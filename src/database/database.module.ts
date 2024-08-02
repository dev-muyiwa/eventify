import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';
import { KNEX_CONNECTION } from './knexfile';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: KNEX_CONNECTION,
      useFactory: (databaseService: DatabaseService) => {
        return databaseService.getKnexConnection();
      },
      inject: [DatabaseService],
    },
  ],
  exports: [KNEX_CONNECTION, DatabaseService],
})
export class DatabaseModule {}
