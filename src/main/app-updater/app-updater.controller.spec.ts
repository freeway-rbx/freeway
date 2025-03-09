import { Test, TestingModule } from '@nestjs/testing';
import { AppUpdaterController } from './app-updater.controller';

describe('AppUpdaterController', () => {
  let controller: AppUpdaterController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppUpdaterController],
    }).compile();

    controller = module.get<AppUpdaterController>(AppUpdaterController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
