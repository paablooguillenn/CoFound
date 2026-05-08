import { signToken, verifyToken } from '../src/utils/jwt';

describe('jwt utils', () => {
  const payload = { userId: '11111111-1111-1111-1111-111111111111', email: 'user@example.com' };

  it('round-trips a payload through sign + verify', () => {
    const token = signToken(payload);
    const decoded = verifyToken(token);
    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
  });

  it('rejects a tampered token', () => {
    const token = signToken(payload);
    const tampered = token.slice(0, -2) + (token.endsWith('A') ? 'BB' : 'AA');
    expect(() => verifyToken(tampered)).toThrow();
  });

  it('rejects a malformed token', () => {
    expect(() => verifyToken('not-a-real-token')).toThrow();
  });
});
