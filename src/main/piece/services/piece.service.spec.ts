import {Test, TestingModule} from '@nestjs/testing'
import {PieceService} from './piece.service'

describe('pieceService', () => {
  let service: PieceService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PieceService],
    }).compile()

    service = module.get<PieceService>(PieceService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
