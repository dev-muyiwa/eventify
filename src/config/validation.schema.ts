import Joi, { ObjectSchema } from 'joi';

export interface EnvConfig {
  node_env: 'local' | 'development' | 'production' | 'test';
  app_name: string;
  port: number;
  database: {
    host: string;
    port: number;
    user: string;
    password: string;
    name: string;
  };
}

export const validationSchema: ObjectSchema<EnvConfig> = Joi.object({
  node_env: Joi.string()
    .valid('local', 'development', 'production', 'test')
    .required(),
  app_name: Joi.string().default('Twitter'),
  port: Joi.number().default(3000),
  database: Joi.object({
    host: Joi.string().required(),
    port: Joi.number(),
    user: Joi.string().required(),
    password: Joi.string().required(),
    name: Joi.string().required(),
  }).required(),
});
