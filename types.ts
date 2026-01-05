
export interface PlayerSkills {
  pace: number;
  shooting: number;
  passing: number;
  defending: number;
  physical: number;
  technique: number;
}

export const SKILL_LABELS: Record<keyof PlayerSkills, string> = {
  pace: 'מהירות',
  shooting: 'בעיטה',
  passing: 'מסירה',
  defending: 'הגנה',
  physical: 'פיזיות',
  technique: 'טכניקה'
};

export interface RoundStats {
  points: number;
  goals: number;
}

export interface Player {
  id: string;
  name: string;
  photo?: string;
  skills: PlayerSkills;
  rank: number;
  leagueData: Record<number, RoundStats>;
}

export interface Team {
  name: string;
  players: Player[];
  totalRank: number;
  color: string;
}

export const INITIAL_SKILLS: PlayerSkills = {
  pace: 70,
  shooting: 70,
  passing: 70,
  defending: 70,
  physical: 70,
  technique: 70
};

// פונקציה שמחזירה אובייקט חדש בכל פעם כדי למנוע הצבעה לאותו אובייקט בזיכרון
export const createInitialLeagueData = (): Record<number, RoundStats> => {
  const data: Record<number, RoundStats> = {};
  for (let i = 1; i <= 10; i++) {
    data[i] = { points: 0, goals: 0 };
  }
  return data;
};
