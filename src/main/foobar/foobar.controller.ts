import {Controller, Get} from '@nestjs/common'

@Controller()
export class FoobarController {
  @Get('api/foobar')
  getBaz() {
    return {
      message: 'Hello from Foobar',
      number: 42,
    }
  }
}
