import {join, parse} from 'node:path'
import {platform} from '@electron-toolkit/utils'
import {PieceEventEnum} from '@main/piece/enum'
import {PieceProvider} from '@main/piece/piece.provider'
import {now, STUDIO_LINKS_DIR} from '@main/utils'
import {Injectable} from '@nestjs/common'
import {OnEvent} from '@nestjs/event-emitter'
import fse from 'fs-extra'
import {glob} from 'glob'
import pMap from 'p-map'
import {Piece} from '../piece'

const LINK_NAME_GLOB = '*.*'

@Injectable()
export class PieceLinkService {
  constructor(
    private readonly provider: PieceProvider,
  ) {
    //
  }

  async ensureLink(piece: Piece) {
    const dest = this.getLinkPath(piece)
    const fullPath = join(piece.dir, piece.name)

    if (platform.isWindows) {
      // use hard links for windows for now
      await fse.ensureLink(fullPath, dest)
    }
    else {
      await fse.ensureSymlink(fullPath, dest)
    }
    piece.linkedAt = now()
  }

  async removeLink(piece: Piece) {
    const dest = this.getLinkPath(piece)
    await fse.remove(dest)
  }

  async syncLinks() {
    const fsLinks = await glob(LINK_NAME_GLOB, {cwd: STUDIO_LINKS_DIR})

    const pieces = this.provider.findMany({deletedAt: null, isDirty: false})

    const actualLinks = pieces.map((p) => {
      return this.getLinkName(p)
    })

    const toRemoveLinks = fsLinks.filter(x => !actualLinks.includes(x))
    const toCreateLinks = actualLinks.filter(x => !fsLinks.includes(x))

    await pMap(toRemoveLinks, async (linksName: string) => {
      await fse.remove(join(STUDIO_LINKS_DIR, linksName))
    }, {concurrency: 5})

    const piecesToCreateLinks = pieces.filter((p: Piece) => {
      return toCreateLinks.includes(this.getLinkName(p))
    })

    await pMap(piecesToCreateLinks, async (piece: Piece) => {
      return this.ensureLink(piece)
    }, {concurrency: 5})
  }

  private getLinkName(piece: Piece): string {
    const parsed = parse(piece.name)
    return `${piece.id}-${piece.hash}${parsed.ext}`
  }

  private getLinkPath(piece: Piece): string {
    const name = this.getLinkName(piece)
    return join(STUDIO_LINKS_DIR, name)
  }

  @OnEvent(PieceEventEnum.watcherReady)
  async handleWatcherReady() {
    await this.syncLinks()
  }

  @OnEvent(PieceEventEnum.created)
  async handlePieceCreated(_piece: Piece) {
    // TODO user syncLinks in queue
    await this.ensureLink(_piece)
    // await this.syncLinks()
  }

  @OnEvent(PieceEventEnum.changed)
  async handlePieceChanged(_piece: Piece) {
    // TODO user syncLinks in queue
    await this.ensureLink(_piece)
    // await this.syncLinks()
  }

  @OnEvent(PieceEventEnum.deleted)
  async handlePieceDeleted(_piece: Piece) {
    // await this.removeLinks(_piece)
    await this.syncLinks()
  }
}
