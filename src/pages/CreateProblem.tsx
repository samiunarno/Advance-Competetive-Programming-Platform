import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ALL_LANGUAGES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

export default function CreateProblem() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    points: '100',
    input_format: '',
    output_format: '',
    sample_input: '',
    sample_output: '',
    start_time: '',
    deadline: '',
    daily_submission_limit: '',
    visibility: 'public',
    supported_languages: [] as string[],
    tags: [] as string[],
  });

  const [availableTags, setAvailableTags] = useState<{ _id: string, name: string }[]>([]);
  const isEditMode = !!id;

  useEffect(() => {
    fetchTags();
    if (isEditMode) {
      fetchProblem();
    }
  }, [id]);

  const fetchTags = async () => {
    try {
      const res = await api.tags.getAll();
      if (res.ok) {
        const data = await res.json();
        setAvailableTags(data);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const fetchProblem = async () => {
    try {
      const res = await api.problems.getById(id!);
      if (res.ok) {
        const data = await res.json();
        setFormData({
          title: data.title || '',
          description: data.description || '',
          difficulty: data.difficulty || 'Easy',
          points: data.points ? data.points.toString() : '100',
          input_format: data.input_format || '',
          output_format: data.output_format || '',
          sample_input: data.sample_input || '',
          sample_output: data.sample_output || '',
          start_time: data.start_time ? new Date(data.start_time).toISOString().slice(0, 16) : '',
          deadline: data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : '',
          daily_submission_limit: data.daily_limit ? data.daily_limit.toString() : '',
          visibility: data.visibility || 'public',
          supported_languages: data.supported_languages || [],
          tags: data.tags || [],
        });
      } else {
        toast.error('Failed to fetch problem details');
        navigate('/admin/problems');
      }
    } catch (error) {
      toast.error('Failed to fetch problem details');
      navigate('/admin/problems');
    }
  };

  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tagToRemove) }));
  };

  const handleGenerateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    const loadingToast = toast.loading('AI is thinking up a problem...');
    
    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error('AI service unavailable (API key missing)');
      }
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const prompt = `Create a coding problem about "${aiPrompt}" with difficulty "${formData.difficulty}".
      Return the response in JSON format with the following structure:
      {
        "title": "Problem Title",
        "description": "Problem Description (markdown supported)",
        "input_format": "Description of input format",
        "output_format": "Description of output format",
        "sample_input": "Example input",
        "sample_output": "Example output",
        "constraints": "Constraints on input (e.g. 1 <= N <= 100)"
      }`;

      const result = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              input_format: { type: Type.STRING },
              output_format: { type: Type.STRING },
              sample_input: { type: Type.STRING },
              sample_output: { type: Type.STRING },
              constraints: { type: Type.STRING }
            },
            required: ["title", "description", "input_format", "output_format", "sample_input", "sample_output", "constraints"]
          }
        }
      });

      const data = JSON.parse(result.text);

      // Validate required fields
      const requiredFields = ['title', 'description', 'input_format', 'output_format', 'sample_input', 'sample_output'];
      const missingFields = requiredFields.filter(field => !data[field]);

      if (missingFields.length > 0) {
        console.warn('AI response missing some fields:', missingFields);
        toast.error('AI generated an incomplete problem. Please try again or refine your prompt.', { id: loadingToast });
        return;
      }

      setFormData(prev => ({
        ...prev,
        title: data.title || prev.title,
        description: data.description || prev.description,
        input_format: data.input_format || prev.input_format,
        output_format: data.output_format || prev.output_format,
        sample_input: data.sample_input || prev.sample_input,
        sample_output: data.sample_output || prev.sample_output,
      }));
      
      toast.success('Problem generated successfully!', { id: loadingToast });
      setShowAiModal(false);
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast.error(error.message || 'Failed to generate problem', { id: loadingToast });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Client-side validation
    const requiredFields = [
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'difficulty', label: 'Difficulty' },
      { key: 'input_format', label: 'Input Format' },
      { key: 'output_format', label: 'Output Format' },
      { key: 'sample_input', label: 'Sample Input' },
      { key: 'sample_output', label: 'Sample Output' },
    ];

    for (const field of requiredFields) {
      if (!(formData as any)[field.key].trim()) {
        toast.error(`${field.label} is required`);
        return;
      }
    }

    if (formData.supported_languages.length === 0) {
      toast.error('At least one supported language must be selected');
      return;
    }

    if (formData.start_time && formData.deadline) {
      if (new Date(formData.deadline) <= new Date(formData.start_time)) {
        toast.error('Deadline (End Time) must be after Start Time');
        return;
      }
    }

    if (formData.daily_submission_limit) {
      const limit = parseInt(formData.daily_submission_limit);
      if (isNaN(limit) || limit <= 0) {
        toast.error('Daily submission limit must be a positive integer');
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        points: parseInt(formData.points) || 100,
        start_time: formData.start_time || null,
        deadline: formData.deadline || null,
        daily_limit: formData.daily_submission_limit ? parseInt(formData.daily_submission_limit) : null,
      };

      let res;
      if (isEditMode) {
        res = await api.problems.update(id!, payload);
      } else {
        res = await api.problems.create(payload);
      }

      if (res.ok) {
        toast.success(isEditMode ? 'Problem updated successfully' : t('create_problem.success'));
        navigate('/admin/problems');
      } else {
        toast.error(isEditMode ? 'Failed to update problem' : t('create_problem.error'));
      }
    } catch (error) {
      toast.error(isEditMode ? 'Failed to update problem' : t('create_problem.error'));
    }
  };

  const handleLanguageToggle = (lang: string) => {
    setFormData(prev => {
      const current = prev.supported_languages;
      if (current.includes(lang)) {
        return { ...prev, supported_languages: current.filter(l => l !== lang) };
      } else {
        return { ...prev, supported_languages: [...current, lang] };
      }
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">
          {isEditMode ? 'Edit Problem' : t('create_problem.title')}
        </h1>
        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
        >
          <Sparkles className="w-4 h-4" />
          Generate with AI
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.problem_title')}</label>
          <input
            type="text"
            required
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
            value={formData.title}
            onChange={e => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.difficulty')}</label>
            <select
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.difficulty}
              onChange={e => setFormData({ ...formData, difficulty: e.target.value as any })}
            >
              <option value="Easy">{t('problems.filter_easy')}</option>
              <option value="Medium">{t('problems.filter_medium')}</option>
              <option value="Hard">{t('problems.filter_hard')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Points</label>
            <input
              type="number"
              required
              min="0"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.points}
              onChange={e => setFormData({ ...formData, points: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Visibility</label>
            <div className="flex items-center gap-3 h-[42px]">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, visibility: formData.visibility === 'public' ? 'private' : 'public' })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  formData.visibility === 'public' ? 'bg-emerald-600' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.visibility === 'public' ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-slate-300 capitalize">{formData.visibility}</span>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.supported_languages')}</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.supported_languages.map(langId => {
              const lang = ALL_LANGUAGES.find(l => l.id === langId);
              return (
                <span key={langId} className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                  {lang?.name || langId}
                  <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => handleLanguageToggle(langId)} />
                </span>
              );
            })}
          </div>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => {
              const val = e.target.value;
              if (val && !formData.supported_languages.includes(val)) {
                setFormData(prev => ({ ...prev, supported_languages: [...prev.supported_languages, val] }));
              }
              e.target.value = "";
            }}
            value=""
          >
            <option value="" disabled>Select a language to add...</option>
            {ALL_LANGUAGES.filter(l => !formData.supported_languages.includes(l.id)).map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Start Time (Optional)</label>
            <input
              type="datetime-local"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.start_time}
              onChange={e => setFormData({ ...formData, start_time: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.deadline')} (End Time - Optional)</label>
            <input
              type="datetime-local"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.deadline}
              onChange={e => setFormData({ ...formData, deadline: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.daily_limit')}</label>
          <input
            type="number"
            min="1"
            placeholder={t('create_problem.daily_limit_placeholder')}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.daily_submission_limit}
            onChange={e => setFormData({ ...formData, daily_submission_limit: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Tags</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.tags.map(tag => (
              <span key={tag} className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-md text-xs flex items-center gap-1">
                {tag}
                <X className="w-3 h-3 cursor-pointer hover:text-white" onClick={() => removeTag(tag)} />
              </span>
            ))}
          </div>
          <select
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            onChange={(e) => {
              const val = e.target.value;
              if (val && !formData.tags.includes(val)) {
                setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
              }
              e.target.value = "";
            }}
            value=""
          >
            <option value="" disabled>Select a tag to add...</option>
            {availableTags.filter(t => !formData.tags.includes(t.name)).map(tag => (
              <option key={tag._id} value={tag.name}>{tag.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.description')}</label>
          <textarea
            required
            rows={4}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.input_format')}</label>
            <textarea
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.input_format}
              onChange={e => setFormData({ ...formData, input_format: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.output_format')}</label>
            <textarea
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.output_format}
              onChange={e => setFormData({ ...formData, output_format: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.sample_input')}</label>
            <textarea
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.sample_input}
              onChange={e => setFormData({ ...formData, sample_input: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">{t('create_problem.sample_output')}</label>
            <textarea
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white font-mono text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.sample_output}
              onChange={e => setFormData({ ...formData, sample_output: e.target.value })}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            {isEditMode ? 'Update Problem' : t('create_problem.create_button')}
          </button>
        </div>
      </form>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {showAiModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-purple-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-400" /> Generate Problem
                </h2>
                <button onClick={() => setShowAiModal(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleGenerateProblem} className="space-y-4">
                <p className="text-neutral-300 text-sm">
                  Describe the problem you want to create. The AI will generate the title, description, and test cases for you.
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Topic / Description</label>
                  <textarea
                    required
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-purple-500/50 focus:outline-none"
                    rows={4}
                    placeholder="e.g. A dynamic programming problem about finding the longest common subsequence of two strings..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAiModal(false)}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
