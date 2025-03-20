import { Test, TestingModule } from '@nestjs/testing';
import { FoobarController } from './foobar.controller';

describe('FoobarController', () => {
  let controller: FoobarController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FoobarController],
    }).compile();

    controller = module.get<FoobarController>(FoobarController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
