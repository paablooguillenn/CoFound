import { comparePassword, hashPassword } from '../src/utils/password';

describe('password utils', () => {
  it('hashes a password to a non-reversible string', async () => {
    const hash = await hashPassword('Pa$$w0rd!');
    expect(hash).not.toBe('Pa$$w0rd!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('comparePassword returns true only for the original input', async () => {
    const hash = await hashPassword('correct horse battery staple');
    await expect(comparePassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(comparePassword('wrong password', hash)).resolves.toBe(false);
  });

  it('produces different hashes for the same input (salted)', async () => {
    const a = await hashPassword('same input');
    const b = await hashPassword('same input');
    expect(a).not.toBe(b);
  });
});
