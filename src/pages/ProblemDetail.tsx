import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Trophy, Clock, ArrowLeft, CheckCircle, AlertCircle, List, BarChart2, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import ContestLeaderboard from '../components/ContestLeaderboard';
import { useContestWebSocket } from '../hooks/useContestWebSocket';

interface ContestProblem {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  points: number;
  status?: 'solved' | 'attempted' | 'unsolved';
}

interface ContestDetail {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  status: 'upcoming' | 'active' | 'ended';
  is_registered: boolean;
  problems: ContestProblem[];
}

export default function ContestDetail() {
  const { id } = useParams();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [contest, setContest] = useState<ContestDetail | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [activeTab, setActiveTab] = useState<'problems' | 'leaderboard'>('problems');
  const [liveLeaderboard, setLiveLeaderboard] = useState<any[] | null>(null);

  useEffect(() => {
    fetchContestDetail();
  }, [id]);

  useContestWebSocket(id!, (data) => {
    if (data.type === 'contest_update') {
      setContest(prev => {
        if (!prev) return null;
        return { ...prev, ...data.payload };
      });
    } else if (data.type === 'leaderboard_update') {
      setLiveLeaderboard(data.payload);
    }
  });

  useEffect(() => {
    if (contest) {
      const updateTimer = () => {
        const now = new Date().getTime();
        let targetTime;
        let label = '';

        if (contest.status === 'upcoming') {
          targetTime = new Date(contest.start_time).getTime();
          label = 'Starts In';
        } else if (contest.status === 'active') {
          targetTime = new Date(contest.end_time).getTime();
          label = 'Time Remaining';
        } else {
          setTimeLeft('Ended');
          return;
        }

        const distance = targetTime - now;

        if (distance < 0) {
          if (contest.status === 'upcoming') {
             // Should ideally trigger a refresh or status update
             setContest(prev => prev ? { ...prev, status: 'active' } : null);
          } else {
             setTimeLeft('Ended');
             setContest(prev => prev ? { ...prev, status: 'ended' } : null);
          }
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((distance % (1000 * 60)) / 1000);
          
          const parts = [];
          if (days > 0) parts.push(`${days}d`);
          parts.push(`${hours.toString().padStart(2, '0')}h`);
          parts.push(`${minutes.toString().padStart(2, '0')}m`);
          parts.push(`${seconds.toString().padStart(2, '0')}s`);
          
          setTimeLeft(parts.join(' '));
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [contest]);

  const fetchContestDetail = async () => {
    try {
      const [contestRes, submissionsRes] = await Promise.all([
        api.contests.getById(id!),
        api.submissions.getAll()
      ]);

      if (contestRes.ok) {
        const data = await contestRes.json();
        const userSubmissions = submissionsRes.ok ? await submissionsRes.json() : [];
        
        setContest({
          ...data,
          id: data._id || data.id,
          problems: data.problems.map((p: any) => {
            const problemId = p._id || p.id;
            const problemSubmissions = userSubmissions.filter((s: any) => {
              const sProblemId = typeof s.problem_id === 'string' ? s.problem_id : s.problem_id._id;
              return sProblemId === problemId;
            });

            let pStatus: 'solved' | 'attempted' | 'unsolved' = 'unsolved';
            if (problemSubmissions.some((s: any) => s.verdict === 'Accepted')) {
              pStatus = 'solved';
            } else if (problemSubmissions.length > 0) {
              pStatus = 'attempted';
            }

            return {
              ...p,
              id: problemId,
              status: pStatus,
              points: p.points || (p.difficulty === 'Easy' ? 100 : p.difficulty === 'Medium' ? 200 : 300)
            };
          })
        });
      } else {
        toast.error('Failed to fetch contest details');
      }
    } catch (error) {
      toast.error('Failed to fetch contest details');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      toast.error('Please login to register');
      return;
    }

    try {
      setIsRegistering(true);
      const res = await api.contests.register(id!);
      if (res.ok) {
        toast.success('Successfully registered for contest');
        setContest(prev => prev ? { ...prev, is_registered: true } : null);
      } else {
        const data = await res.json();
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      toast.error('Registration failed');
    } finally {
      setIsRegistering(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Hard': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-neutral-400';
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  if (!contest) return <div className="min-h-screen flex items-center justify-center text-white">Contest not found</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
      <Link to="/contests" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Contests
      </Link>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 border-b border-white/10 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-4xl font-serif text-white">{contest.title}</h1>
            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
              contest.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
              contest.status === 'upcoming' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
              'bg-neutral-500/10 text-neutral-400 border-neutral-500/20'
            }`}>
              {contest.status.charAt(0).toUpperCase() + contest.status.slice(1)}
            </span>
          </div>
          <p className="text-neutral-400 font-light max-w-2xl">{contest.description}</p>
          
          <div className="flex items-center gap-6 mt-4 text-sm text-neutral-500">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(contest.start_time).toLocaleString()}</span>
            </div>
            <span>to</span>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(contest.end_time).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        {contest.status !== 'ended' && (
          <div className="flex flex-col items-end gap-4">
            {!contest.is_registered && (
              <button
                onClick={handleRegister}
                disabled={isRegistering}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/20 disabled:opacity-50"
              >
                {isRegistering ? 'Registering...' : 'Register for Contest'}
              </button>
            )}
            <div className="bg-neutral-900 border border-white/10 px-6 py-4 rounded-xl flex items-center gap-4 shadow-lg shadow-black/20">
              <Clock className={`w-8 h-8 ${contest.status === 'active' ? 'text-emerald-400' : 'text-blue-400'}`} />
              <div className="flex flex-col">
                <span className="text-xs text-neutral-500 uppercase tracking-wider font-mono mb-1">
                  {contest.status === 'active' ? 'Time Remaining' : 'Starts In'}
                </span>
                <span className="text-2xl font-mono text-white font-medium tracking-tight">{timeLeft}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-8 border-b border-white/10">
        <button
          onClick={() => setActiveTab('problems')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'problems' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-neutral-400 hover:text-white hover:border-white/20'
          }`}
        >
          <List className="w-4 h-4" /> Problems
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'leaderboard' 
              ? 'border-emerald-500 text-emerald-400' 
              : 'border-transparent text-neutral-400 hover:text-white hover:border-white/20'
          }`}
        >
          <BarChart2 className="w-4 h-4" /> Leaderboard
        </button>
      </div>

      {activeTab === 'problems' ? (
        <div className="grid gap-4">
          {contest.problems.map((problem, index) => (
            <motion.div
              key={problem.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 hover:bg-neutral-900/50 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-neutral-400 font-mono text-sm border border-white/5">
                  {index + 1}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                    {contest.status === 'active' && contest.is_registered ? (
                      <Link to={`/problem/${problem.id}?contestId=${contest.id}`}>{problem.title}</Link>
                    ) : (
                      <span className="cursor-not-allowed opacity-80">{problem.title}</span>
                    )}
                    {problem.status === 'solved' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {problem.status === 'attempted' && <AlertCircle className="w-4 h-4 text-amber-400" />}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getDifficultyColor(problem.difficulty)}`}>
                      {problem.difficulty}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">{problem.points} points</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {problem.status === 'solved' && (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium bg-emerald-400/10 px-3 py-1 rounded-full border border-emerald-400/20">
                    <CheckCircle className="w-4 h-4" /> Solved
                  </span>
                )}
                {problem.status === 'attempted' && (
                  <span className="flex items-center gap-2 text-amber-400 text-sm font-medium bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">
                    <AlertCircle className="w-4 h-4" /> Attempted
                  </span>
                )}
                <Link
                  to={`/problem/${problem.id}?contestId=${contest.id}`}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    contest.status === 'active' && contest.is_registered
                      ? 'bg-white text-black hover:bg-neutral-200' 
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  }`}
                  onClick={(e) => (contest.status !== 'active' || !contest.is_registered) && e.preventDefault()}
                >
                  {contest.status === 'upcoming' ? 'Starts Soon' : contest.status === 'ended' ? 'Ended' : !contest.is_registered ? 'Register to Solve' : 'Solve'}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <ContestLeaderboard contestId={contest.id} problems={contest.problems} liveData={liveLeaderboard} />
      )}
    </div>
  );
}
