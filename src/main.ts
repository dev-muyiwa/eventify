import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { GlobalExceptionFilter } from './util/exception.filter';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import morgan from 'morgan';
import { Logger } from 'winston';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { JwtAuthGuard } from './auth/strategy/jwt.strategy';

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
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter(httpLogger));

  const config = new DocumentBuilder()
    .setTitle('Eventify API')
    .setDescription(
      'This is the API documentation for the Eventify application',
    )
    .build();

  const v1Document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/v1/docs', app, v1Document, {
    useGlobalPrefix: true,
  });

  const configService = app.get(ConfigService);

  const port = configService.get<number>('port') as number;

  await app.listen(port, () =>
    httpLogger.info(`Listening to server on port ${port}`, {
      context: 'ApplicationModule',
    }),
  );
}

bootstrap();
