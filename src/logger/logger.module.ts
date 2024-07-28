import { Global, Module } from '@nestjs/common';
import { WinstonModule, WinstonModuleOptions } from 'nest-winston';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

@Global()
@Module({
  imports: [
    ConfigModule,
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService): WinstonModuleOptions => {
        const { combine, timestamp, printf, colorize, align, json } =
          winston.format;

        const fileRotateTransport = (
          fileName: string,
          level: string = 'info',
          format: winston.Logform.Format = json(),
        ) =>
          new winston.transports.DailyRotateFile({
            filename: `logs/%DATE%/${fileName}.log`,
            auditFile: `logs/${fileName}-audit.json`,
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '40m',
            maxFiles: '90d',
            level,
            format,
          });

        const consoleFormat = combine(
          colorize({ all: true }),
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          align(),
          printf(
            (info) => `[${info.timestamp}] ${info.level}: ${info.message}`,
          ),
        );

        const fileFormat = combine(
          timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
          json(),
        );

        const errorFilter = winston.format((info) =>
          info.level === 'error' ? info : false,
        )();

        const transports: winston.transport[] = [];
        const exceptionHandlers: winston.transport[] = [];

        if (configService.get<string>('node_env') === 'development') {
          transports.push(
            new winston.transports.Console({ format: consoleFormat }),
          );
          exceptionHandlers.push(
            new winston.transports.Console({ format: consoleFormat }),
          );
        } else {
          transports.push(
            fileRotateTransport('app', 'verbose', fileFormat),
            fileRotateTransport(
              'app-error',
              'error',
              combine(errorFilter, fileFormat),
            ),
          );
          exceptionHandlers.push(
            fileRotateTransport('exceptions', 'error', fileFormat),
          );
        }

        return {
          level:
            configService.get<string>('node_env') === 'development'
              ? 'debug'
              : 'http',
          transports,
          exceptionHandlers,
          rejectionHandlers: exceptionHandlers,
          handleExceptions: true,
          handleRejections: true,
          exitOnError: false,
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [WinstonModule],
})
export class LoggerModule {}
