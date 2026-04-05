import React, { useState, useEffect } from 'react';
import MeshBackground from './components/Layout/MeshBackground';
import CategoryCard from './components/Home/CategoryCard';
import GroupListing from './components/Listing/GroupListing';
import GroupDetail from './components/Details/GroupDetail';
import Oracle from './components/AI/Oracle';
import AuthModal from './components/Auth/AuthModal';
import ProfileModal from './components/Profile/ProfileModal';
import CreateGroupModal from './components/Create/CreateGroupModal'; // New Import
import { searchSubscriptions } from './services/geminiService'; // Import search service
import { CATEGORIES, MOCK_GROUPS, USER_STORAGE_KEY } from './constants';
import { Category, Group, ViewState, User, CategoryType } from './types';
import { Layers, Plus, Search, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [activeGroups, setActiveGroups] = useState<Group[]>(MOCK_GROUPS);

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Group[]>([]);
  
  // Modals
  const [isOracleOpen, setIsOracleOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useEffect(() => {
    // Check Auth
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
  };

  const handleProfileUpdate = (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
  };

  const handleCreateGroup = (newGroup: Group) => {
    setActiveGroups(prev => [newGroup, ...prev]);
  };

  const handleCategoryClick = (cat: Category) => {
    setSelectedCategory(cat);
    setView('LISTING');
  };

  const handleGroupSelect = (group: Group) => {
    setSelectedGroup(group);
    setView('DETAIL');
  };

  const handleBack = () => {
    if (view === 'DETAIL') {
      if (selectedCategory) {
        setView('LISTING');
      } else {
        setView('SEARCH'); // Go back to search results if no category selected
      }
      setSelectedGroup(null);
    } else if (view === 'LISTING' || view === 'SEARCH') {
      setView('HOME');
      setSelectedCategory(null);
      // Optional: don't clear query so user remembers what they searched
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // 1. Semantic/Smart Search via Gemini
      const matchedIds = await searchSubscriptions(searchQuery, activeGroups);
      
      // 2. Filter groups
      let results = activeGroups.filter(g => matchedIds.includes(g.id));
      
      // Fallback: If AI returns nothing or fails, do simple local text search
      if (results.length === 0) {
         const lowerQ = searchQuery.toLowerCase();
         results = activeGroups.filter(g => 
           g.name.toLowerCase().includes(lowerQ) || 
           g.description.toLowerCase().includes(lowerQ) ||
           g.planName.toLowerCase().includes(lowerQ)
         );
      }

      setSearchResults(results);
      setSelectedCategory(null); // Clear category selection
      setView('SEARCH');
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
    setView('HOME');
  };

  // Section Renderer
  const renderCategorySection = (title: string, type: CategoryType) => {
    const cats = CATEGORIES.filter(c => c.type === type);
    if (cats.length === 0) return null;

    return (
      <div className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <h3 className="text-white/60 text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
           <div className="w-1 h-4 bg-cyan-500 rounded-full" /> {title}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {cats.map(cat => {
             const count = activeGroups.filter(g => g.categoryId === cat.id).length;
             return (
               <CategoryCard 
                  key={cat.id} 
                  category={cat} 
                  activeCount={count}
                  onClick={() => handleCategoryClick(cat)} 
               />
             );
           })}
        </div>
      </div>
    );
  };

  // Construct Rich Context for Oracle
  const oracleContext = `
    User: ${user?.name}. Balance: ${user?.walletBalance}.
    Available Categories: ${CATEGORIES.map(c => c.name).join(', ')}.
    Groups: ${JSON.stringify(activeGroups)}.
  `;

  // Search Results Category Object (Transient)
  const searchCategory: Category = {
    id: 'search',
    name: `Results for "${searchQuery}"`,
    type: 'ENTERTAINMENT', 
    color: '#06b6d4'
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
      <MeshBackground />

      {/* Authentication */}
      {!user && <AuthModal onLogin={handleLogin} />}

      {/* Modals */}
      {user && (
        <>
          <ProfileModal 
            isOpen={isProfileOpen}
            onClose={() => setIsProfileOpen(false)}
            user={user}
            onUpdate={handleProfileUpdate}
          />
          <CreateGroupModal
            isOpen={isCreateOpen}
            onClose={() => setIsCreateOpen(false)}
            categories={CATEGORIES}
            currentUser={user}
            onCreate={handleCreateGroup}
          />
        </>
      )}

      {/* Oracle */}
      <Oracle 
        isOpen={isOracleOpen} 
        onOpen={() => setIsOracleOpen(true)}
        onClose={() => setIsOracleOpen(false)} 
        appContext={oracleContext}
      />

      {user && (
        <>
           {/* Top Bar */}
           <div className="fixed top-0 left-0 w-full p-6 flex justify-between items-center z-40 bg-gradient-to-b from-black/80 to-transparent pointer-events-none backdrop-blur-[2px]">
              <div className="flex items-center gap-2 pointer-events-auto">
                 <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Layers size={16} className="text-white" />
                 </div>
                 <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60 hidden sm:block">
                   SubShare
                 </h1>
              </div>

              <div className="flex items-center gap-3 pointer-events-auto">
                 <button 
                   onClick={() => setIsCreateOpen(true)}
                   className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full border border-white/10 text-sm font-medium transition-all hover:scale-105"
                 >
                   <Plus size={16} /> Create Node
                 </button>

                 <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-white">{user.name}</div>
                    <div className="text-[10px] text-emerald-400 font-mono">Verified ID</div>
                 </div>
                 <div 
                   onClick={() => setIsProfileOpen(true)}
                   className="w-10 h-10 rounded-full cursor-pointer border-2 border-white/10 hover:border-cyan-500/50 transition-colors shadow-lg"
                   style={{ 
                     background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : user.avatarGradient 
                   }}
                 />
              </div>
           </div>

           {/* Content */}
           {view === 'HOME' && (
             <div className="max-w-7xl mx-auto min-h-screen pt-28 px-6 relative pb-20">
               <div className="mb-12 text-center md:text-left">
                 <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 tracking-tight">
                   Protocol <span className="text-cyan-400">Nexus</span>
                 </h2>
                 <p className="text-white/40 text-lg max-w-xl">
                   The decentralized sharing economy. Join existing nodes or initialize your own protocol for any service.
                 </p>
                 
                 {/* SEARCH BAR */}
                 <div className="mt-8 max-w-xl relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                    <form onSubmit={handleSearch} className="relative flex items-center bg-[#0f0a1e] border border-white/10 rounded-2xl overflow-hidden shadow-2xl transition-all focus-within:border-cyan-500/50">
                       <Search className="ml-4 text-white/30 group-focus-within:text-cyan-400 transition-colors" size={20} />
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Find any group (e.g., 'Netflix', 'Billboard', 'Sushi')..." 
                         className="w-full bg-transparent border-none text-white px-4 py-4 focus:outline-none placeholder:text-white/30"
                       />
                       <button 
                         type="submit" 
                         disabled={isSearching}
                         className="mr-2 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors disabled:opacity-50"
                       >
                         {isSearching ? <Loader2 className="animate-spin" size={20} /> : <div className="px-3 py-1 text-sm font-bold">Search</div>}
                       </button>
                    </form>
                 </div>
                 
                 {/* Mobile Create Button */}
                 <button 
                   onClick={() => setIsCreateOpen(true)}
                   className="md:hidden mt-6 w-full bg-gradient-to-r from-cyan-600 to-blue-600 py-3 rounded-xl font-bold shadow-lg shadow-cyan-900/20 flex items-center justify-center gap-2"
                 >
                   <Plus size={18} /> Initialize Node
                 </button>
               </div>

               {renderCategorySection('Entertainment Protocols', 'ENTERTAINMENT')}
               {renderCategorySection('Business & Tech', 'BUSINESS')}
               {renderCategorySection('Lifestyle & Dining', 'FOOD')}
               {renderCategorySection('Product Pools', 'PRODUCT')}
               {renderCategorySection('Marketing & Ads', 'ADS')}
             </div>
           )}

           {(view === 'LISTING' && selectedCategory) && (
             <GroupListing 
                category={selectedCategory}
                groups={activeGroups.filter(g => g.categoryId === selectedCategory.id)}
                onBack={handleBack}
                onSelectGroup={handleGroupSelect}
                onCreateClick={() => setIsCreateOpen(true)}
             />
           )}
           
           {/* Search Results View */}
           {(view === 'SEARCH') && (
             <GroupListing 
                category={searchCategory}
                groups={searchResults}
                onBack={handleBack}
                onSelectGroup={handleGroupSelect}
                onCreateClick={() => setIsCreateOpen(true)}
             />
           )}

           {view === 'DETAIL' && selectedGroup && (
             <div className="pt-20 md:pt-0 h-screen">
                <GroupDetail 
                  group={selectedGroup} 
                  currentUser={user}
                  onBack={handleBack} 
                />
             </div>
           )}
        </>
      )}
    </div>
  );
};

export default App;