import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { Trash2, ArrowRight, Search, Filter, ArrowUp, ArrowDown, CheckCircle, Clock, Activity, PieChart as PieChartIcon, ChevronDown, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { SubmissionChart, DifficultyChart } from '../components/Charts';
import GlobalActivityFeed from '../components/GlobalActivityFeed';
import SkillTree3D from '../components/SkillTree3D';
import MultiSelect from '../components/MultiSelect';
import ConfirmationDialog from '../components/ConfirmationDialog';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface Problem {
  id: string; // MongoDB ID is string
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  tags: string[];
  created_at: string;
}

interface Submission {
  id: string;
  problem_id: { _id: string; title: string } | string; // Populate or ID
  verdict: string;
}

export default function Dashboard() {
  const { t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulties, setSelectedDifficulties] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'title' | 'difficulty' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null);

  // Get unique tags from all problems
  const allTags = Array.from(new Set(problems.flatMap(p => p.tags || []))).sort();

  useEffect(() => {
    fetchProblems();
    if (user) {
      fetchUserSubmissions();
    }

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'new_problem' || data.type === 'problem_deleted') {
        fetchProblems();
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  const fetchProblems = async () => {
    try {
      const res = await api.problems.getAll();
      if (res.ok) {
        const data = await res.json();
        // Map _id to id for frontend consistency if needed, or just use _id
        const mappedData = data.map((p: any) => ({ ...p, id: p._id }));
        setProblems(mappedData);
      } else {
        toast.error('Failed to fetch problems');
      }
    } catch (error) {
      toast.error('Failed to fetch problems');
    }
  };

  const fetchUserSubmissions = async () => {
    if (!user) return;
    try {
      const res = await api.submissions.getAll();
      if (res.ok) {
        const data = await res.json();
        setUserSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions', error);
    }
  };

  const handleDelete = async () => {
    if (!problemToDelete) return;
    
    try {
      const res = await api.problems.delete(problemToDelete);
      if (res.ok) {
        setProblems(problems.filter(p => p.id !== problemToDelete));
        toast.success('Problem deleted');
      } else {
        toast.error('Failed to delete');
      }
    } catch (error) {
      toast.error('Failed to delete');
    } finally {
      setProblemToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setProblemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-neutral-400';
    }
  };

  const getProblemStatus = (problemId: string) => {
    // Problem ID in submission might be populated object or string
    const submissions = userSubmissions.filter(s => {
      const pId = typeof s.problem_id === 'string' ? s.problem_id : (s.problem_id as any)._id;
      return pId === problemId;
    });
    if (submissions.length === 0) return 'Unsolved';
    if (submissions.some(s => s.verdict === 'Accepted')) return 'Solved';
    return 'Attempted';
  };

  const difficultyOrder = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };

  const filteredProblems = problems
    .filter(problem => {
      const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDifficulty = selectedDifficulties.length === 0 || selectedDifficulties.includes(problem.difficulty);
      const matchesTags = selectedTags.length === 0 || (problem.tags && selectedTags.every(tag => problem.tags.includes(tag)));
      return matchesSearch && matchesDifficulty && matchesTags;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'difficulty') {
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      } else if (sortBy === 'created_at') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const toggleSort = (field: 'title' | 'difficulty' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2">{t('problems.title')}</h1>
          <p className="text-neutral-400 font-light">{t('problems.subtitle')}</p>
        </div>
        
        <div className="flex flex-col lg:flex-row gap-4 w-full lg:w-auto">
          {/* Search */}
          <div className="relative group flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              placeholder={t('problems.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full lg:w-64 bg-neutral-900/50 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white focus:border-white/30 focus:bg-neutral-900 outline-none transition-all"
            />
          </div>

          {/* Difficulty Multi-Select */}
          <MultiSelect
            options={['Easy', 'Medium', 'Hard']}
            selected={selectedDifficulties}
            onChange={setSelectedDifficulties}
            placeholder="Difficulty"
            icon={<Filter className="w-4 h-4" />}
          />

          {/* Tags Multi-Select */}
          <MultiSelect
            options={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
            placeholder="Filter by Tags"
            icon={<Tag className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-neutral-900/30 p-8 rounded-2xl border border-white/5 backdrop-blur-sm"
            >
              <h3 className="text-lg font-medium text-white mb-8 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> {t('profile.recent_activity')}
              </h3>
              <SubmissionChart />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-neutral-900/30 p-8 rounded-2xl border border-white/5 backdrop-blur-sm"
            >
              <h3 className="text-lg font-medium text-white mb-8 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-400" /> {t('problems.distribution')}
              </h3>
              <DifficultyChart />
            </motion.div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <GlobalActivityFeed />
        </div>
      </div>

      {/* 3D Skill Tree Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-16"
      >
        <SkillTree3D />
      </motion.div>

      {/* Sort Controls */}
      <div className="flex gap-6 mb-8 text-sm text-neutral-500 border-b border-white/5 pb-4">
        <span className="font-medium text-neutral-400">{t('problems.sort_by')}</span>
        <button 
          onClick={() => toggleSort('title')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'title' ? 'text-white' : ''}`}
        >
          {t('problems.sort_title')} {sortBy === 'title' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </button>
        <button 
          onClick={() => toggleSort('difficulty')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'difficulty' ? 'text-white' : ''}`}
        >
          {t('problems.difficulty')} {sortBy === 'difficulty' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </button>
        <button 
          onClick={() => toggleSort('created_at')}
          className={`flex items-center gap-1 hover:text-white transition-colors ${sortBy === 'created_at' ? 'text-white' : ''}`}
        >
          {t('profile.date')} {sortBy === 'created_at' && (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
        </button>
      </div>

      <div className={`grid gap-4 ${user?.is_banned ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
        {filteredProblems.map((problem, index) => {
          const status = getProblemStatus(problem.id);
          return (
            <motion.div 
              key={problem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-white/10 hover:bg-neutral-900/50 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between relative z-10 gap-4">
                <div className="w-full md:w-auto">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-medium text-white group-hover:text-emerald-400 transition-colors font-serif tracking-tight">
                      {user?.is_banned ? (
                        <span>{problem.title}</span>
                      ) : (
                        <Link to={`/problem/${problem.id}`}>{problem.title}</Link>
                      )}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    {problem.tags && problem.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded-md text-[10px] font-mono text-neutral-500 bg-white/5 border border-white/5">
                        #{tag}
                      </span>
                    ))}
                    {status === 'Solved' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                        <CheckCircle className="w-3 h-3" /> {t('problems.status')}: {t('problem_detail.accepted')}
                      </span>
                    )}
                    {status === 'Attempted' && (
                      <span className="flex items-center gap-1 text-xs font-medium text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                        <Clock className="w-3 h-3" /> {t('problems.status')}: {t('problems.attempted')}
                      </span>
                    )}
                  </div>
                  <p className="text-neutral-400 line-clamp-2 max-w-2xl font-light">{problem.description}</p>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-end mt-4 md:mt-0">
                  {user?.is_banned ? (
                    <span className="flex items-center gap-2 text-neutral-500 bg-white/5 px-5 py-2.5 rounded-full text-sm font-medium border border-white/5 cursor-not-allowed">
                      {t('problems.solve')} <ArrowRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <Link 
                      to={`/problem/${problem.id}`}
                      className="flex items-center gap-2 text-neutral-300 hover:text-white bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-full transition-colors text-sm font-medium border border-white/5"
                    >
                      {t('problems.solve')} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                  
                  {user?.role === 'admin' && (
                    <button 
                      onClick={() => confirmDelete(problem.id)}
                      className="p-2.5 text-neutral-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-full transition-colors"
                      title="Delete Problem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {filteredProblems.length === 0 && (
          <div className="text-center py-20 bg-neutral-900/20 rounded-xl border border-white/5 border-dashed">
            <p className="text-neutral-500">{t('problems.no_problems_found')}</p>
            {user?.role === 'admin' && (
              <Link to="/admin/create" className="text-emerald-400 hover:underline mt-2 inline-block">
                {t('problems.create_new')}
              </Link>
            )}
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Problem"
        message="Are you sure you want to delete this problem? This action cannot be undone and will remove all associated submissions."
        confirmLabel="Delete Problem"
        cancelLabel="Keep Problem"
        variant="danger"
      />
    </div>
  );
}
