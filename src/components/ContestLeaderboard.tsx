import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Medal, User, Activity, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';

interface LeaderboardEntry {
  rank: number;
  username: string;
  score: number;
  solved_count: number;
  solved_problem_ids: string[];
  finish_time: string; // Time of last submission
  avatar?: string;
}

interface ContestLeaderboardProps {
  contestId: string;
  problems: any[];
  liveData?: any[] | null;
}

export default function ContestLeaderboard({ contestId, problems, liveData }: ContestLeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [contestId]);

  useEffect(() => {
    if (liveData) {
      setLeaderboard(liveData);
    }
  }, [liveData]);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.contests.getLeaderboard(contestId);
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-neutral-500">Loading leaderboard...</div>;
  }

  return (
    <div className="bg-neutral-900/30 border border-white/5 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <h3 className="text-white font-medium">Live Standings</h3>
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20 animate-pulse">
          <Activity className="w-3 h-3" />
          LIVE
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wider font-mono">
            <tr>
              <th className="px-6 py-4 w-20 text-center border-b border-white/5">Rank</th>
              <th className="px-6 py-4 border-b border-white/5 min-w-[200px]">User</th>
              <th className="px-6 py-4 text-center border-b border-white/5">Score</th>
              {problems.map((p, i) => (
                <th key={p.id} className="px-4 py-4 text-center border-b border-white/5 min-w-[60px]" title={p.title}>
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
              <th className="px-6 py-4 text-right border-b border-white/5">Finish Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={4 + problems.length} className="px-6 py-12 text-center text-neutral-500">
                  No submissions yet. Be the first!
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, index) => (
                <motion.tr 
                  key={entry.username}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`hover:bg-white/5 transition-colors ${
                    entry.rank === 1 ? 'bg-yellow-500/5' : 
                    entry.rank === 2 ? 'bg-slate-400/5' : 
                    entry.rank === 3 ? 'bg-amber-700/5' : ''
                  }`}
                >
                  <td className="px-6 py-4 text-center font-mono">
                    {entry.rank === 1 ? <Trophy className="w-5 h-5 text-yellow-500 mx-auto" /> :
                     entry.rank === 2 ? <Medal className="w-5 h-5 text-slate-400 mx-auto" /> :
                     entry.rank === 3 ? <Medal className="w-5 h-5 text-amber-700 mx-auto" /> :
                     <span className="text-neutral-500">#{entry.rank}</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center overflow-hidden border border-white/10">
                        {entry.avatar ? (
                          <img src={entry.avatar} alt={entry.username} className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <span className={`font-medium ${
                        entry.rank <= 3 ? 'text-white' : 'text-neutral-300'
                      }`}>
                        {entry.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-mono text-emerald-400 font-medium">
                    {entry.score}
                  </td>
                  {problems.map((p) => {
                    const isSolved = entry.solved_problem_ids.includes(p.id);
                    return (
                      <td key={p.id} className="px-4 py-4 text-center">
                        {isSolved ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto" />
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-white/10 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                  <td className="px-6 py-4 text-right font-mono text-neutral-500 text-sm">
                    {entry.finish_time}
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-white/5 border-t border-white/5 flex gap-6 text-xs text-neutral-500 font-mono">
        {problems.map((p, i) => (
          <div key={p.id} className="flex items-center gap-1">
            <span className="text-neutral-400 font-bold">{String.fromCharCode(65 + i)}:</span>
            <span>{p.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
