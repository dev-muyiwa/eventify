import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseService } from './database.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    DatabaseService,
    {
      provide: 'KnexConnection',
      useFactory: (databaseService: DatabaseService) => {
        return databaseService.getKnexConnection();
      },
      inject: [DatabaseService],
    },
  ],
  exports: ['KnexConnection', DatabaseService],
})
export class DatabaseModule {
}
