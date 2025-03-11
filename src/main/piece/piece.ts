import {now} from '@main/utils'
import {PartialType} from '@nestjs/mapped-types'
import {PieceRoleEnum, PieceStatusEnum, PieceTypeEnum} from './enum'

export class PieceUpload {
  public hash: string
  public assetId: string
  public decalId?: string
  public operationId?: string

  constructor() {
    //
  }

  static fromObject(obj: PieceUploadDto) {
    const piece = new PieceUpload()
    Object.assign(piece, obj)
    return piece
  }
}

export class PieceUploadDto extends PartialType(PieceUpload) {
  //
}

export class Piece {
  public id: string
  public role: PieceRoleEnum
  public type: PieceTypeEnum
  public status: PieceStatusEnum = PieceStatusEnum.ok
  public dir: string
  public name: string
  public hash: string = ''
  public uploads: PieceUpload[] = []
  public isAutoUpload: boolean = false
  public updatedAt: number = null
  public deletedAt: number = null
  public uploadedAt: number = null
  public isDirty: boolean = true
  public get fullPath() {
    return `${this.dir}/${this.name}`
  }

  constructor() {
    if (!this.updatedAt) {
      this.updatedAt = now()
    }
  }

  toJSON() {
    const {
      isDirty, // exclude isDirty
      ...object
    } = this

    return object
  }
}

export class NewPieceDto extends PartialType(Piece) {
  //
}
