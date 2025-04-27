import fs from 'node:fs/promises'
import {join} from 'node:path'
import {ConfigurationPiece} from '@main/_config/configuration'
import {PieceExtTypeMap} from '@main/piece/enum'
import {PieceEventEnum} from '@main/piece/enum/piece-event.enum'
import {Piece} from '@main/piece/piece'
import {PieceProvider} from '@main/piece/piece.provider'
import {PieceWatcherQueue, PieceWatcherQueueTask} from '@main/piece/queue'
import {Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy, OnModuleInit} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import {EventEmitter2} from '@nestjs/event-emitter'
import watcher, {AsyncSubscription} from '@parcel/watcher'
import {ensureDir} from 'fs-extra'
import micromatch from 'micromatch'

@Injectable()
export class PieceWatcher implements OnModuleInit, OnModuleDestroy, OnApplicationBootstrap {
  protected isReady: boolean
  protected isInitialScanned: boolean
  protected isApplicationBootstrapped: boolean
  protected readonly logger = new Logger(PieceWatcher.name)
  protected readonly options: ConfigurationPiece
  private subscription: AsyncSubscription = null
  private readonly ignoreGlobs: string[] = []

  constructor(
    private readonly config: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    protected readonly provider: PieceProvider,
    protected readonly queue: PieceWatcherQueue,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')

    let globPattern = Array.from(PieceExtTypeMap.keys()).map(k => `*${k}`).join('|')
    globPattern = `**/!(${globPattern})`

    this.ignoreGlobs = [
      '**/!(*.*)', // ignore files and dirs without ext (file-name.ext)
      '_*', // ignore _files and _dirs
      '.*', // ignore .files and .dirs
      globPattern,
    ]
  }

  async onModuleInit(): Promise<void> {
    await ensureDir(this.options.watchDirectory)
    await this.provider.load()
  }

  async onApplicationBootstrap() {
    this.isApplicationBootstrapped = true
    if (this.isInitialScanned) {
      this.checkIsReady()
    }

    // async manner
    this.initialScan()
      .then(() => {
        this.logger.log('Initial scan completed...')
      })

    // async manner
    this.startWatch()
      .then(() => {
        this.logger.log('Started watching...')
      })
  }

  async onModuleDestroy() {
    // stopWatch in onModuleDestroy not onApplicationShutdown
    // onApplicationShutdown never called (and therefor application never closed)
    // because resources is not disposed by module.
    // So we must dispose it here -- onModuleDestroy
    await this.stopWatch()
    this.logger.log(`Stopped watching dir ${this.options.watchDirectory}`)

    this.isReady = false
    this.isInitialScanned = false
    this.isApplicationBootstrapped = false
  }

  async initialScan() {
    let files = await fs.readdir(this.options.watchDirectory, {recursive: true})
    files = files.filter(x => !micromatch.isMatch(x, this.ignoreGlobs))

    const promises = files.map((name) => {
      const dir = this.options.watchDirectory
      const fullPath = join(this.options.watchDirectory, name) // make absolute path
      return this.queue.push(fullPath, {
        fullPath,
        dir,
        name,
        run: (task) => {
          return this.onInit(task)
        },
      })
    })

    await Promise.allSettled(promises)
    this.isInitialScanned = true

    if (this.isApplicationBootstrapped) {
      this.checkIsReady()
    }
  }

  async stopWatch() {
    if (!this.subscription) {
      return
    }

    await this.subscription.unsubscribe()
    this.subscription = null
  }

  async startWatch() {
    this.logger.log(`Start watching dir ${this.options.watchDirectory}`)
    this.subscription = await watcher.subscribe(this.options.watchDirectory, (err, events) => {
      if (err) {
        this.logger.log(err.stack)
      }
      events.forEach((event: {type: 'create' | 'update' | 'delete', path: string}) => {
        if (!event.path?.startsWith(this.options.watchDirectory)) {
          // in some cases parcel watcher grabs file events not in watchDirectory
          this.logger.debug(`Ignore event ${event.type} occurred for file ${event.path}`)
          return
        }

        const dir = this.options.watchDirectory
        const name = event.path.slice(dir.length + 1)

        if (event.type === 'create' || event.type === 'update') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push(event.path, {
            fullPath: event.path,
            dir,
            name,
            run: (task) => {
              return this.onChange(task)
            },
          })
        }
        if (event.type === 'delete') {
          this.logger.debug(`Event "${event.type}": ${event.path}`)
          this.queue.push(event.path, {
            fullPath: event.path,
            dir,
            name,
            run: (task) => {
              return this.onUnlink(task)
            },
          })
        }
      })
    }, {ignore: this.ignoreGlobs})
  }

  async onInit(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    const piece = this.provider.findOne({dir, name})
    if (!piece) {
      await this.createFromFile(dir, name)
    }
    else {
      await this.updateFromFile(piece)
    }

    // this.eventEmitter.emit(PieceEventEnum.initiated, piece)
  }

  async onChange(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    const piece = this.provider.findOne({dir, name})
    if (!piece) {
      await this.createFromFile(dir, name)
    }
    else {
      await this.updateFromFile(piece)
    }

    await this.provider.save() // queue?
  }

  async createFromFile(dir: string, name: string) {
    const piece = await this.provider.createFromFile(dir, name)
    this.eventEmitter.emit(PieceEventEnum.created, piece)
    return piece
  }

  async updateFromFile(piece: Piece) {
    const oldHash = piece.hash
    await this.provider.updateFromFile(piece)
    if (oldHash !== piece.hash || true) { // TODO: remove `true` // just for testing
      this.eventEmitter.emit(PieceEventEnum.changed, piece)
    }
  }

  async onUnlink(queueTask: PieceWatcherQueueTask) {
    const {dir, name} = queueTask
    const piece = this.provider.findOne({dir, name})

    if (!piece)
      return

    this.provider.delete(piece)

    this.eventEmitter.emit(PieceEventEnum.deleted, piece)
  }

  checkIsReady() {
    if (this.isInitialScanned && this.isApplicationBootstrapped) {
      this.isReady = true
      this.eventEmitter.emit(PieceEventEnum.watcherReady)
    }
  }
}
