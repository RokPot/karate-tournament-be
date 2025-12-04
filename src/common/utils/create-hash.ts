import { createHash } from 'crypto';

export function createHashFromValue(value: string): string {
  const hasher = createHash('md5');
  hasher.update(value);
  // Add a timestamp for uniqueness
  // const timestamp = new Date().toISOString();
  // hasher.update(timestamp);
  return hasher.digest('hex'); //.slice(0, 12); // Return first 12 characters of the hash
}
