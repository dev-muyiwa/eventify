import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SkipAuthorization } from './auth/guards/jwt.guard';

@SkipAuthorization()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  getHealth(): string {
    return this.appService.getHello();
  }
}
