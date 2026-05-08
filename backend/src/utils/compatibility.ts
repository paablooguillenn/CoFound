/**
 * Skill-based compatibility score between two users.
 *
 * Mirrors the SQL formula in `discovery.service.ts`:
 *   score = round( (overlap_a_offer_with_b_learn + overlap_a_learn_with_b_offer)
 *                  * 100 / (a.offered.length + a.learning.length) )
 *
 * Returns 0 when the user has no skills (matches the SQL `GREATEST(..., 1)` guard).
 */
export const computeCompatibility = (
  me: { offered: string[]; learning: string[] },
  them: { offered: string[]; learning: string[] },
): number => {
  const myTotal = me.offered.length + me.learning.length;
  if (myTotal === 0) return 0;

  const theirOffered = new Set(them.offered);
  const theirLearning = new Set(them.learning);

  const matches =
    me.learning.filter((skill) => theirOffered.has(skill)).length +
    me.offered.filter((skill) => theirLearning.has(skill)).length;

  return Math.round((matches * 100) / myTotal);
};
