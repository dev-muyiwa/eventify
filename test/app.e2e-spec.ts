import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { setupTestConfig } from './setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;

  beforeAll(async () => {
    const setup = await setupTestConfig();
    app = setup.app;
    container = setup.container;
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
