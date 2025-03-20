import { Module } from '@nestjs/common';
import { FoobarService } from './foobar.service';
import { FoobarController } from './foobar.controller';

@Module({
  providers: [FoobarService],
  controllers: [FoobarController]
})
export class FoobarModule {}
