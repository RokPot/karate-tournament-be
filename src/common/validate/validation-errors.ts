import type { ValidationError } from 'class-validator';

function deepMergeShortValidation(errors: ValidationError[]): string[] {
  return errors.map((error) => {
    if (error.children?.length) {
      return `${error.property}.${deepMergeShortValidation(error.children).join(', ')}`;
    } else {
      return `${error.property}${error.constraints ? '(' + Object.keys(error.constraints || {}).join(', ') + ')' : ''}`;
    }
  });
}

/**
 * Wrapper for class-validator non-standard ValidationError array
 */
export class ValidationErrors extends Error {
  public readonly target: object | undefined;
  constructor(public readonly errors: ValidationError[]) {
    const target = errors?.[0]?.target;

    super(
      `Validation failed for ${target ? target.constructor.name : 'unknown'} on ${deepMergeShortValidation(errors).join(', ')}`,
    );
    this.target = target;
  }

  public toConsole() {
    return deepMergeShortValidation(this.errors).join(', ');
  }
}
