import * as process from 'node:process';
import dotenv from 'dotenv';
import { EnvConfig } from './validation.schema';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';
import * as path from 'node:path';

const envFile = `.env.${process.env.NODE_ENV || 'local'}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

export default (): EnvConfig => {
  const config = {
    app_name: process.env.APP_NAME,
    jwt_secret: process.env.JWT_SECRET,
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

  const configInstance = plainToInstance(EnvConfig, config);
  const errors = validateSync(configInstance, {
    skipMissingProperties: false,
    whitelist: true,
    forbidNonWhitelisted: true,
    forbidUnknownValues: true,
  });

  if (errors.length > 0) {
    const formatValidationErrors = (
      errors: ValidationError[],
      parentPath: string = '',
    ): any[] => {
      return errors.flatMap((error: ValidationError) => {
        const currentPath = parentPath
          ? `${parentPath}.${error.property}`
          : error.property;

        const fieldErrors = Object.entries(error.constraints || {}).map(
          (message) => ({
            field: `${currentPath}`,
            message: message.pop(),
          }),
        );

        const nestedErrors = formatValidationErrors(
          error.children as ValidationError[],
          currentPath,
        );

        return [...fieldErrors, ...nestedErrors];
      });
    };
    const formattedErrors = formatValidationErrors(errors);
    console.error(
      '❌ Invalid environment variables:',
      JSON.stringify(formattedErrors, null, 2),
    );
    process.exit(1);
  }

  return configInstance;
};
