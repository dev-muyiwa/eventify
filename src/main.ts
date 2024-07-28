import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { HttpExceptionFilter } from './util/exception.filter';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import morgan from 'morgan';
import { Logger } from 'winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const httpLogger = app.get<Logger>(WINSTON_MODULE_PROVIDER);
  app.use(
    morgan(
      function (tokens, req, res) {
        return JSON.stringify({
          context: 'HTTP',
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number.parseFloat(<string>tokens.status(req, res)),
          response_time: `${Number.parseFloat(<string>tokens['response-time'](req, res))}ms`,
          content_length: tokens.res(req, res, 'content-length'),
          remote_addr: tokens['remote-addr'](req, res),
          user_agent: tokens['user-agent'](req, res),
          referrer: tokens.referrer(req, res),
          http_version: tokens['http-version'](req, res),
        });
      },
      {
        stream: {
          write: (message) =>
            httpLogger.http('nil', JSON.parse(message.trim())),
        },
      },
    ),
  );
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);

  const port = configService.get<number>('port') as number;

  await app.listen(port, () =>
    httpLogger.info(`Listening to server on port ${port}`, {
      context: 'ApplicationModule',
    }),
  );
}

bootstrap();
