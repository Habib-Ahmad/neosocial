import bcrypt from 'bcryptjs';

/**
 * Fast password hashing for tests only (uses 1 round instead of 10)
 * Reduces bcrypt time from ~100ms to <5ms per hash
 */
export async function hashPasswordForTest(password: string): Promise<string> {
  return bcrypt.hash(password, 1); // Fast hashing for tests
}
