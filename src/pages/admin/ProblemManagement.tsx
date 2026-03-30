import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, Plus, Search, Edit } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { useLanguage } from '../../context/LanguageContext';
import ConfirmationDialog from '../../components/ConfirmationDialog';

interface Problem {
  _id: string;
  title: string;
  difficulty: string;
  visibility?: string;
  created_at: string;
  created_by: {
    username: string;
  } | null;
}

export default function ProblemManagement() {
  const { t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  
  // Deletion state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [problemToDelete, setProblemToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const res = await api.problems.getAll();
      if (res.ok) {
        const data = await res.json();
        setProblems(data);
      } else {
        toast.error(t('problem_management.fetch_error'));
      }
    } catch (error) {
      toast.error(t('problem_management.fetch_error'));
    }
  };

  const handleDelete = async () => {
    if (!problemToDelete) return;
    
    try {
      const res = await api.problems.delete(problemToDelete);
      if (res.ok) {
        setProblems(problems.filter(p => p._id !== problemToDelete));
        toast.success(t('problem_management.delete_success'));
      } else {
        toast.error(t('problem_management.delete_error'));
      }
    } catch (error) {
      toast.error(t('problem_management.delete_error'));
    } finally {
      setProblemToDelete(null);
    }
  };

  const confirmDelete = (id: string) => {
    setProblemToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesDate = !dateFilter || new Date(problem.created_at) >= new Date(dateFilter);
    return matchesSearch && matchesDifficulty && matchesDate;
  });

  return (
    <div>
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white">{t('problem_management.title')}</h2>
          <Link 
            to="/admin/create" 
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> {t('problem_management.create_problem')}
          </Link>
        </div>

        <div className="flex flex-wrap gap-4 items-center bg-slate-900 p-4 rounded-xl border border-slate-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('problem_management.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
          >
            <option value="All">All</option>
            <option value="Easy">{t('problems.filter_easy')}</option>
            <option value="Medium">{t('problems.filter_medium')}</option>
            <option value="Hard">{t('problems.filter_hard')}</option>
          </select>

          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{t('problem_management.created_after')}</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          
          {(difficultyFilter !== 'All' || dateFilter || searchTerm) && (
            <button
              onClick={() => {
                setDifficultyFilter('All');
                setDateFilter('');
                setSearchTerm('');
              }}
              className="text-sm text-slate-400 hover:text-white transition-colors px-2"
            >
              {t('problem_management.clear_filters')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-400 min-w-[800px]">
          <thead className="bg-slate-950 text-slate-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-4">{t('problem_management.id')}</th>
              <th className="px-6 py-4">{t('problem_management.title_col')}</th>
              <th className="px-6 py-4">{t('problem_management.difficulty_col')}</th>
              <th className="px-6 py-4">Visibility</th>
              <th className="px-6 py-4">{t('problem_management.created_by')}</th>
              <th className="px-6 py-4">{t('problem_management.date_added')}</th>
              <th className="px-6 py-4 text-right">{t('problem_management.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredProblems.map((problem) => (
              <tr key={problem._id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-slate-500">#{problem._id.slice(0, 8)}...</td>
                <td className="px-6 py-4 font-medium text-white">
                  <Link to={`/problem/${problem._id}`} className="hover:text-emerald-400 transition-colors">
                    {problem.title}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    problem.difficulty === 'Easy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' :
                    problem.difficulty === 'Medium' ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                    'text-rose-400 bg-rose-400/10 border-rose-400/20'
                  }`}>
                    {problem.difficulty}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium border ${
                    problem.visibility === 'private' 
                      ? 'text-neutral-400 bg-neutral-400/10 border-neutral-400/20' 
                      : 'text-blue-400 bg-blue-400/10 border-blue-400/20'
                  }`}>
                    {problem.visibility || 'public'}
                  </span>
                </td>
                <td className="px-6 py-4">{problem.created_by?.username || t('problem_management.unknown_user')}</td>
                <td className="px-6 py-4">{new Date(problem.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      to={`/admin/edit/${problem._id}`}
                      className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                      title="Edit Problem"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button 
                      onClick={() => confirmDelete(problem._id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors"
                      title={t('problem_management.delete_tooltip')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProblems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  {t('problem_management.no_problems')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
