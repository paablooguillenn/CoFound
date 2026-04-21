import { PoolClient } from 'pg';

import { pool } from '../config/database';

type SkillInput = {
  name: string;
  level?: number;
};

type SkillGroup = {
  offeredSkills: Array<{ id: string; name: string; level: number }>;
  learningSkills: Array<{ id: string; name: string; level: number }>;
};

const normalizeSkillName = (value: string) => value.trim().toLowerCase();

export const syncUserSkills = async (
  userId: string,
  offeredSkills: SkillInput[],
  learningSkills: SkillInput[],
  client?: PoolClient,
) => {
  const executor = client ?? pool;

  await executor.query('DELETE FROM user_skills WHERE user_id = $1', [userId]);

  const skillGroups = [
    { items: offeredSkills, type: 'offer' },
    { items: learningSkills, type: 'learn' },
  ] as const;

  for (const group of skillGroups) {
    for (const item of group.items) {
      const normalizedName = normalizeSkillName(item.name);
      if (!normalizedName) {
        continue;
      }

      const skillResult = await executor.query<{ id: string }>(
        `INSERT INTO skills (name)
         VALUES ($1)
         ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [normalizedName],
      );

      await executor.query(
        `INSERT INTO user_skills (user_id, skill_id, skill_type, level)
         VALUES ($1, $2, $3, $4)`,
        [userId, skillResult.rows[0].id, group.type, item.level ?? 3],
      );
    }
  }
};

export const getUserSkills = async (userId: string): Promise<SkillGroup> => {
  const result = await pool.query<{
    id: string;
    name: string;
    level: number;
    skill_type: 'offer' | 'learn';
  }>(
    `SELECT s.id, s.name, us.level, us.skill_type
     FROM user_skills us
     INNER JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = $1
     ORDER BY s.name ASC`,
    [userId],
  );

  return result.rows.reduce<SkillGroup>(
    (accumulator, row) => {
      const formattedSkill = {
        id: row.id,
        name: row.name,
        level: row.level,
      };

      if (row.skill_type === 'offer') {
        accumulator.offeredSkills.push(formattedSkill);
      } else {
        accumulator.learningSkills.push(formattedSkill);
      }

      return accumulator;
    },
    {
      offeredSkills: [],
      learningSkills: [],
    },
  );
};

export const getSkillsMap = async (userIds: string[]) => {
  if (!userIds.length) {
    return new Map<string, SkillGroup>();
  }

  const result = await pool.query<{
    user_id: string;
    id: string;
    name: string;
    level: number;
    skill_type: 'offer' | 'learn';
  }>(
    `SELECT us.user_id, s.id, s.name, us.level, us.skill_type
     FROM user_skills us
     INNER JOIN skills s ON s.id = us.skill_id
     WHERE us.user_id = ANY($1::uuid[])
     ORDER BY s.name ASC`,
    [userIds],
  );

  const skillsMap = new Map<string, SkillGroup>();

  userIds.forEach((userId) => {
    skillsMap.set(userId, {
      offeredSkills: [],
      learningSkills: [],
    });
  });

  result.rows.forEach((row) => {
    const group = skillsMap.get(row.user_id);

    if (!group) {
      return;
    }

    const formattedSkill = {
      id: row.id,
      name: row.name,
      level: row.level,
    };

    if (row.skill_type === 'offer') {
      group.offeredSkills.push(formattedSkill);
    } else {
      group.learningSkills.push(formattedSkill);
    }
  });

  return skillsMap;
};
