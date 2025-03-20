import { Test, TestingModule } from '@nestjs/testing';
import { FoobarService } from './foobar.service';

describe('FoobarService', () => {
  let service: FoobarService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FoobarService],
    }).compile();

    service = module.get<FoobarService>(FoobarService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
