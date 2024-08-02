import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';

export const KNEX_CONNECTION = 'KnexConnection';

export const getKnexConfig = (configService: ConfigService): Knex.Config => {
  return {
    client: 'pg',
    connection: {
      host: configService.get<string>('database.host'),
      port: configService.get<number>('database.port'),
      user: configService.get<string>('database.user'),
      password: configService.get<string>('database.password'),
      database: configService.get<string>('database.name'),
    },
    migrations: {
      directory: './migrations',
      tableName: 'knex_migrations',
    },
  };
};

export default getKnexConfig;
