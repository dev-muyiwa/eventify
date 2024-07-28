import * as process from 'node:process';
import dotenv from 'dotenv';
import { EnvConfig, validationSchema } from './validation.schema';
import * as path from 'node:path';

const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default (): EnvConfig => {
  const config = {
    app_name: process.env.APP_NAME,
    node_env: process.env.NODE_ENV,
    port: process.env.PORT,
    database: {
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      name: process.env.POSTGRES_DB,
    },
  };

  const { error, value } = validationSchema.validate(config, {
    abortEarly: false,
  });

  if (error) {
    const errors = error.details.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(errors, null, 2),
    );
    process.exit(1);
  }

  return value as EnvConfig;
};
