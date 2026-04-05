import { AppState, Habit, Session, Note, User, SyllabusNode } from '../types';

const STORAGE_KEY = 'habitify_v1';

export const storageService = {
  saveState: (state: AppState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state', e);
    }
  },

  loadState: (): AppState | null => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load state', e);
      return null;
    }
  },

  clearState: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  // Seed data for first-time users
  getSeedData: (): AppState => {
    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    return {
      user: {
        name: 'Scholar',
        avatar: '🎓',
        exam: 'GATE CS',
        examDate: '2026-02-01',
        level: 1,
        xp: 0,
        streak: 3,
        lastLogin: new Date().toISOString(),
        dailyHoursGoal: 6,
        achievements: [
          { id: 'first_pomodoro', title: 'First Pomodoro', description: 'Complete your first 25-minute focus session.', icon: '🍅' },
          { id: 'seven_day_streak', title: '7-Day Streak', description: 'Maintain a study streak for 7 consecutive days.', icon: '🔥' },
          { id: 'syllabus_50', title: 'Syllabus 50%', description: 'Complete 50% of your exam syllabus.', icon: '📚' }
        ]
      },
      habits: [
        {
          id: '1',
          name: 'Morning Revision',
          category: 'Study',
          frequency: 'Daily',
          createdAt: now,
          completions: [today],
          streak: 5,
          bestStreak: 5
        },
        {
          id: '2',
          name: 'Hydration (2L)',
          category: 'Health',
          frequency: 'Daily',
          createdAt: now,
          completions: [today],
          streak: 12,
          bestStreak: 12
        }
      ],
      sessions: [],
      syllabus: {
        'CAT': [
          {
            id: 'cat_qa',
            name: 'Quantitative Aptitude',
            difficulty: 'Hard',
            weightage: 30,
            estimatedHours: 120,
            checked: false,
            children: [
              { id: 'cat_qa_arith', name: 'Arithmetic (Percentages, Profit & Loss, SI-CI)', difficulty: 'Medium', weightage: 10, estimatedHours: 40, checked: false },
              { id: 'cat_qa_algebra', name: 'Algebra (Equations, Functions, Logarithms)', difficulty: 'Hard', weightage: 8, estimatedHours: 35, checked: false },
              { id: 'cat_qa_geometry', name: 'Geometry & Mensuration', difficulty: 'Hard', weightage: 6, estimatedHours: 25, checked: false },
              { id: 'cat_qa_number', name: 'Number Systems', difficulty: 'Medium', weightage: 6, estimatedHours: 20, checked: false }
            ]
          },
          {
            id: 'cat_dilr',
            name: 'Data Interpretation & Logical Reasoning',
            difficulty: 'Hard',
            weightage: 30,
            estimatedHours: 100,
            checked: false,
            children: [
              { id: 'cat_dilr_sets', name: 'Set Theory & Venn Diagrams', difficulty: 'Medium', weightage: 10, estimatedHours: 25, checked: false },
              { id: 'cat_dilr_arr', name: 'Arrangements & Selections', difficulty: 'Hard', weightage: 10, estimatedHours: 35, checked: false },
              { id: 'cat_dilr_graphs', name: 'Graphs & Charts', difficulty: 'Medium', weightage: 10, estimatedHours: 40, checked: false }
            ]
          },
          {
            id: 'cat_varc',
            name: 'Verbal Ability & Reading Comprehension',
            difficulty: 'Medium',
            weightage: 40,
            estimatedHours: 80,
            checked: false,
            children: [
              { id: 'cat_varc_rc', name: 'Reading Comprehension', difficulty: 'Hard', weightage: 25, estimatedHours: 50, checked: false },
              { id: 'cat_varc_va', name: 'Verbal Ability (Para-jumbles, Summary)', difficulty: 'Medium', weightage: 15, estimatedHours: 30, checked: false }
            ]
          }
        ],
        'Python': [
          {
            id: 'py_basics',
            name: 'Python Fundamentals',
            difficulty: 'Easy',
            weightage: 20,
            estimatedHours: 15,
            checked: true,
            children: [
              { id: 'py_basics_vars', name: 'Variables & Data Types', difficulty: 'Easy', weightage: 5, estimatedHours: 3, checked: true },
              { id: 'py_basics_ctrl', name: 'Control Flow (If, Loops)', difficulty: 'Easy', weightage: 5, estimatedHours: 4, checked: true },
              { id: 'py_basics_func', name: 'Functions & Modules', difficulty: 'Medium', weightage: 10, estimatedHours: 8, checked: false }
            ]
          },
          {
            id: 'py_ds',
            name: 'Data Structures',
            difficulty: 'Medium',
            weightage: 30,
            estimatedHours: 25,
            checked: false,
            children: [
              { id: 'py_ds_list', name: 'Lists, Tuples, Sets', difficulty: 'Easy', weightage: 10, estimatedHours: 8, checked: false },
              { id: 'py_ds_dict', name: 'Dictionaries & Comprehensions', difficulty: 'Medium', weightage: 10, estimatedHours: 10, checked: false },
              { id: 'py_ds_strings', name: 'String Manipulation & Regex', difficulty: 'Medium', weightage: 10, estimatedHours: 7, checked: false }
            ]
          },
          {
            id: 'py_adv',
            name: 'Advanced Python',
            difficulty: 'Hard',
            weightage: 50,
            estimatedHours: 60,
            checked: false,
            children: [
              { id: 'py_adv_oop', name: 'Object Oriented Programming', difficulty: 'Hard', weightage: 20, estimatedHours: 20, checked: false },
              { id: 'py_adv_iter', name: 'Iterators, Generators, Decorators', difficulty: 'Hard', weightage: 15, estimatedHours: 20, checked: false },
              { id: 'py_adv_async', name: 'Asynchronous Programming (asyncio)', difficulty: 'Hard', weightage: 15, estimatedHours: 20, checked: false }
            ]
          }
        ]
      },
      notes: [],
      settings: {
        apiKey: '',
        theme: 'Dark Neon',
        notifications: true
      }
    };
  }
};
