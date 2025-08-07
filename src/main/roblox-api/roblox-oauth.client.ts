import crypto from 'node:crypto'

import {URL} from 'node:url'
import {ConfigurationRoblox} from '@main/_config'
import {TokenSetDto} from '@main/roblox-api/dto/token-set.dto'
import {Injectable, Logger, UnauthorizedException, UnprocessableEntityException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import got from 'got'
import keytar from 'keytar'
import {KEYTAR_ACCOUNT, KEYTAR_SERVICE, REDIRECT_URI} from './constants'
import {GrantType} from './type/grant-type'
import {TokenSet} from './type/token.set'

@Injectable()
export class RobloxOauthClient {
  private codeVerifier: string = null
  private tokenSet: TokenSet
  private readonly logger = new Logger(RobloxOauthClient.name)

  constructor(private config: ConfigService) {
  }

  get clientId(): string {
    return this.config.get<ConfigurationRoblox>('roblox').clientId
  }

  get accessToken(): string {
    return this.tokenSet?.accessToken
  }

  get userId(): string {
    return this.tokenSet?.claims.sub
  }

  async getTokenSet() {
    if (typeof this.tokenSet === 'undefined') {
      const json = await keytar.getPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT)
      if (!json) {
        this.tokenSet = null
      }
      else {
        this.tokenSet = this._tryParseTokenSet(json)
      }
    }

    return this.tokenSet
  }

  _tryParseTokenSet(json: string) {
    try {
      const obj = JSON.parse(json)
      return TokenSet.fromObject(obj)
    }
    catch (err: any) {
      this.logger.error(`Unable to parse stored token set: ${err.message}`)
      return null
    }
  }

  async setTokenSet(tokenSet: TokenSet) {
    this.tokenSet = tokenSet
    await keytar.setPassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT, JSON.stringify(this.tokenSet))
  }

  async resetTokenSet() {
    await keytar.deletePassword(KEYTAR_SERVICE, KEYTAR_ACCOUNT)
    this.tokenSet = null
  }

  async assertTokenSetIsValid() {
    const tokenSet = await this.getTokenSet()

    if (!tokenSet) {
      throw new UnauthorizedException('Unauthorized')
    }

    if (tokenSet.isExpired) {
      await this.refresh()
    }
  }

  createAuthorizeUrl(): string {
    if (!this.codeVerifier) {
      // generate code verified every time it is empty
      this.codeVerifier = crypto.randomBytes(32).toString('base64url')
    }

    const url = new URL('https://apis.roblox.com/oauth/v1/authorize')

    Object.entries({
      client_id: this.clientId,
      code_challenge: crypto.createHash('sha256').update(this.codeVerifier).digest('base64url'),
      code_challenge_method: 'S256',
      redirect_uri: REDIRECT_URI,
      scope: this.config.get<ConfigurationRoblox>('roblox').scope,
      response_type: 'code',
      state: 'aaaBBB211', // TODO ES: remove this ?
    }).forEach(([key, value]) => url.searchParams.set(key, value))

    return url.toString()
  }

  request(endpointUrl: string, data: any) {
    // got.defaults.options.retry.statusCodes.push('POST')
    return got(endpointUrl, {
      method: 'POST',
      form: data,
      retry: {
        limit: 3,
        methods: [
          'POST',
        ],
      },
    })
  }

  async grant(body: GrantType): Promise<TokenSet> {
    try {
      // this.logger.log(body)
      const json = await this.request('https://apis.roblox.com/oauth/v1/token', body).json() as TokenSetDto
      return TokenSet.fromDto(json)
    }
    catch (err: any) {
      this.logger.error(`Cannot grant ${body.grant_type}. (status: ${err.response?.statusCode}. json: ${err.response?.body})`)
      this.logger.error(err.message)
      throw err
    }
  }

  async exchangeRefreshToken(refreshToken: string): Promise<TokenSet> {
    return this.grant({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      refresh_token: refreshToken,
    })
  }

  parseCallbackUrl(callbackUrl: string): string {
    const parsed = new URL(callbackUrl)
    // TODO: make checks: state, code_verifier
    return parsed.searchParams.get('code')
  }

  async exchangeCode(code: string): Promise<TokenSet> {
    return this.grant({
      grant_type: 'authorization_code',
      code,
      code_verifier: this.codeVerifier,
      client_id: this.clientId,
    })
  }

  async revokeToken(refreshToken: string) {
    try {
      await this.request('https://apis.roblox.com/oauth/v1/token/revoke', {
        client_id: this.clientId,
        token: refreshToken,
      }).json()
    }
    catch (err: any) {
      this.logger.error(err.message)
      throw new UnprocessableEntityException(`Cannot revoke token. Status: ${err.response.status}`)
    }
  }

  async getAuthorizedResources(/* accessToken: string */): Promise<any> {
    try {
      return await this.request('https://apis.roblox.com/oauth/v1/token/resources', {
        client_id: this.clientId,
        token: this.tokenSet.accessToken,
      }).json()
    }
    catch (err: any) {
      this.logger.error(err.message)
      throw new Error(`Cannot get authorized resources. Status: ${err.response.status}`)
    }
  }

  async callback(url: string) {
    const code = this.parseCallbackUrl(url)
    const tokenSet = await this.exchangeCode(code)
    this.logger.debug('TokenSet was exchanged by code (user logged in)')
    await this.setTokenSet(tokenSet)
  }

  async refresh() {
    let tokenSet = await this.getTokenSet()

    if (tokenSet) {
      if (tokenSet.isExpired) {
        this.logger.debug('TokenSet is expired, refreshing...')
        try {
          tokenSet = await this.exchangeRefreshToken(tokenSet.refreshToken)
          await this.setTokenSet(tokenSet)
          this.logger.debug('TokenSet is refreshed')
        }
        catch (err) {
          this.logger.error('Cannot exchange TokenSet')
          this.logger.error(err)
          this.logger.debug('Reset TokenSet')
          await this.resetTokenSet()
        }
      }
      else {
        // this.logger.debug('TokenSet is OK');
      }
    }
    else {
      this.logger.debug('TokenSet is absent. Login required.')
      // TODO: send ipc message to renderer?
    }
  }
}
