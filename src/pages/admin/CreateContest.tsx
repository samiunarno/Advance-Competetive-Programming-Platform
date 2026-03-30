import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';
import { ArrowLeft, Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CreateContest() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
    rules: ['']
  });

  useEffect(() => {
    if (isEditMode) {
      fetchContest();
    }
  }, [id]);

  const fetchContest = async () => {
    try {
      const res = await api.contests.getById(id!);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || '',
          description: data.description || '',
          start_time: data.start_time ? formatDateForInput(data.start_time) : '',
          end_time: data.end_time ? formatDateForInput(data.end_time) : '',
          rules: data.rules && data.rules.length > 0 ? data.rules : ['']
        });
      } else {
        toast.error('Failed to fetch contest details');
        navigate('/admin/contests');
      }
    } catch (error) {
      toast.error('Failed to fetch contest details');
      navigate('/admin/contests');
    }
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  const handleRuleChange = (index: number, value: string) => {
    const newRules = [...formData.rules];
    newRules[index] = value;
    setFormData({ ...formData, rules: newRules });
  };

  const addRule = () => {
    setFormData({ ...formData, rules: [...formData.rules, ''] });
  };

  const removeRule = (index: number) => {
    const newRules = formData.rules.filter((_, i) => i !== index);
    setFormData({ ...formData, rules: newRules });
  };

  const calculateDuration = () => {
    if (!formData.start_time || !formData.end_time) return null;
    const start = new Date(formData.start_time).getTime();
    const end = new Date(formData.end_time).getTime();
    const diff = end - start;
    if (diff <= 0) return 'Invalid duration';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (new Date(formData.end_time) <= new Date(formData.start_time)) {
      toast.error('End time must be after start time');
      return;
    }

    // Filter out empty rules
    const payload = {
      ...formData,
      rules: formData.rules.filter(r => r.trim() !== '')
    };

    try {
      let res;
      if (isEditMode) {
        res = await api.contests.update(id!, payload);
      } else {
        res = await api.contests.create(payload);
      }

      if (res.ok) {
        toast.success(isEditMode ? 'Contest updated successfully' : 'Contest created successfully');
        navigate('/admin/contests');
      } else {
        const data = await res.json();
        toast.error(data.message || 'Operation failed');
      }
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link to="/admin/contests" className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Contests
          </Link>
          <h1 className="text-3xl font-serif text-white">
            {isEditMode ? 'Edit Contest' : 'Create New Contest'}
          </h1>
          <p className="text-neutral-400 mt-2">Configure contest details, timing, and rules.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-neutral-900 border border-white/10 rounded-xl p-8 space-y-8 shadow-xl">
        <div className="space-y-6">
          <h2 className="text-xl font-medium text-white border-b border-white/10 pb-2">Basic Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Contest Title</label>
            <input
              type="text"
              required
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Weekly Challenge #105"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Description</label>
            <textarea
              required
              rows={4}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the contest..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-medium text-white border-b border-white/10 pb-2 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Schedule
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Start Time</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.start_time}
                  onChange={e => setFormData({ ...formData, start_time: e.target.value })}
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">End Time</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                  value={formData.end_time}
                  onChange={e => setFormData({ ...formData, end_time: e.target.value })}
                />
                <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {formData.start_time && formData.end_time && (
            <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg ${
              calculateDuration() === 'Invalid duration' 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {calculateDuration() === 'Invalid duration' ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
              <span className="font-medium">Duration: {calculateDuration()}</span>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h2 className="text-xl font-medium text-white">Rules</h2>
            <button
              type="button"
              onClick={addRule}
              className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>
          
          <div className="space-y-3">
            {formData.rules.map((rule, index) => (
              <div key={index} className="flex gap-3 group">
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-xs font-mono">
                    {index + 1}.
                  </span>
                  <input
                    type="text"
                    className="w-full bg-black/50 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white text-sm focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all"
                    value={rule}
                    onChange={e => handleRuleChange(index, e.target.value)}
                    placeholder={`Enter rule description...`}
                  />
                </div>
                {formData.rules.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="p-3 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                    title="Remove rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
          <Link
            to="/admin/contests"
            className="px-6 py-2.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors font-medium"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transform hover:-translate-y-0.5"
          >
            {isEditMode ? 'Update Contest' : 'Create Contest'}
          </button>
        </div>
      </form>
    </div>
  );
}
