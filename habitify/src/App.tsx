import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Target, 
  Map, 
  Brain, 
  BarChart3, 
  BookOpen, 
  Flame, 
  Settings, 
  Menu,
  X,
  Plus,
  CheckCircle2,
  Trophy,
  Zap,
  Clock,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AICommandBar } from './components/AICommandBar';
import { Timer } from './components/Timer';
import { SyllabusExplorer } from './components/SyllabusExplorer';
import { MissionControl } from './components/MissionControl';
import { NotesHub } from './components/NotesHub';
import { StudyPlanner } from './components/StudyPlanner';
import { MindMap } from './components/MindMap';
import { ConsistencyTracker } from './components/ConsistencyTracker';
import { Resources } from './components/Resources';
import { StudyMethods } from './components/StudyMethods';
import { LevelUpModal } from './components/LevelUpModal';
import { AddHabitModal } from './components/AddHabitModal';
import { CommunityChat } from './components/CommunityChat';
import { storageService } from './services/storageService';
import { AppState, User, Habit, SyllabusNode, Note, Task, Session } from './types';
import { calculateXPForTask, calculateXPForHabit, checkLevelUp, getTitleForLevel, XP_PER_LEVEL } from './services/gamification';
import { geminiService } from './services/geminiService';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  onAuthStateChanged, 
  FirebaseUser 
} from './firebase';
import { firebaseService } from './services/firebaseService';
import { LogIn, LogOut, User as UserIcon } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = storageService.loadState();
    return saved || storageService.getSeedData();
  });

  const [activeTab, setActiveTab] = useState('Home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(() => !state.user?.name || state.user.name === 'Scholar');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [lastLevel, setLastLevel] = useState(state.user?.level || 1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [goalInput, setGoalInput] = useState('');
  const [hoursInput, setHoursInput] = useState(6);
  const [startTimeInput, setStartTimeInput] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (state.settings.apiKey) {
      geminiService.setApiKey(state.settings.apiKey);
    }
  }, [state.settings.apiKey]);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.user && state.user.lastLogin.split('T')[0] !== today) {
      setShowGoalModal(true);
      setState(prev => ({ ...prev, user: prev.user ? { ...prev.user, lastLogin: new Date().toISOString() } : null }));
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsAuthLoading(true);
        try {
          const cloudData = await firebaseService.loadAllUserData(user.uid);
          
          if (cloudData.user) {
            // Merge cloud data with local state if needed, or just replace
            setState(prev => ({
              ...prev,
              user: cloudData.user as User,
              settings: (cloudData.user as any).settings || prev.settings,
              habits: cloudData.habits || [],
              sessions: cloudData.sessions || [],
              notes: cloudData.notes || [],
              syllabus: cloudData.syllabus || {}
            }));
          } else {
            // First time login, sync local data to cloud
            const localState = storageService.loadState() || storageService.getSeedData();
            if (localState.user) {
              await firebaseService.saveUserProfile(user.uid, {
                ...localState.user,
                settings: localState.settings
              } as any);
              for (const h of localState.habits) await firebaseService.saveHabit(user.uid, h);
              for (const s of localState.sessions) await firebaseService.saveSession(user.uid, s);
              for (const n of localState.notes) await firebaseService.saveNote(user.uid, n);
              for (const exam in localState.syllabus) {
                await firebaseService.saveSyllabus(user.uid, exam, localState.syllabus[exam]);
              }
            }
          }
        } catch (error) {
          console.error("Error syncing with Firebase:", error);
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setIsAuthLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setState(storageService.getSeedData());
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const addXP = (amount: number) => {
    setState(prev => {
      if (!prev.user) return prev;
      const newXP = prev.user.xp + amount;
      const { leveledUp, newLevel, remainingXP } = checkLevelUp(prev.user.level, newXP);
      
      if (leveledUp) {
        setShowLevelUp(true);
        setLastLevel(newLevel);
      }

      const updatedUser = {
        ...prev.user,
        level: newLevel,
        xp: remainingXP
      };

      if (currentUser) {
        firebaseService.saveUserProfile(currentUser.uid, {
          ...updatedUser,
          settings: prev.settings
        } as any);
      }

      return {
        ...prev,
        user: updatedUser
      };
    });
  };

  useEffect(() => {
    storageService.saveState(state);
  }, [state]);

  const toggleHabit = (habitId: string, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    setState(prev => {
      const newHabits = prev.habits.map(h => {
        if (h.id === habitId) {
          const completed = h.completions.includes(targetDate);
          const newCompletions = completed 
            ? h.completions.filter(d => d !== targetDate)
            : [...h.completions, targetDate].sort();
          
          // Calculate streak
          let streak = 0;
          const sorted = [...newCompletions].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
          const today = new Date().toISOString().split('T')[0];
          let current = today;
          
          for (const d of sorted) {
            if (d === current) {
              streak++;
              const prev = new Date(current);
              prev.setDate(prev.getDate() - 1);
              current = prev.toISOString().split('T')[0];
            } else if (d < current) {
              break;
            }
          }

          const updatedHabit = { 
            ...h, 
            completions: newCompletions,
            streak,
            bestStreak: Math.max(h.bestStreak, streak)
          };

          if (currentUser) {
            firebaseService.saveHabit(currentUser.uid, updatedHabit);
          }

          if (!completed) {
            addXP(calculateXPForHabit());
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
          }

          return updatedHabit;
        }
        return h;
      });
      return { ...prev, habits: newHabits };
    });
  };

  const addHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'completions' | 'streak' | 'bestStreak'>, manualDates: string[]) => {
    const newHabit: Habit = {
      ...habitData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: Date.now(),
      completions: manualDates,
      streak: 0,
      bestStreak: 0
    };

    // Recalculate streak if manual dates were added
    if (manualDates.length > 0) {
      let streak = 0;
      const sorted = [...manualDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
      const today = new Date().toISOString().split('T')[0];
      let current = today;
      
      for (const d of sorted) {
        if (d === current) {
          streak++;
          const prev = new Date(current);
          prev.setDate(prev.getDate() - 1);
          current = prev.toISOString().split('T')[0];
        } else if (d < current) {
          break;
        }
      }
      newHabit.streak = streak;
      newHabit.bestStreak = streak;
    }

    if (currentUser) {
      firebaseService.saveHabit(currentUser.uid, newHabit);
    }

    setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const toggleSyllabusNode = (id: string) => {
    setState(prev => {
      const exam = prev.user?.exam || 'GATE CS';
      const nodes = prev.syllabus[exam] || [];
      
      const updateNodes = (list: SyllabusNode[]): SyllabusNode[] => {
        return list.map(node => {
          if (node.id === id) {
            return { ...node, checked: !node.checked };
          }
          if (node.children) {
            return { ...node, children: updateNodes(node.children) };
          }
          return node;
        });
      };

      const updatedNodes = updateNodes(nodes);

      if (currentUser) {
        firebaseService.saveSyllabus(currentUser.uid, exam, updatedNodes);
      }

      return {
        ...prev,
        syllabus: {
          ...prev.syllabus,
          [exam]: updatedNodes
        }
      };
    });
  };

  const toggleTask = (id: string) => {
    setState(prev => {
      const today = new Date().toISOString().split('T')[0];
      const session = prev.sessions.find(s => s.date === today);
      if (!session) return prev;

      let xpToAdd = 0;
      const newSessions = prev.sessions.map(s => {
        if (s.date === today) {
          const newPlan = s.plan.map(t => {
            if (t.id === id) {
              const newCompleted = !t.completed;
              if (newCompleted) {
                xpToAdd = calculateXPForTask(t.duration, 'Medium');
                if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
              }
              return { ...t, completed: newCompleted };
            }
            return t;
          });
          const updatedSession = { ...s, plan: newPlan };
          if (currentUser) {
            firebaseService.saveSession(currentUser.uid, updatedSession);
          }
          return updatedSession;
        }
        return s;
      });

      if (xpToAdd > 0) {
        setTimeout(() => addXP(xpToAdd), 100);
      }

      return { ...prev, sessions: newSessions };
    });
  };

  const addNote = () => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Note',
      content: '',
      tags: ['General'],
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      isStarred: false
    };
    if (currentUser) {
      firebaseService.saveNote(currentUser.uid, newNote);
    }
    setState(prev => ({ ...prev, notes: [newNote, ...prev.notes] }));
    return newNote.id;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    setState(prev => {
      const newNotes = prev.notes.map(n => {
        if (n.id === id) {
          const updatedNote = { ...n, ...updates, modifiedAt: Date.now() };
          if (currentUser) {
            firebaseService.saveNote(currentUser.uid, updatedNote);
          }
          return updatedNote;
        }
        return n;
      });
      return { ...prev, notes: newNotes };
    });
  };

  const deleteNote = (id: string) => {
    if (currentUser) {
      firebaseService.deleteNote(currentUser.uid, id);
    }
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  };

  const toggleStarNote = (id: string) => {
    setState(prev => {
      const newNotes = prev.notes.map(n => {
        if (n.id === id) {
          const updatedNote = { ...n, isStarred: !n.isStarred };
          if (currentUser) {
            firebaseService.saveNote(currentUser.uid, updatedNote);
          }
          return updatedNote;
        }
        return n;
      });
      return { ...prev, notes: newNotes };
    });
  };

  const handleOnboardingSubmit = (userData: Partial<User>) => {
    const updatedUser = {
      ...state.user!,
      ...userData,
      lastLogin: new Date().toISOString()
    };
    if (currentUser) {
      firebaseService.saveUserProfile(currentUser.uid, {
        ...updatedUser,
        settings: state.settings
      } as any);
    }
    setState(prev => ({
      ...prev,
      user: updatedUser
    }));
    setShowOnboarding(false);
  };

  const handleGoalSubmit = async (goal: string, hours: number, startTime?: string) => {
    if (!state.settings.apiKey) {
      alert("Please set your Gemini API Key in Settings first.");
      setActiveTab('Settings');
      setShowGoalModal(false);
      return;
    }

    setIsGenerating(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = startTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
      const plan = await geminiService.generateStudyPlan(goal, state.user?.exam || 'GATE CS', hours, currentTime);
      
      if (!Array.isArray(plan)) {
        throw new Error("Invalid plan format received from AI");
      }

      const newSession: Session = {
        id: Math.random().toString(36).substr(2, 9),
        date: today,
        goal,
        exam: state.user?.exam || 'GATE CS',
        plan: plan.map((t: any, i: number) => ({ ...t, id: t.id || String(i), completed: false })),
        notes: {},
        analytics: {},
        completionRate: 0
      };

      if (currentUser) {
        firebaseService.saveSession(currentUser.uid, newSession);
      }

      setState(prev => ({
        ...prev,
        sessions: [newSession, ...prev.sessions.filter(s => s.date !== today)]
      }));
      setShowGoalModal(false);
      setActiveTab('Planner');
    } catch (error) {
      alert("Failed to generate plan. Please check your API key and connection.");
    } finally {
      setIsGenerating(false);
    }
  };

  const regeneratePlan = async () => {
    const today = new Date().toISOString().split('T')[0];
    const session = state.sessions.find(s => s.date === today);
    if (session) {
      const now = new Date();
      const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      handleGoalSubmit(session.goal, 6, startTime);
    } else {
      setShowGoalModal(true);
    }
  };

  const generateSyllabus = async (exam: string) => {
    if (!state.settings.apiKey) {
      alert("Please set your Gemini API Key in Settings first.");
      setActiveTab('Settings');
      return;
    }

    setIsGenerating(true);
    try {
      const normalizedExam = exam.trim().toUpperCase();
      const isSupported = normalizedExam === 'CAT' || normalizedExam === 'PYTHON';
      
      if (!isSupported) {
        // Simulate a "not found" or "coming soon" for other subjects to hide the hard limit
        setTimeout(() => {
          alert(`Syllabus for "${exam}" is currently being indexed. Please try "CAT" or "Python" for the demo.`);
          setIsGenerating(false);
        }, 1500);
        return;
      }

      const syllabus = await geminiService.generateSyllabus(exam);
      if (currentUser) {
        firebaseService.saveSyllabus(currentUser.uid, exam, syllabus);
      }
      setState(prev => ({
        ...prev,
        syllabus: {
          ...prev.syllabus,
          [exam]: syllabus
        },
        user: prev.user ? { ...prev.user, exam: exam as any } : null
      }));
      setActiveTab('Syllabus');
    } catch (error) {
      console.error("Syllabus Generation Error:", error);
      alert("Failed to generate syllabus. Please check your API key.");
    } finally {
      setIsGenerating(false);
    }
  };

  const navItems = [
    { id: 'Home', icon: Home, label: 'Dashboard' },
    { id: 'Planner', icon: Target, label: 'Today\'s Mission' },
    { id: 'Syllabus', icon: Map, label: 'Syllabus Map' },
    { id: 'MindMap', icon: Brain, label: 'Mind Map' },
    { id: 'Analytics', icon: BarChart3, label: 'Mission Control' },
    { id: 'Notes', icon: BookOpen, label: 'Notes Hub' },
    { id: 'Consistency', icon: Flame, label: 'Consistency' },
    { id: 'Settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-bg-void text-text-primary flex">
      {/* XP Bar */}
      <div className="fixed top-0 left-0 w-full h-1 z-[60] bg-white/5">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${(state.user?.xp || 0) / XP_PER_LEVEL * 100}%` }}
          className="h-full bg-neon-green shadow-glow-green"
        />
      </div>

      {/* Particle Background */}
      <div className="particles">
        {[...Array(20)].map((_, i) => (
          <div 
            key={i} 
            className="particle" 
            style={{
              left: `${Math.random() * 100}%`,
              width: `${Math.random() * 4 + 1}px`,
              height: `${Math.random() * 4 + 1}px`,
              animationDuration: `${Math.random() * 10 + 10}s`,
              animationDelay: `${Math.random() * 5}s`
            }}
          />
        ))}
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:relative z-40 h-full bg-bg-card/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-500",
        isSidebarOpen ? "w-64" : "w-20",
        "hidden lg:flex flex-col"
      )}>
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-neon-green rounded-xl flex items-center justify-center shadow-glow-green">
            <Zap className="text-bg-void" fill="currentColor" />
          </div>
          {isSidebarOpen && <h1 className="text-2xl font-syne tracking-tighter text-neon-green">HABITIFY</h1>}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-300 group",
                activeTab === item.id 
                  ? "bg-neon-green/10 text-neon-green border border-neon-green/20" 
                  : "text-text-muted hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon size={24} className={cn(activeTab === item.id && "animate-pulse-glow")} />
              {isSidebarOpen && <span className="font-bold">{item.label}</span>}
              {activeTab === item.id && isSidebarOpen && (
                <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 bg-neon-green rounded-full shadow-glow-green" />
              )}
            </button>
          ))}
          
          <div className="pt-4 border-t border-white/5 mt-4">
            {currentUser ? (
              <button
                onClick={handleLogout}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl text-text-muted hover:bg-neon-pink/10 hover:text-neon-pink transition-all duration-300"
                )}
              >
                <LogOut size={24} />
                {isSidebarOpen && <span className="font-bold">Logout</span>}
              </button>
            ) : (
              <button
                onClick={handleLogin}
                className={cn(
                  "w-full flex items-center gap-4 p-3 rounded-xl text-text-muted hover:bg-neon-cyan/10 hover:text-neon-cyan transition-all duration-300"
                )}
              >
                <LogIn size={24} />
                {isSidebarOpen && <span className="font-bold">Login</span>}
              </button>
            )}
          </div>
        </nav>

        <div className="p-4">
          <div className={cn("glass-card p-4 neon-border-cyan flex items-center gap-3", !isSidebarOpen && "justify-center")}>
            <div className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-xl overflow-hidden border border-white/10">
              {currentUser?.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                state.user?.avatar || '🎓'
              )}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden">
                <p className="font-bold truncate">{currentUser?.displayName || state.user?.name}</p>
                <p className="text-xs text-text-muted">Level {state.user?.level} Scholar</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 relative overflow-y-auto pt-24 pb-24 lg:pb-8 px-4 lg:px-8">
        <AICommandBar onCommand={async (cmd, args) => {
          if (cmd === 'syllabus') {
            await generateSyllabus(args);
          } else if (cmd === 'plan') {
            const now = new Date();
            const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            await handleGoalSubmit(args, 6, startTime);
          } else if (cmd === 'habit') {
            addHabit({
              name: args,
              category: 'AI Suggested',
              frequency: 'Daily',
            }, []);
          }
        }} />

        {/* Loading Overlay */}
        <AnimatePresence>
          {(isGenerating || isAuthLoading) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] bg-bg-void/80 backdrop-blur-md flex flex-col items-center justify-center"
            >
              <div className="w-16 h-16 border-4 border-neon-green border-t-transparent rounded-full animate-spin mb-4 shadow-glow-green" />
              <p className="font-syne text-neon-green animate-pulse">
                {isAuthLoading ? "SYNCHRONIZING CLOUD DATA..." : "SYNCHRONIZING TRAJECTORY..."}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Onboarding Overlay */}
        <AnimatePresence>
          {showOnboarding && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-bg-void flex items-center justify-center p-4"
            >
              <div className="glass-card p-8 max-w-md w-full neon-border-cyan space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-neon-green rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-glow-green animate-float">
                    <Zap size={40} className="text-bg-void" fill="currentColor" />
                  </div>
                  <h2 className="text-3xl font-syne mb-2">WELCOME TO HABITIFY</h2>
                  <p className="text-text-muted">The nexus of your productivity and preparation.</p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="text" 
                    placeholder="Enter your name..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleOnboardingSubmit({ name: (e.target as HTMLInputElement).value });
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.querySelector('input') as HTMLInputElement;
                      handleOnboardingSubmit({ name: input.value });
                    }}
                    className="w-full btn-neon btn-neon-green py-3"
                  >
                    LAUNCH HABITIFY
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Goal Modal */}
        <AnimatePresence>
          {showGoalModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[90] bg-bg-void/90 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="glass-card p-8 max-w-xl w-full neon-border-green space-y-8"
              >
                <div className="flex justify-between items-start">
                  <div className="text-left">
                    <h2 className="text-3xl font-syne mb-2">TODAY'S MISSION</h2>
                    <p className="text-text-muted text-sm">Set your mission parameters for {new Date().toLocaleDateString()}</p>
                  </div>
                  <button 
                    onClick={() => setShowGoalModal(false)}
                    className="p-2 hover:bg-white/10 rounded-xl transition-all text-text-muted"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-3 tracking-widest">1. What's the target?</label>
                    <textarea 
                      value={goalInput}
                      onChange={(e) => setGoalInput(e.target.value)}
                      placeholder="e.g. Master Python Data Structures and solve 5 problems..."
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:neon-border-green h-24 resize-none font-syne text-lg transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-3 tracking-widest">2. Mission Duration (Hours)</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 3, 6].map(h => (
                        <button
                          key={h}
                          onClick={() => setHoursInput(h)}
                          className={cn(
                            "py-3 rounded-xl font-bold transition-all border-2",
                            hoursInput === h 
                              ? "bg-neon-green text-bg-void border-neon-green shadow-glow-green" 
                              : "bg-white/5 border-white/10 text-text-muted hover:border-neon-green/50"
                          )}
                        >
                          {h}H
                        </button>
                      ))}
                      <div className="relative">
                        <input 
                          type="number" 
                          value={hoursInput}
                          onChange={(e) => setHoursInput(parseInt(e.target.value) || 0)}
                          className={cn(
                            "w-full h-full bg-white/5 border-2 rounded-xl px-3 outline-none font-bold text-center transition-all",
                            ![1, 3, 6].includes(hoursInput) ? "border-neon-green text-neon-green" : "border-white/10 text-text-muted"
                          )}
                          placeholder="Custom"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-3 tracking-widest">3. Launch Time</label>
                    <div className="flex items-center gap-4">
                      <div className="relative flex-1">
                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-neon-green" size={20} />
                        <input 
                          type="time" 
                          value={startTimeInput}
                          onChange={(e) => setStartTimeInput(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-4 outline-none focus:neon-border-green font-bold text-lg"
                        />
                      </div>
                      <button 
                        onClick={() => {
                          const now = new Date();
                          setStartTimeInput(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                        }}
                        className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-xs font-bold hover:text-neon-green transition-all"
                      >
                        NOW
                      </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => handleGoalSubmit(goalInput, hoursInput, startTimeInput)}
                    disabled={!goalInput.trim() || isGenerating}
                    className="w-full btn-neon btn-neon-green py-5 text-xl flex items-center justify-center gap-3"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-6 h-6 border-4 border-bg-void border-t-transparent rounded-full animate-spin" />
                        CALCULATING TRAJECTORY...
                      </>
                    ) : (
                      <>
                        <Zap size={24} /> GENERATE MISSION PLAN
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto space-y-8">
          {activeTab === 'Home' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Hero Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="glass-card p-6 neon-border-green group hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-neon-green/10 rounded-xl text-neon-green">
                      <Trophy size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-muted">TODAY'S SCORE</span>
                  </div>
                  <div className="text-4xl font-syne font-bold mb-2">84%</div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '84%' }}
                      className="h-full bg-neon-green shadow-glow-green"
                    />
                  </div>
                </div>

                <div className="glass-card p-6 neon-border-cyan group hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-neon-cyan/10 rounded-xl text-neon-cyan">
                      <Flame size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-muted">STREAK</span>
                  </div>
                  <div className="text-4xl font-syne font-bold mb-2">{state.user?.streak} DAYS</div>
                  <p className="text-xs text-neon-cyan">Personal Best: 15 Days</p>
                </div>

                <div className="glass-card p-6 neon-border-purple group hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-neon-purple/10 rounded-xl text-neon-purple">
                      <Target size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-muted">TASKS</span>
                  </div>
                  <div className="text-4xl font-syne font-bold mb-2">5/8</div>
                  <p className="text-xs text-text-muted">3 remaining for today</p>
                </div>

                <div className="glass-card p-6 neon-border-orange group hover:scale-105 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-neon-orange/10 rounded-xl text-neon-orange">
                      <Zap size={24} />
                    </div>
                    <span className="text-xs font-bold text-text-muted">XP EARNED</span>
                  </div>
                  <div className="text-4xl font-syne font-bold mb-2">1,240</div>
                  <p className="text-xs text-neon-orange">Next Level in 760 XP</p>
                </div>
              </div>

              {/* Habits and Timer Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-syne">THIS WEEK'S HABITS</h2>
                    <button className="flex items-center gap-2 text-neon-green hover:underline font-bold" onClick={() => setIsAddHabitModalOpen(true)}>
                      <Plus size={18} /> ADD HABIT
                    </button>
                  </div>

                  <div className="glass-card overflow-hidden">
                    <div className="grid grid-cols-8 border-b border-white/5 bg-white/5 p-4">
                      <div className="col-span-1 text-xs font-bold text-text-muted uppercase">Habit</div>
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="text-center text-xs font-bold text-text-muted uppercase">{d}</div>
                      ))}
                    </div>
                    <div className="divide-y divide-white/5">
                      {state.habits.map((habit) => (
                        <div key={habit.id} className="grid grid-cols-8 p-4 items-center hover:bg-white/5 transition-all">
                          <div className="col-span-1">
                            <p className="font-bold text-sm transition-colors" style={habit.color ? { color: habit.color } : {}}>{habit.name}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              <span className="text-[8px] text-text-muted uppercase px-1 bg-white/5 rounded">{habit.category}</span>
                              {(habit.targetDurationHours !== undefined || habit.targetDurationMinutes !== undefined) && (
                                <span className="text-[8px] text-text-muted uppercase px-1 bg-white/5 rounded">
                                  {habit.targetDurationHours || 0}h {habit.targetDurationMinutes || 0}m
                                </span>
                              )}
                            </div>
                            {habit.tags && habit.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {habit.tags.map(tag => (
                                  <span key={tag} className="text-[8px] text-neon-cyan/80">#{tag}</span>
                                ))}
                              </div>
                            )}
                          </div>
                          {[...Array(7)].map((_, i) => {
                            const todayIdx = (new Date().getDay() + 6) % 7;
                            const isToday = i === todayIdx;
                            
                            // Calculate the date for this column
                            const d = new Date();
                            d.setDate(d.getDate() - (todayIdx - i));
                            const dateStr = d.toISOString().split('T')[0];
                            
                            const completed = habit.completions.includes(dateStr);
                            return (
                              <div key={i} className="flex justify-center">
                                <button
                                  onClick={() => toggleHabit(habit.id, dateStr)}
                                  style={completed && habit.color ? { backgroundColor: habit.color, borderColor: habit.color, boxShadow: `0 0 15px ${habit.color}` } : {}}
                                  className={cn(
                                    "w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center",
                                    completed ? (habit.color ? "text-bg-void" : "bg-neon-green border-neon-green text-bg-void shadow-glow-green") : "border-white/10 hover:border-neon-green/50",
                                    isToday && !completed && "animate-pulse-glow border-neon-green/30"
                                  )}
                                >
                                  {completed && <CheckCircle2 size={16} />}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h2 className="text-2xl font-syne">FOCUS LAB</h2>
                  <Timer />
                  
                  <div className="glass-card p-6 neon-border-purple">
                    <h3 className="font-syne text-lg mb-4">DAILY PROGRESS</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>SYLLABUS COVERAGE</span>
                          <span className="text-neon-purple">
                            {Math.round((state.syllabus[state.user?.exam || 'GATE CS']?.filter(n => n.checked).length || 0) / (state.syllabus[state.user?.exam || 'GATE CS']?.length || 1) * 100)}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-neon-purple shadow-glow-purple transition-all duration-1000" 
                            style={{ width: `${(state.syllabus[state.user?.exam || 'GATE CS']?.filter(n => n.checked).length || 0) / (state.syllabus[state.user?.exam || 'GATE CS']?.length || 1) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs font-bold mb-1">
                          <span>MOCK TESTS</span>
                          <span className="text-neon-cyan">12/30</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-neon-cyan w-[40%]" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card p-6 neon-border-green group cursor-pointer" onClick={() => setActiveTab('Syllabus')}>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-syne text-lg">SYLLABUS MAP</h3>
                      <Map size={20} className="text-neon-green group-hover:rotate-12 transition-all" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="text-text-muted uppercase">{state.user?.exam || 'GATE CS'}</span>
                        <span className="text-neon-green">
                          {state.syllabus[state.user?.exam || 'GATE CS']?.filter(n => n.checked).length || 0} / {state.syllabus[state.user?.exam || 'GATE CS']?.length || 0} Modules
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-neon-green shadow-glow-green" 
                          style={{ width: `${(state.syllabus[state.user?.exam || 'GATE CS']?.filter(n => n.checked).length || 0) / (state.syllabus[state.user?.exam || 'GATE CS']?.length || 1) * 100}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-text-muted text-center uppercase tracking-widest">Tap to explore your learning path</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'Planner' && (
            <StudyPlanner 
              tasks={state.sessions.find(s => s.date === new Date().toISOString().split('T')[0])?.plan || []} 
              onToggleTask={toggleTask}
              onRegenerate={regeneratePlan}
              onOpenModal={() => setShowGoalModal(true)}
            />
          )}

          {activeTab === 'Syllabus' && (
            <SyllabusExplorer 
              syllabus={state.syllabus[state.user?.exam || 'GATE CS'] || []} 
              currentExam={state.user?.exam || 'GATE CS'}
              onToggle={toggleSyllabusNode}
              onStop={(node) => {
                const now = new Date();
                const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
                handleGoalSubmit(`Master ${node.name}`, 4, startTime);
              }}
              onGenerate={generateSyllabus}
              isGenerating={isGenerating}
            />
          )}

          {activeTab === 'Analytics' && <MissionControl />}

          {activeTab === 'Notes' && (
            <NotesHub 
              notes={state.notes}
              onAddNote={addNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              onToggleStar={toggleStarNote}
            />
          )}

          {activeTab === 'MindMap' && <MindMap />}

          {activeTab === 'Consistency' && <ConsistencyTracker />}

          {activeTab === 'Resources' && (
            <div className="space-y-12">
              <Resources />
              <StudyMethods onApply={(method) => {
                alert(`Habitify AI is restructuring your plan using ${method}...`);
                // In a real app, this would call Gemini API
              }} />
            </div>
          )}

          {activeTab === 'Settings' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-2xl mx-auto glass-card p-8 neon-border-cyan"
            >
              <h2 className="text-3xl font-syne mb-8 text-center">MISSION CONTROL SETTINGS</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2">Gemini API Key</label>
                  <input 
                    type="password"
                    value={state.settings.apiKey}
                    onChange={(e) => {
                      const newSettings = { ...state.settings, apiKey: e.target.value };
                      if (currentUser) {
                        firebaseService.saveUserProfile(currentUser.uid, {
                          ...state.user!,
                          settings: newSettings
                        } as any);
                      }
                      setState(prev => ({ ...prev, settings: newSettings }));
                    }}
                    placeholder="Enter your API key..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan transition-all"
                  />
                  <p className="text-[10px] text-text-muted mt-2">Get your key from <a href="https://aistudio.google.com/app/apikey" target="_blank" className="text-neon-cyan underline">Google AI Studio</a></p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2">User Name</label>
                    <input 
                      type="text"
                      value={state.user?.name}
                      onChange={(e) => {
                        const newName = e.target.value;
                        setState(prev => {
                          const updatedUser = prev.user ? { ...prev.user, name: newName } : null;
                          if (currentUser && updatedUser) {
                            firebaseService.saveUserProfile(currentUser.uid, {
                              ...updatedUser,
                              settings: prev.settings
                            } as any);
                          }
                          return { ...prev, user: updatedUser };
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-text-muted uppercase mb-2">Avatar Emoji</label>
                    <input 
                      type="text"
                      value={state.user?.avatar}
                      onChange={(e) => {
                        const newAvatar = e.target.value;
                        setState(prev => {
                          const updatedUser = prev.user ? { ...prev.user, avatar: newAvatar } : null;
                          if (currentUser && updatedUser) {
                            firebaseService.saveUserProfile(currentUser.uid, {
                              ...updatedUser,
                              settings: prev.settings
                            } as any);
                          }
                          return { ...prev, user: updatedUser };
                        });
                      }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-2">Target Exam</label>
                  <select 
                    value={state.user?.exam}
                    onChange={(e) => generateSyllabus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-neon-cyan transition-all"
                  >
                    {['SSC CGL', 'GATE CS', 'CAT', 'NIMCET', 'ICET', 'UPSC', 'NEET', 'JEE Main'].map(exam => (
                      <option key={exam} value={exam} className="bg-bg-card">{exam}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    onClick={() => {
                      const data = JSON.stringify(state);
                      const blob = new Blob([data], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'habitify_backup.json';
                      a.click();
                    }}
                    className="flex-1 py-3 glass-card border-white/10 hover:bg-white/5 transition-all font-bold"
                  >
                    EXPORT DATA
                  </button>
                  <button 
                    onClick={() => {
                      if (confirm('Are you sure? This will reset all your progress.')) {
                        storageService.clearState();
                        window.location.reload();
                      }
                    }}
                    className="flex-1 py-3 glass-card border-neon-pink/30 text-neon-pink hover:bg-neon-pink/10 transition-all font-bold"
                  >
                    RESET ALL
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
        {/* Level Up Modal */}
        <AnimatePresence>
          {showLevelUp && (
            <LevelUpModal 
              level={state.user?.level || 1} 
              title={getTitleForLevel(state.user?.level || 1)} 
              onClose={() => setShowLevelUp(false)} 
            />
          )}
        </AnimatePresence>

        {/* Add Habit Modal */}
        <AddHabitModal 
          isOpen={isAddHabitModalOpen} 
          onClose={() => setIsAddHabitModalOpen(false)} 
          onAdd={addHabit} 
        />

        {/* Quick Action FAB */}
        <div className="fixed bottom-24 right-8 lg:bottom-8 lg:right-8 z-40">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsAddHabitModalOpen(true)}
            className="w-14 h-14 bg-neon-green rounded-full flex items-center justify-center text-bg-void shadow-glow-green"
          >
            <Plus size={32} />
          </motion.button>
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full bg-bg-card/90 backdrop-blur-2xl border-t border-white/5 lg:hidden flex justify-around p-4 z-50">
        {navItems.slice(0, 5).map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "p-2 rounded-xl transition-all",
              activeTab === item.id ? "text-neon-green bg-neon-green/10" : "text-text-muted"
            )}
          >
            <item.icon size={24} />
          </button>
        ))}
      </nav>
    </div>
  );
}
