import { createHash, timingSafeEqual } from 'crypto';

export function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function sha256HexEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
