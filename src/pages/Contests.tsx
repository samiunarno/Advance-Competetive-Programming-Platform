import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, Calendar, Clock, ArrowRight, Users, Timer, BookOpen, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

interface Contest {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'ended';
  participant_count: number;
  is_registered: boolean;
  rules?: string[];
}

export default function Contests() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContestRules, setSelectedContestRules] = useState<Contest | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchContests();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'contest_status_update' || data.type === 'new_contest') {
        fetchContests();
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, []);

  const fetchContests = async () => {
    try {
      setLoading(true);
      const res = await api.contests.getAll();
      if (res.ok) {
        const data = await res.json();
        setContests(data);
      } else {
        throw new Error('Failed to fetch contests');
      }
    } catch (error) {
      console.error('Fetch contests error:', error);
      toast.error('Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (contestId: string) => {
    if (!user) {
      toast.error(t('auth.login_required') || 'Please login to register');
      return;
    }
    
    try {
      // Optimistic update
      setContests(contests.map(c => 
        c.id === contestId ? { ...c, is_registered: true, participant_count: c.participant_count + 1 } : c
      ));

      // API call
      const res = await api.contests.register(contestId);
      
      if (res.ok) {
        toast.success(t('contests.registration_success') || 'Successfully registered for contest');
        const contest = contests.find(c => c.id === contestId);
        if (contest?.status === 'active') {
          navigate(`/contest/${contestId}`);
        }
      } else {
        // Revert on failure
        setContests(contests.map(c => 
          c.id === contestId ? { ...c, is_registered: false, participant_count: c.participant_count - 1 } : c
        ));
        const data = await res.json();
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      // Revert on error
      setContests(contests.map(c => 
        c.id === contestId ? { ...c, is_registered: false, participant_count: c.participant_count - 1 } : c
      ));
      toast.error('Registration failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ended': return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
      default: return 'text-neutral-400';
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const getDuration = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes > 0 ? `${minutes}m` : ''}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2 flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" /> Contests
          </h1>
          <p className="text-neutral-400 font-light">Compete with others and climb the leaderboard.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-neutral-500">Loading contests...</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {contests.map((contest, index) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:border-white/10 transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex flex-col md:flex-row gap-6 justify-between relative z-10">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <h3 className="text-xl font-medium text-white font-serif tracking-tight">
                      {contest.title}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${getStatusColor(contest.status)}`}>
                      {contest.status}
                    </span>
                  </div>
                  
                  <p className="text-neutral-400 mb-6 max-w-2xl font-light">{contest.description}</p>
                  
                  <div className="flex flex-wrap gap-6 text-sm text-neutral-500 font-mono">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatTime(contest.start_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      <span>{getDuration(contest.start_time, contest.end_time)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{contest.participant_count} participants</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 w-full md:w-auto mt-4 md:mt-0">
                  <div className="flex items-center gap-4">
                    {contest.status === 'active' ? (
                      contest.is_registered ? (
                        <Link
                          to={`/contest/${contest.id}`}
                          className="flex-1 md:flex-none text-center bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          Enter Contest
                        </Link>
                      ) : (
                        <button
                          onClick={() => handleRegister(contest.id)}
                          className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20"
                        >
                          Register & Enter
                        </button>
                      )
                    ) : contest.status === 'upcoming' ? (
                      contest.is_registered ? (
                        <button disabled className="flex-1 md:flex-none bg-white/10 text-emerald-400 border border-emerald-500/30 px-6 py-3 rounded-lg font-medium cursor-default flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4" /> Registered
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(contest.id)}
                          className="flex-1 md:flex-none bg-white text-black hover:bg-neutral-200 px-6 py-3 rounded-lg font-medium transition-colors"
                        >
                          Register Now
                        </button>
                      )
                    ) : (
                      <Link
                        to={`/contest/${contest.id}`}
                        className="flex-1 md:flex-none text-center bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 px-6 py-3 rounded-lg font-medium transition-colors"
                      >
                        View Results
                      </Link>
                    )}
                  </div>
                  
                  {contest.rules && (
                    <button
                      onClick={() => setSelectedContestRules(contest)}
                      className="text-neutral-400 hover:text-white text-sm flex items-center justify-center gap-2 py-2 transition-colors"
                    >
                      <BookOpen className="w-4 h-4" /> View Rules
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Rules Modal */}
      <AnimatePresence>
        {selectedContestRules && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedContestRules(null)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="mb-6">
                <h2 className="text-2xl font-serif text-white mb-2">{selectedContestRules.title}</h2>
                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                  <BookOpen className="w-4 h-4" /> Contest Rules
                </div>
              </div>

              <div className="space-y-4">
                <ul className="space-y-3">
                  {selectedContestRules.rules?.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-neutral-300 text-sm leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                      {rule}
                    </li>
                  )) || (
                    <li className="text-neutral-500 italic">No specific rules listed for this contest.</li>
                  )}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => setSelectedContestRules(null)}
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
