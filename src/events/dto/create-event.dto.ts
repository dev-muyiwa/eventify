import {
  IsDateString,
  IsString,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterDate', async: false })
class IsAfterDate implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    const compareValue = args.constraints[0];
    const currentDate =
      compareValue === 'now' ? new Date() : (args.object as any)[compareValue];

    return new Date(propertyValue) > new Date(currentDate);
  }

  defaultMessage(args: ValidationArguments) {
    const compareValue = args.constraints[0];
    return `${args.property} must be after ${compareValue === 'now' ? 'the current date' : compareValue}`;
  }
}

export class CreateEventDto {
  @IsString({ message: 'Event name must be a string' })
  readonly name: string;

  @IsString({ message: 'Event description must be a string' })
  readonly description: string;

  @IsDateString({ strict: true }, { message: 'Invalid date format' })
  @Validate(IsAfterDate, ['now'], {
    message: 'Start date must be after the current date',
  })
  readonly startDate: Date;

  @IsDateString({ strict: true }, { message: 'Invalid date format' })
  @Validate(IsAfterDate, ['startDate'], {
    message: 'End date must be after the start date',
  })
  readonly endDate: Date;

  @IsString({ message: 'Event location must be a string' })
  readonly location: string;
}
