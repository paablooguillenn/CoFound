import { computeCompatibility } from '../src/utils/compatibility';

describe('computeCompatibility', () => {
  it('returns 0 when the current user has no skills', () => {
    const score = computeCompatibility(
      { offered: [], learning: [] },
      { offered: ['react'], learning: ['python'] },
    );
    expect(score).toBe(0);
  });

  it('returns 100 when every skill of mine is mirrored by the other user', () => {
    // I offer react and want to learn python; they want react and offer python.
    const score = computeCompatibility(
      { offered: ['react'], learning: ['python'] },
      { offered: ['python'], learning: ['react'] },
    );
    expect(score).toBe(100);
  });

  it('returns 0 when there is no overlap', () => {
    const score = computeCompatibility(
      { offered: ['react'], learning: ['python'] },
      { offered: ['rust'], learning: ['go'] },
    );
    expect(score).toBe(0);
  });

  it('partial overlap is reflected proportionally', () => {
    // I offer react,node and learn python,go.
    // They offer python and learn react. → 2 matches out of 4 → 50%.
    const score = computeCompatibility(
      { offered: ['react', 'node'], learning: ['python', 'go'] },
      { offered: ['python'], learning: ['react'] },
    );
    expect(score).toBe(50);
  });

  it('only counts cross-direction matches (offer↔learn), never offer↔offer', () => {
    // Both offer react. They are NOT compatible because compatibility is complementarity.
    const score = computeCompatibility(
      { offered: ['react'], learning: ['python'] },
      { offered: ['react'], learning: ['go'] },
    );
    expect(score).toBe(0);
  });

  it('rounds to the nearest integer', () => {
    // I have 3 skills total, 1 match → 33.33 → rounds to 33.
    const score = computeCompatibility(
      { offered: ['react', 'node'], learning: ['python'] },
      { offered: ['python'], learning: [] },
    );
    expect(score).toBe(33);
  });
});
