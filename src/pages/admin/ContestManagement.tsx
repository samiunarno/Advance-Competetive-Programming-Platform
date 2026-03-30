import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import { Trash2, Edit, Plus, Calendar, Users, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';

interface Contest {
  _id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  participant_count: number;
  status: 'upcoming' | 'active' | 'ended';
}

export default function ContestManagement() {
  const { t } = useLanguage();
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContests();
  }, []);

  const fetchContests = async () => {
    try {
      const res = await api.contests.getAll();
      if (res.ok) {
        const data = await res.json();
        // Ensure data is mapped correctly if backend returns different structure
        // Assuming backend returns array of contests with _id
        setContests(data.map((c: any) => ({ ...c, _id: c._id || c.id })));
      } else {
        toast.error('Failed to fetch contests');
      }
    } catch (error) {
      toast.error('Failed to fetch contests');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contest?')) return;
    
    try {
      const res = await api.contests.delete(id);
      if (res.ok) {
        setContests(contests.filter(c => c._id !== id));
        toast.success('Contest deleted');
      } else {
        toast.error('Failed to delete contest');
      }
    } catch (error) {
      toast.error('Failed to delete contest');
    }
  };

  const getStatusColor = (status: string) => {
    const now = new Date();
    // Calculate status if not provided by backend logic (though backend should ideally provide it)
    // But here we rely on what's passed or calculated
    switch (status) {
      case 'active': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'upcoming': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'ended': return 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20';
      default: return 'text-neutral-400';
    }
  };

  // Helper to determine status if not explicitly provided
  const getContestStatus = (contest: Contest) => {
    const now = new Date().getTime();
    const start = new Date(contest.start_time).getTime();
    const end = new Date(contest.end_time).getTime();
    
    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Contest Management</h1>
          <p className="text-neutral-400">Create and manage programming contests.</p>
        </div>
        <Link
          to="/admin/contests/create"
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Create Contest
        </Link>
      </div>

      <div className="bg-neutral-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-neutral-400 text-xs uppercase tracking-wider font-mono">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Start Time</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4 text-center">Participants</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {contests.map((contest) => {
                const status = getContestStatus(contest);
                const duration = (new Date(contest.end_time).getTime() - new Date(contest.start_time).getTime()) / (1000 * 60 * 60);
                
                return (
                  <tr key={contest._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">{contest.title}</div>
                      <div className="text-xs text-neutral-500 truncate max-w-xs">{contest.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border uppercase ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 text-sm">
                      {new Date(contest.start_time).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-neutral-300 text-sm">
                      {duration.toFixed(1)}h
                    </td>
                    <td className="px-6 py-4 text-center text-neutral-300">
                      {contest.participant_count || 0}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/admin/contests/edit/${contest._id}`}
                          className="p-2 text-neutral-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button 
                          onClick={() => handleDelete(contest._id)}
                          className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              
              {contests.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-500">
                    No contests found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
