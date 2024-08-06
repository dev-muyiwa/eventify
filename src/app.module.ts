import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { DatabaseModule } from './database/database.module';
import { LoggerModule } from './logger/logger.module';
import helmet from 'helmet';
import cors from 'cors';
import configuration from './config/configuration';
import { EventsModule } from './events/events.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),
    LoggerModule,
    DatabaseModule,
    UserModule,
    AuthModule,
    EventsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): any {
    consumer
      .apply(
        helmet({
          contentSecurityPolicy: {
            directives: {
              defaultSrc: [`'self'`],
              styleSrc: [`'self'`, `'unsafe-inline'`],
              imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
              scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
            },
          },
        }),
        cors(),
      )
      .forRoutes('*');
  }
}
