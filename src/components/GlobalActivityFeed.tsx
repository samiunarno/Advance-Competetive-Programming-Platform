import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle, XCircle, Zap, Trophy, User } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Activity {
  id: string;
  type: 'submission' | 'achievement' | 'contest_win';
  user: {
    id: string;
    username: string;
    avatar?: string;
  };
  details: {
    problemTitle?: string;
    problemId?: string;
    verdict?: string;
    achievementName?: string;
    contestName?: string;
  };
  timestamp: Date;
}

export default function GlobalActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Connect to WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const socket = new WebSocket(`${protocol}//${host}/ws`);

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'global_activity') {
        const newActivity: Activity = {
          id: Math.random().toString(36).substr(2, 9),
          ...data.payload,
          timestamp: new Date()
        };
        setActivities(prev => [newActivity, ...prev].slice(0, 10));
      }
    };

    return () => socket.close();
  }, []);

  return (
    <div className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-serif text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Global Activity
        </h3>
        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {activities.map((activity) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center flex-shrink-0 border border-white/10 overflow-hidden">
                {activity.user.avatar ? (
                  <img src={activity.user.avatar} alt={activity.user.username} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-neutral-500" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium text-white">{activity.user.username}</span>
                  {activity.type === 'submission' && (
                    <span className="text-neutral-400">
                      {' solved '}
                      <Link to={`/problem/${activity.details.problemId}`} className="text-emerald-400 hover:underline">
                        {activity.details.problemTitle}
                      </Link>
                    </span>
                  )}
                  {activity.type === 'achievement' && (
                    <span className="text-neutral-400">
                      {' earned achievement '}
                      <span className="text-amber-400 font-medium">{activity.details.achievementName}</span>
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  {activity.type === 'submission' && (
                    <div className={`flex items-center gap-1 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded ${
                      activity.details.verdict === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {activity.details.verdict === 'Accepted' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {activity.details.verdict}
                    </div>
                  )}
                  <span className="text-[10px] text-neutral-600 font-mono">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {activities.length === 0 && (
          <div className="py-8 text-center">
            <p className="text-neutral-500 text-sm font-light italic">Waiting for activity...</p>
          </div>
        )}
      </div>
    </div>
  );
}
