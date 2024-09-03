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
import { User, UserRole } from '../src/user/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../src/auth/dto/register-user.dto';
import { Knex } from 'knex';

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

  const knex: Knex = app.get(KNEX_CONNECTION);
  await app.init();

  const jwtService = await app.resolve(JwtService);

  // create user
  const userDto = RegisterUserDto.generateTestObject(true);
  const adminDto = RegisterUserDto.generateTestObject(true);
  
  const [[newUser], [newAdmin]] = await Promise.all([
    knex<User>('users')
      .insert({
        first_name: userDto.firstName,
        last_name: userDto.lastName,
        email: userDto.email,
        password: userDto.password,
        dob: userDto.dateOfBirth,
      } as User)
      .returning('*'),

    knex<User>('users')
      .insert({
        first_name: adminDto.firstName,
        last_name: adminDto.lastName,
        email: adminDto.email,
        password: adminDto.password,
        dob: adminDto.dateOfBirth,
        roles: [UserRole.ADMIN, UserRole.USER],
      } as User)
      .returning('*'),
  ]);
  const accessToken = jwtService.sign(
    {
      email: newUser.email,
    },
    { subject: newUser.id },
  );

  const adminToken = jwtService.sign(
    {
      email: newAdmin.email,
    },
    { subject: newAdmin.id },
  );
  return { app, container, knex, user: newUser, admin: newAdmin, accessToken, adminToken };
}
