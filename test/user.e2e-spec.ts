import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { Knex } from 'knex';
import { User, UserRole } from '../src/user/entities/user.entity';
import { setupTestConfig } from './setup';
import { UpdateUserDto } from '../src/user/dto/update-user.dto';
import bcrypt from 'bcryptjs';
import { UpdatePasswordDto } from '../src/user/dto/update-password.dto';
import { faker } from '@faker-js/faker';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../src/auth/dto/register-user.dto';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let container: StartedPostgreSqlContainer;
  let knex: Knex;
  let accessToken: string, adminToken: string;
  let user: User, admin: User;

  beforeAll(async () => {
    const setup = await setupTestConfig();
    app = setup.app;
    container = setup.container;
    knex = setup.knex;
    // user = setup.user;
    // admin = setup.admin;
    // accessToken = setup.accessToken;
    // adminToken = setup.adminToken;

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

    // console.log('user', user);
    // console.log('admin', admin);

    accessToken = jwtService.sign(
      {
        email: newUser.email,
      },
      { subject: newUser.id },
    );

    adminToken = jwtService.sign(
      {
        email: newAdmin.email,
      },
      { subject: newAdmin.id },
    );
    user = newUser;
    admin = newAdmin;
  });

  afterAll(async () => {
    await app.close();
    await knex.destroy();
    await container.stop();
  });

  afterEach(async () => {
    await knex.raw('TRUNCATE TABLE users CASCADE');
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('/users (GET)', () => {
    const getAllUsersEndpoint = '/users';

    it('should fetch users with pagination, and return a status code of 200 if the user has the admin role', async () => {
      const response = await request(app.getHttpServer())
        .get(getAllUsersEndpoint)
        .auth(adminToken, { type: 'bearer' })
        .expect(200);

      const { success, data, message } = response.body;

      expect(success).toBe(true);
      expect(message).toBe('users retrieved');
      expect(data).toBe('This action returns all user');
    });

    it("should return a status code of 403 if the user isn't an admin", async () => {
      const response = await request(app.getHttpServer())
        .get(getAllUsersEndpoint)
        .auth(accessToken, { type: 'bearer' })
        .expect(403);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('Forbidden resource');
      expect(error).toBeNull();
    });
  });

  describe('/users/me (GET)', () => {
    const getMeEndpoint = '/users/me';

    it('should get the info about the authenticated user, and return a status code of 200', async () => {
      const response = await request(app.getHttpServer())
        .get(getMeEndpoint)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const { success, data, message } = response.body;

      expect(success).toBe(true);
      expect(message).toBe('user profile retrieved');
      expect(typeof data).toBe('object');
      expect(data.id).toBe(user.id);
      expect(data).not.toHaveProperty('password');
    });

    it('should return a status code of 401 if the request has no bearer auth', async () => {
      const response = await request(app.getHttpServer())
        .get(getMeEndpoint)
        .expect(401);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('Unauthorized');
      expect(error).toBeNull();
    });
  });

  describe('/users/me (PATCH)', () => {
    const updateMeEndpoint = '/users/me';
    const body = UpdateUserDto.generateTestObject();

    it('should update the info about the authenticated user, and return a status code of 200', async () => {
      const response = await request(app.getHttpServer())
        .patch(updateMeEndpoint)
        .send(body)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const { success, data, message } = response.body;

      const updatedUser = await knex<User>('active_users')
        .where('id', data.id)
        .first();

      expect(updatedUser).toBeDefined();

      expect(success).toBe(true);
      expect(message).toBe('user profile updated');
      expect(typeof data).toBe('object');

      expect(data.id).toBe(updatedUser?.id);
      expect(data.first_name).toBe(updatedUser?.first_name);
      expect(data.last_name).toBe(updatedUser?.last_name);
      expect(data.bio).toBe(updatedUser?.bio);
      expect(data).not.toHaveProperty('password');
    });

    it('should return a status code of 401 if the request has no bearer auth', async () => {
      const response = await request(app.getHttpServer())
        .patch(updateMeEndpoint)
        .send(body)
        .expect(401);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('Unauthorized');
      expect(error).toBeNull();
    });
  });

  describe('/users/me/password (PATCH)', () => {
    const updatePasswordEndpoint = '/users/me/password';
    const body = UpdatePasswordDto.generateTestObject();

    it('should update the password of the authenticated user, and return a status code of 200', async () => {
      const response = await request(app.getHttpServer())
        .patch(updatePasswordEndpoint)
        .send(body)
        .auth(accessToken, { type: 'bearer' })
        .expect(200);

      const { success, data, message } = response.body;

      const updatedUser = await knex<User>('active_users')
        .where('id', data.id)
        .select('id', 'password')
        .first();

      expect(updatedUser).toBeDefined();

      expect(success).toBe(true);
      expect(message).toBe('user password updated');

      expect(bcrypt.compareSync(body.new_password, updatedUser!.password)).toBe(
        true,
      );
    });

    it('should return a status code of 400 if the old password is incorrect', async () => {
      const response = await request(app.getHttpServer())
        .patch(updatePasswordEndpoint)
        .send({ ...body, old_password: faker.internet.password() })
        .auth(accessToken, { type: 'bearer' })
        .expect(400);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('incorrect password');
      expect(error).toBeNull();
    });

    it('should return a status code of 400 if no password was provided', async () => {
      const response = await request(app.getHttpServer())
        .patch(updatePasswordEndpoint)
        .auth(accessToken, { type: 'bearer' })
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

    it('should return a status code of 401 if the request has no bearer auth', async () => {
      const response = await request(app.getHttpServer())
        .patch(updatePasswordEndpoint)
        .send(body)
        .expect(401);

      const { success, error, message } = response.body;

      expect(success).toBe(false);
      expect(message).toBe('Unauthorized');
      expect(error).toBeNull();
    });
  });
});
