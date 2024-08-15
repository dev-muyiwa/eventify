import {
  IsString,
  IsNumber,
  ValidateNested,
  IsNotEmpty,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

class DatabaseConfig {
  @IsString()
  @IsNotEmpty({ message: 'Database host is required' })
  host: string;

  @Type(() => Number)
  @IsNumber()
  port: number;

  @IsString()
  @IsNotEmpty({ message: 'Database user is required' })
  user: string;

  @IsString()
  @IsNotEmpty({ message: 'Database password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Database name is required' })
  name: string;
}

class RedisConfig {
  @IsString()
  @IsNotEmpty({ message: 'Redis host is required' })
  host: string;

  @Type(() => Number)
  @IsNumber()
  port: number;
}

class MailConfig {
  @IsString()
  @IsNotEmpty({ message: 'Mail host is required' })
  host: string;

  @Type(() => Number)
  @IsNumber()
  port: number;

  @IsString()
  @IsNotEmpty({ message: 'Mail user is required' })
  user: string;

  @IsString()
  @IsNotEmpty({ message: 'Mail password is required' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Mail from is required' })
  from: string;

  @IsString()
  @IsNotEmpty({ message: 'Mail secure is required' })
  secure: string;
}

export class EnvConfig {
  @IsString()
  @IsIn(['local', 'development', 'production', 'test'])
  node_env: 'local' | 'development' | 'production' | 'test';

  @IsString()
  app_name: string;

  @IsString()
  jwt_secret: string;

  @Type(() => Number)
  @IsNumber()
  port: number;

  @ValidateNested()
  @Type(() => DatabaseConfig)
  database: DatabaseConfig;

  @ValidateNested()
  @Type(() => RedisConfig)
  redis: RedisConfig;

  @ValidateNested()
  @Type(() => MailConfig)
  email: MailConfig;
}
