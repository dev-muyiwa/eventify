import { AuthService } from './auth.service';
import { INestApplication } from '@nestjs/common';

describe('AuthService', () => {
  let authService: AuthService;
  let app: INestApplication;

  beforeAll(() => {
    authService = app.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });
});
