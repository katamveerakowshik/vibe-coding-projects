/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, collection, query, where, orderBy, limit, serverTimestamp, Timestamp, getDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, logout, handleFirestoreError, OperationType, storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { UserProfile, Persona, Task, DailyLog, JourneyPost, Cohort } from './types';
import { 
  Target, 
  LayoutDashboard, 
  Swords, 
  Users, 
  Settings, 
  LogOut, 
  CheckCircle2, 
  Circle, 
  Flame, 
  Trophy, 
  MessageSquare, 
  TrendingUp, 
  Calendar, 
  Zap,
  ChevronRight,
  Plus,
  Trash2,
  ArrowRight,
  BrainCircuit,
  Sparkles,
  Image as ImageIcon,
  FileText,
  X,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { format, isToday, parseISO, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-200",
      active 
        ? "bg-black text-white shadow-lg shadow-black/10 dark:bg-white dark:text-black dark:shadow-white/5 glow-green" 
        : "text-gray-500 hover:bg-gray-100 hover:text-black dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
    )}
  >
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </button>
);

const Card = ({ children, className, title, subtitle }: { children: React.ReactNode, className?: string, title?: string, subtitle?: string }) => (
  <div className={cn("bg-white border border-gray-100 rounded-2xl p-6 shadow-sm dark:bg-[#141414] dark:border-white/5", className)}>
    {(title || subtitle) && (
      <div className="mb-6">
        {title && <h3 className="text-lg font-bold text-gray-900 tracking-tight dark:text-white">{title}</h3>}
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

const Badge = ({ children, variant = 'default', className }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'error', className?: string }) => {
  const variants = {
    default: "bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-400",
    success: "bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400",
    warning: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    error: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400",
  };
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
};

const ConsistencyChart = ({ logs }: { logs: DailyLog[] }) => {
  // Generate a grid of 7 rows (days) and 52 columns (weeks)
  const weeks = 52;
  const days = 7;
  
  // Create a map of dates that have logs
  const logMap = new Set(logs.map(l => l.date));

  return (
    <Card className="bg-black border-none overflow-hidden" title="CONSISTENCY" subtitle="Your journey visualized.">
      <div className="mt-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Flame className="text-green-500 glow-text-green" size={24} fill="currentColor" />
            <h4 className="text-xl font-black text-white tracking-tighter glow-text-green">CONSISTENCY</h4>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold text-gray-500">
            <button className="hover:text-white transition-colors">&lt;</button>
            <span className="text-white">2026</span>
            <button className="hover:text-white transition-colors">&gt;</button>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-4 no-scrollbar">
          {Array.from({ length: weeks }).map((_, w) => (
            <div key={w} className="flex flex-col gap-1">
              {Array.from({ length: days }).map((_, d) => {
                // Simplified date logic for visualization
                const isActive = Math.random() > 0.3; // Placeholder for real logic
                return (
                  <div 
                    key={d} 
                    className={cn(
                      "consistency-dot",
                      isActive ? "active" : "inactive"
                    )}
                  />
                );
              })}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/5">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Current Streak</p>
            <p className="text-2xl font-black text-white glow-text-green">12 DAYS</p>
          </div>
          <div className="text-center border-x border-white/5">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Study Days</p>
            <p className="text-2xl font-black text-white">248 TOTAL</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Consistency Score</p>
            <p className="text-2xl font-black text-green-500 glow-text-green">92% SCORE</p>
          </div>
        </div>
      </div>
    </Card>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'goals' | 'arena' | 'journey' | 'coach' | 'settings'>('dashboard');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [journeyPosts, setJourneyPosts] = useState<JourneyPost[]>([]);
  const [cohorts, setCohorts] = useState<Cohort[]>([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') as 'light' | 'dark' || 'light';
    }
    return 'light';
  });

  // Theme Listener
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
      if (!u) {
        setProfile(null);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Profile & Data Listeners
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubProfile = onSnapshot(profileRef, (doc) => {
      if (doc.exists()) {
        setProfile(doc.data() as UserProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Profile listener error:", err);
      setLoading(false);
    });

    const tasksQuery = query(
      collection(db, 'users', user.uid, 'tasks'),
      orderBy('createdAt', 'desc')
    );
    const unsubTasks = onSnapshot(tasksQuery, (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/tasks`));

    const logsQuery = query(
      collection(db, 'users', user.uid, 'logs'),
      orderBy('date', 'desc'),
      limit(30)
    );
    const unsubLogs = onSnapshot(logsQuery, (snap) => {
      setLogs(snap.docs.map(d => d.data() as DailyLog));
    }, (err) => handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/logs`));

    const journeyQuery = query(
      collection(db, 'journey'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
    const unsubJourney = onSnapshot(journeyQuery, (snap) => {
      setJourneyPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as JourneyPost)));
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'journey'));

    return () => {
      unsubProfile();
      unsubTasks();
      unsubLogs();
      unsubJourney();
    };
  }, [user]);

  // Onboarding Logic
  const handleOnboarding = async (data: { persona: Persona, goalTitle: string, goalDeadline: string }) => {
    if (!user) return;
    const newProfile: UserProfile = {
      uid: user.uid,
      displayName: user.displayName || 'Aspirant',
      email: user.email || '',
      photoURL: user.photoURL || '',
      persona: data.persona,
      goalTitle: data.goalTitle,
      goalDeadline: data.goalDeadline,
      streak: 0,
      totalStudyHours: 0,
      lastActive: serverTimestamp() as Timestamp,
    };
    await setDoc(doc(db, 'users', user.uid), newProfile);
  };

  if (!isAuthReady || (user && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Initializing Aspirant OS...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LandingPage onSignIn={signInWithGoogle} />;
  }

  if (!profile) {
    return <Onboarding onComplete={handleOnboarding} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#0f0f0f] border-r border-gray-100 dark:border-white/5 flex flex-col p-4 fixed h-full z-20">
        <div className="flex items-center gap-2 px-4 py-6 mb-4">
          <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
            <Zap className="text-white dark:text-black" size={18} />
          </div>
          <h1 className="text-xl font-black tracking-tighter text-gray-900 dark:text-white">ASPIRANT OS</h1>
        </div>

        <nav className="flex-1 space-y-1">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarItem 
            icon={Target} 
            label="Goal Engine" 
            active={activeTab === 'goals'} 
            onClick={() => setActiveTab('goals')} 
          />
          <SidebarItem 
            icon={Swords} 
            label="The Arena" 
            active={activeTab === 'arena'} 
            onClick={() => setActiveTab('arena')} 
          />
          <SidebarItem 
            icon={Users} 
            label="Journey" 
            active={activeTab === 'journey'} 
            onClick={() => setActiveTab('journey')} 
          />
          <SidebarItem 
            icon={BrainCircuit} 
            label="Coach AI" 
            active={activeTab === 'coach'} 
            onClick={() => setActiveTab('coach')} 
          />
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-white/5">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl mb-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/5 transition-all"
          >
            {theme === 'light' ? <motion.div initial={{ rotate: 0 }} animate={{ rotate: 180 }}><Zap size={20} /></motion.div> : <motion.div initial={{ rotate: 180 }} animate={{ rotate: 0 }}><Sparkles size={20} /></motion.div>}
            <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
              alt="Profile" 
              className="w-8 h-8 rounded-full border border-gray-200 dark:border-white/10"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{profile.displayName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.persona}</p>
            </div>
          </div>
          <SidebarItem 
            icon={Settings} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="max-w-6xl mx-auto"
          >
            {activeTab === 'dashboard' && <Dashboard profile={profile} tasks={tasks} logs={logs} theme={theme} />}
            {activeTab === 'goals' && <GoalEngine profile={profile} tasks={tasks} theme={theme} />}
            {activeTab === 'arena' && <Arena profile={profile} theme={theme} />}
            {activeTab === 'journey' && <JourneyFeed profile={profile} posts={journeyPosts} theme={theme} />}
            {activeTab === 'coach' && <CoachAI profile={profile} tasks={tasks} logs={logs} theme={theme} />}
            {activeTab === 'settings' && <SettingsView profile={profile} theme={theme} />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function LandingPage({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex flex-col">
      <header className="px-8 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center">
            <Zap className="text-white dark:text-black" size={24} />
          </div>
          <span className="text-2xl font-black tracking-tighter dark:text-white">ASPIRANT OS</span>
        </div>
        <button 
          onClick={onSignIn}
          className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full font-bold hover:scale-105 transition-transform"
        >
          Get Started
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Badge variant="warning">The World's First Aspirant Operating System</Badge>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-gray-900 dark:text-white mt-6 mb-8 leading-[0.9]">
            STOP TRACKING.<br />START TRANSFORMING.
          </h1>
          <p className="text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Replicate the psychological power of elite coaching institutes. 
            Structure, accountability, and competition — engineered for your dream.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={onSignIn}
              className="bg-black text-white dark:bg-white dark:text-black px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:shadow-2xl hover:shadow-black/20 dark:hover:shadow-white/10 transition-all"
            >
              Enter the Arena <ArrowRight size={20} />
            </button>
            <button className="bg-white text-black dark:bg-transparent dark:text-white dark:border-white border-2 border-black px-10 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
              Watch Demo
            </button>
          </div>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {[
            { title: "Goal Engine", desc: "Reverse-engineer your dream into daily actions." },
            { title: "The Arena", desc: "Anonymous competition with peers in your cohort." },
            { title: "Coach AI", desc: "Behavioral nudges and personalized strategy." }
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-gray-50 dark:bg-white/5 rounded-3xl text-left border border-gray-100 dark:border-white/5">
              <h3 className="text-xl font-bold mb-2 dark:text-white">{feature.title}</h3>
              <p className="text-gray-500 dark:text-gray-400">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

function Onboarding({ onComplete }: { onComplete: (data: { persona: Persona, goalTitle: string, goalDeadline: string }) => void }) {
  const [step, setStep] = useState(1);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDeadline, setGoalDeadline] = useState('');

  const personas: { type: Persona, title: string, desc: string, icon: any }[] = [
    { type: 'Warrior', title: 'The Warrior', desc: 'Driven by discipline and raw effort.', icon: Swords },
    { type: 'Scholar', title: 'The Scholar', desc: 'Driven by deep understanding and curiosity.', icon: Target },
    { type: 'Grinder', title: 'The Grinder', desc: 'Driven by consistency and volume.', icon: Zap },
    { type: 'Strategist', title: 'The Strategist', desc: 'Driven by efficiency and planning.', icon: LayoutDashboard },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <div className="mb-12">
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map(s => (
              <div key={s} className={cn("h-1 flex-1 rounded-full", s <= step ? "bg-black dark:bg-white" : "bg-gray-100 dark:bg-white/5")} />
            ))}
          </div>
          <h2 className="text-3xl font-black tracking-tight dark:text-white">
            {step === 1 && "Choose your Persona"}
            {step === 2 && "What is your Ultimate Goal?"}
            {step === 3 && "When is the Deadline?"}
          </h2>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-1 gap-4">
            {personas.map(p => (
              <button
                key={p.type}
                onClick={() => { setPersona(p.type); setStep(2); }}
                className="flex items-center gap-4 p-6 border-2 border-gray-100 dark:border-white/5 rounded-2xl hover:border-black dark:hover:border-white hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-left group"
              >
                <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors">
                  <p.icon size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg dark:text-white">{p.title}</h4>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">{p.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <input 
              type="text"
              placeholder="e.g. Crack UPSC 2026, Master Full Stack, NEET Top 100"
              className="w-full text-2xl font-bold p-4 border-b-4 border-gray-100 dark:border-white/5 bg-transparent dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              autoFocus
            />
            <button 
              disabled={!goalTitle}
              onClick={() => setStep(3)}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-bold disabled:opacity-50"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <input 
              type="date"
              className="w-full text-2xl font-bold p-4 border-b-4 border-gray-100 dark:border-white/5 bg-transparent dark:text-white focus:border-black dark:focus:border-white outline-none transition-colors"
              value={goalDeadline}
              onChange={(e) => setGoalDeadline(e.target.value)}
              autoFocus
            />
            <button 
              disabled={!goalDeadline}
              onClick={() => persona && onComplete({ persona, goalTitle, goalDeadline })}
              className="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-bold disabled:opacity-50"
            >
              Initialize Aspirant OS
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Dashboard({ profile, tasks, logs, theme }: { profile: UserProfile, tasks: Task[], logs: DailyLog[], theme: 'light' | 'dark' }) {
  const [studyHours, setStudyHours] = useState(0);
  const [logging, setLogging] = useState(false);

  const todayTasks = tasks.filter(t => t.date === format(new Date(), 'yyyy-MM-dd'));
  const completedCount = todayTasks.filter(t => t.completed).length;
  const progress = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

  const handleCheckOut = async () => {
    if (studyHours <= 0) return;
    setLogging(true);
    try {
      const dateStr = format(new Date(), 'yyyy-MM-dd');
      const logRef = doc(db, 'users', profile.uid, 'logs', dateStr);
      await setDoc(logRef, {
        userId: profile.uid,
        date: dateStr,
        studyHours,
        tasksCompleted: completedCount,
        tasksTotal: todayTasks.length
      });
      
      // Update total study hours in profile
      const profileRef = doc(db, 'users', profile.uid);
      await updateDoc(profileRef, {
        totalStudyHours: (profile.totalStudyHours || 0) + studyHours,
        lastActive: serverTimestamp()
      });
      setStudyHours(0);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${profile.uid}/logs`);
    } finally {
      setLogging(false);
    }
  };

  const chartData = useMemo(() => {
    return [...logs].reverse().map(l => ({
      date: format(parseISO(l.date), 'MMM d'),
      hours: l.studyHours
    }));
  }, [logs]);

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Welcome back, {profile.displayName.split(' ')[0]}</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">You are {profile.streak} days into becoming a top performer.</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white dark:bg-[#141414] px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-2 shadow-sm">
            <Flame className="text-orange-500" size={18} />
            <span className="font-bold dark:text-white">{profile.streak} Day Streak</span>
          </div>
          <div className="bg-white dark:bg-[#141414] px-4 py-2 rounded-xl border border-gray-100 dark:border-white/5 flex items-center gap-2 shadow-sm">
            <Trophy className="text-yellow-500" size={18} />
            <span className="font-bold dark:text-white">Rank #{profile.rank || '--'}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Focus */}
        <Card className="lg:col-span-2" title="Daily Focus" subtitle={`Today's actions for ${profile.goalTitle}`}>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-gray-900 dark:text-white">{completedCount}/{todayTasks.length} Completed</span>
              <span className="text-sm font-bold text-gray-900 dark:text-white">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-black dark:bg-white"
              />
            </div>
          </div>

          <div className="space-y-3">
            {todayTasks.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-white/5 rounded-2xl border-2 border-dashed border-gray-200 dark:border-white/10">
                <p className="text-gray-400 font-medium">No tasks for today yet.</p>
                <button className="mt-4 text-black dark:text-white font-bold flex items-center gap-2 mx-auto hover:gap-3 transition-all">
                  Set Daily Agenda <ArrowRight size={16} />
                </button>
              </div>
            ) : (
              todayTasks.map(task => (
                <div 
                  key={task.id}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer",
                    task.completed 
                      ? "bg-gray-50 dark:bg-white/5 border-transparent opacity-60" 
                      : "bg-white dark:bg-[#141414] border-gray-100 dark:border-white/5 hover:border-black dark:hover:border-white"
                  )}
                  onClick={async () => {
                    const taskRef = doc(db, 'users', profile.uid, 'tasks', task.id);
                    await updateDoc(taskRef, { completed: !task.completed });
                  }}
                >
                  {task.completed ? <CheckCircle2 className="text-black dark:text-white" size={24} /> : <Circle className="text-gray-300 dark:text-gray-600" size={24} />}
                  <span className={cn("font-medium flex-1 dark:text-white", task.completed && "line-through")}>{task.title}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Stats & Insights */}
        <div className="space-y-8">
          <ConsistencyChart logs={logs} />
          
          <Card title="Study Momentum">
            <div className="h-48 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme === 'dark' ? '#fff' : '#000'} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={theme === 'dark' ? '#fff' : '#000'} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="hours" stroke={theme === 'dark' ? '#fff' : '#000'} fillOpacity={1} fill="url(#colorHours)" strokeWidth={2} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      backgroundColor: theme === 'dark' ? '#141414' : '#fff',
                      color: theme === 'dark' ? '#fff' : '#000'
                    }}
                    labelStyle={{ fontWeight: 'bold' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-6 flex justify-between items-center bg-gray-50 dark:bg-white/5 p-4 rounded-xl">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Total Hours</p>
                <p className="text-xl font-black dark:text-white">{profile.totalStudyHours || 0}h</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Avg/Day</p>
                <p className="text-xl font-black dark:text-white">{(profile.totalStudyHours || 0) / (logs.length || 1)}h</p>
              </div>
            </div>
          </Card>

          <Card title="AI Insight" className="bg-black text-white dark:bg-white dark:text-black border-none">
            <div className="flex gap-3 items-start">
              <div className="w-8 h-8 bg-white/10 dark:bg-black/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sparkles className="text-white dark:text-black" size={18} />
              </div>
              <p className="text-sm leading-relaxed text-gray-300 dark:text-gray-700">
                "Your peak window is <span className="text-white dark:text-black font-bold">6–9am</span>. You've completed 80% of your tasks during this time. Double down on deep work tomorrow morning."
              </p>
            </div>
          </Card>

          <Card title="Daily Check-out" subtitle="Log your effort for today.">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase">Study Hours</label>
                <div className="flex items-center gap-4 mt-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="16" 
                    step="0.5"
                    className="flex-1 accent-black dark:accent-white"
                    value={studyHours}
                    onChange={(e) => setStudyHours(parseFloat(e.target.value))}
                  />
                  <span className="text-xl font-black w-12 dark:text-white">{studyHours}h</span>
                </div>
              </div>
              <button 
                onClick={handleCheckOut}
                disabled={logging || studyHours <= 0}
                className="w-full bg-black text-white dark:bg-white dark:text-black py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-xl shadow-black/20 dark:shadow-white/5 flex items-center justify-center gap-2 glow-green"
              >
                {logging ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                {logging ? "Syncing Effort..." : "Confirm Daily Mission"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GoalEngine({ profile, tasks, theme }: { profile: UserProfile, tasks: Task[], theme: 'light' | 'dark' }) {
  const [newTask, setNewTask] = useState('');
  const [adding, setAdding] = useState(false);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.trim() || !profile) return;
    setAdding(true);
    try {
      const taskData = {
        userId: profile.uid,
        title: newTask,
        completed: false,
        date: format(new Date(), 'yyyy-MM-dd'),
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, 'users', profile.uid, 'tasks'), taskData);
      setNewTask('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `users/${profile.uid}/tasks`);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Goal Engine</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Reverse-engineering your dream: <span className="text-black dark:text-white font-bold">{profile.goalTitle}</span></p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="md:col-span-2" title="Daily Agenda" subtitle="Surfacing the 3 most critical tasks for today.">
          <form onSubmit={addTask} className="mb-6 flex gap-2">
            <input 
              type="text" 
              placeholder="Add a critical task..." 
              className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 focus:border-black dark:focus:border-white dark:text-white outline-none transition-all"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
            />
            <button 
              type="submit"
              disabled={adding || !newTask.trim()}
              className="bg-black text-white dark:bg-white dark:text-black px-6 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
            >
              <Plus size={20} />
            </button>
          </form>

          <div className="space-y-3">
            {tasks.filter(t => t.date === format(new Date(), 'yyyy-MM-dd')).map(task => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 rounded-xl group">
                <button 
                  onClick={async () => {
                    await updateDoc(doc(db, 'users', profile.uid, 'tasks', task.id), { completed: !task.completed });
                  }}
                >
                  {task.completed ? <CheckCircle2 className="text-black dark:text-white" size={24} /> : <Circle className="text-gray-300 dark:text-gray-600" size={24} />}
                </button>
                <span className={cn("flex-1 font-medium dark:text-white", task.completed && "line-through text-gray-400 dark:text-gray-500")}>{task.title}</span>
                <button 
                  onClick={async () => {
                    await deleteDoc(doc(db, 'users', profile.uid, 'tasks', task.id));
                  }}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card title="Goal DNA" subtitle="Visualizing the path to the dream.">
            <div className="space-y-6 mt-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-bold">1</div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">Foundation Phase</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current status: 45% complete</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-white/10 ml-5" />
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center font-bold">2</div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">Intensive Practice</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Starts in 12 days</p>
                </div>
              </div>
              <div className="w-px h-8 bg-gray-100 dark:bg-white/10 ml-5" />
              <div className="flex items-center gap-4 opacity-40">
                <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 rounded-full flex items-center justify-center font-bold">3</div>
                <div className="flex-1">
                  <p className="text-sm font-bold dark:text-white">Peak Performance</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Final 30 days</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Arena({ profile, theme }: { profile: UserProfile, theme: 'light' | 'dark' }) {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">The Arena</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Anonymous competition within your cohort: <span className="text-black dark:text-white font-bold">UPSC 2026 Aspirants</span></p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Live Leaderboard" subtitle="Top performers in your cohort today.">
          <div className="space-y-4 mt-6">
            {[
              { rank: 1, name: "Aspirant #47", hours: 12.5, tasks: 15, persona: "Grinder" },
              { rank: 2, name: "Aspirant #12", hours: 11.2, tasks: 12, persona: "Warrior" },
              { rank: 3, name: "Aspirant #89", hours: 10.8, tasks: 14, persona: "Strategist" },
              { rank: 4, name: "You", hours: 8.5, tasks: 10, persona: profile.persona, isYou: true },
              { rank: 5, name: "Aspirant #33", hours: 8.2, tasks: 9, persona: "Scholar" },
            ].map((item, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  item.isYou 
                    ? "bg-black text-white border-black dark:bg-white dark:text-black dark:border-white" 
                    : "bg-white dark:bg-[#141414] border-gray-100 dark:border-white/5"
                )}
              >
                <span className={cn("w-8 text-lg font-black", item.isYou ? (theme === 'dark' ? "text-black" : "text-white") : "text-gray-400 dark:text-gray-600")}>#{item.rank}</span>
                <div className="flex-1">
                  <p className="font-bold dark:text-white">{item.name}</p>
                  <p className={cn("text-xs", item.isYou ? (theme === 'dark' ? "text-gray-700" : "text-gray-400") : "text-gray-500 dark:text-gray-400")}>{item.persona}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold dark:text-white">{item.hours}h</p>
                  <p className={cn("text-xs", item.isYou ? (theme === 'dark' ? "text-gray-700" : "text-gray-400") : "text-gray-500 dark:text-gray-400")}>{item.tasks} tasks</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-8">
          <Card title="Ghost Mode" subtitle="Compete against your past self.">
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase">Yesterday's You</p>
                <p className="text-lg font-bold dark:text-white">8.2 Hours</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase">Today's You</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">8.5 Hours</p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">+0.3h ahead of yesterday</p>
              </div>
            </div>
          </Card>

          <Card title="Cohort Stats" className="bg-gray-900 dark:bg-white text-white dark:text-black border-none">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-600 text-sm">Active Members</span>
                <span className="font-bold">1,240</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-600 text-sm">Avg Study Time</span>
                <span className="font-bold">7.4h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 dark:text-gray-600 text-sm">Cohort Rank</span>
                <span className="text-yellow-500 font-bold">Top 15%</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function JourneyFeed({ profile, posts, theme }: { profile: UserProfile, posts: JourneyPost[], theme: 'light' | 'dark' }) {
  const [newPost, setNewPost] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const generateSmartCaption = async () => {
    if (!selectedFile || !selectedFile.type.startsWith('image/')) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      
      // Convert file to base64 for Gemini
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
      });
      reader.readAsDataURL(selectedFile);
      const base64Data = await base64Promise;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            parts: [
              { text: "You are an elite aspirant coach. Look at this image related to a student's journey and write a powerful, short, and motivating caption (max 20 words) that captures the essence of their hard work or achievement. Use an identity-driven tone." },
              { inlineData: { data: base64Data, mimeType: selectedFile.type } }
            ]
          }
        ]
      });

      if (response.text) {
        setNewPost(response.text.trim());
      }
    } catch (err) {
      console.error("Gemini analysis failed", err);
      alert("AI Coach is busy. Please try writing your own caption.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const shareMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || !profile) return;
    setPosting(true);
    try {
      let mediaUrl = '';
      let mediaType: 'image' | 'file' | undefined = undefined;

      if (selectedFile) {
        try {
          const fileRef = ref(storage, `journey/${profile.uid}/${Date.now()}_${selectedFile.name}`);
          const uploadResult = await uploadBytes(fileRef, selectedFile);
          mediaUrl = await getDownloadURL(uploadResult.ref);
          mediaType = selectedFile.type.startsWith('image/') ? 'image' : 'file';
        } catch (storageErr) {
          console.error("Storage upload failed:", storageErr);
          alert("Failed to upload file. Sharing post without media.");
        }
      }

      const postData = {
        userId: profile.uid,
        displayName: profile.displayName || 'Anonymous Aspirant',
        content: newPost,
        timestamp: serverTimestamp(),
        reactions: 0,
        persona: profile.persona || 'Warrior',
        ...(mediaUrl && { mediaUrl, mediaType })
      };
      
      await addDoc(collection(db, 'journey'), postData);
      setNewPost('');
      setSelectedFile(null);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Post sharing failed:", err);
      handleFirestoreError(err, OperationType.CREATE, 'journey');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-20">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Journey Feed</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Anonymous milestones from fellow aspirants.</p>
      </header>

      <Card className="overflow-hidden">
        <form onSubmit={shareMilestone} className="space-y-4">
          <textarea 
            placeholder="Share a milestone... (e.g. Day 45: finally cracked the hardest topic)"
            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-2xl p-4 focus:border-black dark:focus:border-white dark:text-white outline-none transition-all min-h-[120px] resize-none text-lg"
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
          />
          
          {selectedFile && (
            <div className="relative bg-gray-50 dark:bg-white/5 rounded-2xl p-4 border border-gray-100 dark:border-white/5 group">
              <button 
                type="button"
                onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                className="absolute top-2 right-2 p-1 bg-white dark:bg-[#141414] rounded-full shadow-sm hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all z-10"
              >
                <X size={16} />
              </button>
              
              {previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    type="button"
                    onClick={generateSmartCaption}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 text-xs font-bold text-black dark:text-white bg-white dark:bg-white/10 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    {isAnalyzing ? "Analyzing..." : "Generate Smart Caption"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                  <FileText size={20} />
                  <span className="text-sm font-medium truncate">{selectedFile.name}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileSelect}
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                title="Upload image or file"
              >
                <ImageIcon size={20} />
              </button>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-400 dark:text-gray-500">Posts are anonymous.</p>
              <button 
                type="submit"
                disabled={posting || !newPost.trim()}
                className="bg-black text-white dark:bg-white dark:text-black px-8 py-3 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50 shadow-lg shadow-black/10 dark:shadow-white/5 flex items-center gap-2"
              >
                {posting && <Loader2 size={18} className="animate-spin" />}
                {posting ? "Sharing..." : "Share Milestone"}
              </button>
            </div>
          </div>
        </form>
      </Card>

      <div className="space-y-6">
        {posts.map(post => (
          <motion.div 
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-[#141414] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center">
                <Users size={20} className="text-gray-400 dark:text-gray-500" />
              </div>
              <div>
                <p className="font-bold text-sm dark:text-white">Aspirant ({post.persona})</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{format(post.timestamp?.toDate() || new Date(), 'MMM d, h:mm a')}</p>
              </div>
            </div>
            
            <p className="text-gray-800 dark:text-gray-200 leading-relaxed mb-4 text-lg">{post.content}</p>

            {post.mediaUrl && (
              <div className="mb-6 rounded-2xl overflow-hidden border border-gray-50 dark:border-white/5">
                {post.mediaType === 'image' ? (
                  <img 
                    src={post.mediaUrl} 
                    alt="Milestone" 
                    className="w-full max-h-[400px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <a 
                    href={post.mediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-700 dark:text-gray-300"
                  >
                    <FileText size={24} className="text-gray-400 dark:text-gray-500" />
                    <span className="font-bold text-sm">View Attachment</span>
                    <ArrowRight size={16} className="ml-auto" />
                  </a>
                )}
              </div>
            )}

            <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                  const postRef = doc(db, 'journey', post.id);
                  await updateDoc(postRef, { reactions: (post.reactions || 0) + 1 });
                }}
                className="flex items-center gap-2 text-gray-400 dark:text-gray-500 hover:text-orange-500 transition-colors group"
              >
                <div className="p-2 rounded-full group-hover:bg-orange-50 dark:group-hover:bg-orange-500/10 transition-all">
                  <Flame size={20} />
                </div>
                <span className="text-sm font-bold">{post.reactions || 0}</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CoachAI({ profile, tasks, logs, theme }: { profile: UserProfile, tasks: Task[], logs: DailyLog[], theme: 'light' | 'dark' }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: `Hello ${profile.displayName.split(' ')[0]}. I am your Aspirant Coach. I've analyzed your recent patterns. How can I help you optimize your strategy today?` }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const model = ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are an elite coaching institute mentor. 
            User Profile: ${JSON.stringify(profile)}
            Recent Tasks: ${JSON.stringify(tasks.slice(0, 10))}
            Recent Logs: ${JSON.stringify(logs.slice(0, 7))}
            User Question: ${userMsg}` }] }
        ],
        config: {
          systemInstruction: "You are a direct, motivating, and highly strategic mentor for ambitious aspirants. Your goal is to provide actionable, psychologically-driven advice to help them achieve their goals. Be concise, firm, and encouraging."
        }
      });

      const response = await model;
      setMessages(prev => [...prev, { role: 'ai', content: response.text || "I'm processing your strategy. Let's focus on the next step." }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'ai', content: "I encountered a cognitive block. Let's try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col max-w-4xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Coach AI</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Personalized strategy based on your behavioral data.</p>
      </header>

      <Card className="flex-1 flex flex-col overflow-hidden p-0">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                msg.role === 'user' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-100 text-black dark:bg-white/10 dark:text-white"
              )}>
                {msg.role === 'user' ? <Users size={20} /> : <BrainCircuit size={20} />}
              </div>
              <div className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' ? "bg-black text-white dark:bg-white dark:text-black" : "bg-gray-50 text-gray-800 dark:bg-white/5 dark:text-gray-200"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-white/5 rounded-xl flex items-center justify-center animate-pulse">
                <BrainCircuit size={20} className="dark:text-white" />
              </div>
              <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl w-24 h-10 animate-pulse" />
            </div>
          )}
        </div>

        <form onSubmit={sendMessage} className="p-4 border-t border-gray-100 dark:border-white/5 flex gap-2">
          <input 
            type="text" 
            placeholder="Ask about your strategy, schedule, or motivation..."
            className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl px-4 py-3 focus:border-black dark:focus:border-white dark:text-white outline-none transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-black text-white dark:bg-white dark:text-black px-6 rounded-xl font-bold hover:scale-105 transition-all disabled:opacity-50"
          >
            <ArrowRight size={20} />
          </button>
        </form>
      </Card>
    </div>
  );
}

function SettingsView({ profile, theme }: { profile: UserProfile, theme: 'light' | 'dark' }) {
  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <header>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">Settings</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your identity and goal configuration.</p>
      </header>

      <Card title="Identity Profile">
        <div className="space-y-6 mt-4">
          <div className="flex items-center gap-6">
            <img 
              src={profile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.uid}`} 
              alt="Profile" 
              className="w-20 h-20 rounded-3xl border-4 border-gray-50 dark:border-white/5"
            />
            <div>
              <h4 className="text-xl font-bold dark:text-white">{profile.displayName}</h4>
              <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
              <Badge variant="warning" className="mt-2">{profile.persona}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 pt-6 border-t border-gray-100 dark:border-white/5">
            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Current Goal</label>
              <p className="text-lg font-bold mt-1 dark:text-white">{profile.goalTitle}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Deadline</label>
              <p className="text-lg font-bold mt-1 dark:text-white">{profile.goalDeadline}</p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Preferences">
        <div className="space-y-4 mt-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div>
              <p className="font-bold dark:text-white">Ghost Mode</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Compete against your past self.</p>
            </div>
            <div className="w-12 h-6 bg-black dark:bg-white rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white dark:bg-black rounded-full" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
            <div>
              <p className="font-bold dark:text-white">Anonymous Arena</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Hide your real name on leaderboards.</p>
            </div>
            <div className="w-12 h-6 bg-black dark:bg-white rounded-full relative">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white dark:bg-black rounded-full" />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
