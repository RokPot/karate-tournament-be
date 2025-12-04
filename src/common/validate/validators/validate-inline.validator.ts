import { registerDecorator, type ValidationOptions, type ValidationArguments } from 'class-validator';

export function ValidateInline(
  func: ({ object, value }: { object: any; value: any }) => Promise<boolean> | boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'validateInline',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [func],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [func] = args.constraints;
          return func({ args: args, object: args.object, value });
        },
      },
    });
  };
}
