import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Knex } from 'knex';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(@Inject('KnexConnection') private readonly knex: Knex) {}

  async onModuleInit(): Promise<any> {
    await this.runMigrations();
  }

  async runMigrations() {
    try {
      await this.knex.migrate.latest();
      console.log('Migrations are up to date');
    } catch (error) {
      console.error('Migration failed:', error);
    }
  }
}
