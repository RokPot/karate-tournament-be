/**
 * Formats validation errors from class-validator into a more usable structure
 * @param validationErrors Array of validation errors from class-validator
 * @returns Formatted errors as an array of objects with field and errors properties
 */
export function formatValidationErrors(
  validationErrors: any[],
): Array<{ field: string; errors: string[]; target: string }> {
  const formattedErrors: Array<{ field: string; errors: string[]; target: string }> = [];

  const processErrors = (errors: any, path = '') => {
    if (errors.children && errors.children.length > 0) {
      // Process nested children
      errors.children.forEach((child: any, index: number) => {
        const newPath = path ? `${path}.${child.property || index}` : child.property || `${index}`;
        processErrors(child, newPath);
      });
    }

    // Process constraints at current level
    if (errors.constraints) {
      const field = path || errors.property;
      const constraintErrors = Object.values(errors.constraints) as string[];
      formattedErrors.push({ field, errors: constraintErrors, target: errors.target });
    }
  };

  validationErrors.forEach((error) => processErrors(error));
  return formattedErrors;
}
