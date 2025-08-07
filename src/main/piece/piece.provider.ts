import {join, parse} from 'node:path'
import {filter as whereFilter, find as whereFind} from '@common/where'
import {ConfigurationPiece} from '@main/_config'
import {PieceExtTypeMap, PieceRoleEnum, PieceTypeEnum} from '@main/piece/enum'
import {hashFromFile, now, randomString, RESOURCES_DIR} from '@main/utils'
import {Injectable, Logger, UnprocessableEntityException} from '@nestjs/common'
import {ConfigService} from '@nestjs/config'
import fse from 'fs-extra'
import {NewPieceDto, Piece} from './piece'

type PieceCriteria = any // PieceFieldCriteria | ((piece: Piece) => boolean)

@Injectable()
export class PieceProvider {
  private readonly data: Piece[] = []

  private readonly logger = new Logger(PieceProvider.name)
  private readonly options: ConfigurationPiece

  constructor(
    private readonly config: ConfigService,
  ) {
    this.options = this.config.get<ConfigurationPiece>('piece')
  }

  async load() {
    try {
      await fse.access(this.options.metadataPath)
    }
    catch (accessErr: any) {
      if (accessErr.code === 'ENOENT') {
        await fse.writeFile(this.options.metadataPath, '[]') // create empty-array file
      }
      else {
        throw accessErr
      }
    }

    let data = null
    try {
      data = await fse.readFile(this.options.metadataPath, {encoding: 'utf8'})
      data = data || '[]'
    }
    catch (readErr) {
      this.logger.error(readErr)
      throw new Error(`File ${this.options.metadataPath} does not exist`)
    }

    try {
      data = JSON.parse(data)
    }
    catch (parseErr) {
      this.logger.error(parseErr)
      throw new Error(`Cannot parse JSON file ${this.options.metadataPath}`)
    }

    if (Array.isArray(data)) {
      for (const x of data) {
        this.data.push(this.createFromObject(x))
      }
    }
    else {
      throw new TypeError('Invalid metadata format')
    }
  }

  async save(): Promise<void> {
    try {
      const data = JSON.stringify(this.data, null, 2)
      await fse.writeFile(this.options.metadataPath, data, {encoding: 'utf8'})
    }
    catch (writeErr) {
      this.logger.error(writeErr)
      throw new Error(`File ${this.options.metadataPath} cannot write file`)
    }
  }

  findMany(criteria: PieceCriteria): Piece[] {
    return whereFilter<Piece>(this.data, criteria)
  }

  findOne(criteria: PieceCriteria): Piece | undefined {
    return whereFind<Piece>(this.data, criteria)
  }

  add(piece: Piece): void {
    this.data.push(piece)
  }

  delete(piece: Piece): void {
    piece.deletedAt = now()
  }

  createFromObject(obj: NewPieceDto) {
    const piece = new Piece()
    Object.assign(piece, obj)
    return piece
  }

  async create(dir: string, name: string, role = PieceRoleEnum.asset) {
    const id = this._generateUniqId()
    const hash = null
    const type = this.getTypeByName(name)
    const isDirty = false

    const newPiece = this.createFromObject({
      id,
      dir,
      name,
      role,
      type,
      hash,
      isDirty,
      isAutoUpload: this.options.isAutoUpload,
    })

    this.add(newPiece)

    return newPiece
  }

  async createPlaceholder({dir, name, role}: {dir: string, name: string, role: PieceRoleEnum}) {
    const id = this._generateUniqId()
    const uniqName = await this.generateUniqName(dir, name)
    const type = this.getTypeByName(name)

    let placeholderFile = join(RESOURCES_DIR, 'placeholder.png')
    if (type === PieceTypeEnum.mesh) {
      placeholderFile = join(RESOURCES_DIR, 'placeholder.obj')
    }

    const hash = await hashFromFile(placeholderFile)

    const piece = this.createFromObject({
      id,
      dir,
      name: uniqName,
      role,
      type,
      hash,
      isDirty: false,
      isAutoUpload: this.options.isAutoUpload,
    })

    this.add(piece)

    await fse.copy(placeholderFile, join(piece.dir, piece.name))

    return piece
  }

  getTypeByName(name: string) {
    const parsed = parse(name)
    return PieceExtTypeMap.get(parsed.ext) || PieceTypeEnum.unknown as PieceTypeEnum
  }

  async createFromFile(dir: string, name: string, role = PieceRoleEnum.asset) {
    const file = join(dir, name)
    const id = this._generateUniqId()
    const hash = await hashFromFile(file)
    const type = this.getTypeByName(name)
    const isDirty = false

    const piece = this.createFromObject({
      id,
      dir,
      name,
      role,
      type,
      hash,
      isDirty,
      isAutoUpload: this.options.isAutoUpload,
    })

    this.add(piece)

    return piece
  }

  async updateFromFile(piece: Piece) {
    const hash = await hashFromFile(piece.fullPath)
    piece.isDirty = false

    if (hash !== piece.hash) {
      piece.hash = hash
      piece.updatedAt = now()
    }

    if (piece.deletedAt) {
      piece.deletedAt = null
      piece.updatedAt = now()
    }

    return piece
  }

  findCurrentUpload(piece: Piece) {
    return piece.uploads.find(x => x.hash === piece.hash)
  }

  private async generateUniqName(dir, name: string): Promise<string> {
    const parsed = parse(name)
    let i = 0
    let current = name
    while (true) {
      const exists = await this.fileExists(join(dir, current))
      if (!exists) {
        return current
      }
      i++
      current = join(parsed.dir, `${parsed.name}-${i}${parsed.ext}`)
    }
  }

  private async fileExists(file: string) {
    try {
      await fse.access(file)
      return true
    }
    catch (err: any) {
      if (err.code !== 'ENOENT') {
        throw err
      }
    }

    return false
  }

  async hardDelete(piece: Piece) {
    const pos = this.data.indexOf(piece)
    if (pos !== -1) {
      this.data.splice(pos, 1)
    }

    return piece
  }

  async unlinkFile(piece: Piece) {
    try {
      await fse.unlink(piece.fullPath)
    }
    catch (err: any) {
      if (err.code === 'ENOENT') {
        // No such file,
        // It is ok in this case
      }
      else {
        this.logger.error(`Unable to unlink piece file: ${piece.fullPath}`, err)
        throw new UnprocessableEntityException(`Unable to unlink piece file: ${piece.fullPath}`)
      }
    }
  }

  async hardDeleteWithFile(piece: Piece) {
    await this.unlinkFile(piece)
    await this.hardDelete(piece)
    return piece
  }

  private _generateUniqId() {
    for (let i = 0; ; i++) {
      const id = randomString(Math.floor(i / 10 + 4))
      if (!this.findOne({id})) {
        return id
      }
    }
  }
}
