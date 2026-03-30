import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, CheckCircle, XCircle, Clock, Activity, Trophy, Code2, Calendar, Ban, BarChart3, PieChart as PieChartIcon, Radar as RadarIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../lib/api';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

interface Stats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  currentStreak: number;
  rank: number;
  recentActivity: {
    _id: string;
    problem_id: {
      _id: string;
      title: string;
    };
    verdict: string;
    created_at: string;
    language: string;
  }[];
  heatmapData: { _id: string; count: number }[];
  radarData: { subject: string; A: number; fullMark: number }[];
  achievements: {
    _id: string;
    achievement_id: {
      name: string;
      description: string;
      icon: string;
    };
    earned_at: string;
  }[];
}

export default function Profile() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    bio: '',
    github_url: '',
    linkedin_url: '',
    website_url: ''
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.users.getStats();
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error('Failed to fetch stats');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (user) {
      fetchStats();
      setFormData({
        bio: user.bio || '',
        github_url: user.github_url || '',
        linkedin_url: user.linkedin_url || '',
        website_url: user.website_url || ''
      });
    }
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const res = await api.users.update(user.id, formData);
      if (res.ok) {
        // Ideally update user context here, but for now just close edit mode
        setIsEditing(false);
        // You might want to add a toast notification here
      }
    } catch (error) {
      console.error('Failed to update profile', error);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 mb-16">
        <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center text-emerald-400 shadow-2xl">
          {user.avatar ? (
            <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
          ) : (
            <User className="w-10 h-10" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-serif text-white mb-2">{user.username || 'Developer'}</h1>
              {user.is_banned && (
                <span className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                  <Ban className="w-4 h-4" /> Banned
                </span>
              )}
            </div>
            <button 
              onClick={() => !user.is_banned && setIsEditing(!isEditing)}
              disabled={user.is_banned}
              className={`text-sm px-4 py-2 rounded-lg transition-colors ${
                user.is_banned 
                  ? 'bg-neutral-800/50 text-neutral-500 cursor-not-allowed' 
                  : 'bg-neutral-800 hover:bg-neutral-700 text-white'
              }`}
            >
              {user.is_banned ? 'Editing Disabled' : (isEditing ? 'Cancel' : 'Edit Profile')}
            </button>
          </div>
          
          {isEditing ? (
            <form onSubmit={handleUpdateProfile} className="mt-4 space-y-4 bg-neutral-900/50 p-6 rounded-xl border border-white/10">
              <div>
                <label className="block text-xs font-mono text-neutral-500 mb-1">Bio</label>
                <textarea 
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-neutral-500 mb-1">GitHub URL</label>
                  <input 
                    type="text"
                    value={formData.github_url}
                    onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-500 mb-1">LinkedIn URL</label>
                  <input 
                    type="text"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-neutral-500 mb-1">Website URL</label>
                  <input 
                    type="text"
                    value={formData.website_url}
                    onChange={(e) => setFormData({...formData, website_url: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-white text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium">
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            <>
              <p className="text-neutral-400 mb-4 max-w-2xl">{user.bio || 'No bio yet.'}</p>
              <div className="flex items-center gap-4 text-neutral-400 font-mono text-sm">
                <span className="flex items-center gap-2">
                  <Code2 className="w-4 h-4" /> {user.email}
                </span>
                <span className="w-1 h-1 bg-neutral-700 rounded-full" />
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> {t('profile.joined')} {new Date(user.created_at || Date.now()).toLocaleDateString()}
                </span>
              </div>
              <div className="flex gap-4 mt-4">
                {user.github_url && <a href={user.github_url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white text-sm">GitHub</a>}
                {user.linkedin_url && <a href={user.linkedin_url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white text-sm">LinkedIn</a>}
                {user.website_url && <a href={user.website_url} target="_blank" rel="noreferrer" className="text-neutral-400 hover:text-white text-sm">Website</a>}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
        {[
          { label: t('profile.total_submissions'), value: stats?.totalSubmissions || 0, icon: Activity, color: 'text-blue-400' },
          { label: t('profile.problems_solved'), value: stats?.acceptedSubmissions || 0, icon: CheckCircle, color: 'text-emerald-400' },
          { label: t('profile.acceptance_rate'), value: stats ? `${Math.round((stats.acceptedSubmissions / (stats.totalSubmissions || 1)) * 100) || 0}%` : '0%', icon: Trophy, color: 'text-amber-400' },
          { label: t('profile.current_streak'), value: `${stats?.currentStreak || 0} ${t('profile.days')}`, icon: Clock, color: 'text-purple-400' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl hover:bg-neutral-900/50 transition-colors group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-neutral-500 text-xs font-mono uppercase tracking-wider">{stat.label}</span>
              <stat.icon className={`w-5 h-5 ${stat.color} opacity-70 group-hover:opacity-100 transition-opacity`} />
            </div>
            <div className="text-3xl font-serif text-white">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
        {/* Radar Chart: Skill Distribution */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <RadarIcon className="w-5 h-5 text-emerald-400" />
            <h3 className="text-xl font-serif text-white">Skill Distribution</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={stats?.radarData || []}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
                <Radar
                  name="Skills"
                  dataKey="A"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Bar Chart: Recent Activity */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            <h3 className="text-xl font-serif text-white">Activity (Last 30 Days)</h3>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.heatmapData || []}>
                <XAxis 
                  dataKey="_id" 
                  tick={{ fill: '#555', fontSize: 10 }} 
                  axisLine={false} 
                  tickLine={false}
                  tickFormatter={(val) => val.split('-').slice(1).join('/')}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {(stats?.heatmapData || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.count > 0 ? '#10b981' : '#262626'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Achievements Section */}
      <div className="mb-16">
        <h2 className="text-2xl font-serif text-white mb-8 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-amber-400" /> Achievements
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats?.achievements.map((ua, i) => {
            const Icon = (ua.achievement_id.icon === 'Zap' ? Activity : 
                         ua.achievement_id.icon === 'CheckCircle' ? CheckCircle : 
                         Trophy);
            return (
              <motion.div
                key={ua._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 p-6 rounded-2xl flex items-center gap-4 hover:bg-neutral-900/50 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-white font-medium">{ua.achievement_id.name}</h4>
                  <p className="text-xs text-neutral-500">{ua.achievement_id.description}</p>
                  <div className="text-[10px] text-neutral-600 mt-1 font-mono">
                    Earned: {new Date(ua.earned_at).toLocaleDateString()}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {(!stats?.achievements || stats.achievements.length === 0) && (
            <div className="col-span-full py-12 text-center bg-neutral-900/20 rounded-2xl border border-white/5 border-dashed">
              <p className="text-neutral-500 italic">No achievements earned yet. Keep coding!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-2xl p-8">
        <h2 className="text-2xl font-serif text-white mb-8">{t('profile.recent_activity')}</h2>
        
        <div className="space-y-4">
          {stats?.recentActivity.map((activity, i) => (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-white/5 last:border-0 hover:bg-white/5 rounded-lg transition-colors group gap-4"
            >
              <div className="flex items-center gap-4 w-full sm:w-auto">
                {activity.verdict === 'Accepted' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-500" />
                )}
                <div>
                  <Link to={`/problem/${activity.problem_id?._id}`} className="text-white font-medium hover:text-emerald-400 transition-colors">
                    {activity.problem_id?.title || t('profile.unknown_problem')}
                  </Link>
                  <div className="text-xs text-neutral-500 mt-1 font-mono">
                    {new Date(activity.created_at).toLocaleString()} • {activity.language}
                  </div>
                </div>
              </div>
              <span className={`text-sm font-medium ${
                activity.verdict === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {activity.verdict === 'Accepted' ? t('problem_detail.accepted') : 
                 activity.verdict === 'Wrong Answer' ? t('problem_detail.wrong_answer') :
                 activity.verdict === 'Compilation Error' ? t('problem_detail.compilation_error') :
                 activity.verdict === 'Time Limit Exceeded' ? t('problem_detail.time_limit_exceeded') :
                 activity.verdict === 'Runtime Error' ? t('problem_detail.runtime_error') :
                 activity.verdict}
              </span>
            </motion.div>
          ))}
          
          {(!stats?.recentActivity || stats.recentActivity.length === 0) && (
            <div className="text-center py-12 text-neutral-500 font-light">
              {t('profile.no_activity')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
