import { Injectable, Inject, OnModuleInit, Optional } from '@nestjs/common';
import { knex, Knex } from 'knex';
import Postgrator from 'postgrator';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import * as process from 'node:process';
import { getKnexConfig } from './knexfile';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private readonly knexConnection: Knex;

  constructor(
    private readonly configService: ConfigService,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
    @Optional() overrideConfig?: Knex.Config,
  ) {
    const dbConfig = overrideConfig || getKnexConfig(configService);
    this.knexConnection = knex(dbConfig);
  }

  async onModuleInit() {
    try {
      await this.knexConnection.raw('SELECT 1+1 AS result');
      this.logger.info('Database connection established successfully', {
        context: 'DatabaseService',
      });

      this.knexConnection.on('error', (err) =>
        this.logger.error('Database error', {
          error: err,
          context: 'DatabaseService',
        }),
      );

      const dbConfig = getKnexConfig(this.configService);
      const postgrator = new Postgrator({
        migrationPattern: `${process.cwd()}/migrations/*`,
        driver: 'pg',
        database: (dbConfig.connection as any).database,
        schemaTable: 'schema_migrations',
        execQuery: (query) => this.knexConnection.raw(query),
      });

      postgrator.on('validation-started', (migration) =>
        this.logger.info(`Validating ${migration.filename}`, {
          context: 'DatabaseService',
        }),
      );
      postgrator.on('validation-finished', (migration) =>
        this.logger.info(`Validated ${migration.filename}`, {
          context: 'DatabaseService',
        }),
      );
      postgrator.on('migration-started', (migration) =>
        this.logger.info(`Migrating ${migration.filename}`, {
          context: 'DatabaseService',
        }),
      );
      postgrator.on('migration-finished', (migration) =>
        this.logger.info(`Migrated ${migration.filename}`, {
          context: 'DatabaseService',
        }),
      );

      try {
        const migrations = await postgrator.migrate();
        this.logger.info(`Ran ${migrations.length} migrations`, {
          context: 'DatabaseService',
        });
      } catch (error) {
        this.logger.error(`Error running migrations:${error}`, {
          context: 'DatabaseService',
          error: error,
        });
        process.exit(1);
      }
    } catch (error) {
      this.logger.error('Failed to connect to the database', {
        error,
        context: 'DatabaseService',
      });
      throw error;
    }
  }

  getKnexConnection(overrideConfig?: Knex.Config): Knex {
    if (overrideConfig) {
      return knex(overrideConfig);
    }
    return this.knexConnection;
  }
}
