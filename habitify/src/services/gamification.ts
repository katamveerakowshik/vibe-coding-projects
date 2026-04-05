import { User, Achievement } from '../types';

export const XP_PER_LEVEL = 1000;

export const getTitleForLevel = (level: number): string => {
  if (level < 10) return 'Beginner';
  if (level < 25) return 'Scholar';
  if (level < 50) return 'Master';
  if (level < 75) return 'Sage';
  return 'Legend';
};

export const calculateXPForTask = (duration: number, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium'): number => {
  const baseXP = duration * 2; // 2 XP per minute
  const multiplier = difficulty === 'Easy' ? 1 : difficulty === 'Medium' ? 1.5 : 2;
  return Math.floor(baseXP * multiplier);
};

export const calculateXPForHabit = (): number => {
  return 50; // Flat 50 XP for completing a habit
};

export const checkLevelUp = (currentLevel: number, currentXP: number): { leveledUp: boolean; newLevel: number; remainingXP: number } => {
  if (currentXP >= XP_PER_LEVEL) {
    const levelsGained = Math.floor(currentXP / XP_PER_LEVEL);
    return {
      leveledUp: true,
      newLevel: currentLevel + levelsGained,
      remainingXP: currentXP % XP_PER_LEVEL
    };
  }
  return {
    leveledUp: false,
    newLevel: currentLevel,
    remainingXP: currentXP
  };
};

export const checkAchievements = (user: User, stats: { pomodorosCompleted: number; currentStreak: number; syllabusCompletion: number }): Achievement[] => {
  const newAchievements = [...user.achievements];
  let changed = false;

  if (stats.pomodorosCompleted >= 1 && !newAchievements.find(a => a.id === 'first_pomodoro')?.unlockedAt) {
    const ach = newAchievements.find(a => a.id === 'first_pomodoro');
    if (ach) {
      ach.unlockedAt = Date.now();
      changed = true;
    }
  }

  if (stats.currentStreak >= 7 && !newAchievements.find(a => a.id === 'seven_day_streak')?.unlockedAt) {
    const ach = newAchievements.find(a => a.id === 'seven_day_streak');
    if (ach) {
      ach.unlockedAt = Date.now();
      changed = true;
    }
  }

  if (stats.syllabusCompletion >= 50 && !newAchievements.find(a => a.id === 'syllabus_50')?.unlockedAt) {
    const ach = newAchievements.find(a => a.id === 'syllabus_50');
    if (ach) {
      ach.unlockedAt = Date.now();
      changed = true;
    }
  }

  return changed ? newAchievements : user.achievements;
};
