import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { ConfigService } from '@nestjs/config';
import * as process from 'node:process';
import {
  LoginUserDto,
  RegisterUserDto,
} from '../src/auth/dto/register-user.dto';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from '../src/database/knexfile';
import { User } from '../src/user/entities/user.entity';
import { GlobalExceptionFilter } from '../src/util/exception.filter';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let knex: Knex;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';

    container = await new PostgreSqlContainer()
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
    app = moduleFixture.createNestApplication();
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

    knex = app.get(KNEX_CONNECTION);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await container.stop();
  });

  describe('/auth/register (POST)', () => {
    const registerEndpoint = '/auth/register';
    const body = RegisterUserDto.generateTestObject();

    it('should create a new user, and return a status code of 201', async () => {
      const response = await request(app.getHttpServer())
        .post(registerEndpoint)
        .send(body)
        .expect(201);

      const { success, data, message } = response.body;

      const user = await knex<User>('users').where('email', body.email).first();

      expect(user).toBeDefined();
      expect(user?.email).toBe(body.email);

      expect(success).toBe(true);
      expect(message).toBe(
        'user registered successfully. check your email for verification',
      );
      expect(data).toBeNull();
    });

    it('should return a status code of 400 if the email already exists', async () => {
      const response = await request(app.getHttpServer())
        .post(registerEndpoint)
        .send(body)
        .expect(400);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('an account with this email already exists');
      expect(error).toBeNull();
    });

    it('should return a status code of 400 if the request body fails validation', async () => {
      const response = await request(app.getHttpServer())
        .post(registerEndpoint)
        .expect(400);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('validation errors');
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(Array);
      expect(error.length).toBeGreaterThan(0);
      error.forEach((err: any) => {
        expect(err.path).toBeDefined();
        expect(err.message).toBeDefined();
      });
    });
  });

  describe('/auth/login (POST)', () => {
    const loginEndpoint = '/auth/login';
    const body = RegisterUserDto.generateTestObject() as LoginUserDto;

    it('should log in a user, and return a status code of 200 and an access token', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send(body)
        .expect(200);

      const { success, data, message } = response.body;

      expect(success).toBe(true);
      expect(message).toBe('user logged in successfully');
      expect(data).toMatchObject({
        access_token: expect.any(String),
      });
    });

    it("should return a status code of 404 if an account doesn't exist with that email", async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ ...body, email: 'test@user.com' })
        .expect(404);

      const { success, error, message } = response.body;

      const user = await knex<User>('users')
        .where('email', 'test@user.com')
        .first();

      expect(user).toBeUndefined();

      expect(success).toBe(false);
      expect(message).toBe('incorrect login credentials');
      expect(error).toBeNull();
    });

    it('should return a status code of 404 if the password is incorrect', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .send({ ...body, password: 'Adumpty-231;' })
        .expect(404);

      const { success, error, message } = response.body;

      const user = await knex<User>('users').where('email', body.email).first();

      expect(user).toBeDefined();

      expect(success).toBe(false);
      expect(message).toBe('incorrect login credentials');
      expect(error).toBeNull();
    });

    it('should return a status code of 400 if the request body fails validation', async () => {
      const response = await request(app.getHttpServer())
        .post(loginEndpoint)
        .expect(400);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('validation errors');
      expect(error).toBeDefined();
      expect(error).toBeInstanceOf(Array);
      expect(error.length).toBeGreaterThan(0);
      error.forEach((err: any) => {
        expect(err.path).toBeDefined();
        expect(err.message).toBeDefined();
      });
    });
  });
});
