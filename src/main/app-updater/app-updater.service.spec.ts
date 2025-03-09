import {Test, TestingModule} from '@nestjs/testing'
import {AppUpdaterService} from './app-updater.service'

describe('appUpdaterService', () => {
  let service: AppUpdaterService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AppUpdaterService],
    }).compile()

    service = module.get<AppUpdaterService>(AppUpdaterService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })
})
