import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { ConfigService } from '@nestjs/config';
import * as process from 'node:process';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    container = await new PostgreSqlContainer()
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
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('Hello World!');
  });
});
