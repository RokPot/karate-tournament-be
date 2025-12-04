/**
 * Deep merges an array of objects into a single object.
 * @param objects - Array of objects to merge
 * @returns - Merged object
 */
export function deepMerge<T extends object[]>(...objects: T): any {
  // Return if no objects provided
  if (objects.length === 0) return {};

  const isObject = (item: any): boolean => {
    return item && typeof item === 'object' && !Array.isArray(item);
  };

  // Base object to merge into
  const result: any = { ...objects[0] };

  for (let i = 1; i < objects.length; i++) {
    const currentObject: any = objects[i];

    if (!isObject(currentObject)) continue;

    for (const key in currentObject) {
      if (Object.prototype.hasOwnProperty.call(currentObject, key)) {
        const currentValue = currentObject[key];
        const existingValue = result[key];

        if (Array.isArray(existingValue) && Array.isArray(currentValue)) {
          // Merge arrays
          result[key] = [...existingValue, ...currentValue];
        } else if (isObject(existingValue) && isObject(currentValue)) {
          // Recursively merge objects
          result[key] = deepMerge(existingValue, currentValue);
        } else {
          // Override primitives or handle different types
          result[key] = currentValue;
        }
      }
    }
  }

  return result;
}
