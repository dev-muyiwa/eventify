import { Global, Inject, Module, OnModuleInit } from '@nestjs/common';
import { knex, Knex } from 'knex';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { getKnexConfig } from './knexfile';
import { Logger } from 'winston';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import Postgrator from 'postgrator';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: 'KnexConnection',
      useFactory: async (
        configService: ConfigService,
        logger: Logger,
      ): Promise<Knex> => {
        const dbConfig = getKnexConfig(configService);
        const connection = knex(dbConfig);

        try {
          await connection.raw('SELECT 1+1 AS result');
          logger.info('Database connection established successfully', {
            context: 'DatabaseModule',
          });

          connection.on('error', (err) =>
            logger.error('Database error', {
              error: err,
              context: 'DatabaseModule',
            }),
          );

          return connection;
        } catch (error) {
          logger.error('Failed to connect to the database', {
            error,
            context: 'DatabaseModule',
          });
          throw error;
        }
      },
      inject: [ConfigService, WINSTON_MODULE_PROVIDER],
    },
  ],
  exports: ['KnexConnection', DatabaseService],
})
export class DatabaseModule implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService,
    @Inject('KnexConnection') private readonly knexConnection: Knex,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async onModuleInit() {
    // const { default: Postgrator } = await import('postgrator');

    const dbConfig = getKnexConfig(this.configService);

    const postgrator = new Postgrator({
      migrationPattern: `${__dirname}/migrations/*`,
      driver: 'pg',
      database: (dbConfig.connection as any).database,
      schemaTable: 'schema_migrations',
      execQuery: (query) => this.knexConnection.raw(query),
    });

    postgrator.on('validation-started', (migration) =>
      this.logger.info(`Validating ${migration.filename}`, {
        context: 'DatabaseModule',
      }),
    );
    postgrator.on('validation-finished', (migration) =>
      this.logger.info(`Validated ${migration.filename}`, {
        context: 'DatabaseModule',
      }),
    );
    postgrator.on('migration-started', (migration) =>
      this.logger.info(`Migrating ${migration.filename}`, {
        context: 'DatabaseModule',
      }),
    );
    postgrator.on('migration-finished', (migration) =>
      this.logger.info(`Migrated ${migration.filename}`, {
        context: 'DatabaseModule',
      }),
    );

    try {
      const migrations = await postgrator.migrate();
      this.logger.info(`Ran ${migrations.length} migrations`, {
        context: 'DatabaseModule',
      });
    } catch (error) {
      this.logger.error('Error running migrations:', {
        context: 'DatabaseModule',
        error: error,
      });
      process.exit(1);
    }
  }
}
