import { PostgreSqlContainer } from '@testcontainers/postgresql';
import process from 'node:process';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from '../src/util/exception.filter';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { KNEX_CONNECTION } from '../src/database/knexfile';

export async function setupTestConfig() {
  const container = await new PostgreSqlContainer()
    .withName('test-postgres')
    .withDatabase(process.env.POSTGRES_DB as string)
    .withUsername(process.env.POSTGRES_USER as string)
    .withPassword(process.env.POSTGRES_PASSWORD as string)
    .start();

  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ConfigService)
    .useValue({
      get: (key: string) => {
        switch (key) {
          case 'database.host':
            return container.getHost();
          case 'database.port':
            return container.getPort();
          case 'database.user':
            return container.getUsername();
          case 'database.password':
            return container.getPassword();
          case 'database.name':
            return container.getDatabase();
          default:
            return process.env[key];
        }
      },
    })
    .compile();
  const app = moduleFixture.createNestApplication();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        return new BadRequestException(errors);
      },
    }),
  );
  app.useGlobalFilters(
    new GlobalExceptionFilter(app.get<Logger>(WINSTON_MODULE_PROVIDER)),
  );

  const knex = app.get(KNEX_CONNECTION);
  await app.init();

  return { app, container, knex };
}
