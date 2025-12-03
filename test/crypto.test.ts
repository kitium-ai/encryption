import { describe, it, expect } from 'vitest';
import { checksum } from '../src/utils/checksum';

describe('checksum', () => {
  it('produces stable hash', () => {
    expect(checksum('abc')).toEqual(checksum('abc'));
    expect(checksum('abc')).not.toEqual(checksum('abcd'));
  });
});
