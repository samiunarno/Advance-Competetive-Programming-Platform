import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';

interface Submission {
  id: string;
  problem_id: {
    _id: string;
    title: string;
  };
  verdict: string;
  created_at: string;
  language: string;
}

export default function Submissions() {
  const { t } = useLanguage();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { user } = useAuth();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (user) fetchSubmissions();

    // WebSocket for real-time updates
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    socketRef.current = socket;

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'global_activity' && data.payload.type === 'submission') {
        // Only refresh if it's the current user's submission or we want to see all
        // For now, let's refresh for all to make it feel "real-time"
        fetchSubmissions();
      }
    };

    return () => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;
    
    try {
      const res = await api.submissions.getAll();
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
      }
    } catch (error) {
      console.error('Failed to fetch submissions', error);
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'Accepted': return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case 'Wrong Answer': return <XCircle className="w-5 h-5 text-rose-400" />;
      case 'Time Limit Exceeded': return <Clock className="w-5 h-5 text-amber-400" />;
      default: return <AlertTriangle className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 min-h-screen">
      <div className="flex items-center justify-between mb-12">
        <h1 className="text-4xl font-serif text-white">{t('submissions.title')}</h1>
        <Link to="/dashboard" className="text-neutral-400 hover:text-white flex items-center gap-2 transition-colors">
          {t('submissions.back_to_dashboard')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="bg-neutral-900/30 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr className="border-b border-white/5 bg-white/5 text-neutral-400 text-xs font-mono uppercase tracking-wider">
              <th className="p-6 font-medium">{t('submissions.problem')}</th>
              <th className="p-6 font-medium">{t('submissions.verdict')}</th>
              <th className="p-6 font-medium">{t('submissions.language')}</th>
              <th className="p-6 font-medium text-right">{t('submissions.time')}</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission, i) => (
              <motion.tr 
                key={submission.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-white/5 hover:bg-white/5 transition-colors group"
              >
                <td className="p-6">
                  <Link 
                    to={`/problem/${submission.problem_id?._id}`}
                    className="text-white font-medium hover:text-emerald-400 transition-colors"
                  >
                    {submission.problem_id?.title || t('submissions.unknown_problem')}
                  </Link>
                </td>
                <td className="p-6">
                  <div className="flex items-center gap-3">
                    {getVerdictIcon(submission.verdict)}
                    <span className={`text-sm font-medium ${
                      submission.verdict === 'Accepted' ? 'text-emerald-400' : 
                      submission.verdict === 'Wrong Answer' ? 'text-rose-400' : 'text-neutral-400'
                    }`}>
                      {submission.verdict === 'Accepted' ? t('problem_detail.accepted') : 
                       submission.verdict === 'Wrong Answer' ? t('problem_detail.wrong_answer') :
                       submission.verdict === 'Compilation Error' ? t('problem_detail.compilation_error') :
                       submission.verdict === 'Time Limit Exceeded' ? t('problem_detail.time_limit_exceeded') :
                       submission.verdict === 'Runtime Error' ? t('problem_detail.runtime_error') :
                       submission.verdict}
                    </span>
                  </div>
                </td>
                <td className="p-6">
                  <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-neutral-300">
                    {submission.language}
                  </span>
                </td>
                <td className="p-6 text-right text-neutral-500 text-sm font-mono">
                  {new Date(submission.created_at).toLocaleString()}
                </td>
              </motion.tr>
            ))}
            
            {submissions.length === 0 && (
              <tr>
                <td colSpan={4} className="p-12 text-center text-neutral-500 font-light">
                  {t('submissions.no_submissions')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
