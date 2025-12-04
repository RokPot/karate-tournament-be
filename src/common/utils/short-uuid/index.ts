import short from 'short-uuid';

const translator = short(); // Defaults to flickrBase58

/**
 * A short, unique, user-friendly id
 * - generated from UUID and can be converted back to one
 *    translator.toUUID(shortId)
 */
export function makeId(): string {
  return translator.generate();
}

export function idToUUID(id: string): string {
  return translator.toUUID(id);
}

export function uuidToId(uuid: string): string {
  return translator.fromUUID(uuid);
}

export function makeUUID(): string {
  return translator.uuid();
}
