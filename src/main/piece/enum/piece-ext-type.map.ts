import {PieceTypeEnum} from './piece-type.enum'

export const PieceExtTypeMap: Map<string, PieceTypeEnum> = new Map ([
  ['.png', PieceTypeEnum.image],
  ['.jpg', PieceTypeEnum.image],
  ['.jpeg', PieceTypeEnum.image],
  ['.gif', PieceTypeEnum.image],
  ['.glb', PieceTypeEnum.mesh],
])
