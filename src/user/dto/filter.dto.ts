import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';
import { Optional } from '@nestjs/common';

export class FilterDto {
  @Optional()
  @IsEnum(['asc', 'desc'], {
    message: "sort_by must be either 'asc' or 'desc'",
  })
  @Transform(({ value }) => value || 'asc')
  readonly sort_by: string = 'asc';

  @IsOptional()
  @IsInt({ message: 'page must be an integer' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  readonly page: number = 1;
}
