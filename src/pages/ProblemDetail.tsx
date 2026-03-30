import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Play, CheckCircle, AlertCircle, Clock, Sparkles, X, Lightbulb, Code2, Terminal, XCircle } from 'lucide-react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { GoogleGenAI, Type } from "@google/genai";
import prettier from "prettier/standalone";
import parserBabel from "prettier/plugins/babel";
import parserEstree from "prettier/plugins/estree";
import { ALL_LANGUAGES } from '../constants';

interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  input_format: string;
  output_format: string;
  sample_input: string;
  sample_output: string;
  deadline?: string;
  daily_limit?: number;
  user_daily_submissions?: number;
  supported_languages?: string[];
}

const BOILERPLATES: Record<string, string> = {
  cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    // your code goes here\n    return 0;\n}`,
  python: `def solve():\n    # your code goes here\n    pass\n\nif __name__ == "__main__":\n    solve()`,
  java: `import java.util.*;\n\npublic class Main {\n    public static void main(String[] args) {\n        // your code goes here\n    }\n}`,
  javascript: `// your code goes here\nconsole.log("Hello World");`,
  rust: `fn main() {\n    // your code goes here\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    // your code goes here\n}`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        // your code goes here\n    }\n}`,
  ruby: `# your code goes here\nputs "Hello World"`,
  swift: `import Foundation\n\n// your code goes here\nprint("Hello World")`,
  php: `<?php\n// your code goes here\n?>`,
  typescript: `// your code goes here\nconst message: string = "Hello World";\nconsole.log(message);`
};

export default function ProblemDetail() {
  const { t } = useLanguage();
  const { id } = useParams();
  const { user } = useAuth();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState('cpp');
  const [code, setCode] = useState(BOILERPLATES['cpp']);
  const [verdict, setVerdict] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [runOutput, setRunOutput] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  
  // AI Hint State
  const [isAskingAI, setIsAskingAI] = useState(false);
  const [aiHint, setAiHint] = useState<string | null>(null);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiMode, setAiMode] = useState<'hint' | 'analysis'>('analysis');
  const editorRef = useRef<any>(null);

  const judgeAI = useRef<GoogleGenAI | null>(null);

  useEffect(() => {
    if (!judgeAI.current && process.env.GEMINI_API_KEY) {
      judgeAI.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
  }, []);

  useEffect(() => {
    if (id) fetchProblem();
  }, [id]);

  useEffect(() => {
    if (problem?.deadline) {
      const timer = setInterval(() => {
        const now = new Date().getTime();
        const deadline = new Date(problem.deadline!).getTime();
        const distance = deadline - now;

        if (distance < 0) {
          setTimeLeft('EXPIRED');
          clearInterval(timer);
        } else {
          const days = Math.floor(distance / (1000 * 60 * 60 * 24));
          const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          setTimeLeft(`${days}d ${hours}h ${minutes}m`);
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [problem]);

  const fetchProblem = async () => {
    try {
      const res = await api.problems.getById(id!);
      if (res.ok) {
        const data = await res.json();
        const prob = { ...data, id: data._id };
        setProblem(prob);
        
        // Set default language to first supported language if available
        if (prob.supported_languages && prob.supported_languages.length > 0) {
          const firstLang = prob.supported_languages[0];
          setLanguage(firstLang);
          setCode(BOILERPLATES[firstLang] || '');
        }
      } else {
        toast.error(t('problem_detail.fetch_error'));
      }
    } catch (error) {
      toast.error(t('problem_detail.fetch_error'));
    }
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    setCode(BOILERPLATES[lang]);
  };

  const handleAskAI = async (mode: 'hint' | 'analysis') => {
    setAiMode(mode);
    setShowAiModal(true);
    setIsAskingAI(true);
    setAiHint(null);

    try {
      if (!judgeAI.current) {
        if (process.env.GEMINI_API_KEY) {
          judgeAI.current = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        } else {
          throw new Error('AI not initialized');
        }
      }

      let prompt = '';
      if (mode === 'hint') {
        prompt = `You are a helpful coding tutor. The user is stuck on a problem.
        Problem: ${problem?.title}
        Description: ${problem?.description}
        Language: ${language}
        User's Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide a helpful hint without giving away the full solution. Point out potential logic errors or suggest a better approach. Keep it concise.`;
      } else {
        prompt = `You are a code reviewer. Analyze the following code for time and space complexity, and potential improvements.
        Problem: ${problem?.title}
        Language: ${language}
        Code:
        \`\`\`${language}
        ${code}
        \`\`\`
        
        Provide a detailed analysis.`;
      }

      const result = await judgeAI.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });
      
      setAiHint(result.text || "No response from AI");
    } catch (error) {
      console.error('AI Error:', error);
      setAiHint(t('problem_detail.ai_connection_error'));
    } finally {
      setIsAskingAI(false);
    }
  };

  const handleRun = async () => {
    if (!user || !problem || isRunning || isSubmitting) return;
    setIsRunning(true);
    setRunOutput(null);
    
    try {
      if (!judgeAI.current) throw new Error('AI not initialized');
      const result = await judgeAI.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
        You are a code execution environment. Execute the following ${language} code with the provided input.
        If the code is not JavaScript, simulate its execution as accurately as possible.
        
        Problem: ${problem.title}
        Code:
        ${code}
        
        Input:
        ${customInput || problem.sample_input}
        
        Return ONLY the output of the program. If there is a compilation or runtime error, return the error message.
      `});
      setRunOutput(result.text || "No output");
      toast.success(t('problem_detail.run_complete'));
    } catch (e) {
      console.error('Run error:', e);
      toast.error(t('problem_detail.run_error'));
    } finally {
      setIsRunning(false);
    }
  };

  const [submissionDetails, setSubmissionDetails] = useState<{ output?: string } | null>(null);

  const handleFormat = async (currentCode?: string) => {
    const codeToFormat = currentCode || code;
    if (!codeToFormat) return;

    try {
      let formatted = codeToFormat;
      if (language === 'javascript') {
        formatted = await prettier.format(codeToFormat, {
          parser: "babel",
          plugins: [parserBabel, parserEstree],
          semi: true,
          singleQuote: true,
        });
      }
      // For other languages, we could add more parsers if needed
      // but Prettier is primarily for JS/TS/CSS/HTML/JSON
      
      if (formatted !== codeToFormat) {
        setCode(formatted);
        if (editorRef.current) {
          const model = editorRef.current.getModel();
          if (model) {
            model.setValue(formatted);
          }
        }
      }
    } catch (err) {
      console.error('Formatting error:', err);
    }
  };

  const handleEditorMount = (editor: any) => {
    editorRef.current = editor;
    
    // Auto-format on paste
    editor.onDidPaste(() => {
      // Small delay to let the paste finish
      setTimeout(() => {
        handleFormat(editor.getValue());
      }, 100);
    });
  };

  // Debounced auto-format on type
  useEffect(() => {
    if (language !== 'javascript') return;
    
    const timer = setTimeout(() => {
      // Only format if the editor is focused to avoid unexpected jumps
      if (editorRef.current && editorRef.current.hasTextFocus()) {
        handleFormat();
      }
    }, 2000); // 2 seconds of inactivity

    return () => clearTimeout(timer);
  }, [code, language]);

  const handleSubmit = async () => {
    if (!user || !problem || isSubmitting || isRunning) return;
    if (problem.daily_limit && (problem.user_daily_submissions || 0) >= problem.daily_limit) {
      toast.error(t('problem_detail.daily_limit_reached'));
      return;
    }
    setIsSubmitting(true);
    setVerdict(null);
    setRunOutput(null);
    setSubmissionDetails(null);
    
    try {
      // AI Judging
      if (!judgeAI.current) throw new Error('AI not initialized');
      const prompt = `
        You are a competitive programming judge. Evaluate the following ${language} code for the problem "${problem.title}".
        
        Problem Description:
        ${problem.description}
        
        Input Format: ${problem.input_format}
        Output Format: ${problem.output_format}
        Sample Input: ${problem.sample_input}
        Sample Output: ${problem.sample_output}
        
        Code to evaluate:
        ${code}
        
        Return a JSON object with:
        - "verdict": One of ["Accepted", "Wrong Answer", "Time Limit Exceeded", "Runtime Error", "Compilation Error"]
        - "output": A brief explanation of the verdict or the execution log.
        - "execution_time": Estimated time in ms (number)
        - "memory_usage": Estimated memory in KB (number)
      `;

      const result = await judgeAI.current.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              verdict: { type: Type.STRING },
              output: { type: Type.STRING },
              execution_time: { type: Type.NUMBER },
              memory_usage: { type: Type.NUMBER }
            },
            required: ["verdict", "output", "execution_time", "memory_usage"]
          }
        }
      });

      const judgeResult = JSON.parse(result.text);
      
      const res = await api.submissions.create({
        problem_id: problem.id,
        code,
        language,
        verdict: judgeResult.verdict,
        execution_output: judgeResult.output,
        execution_time: judgeResult.execution_time,
        memory_usage: judgeResult.memory_usage
      });

      const data = await res.json();
      
      if (res.ok) {
        setVerdict(judgeResult.verdict);
        setSubmissionDetails({ output: judgeResult.output });
        
        if (judgeResult.verdict === 'Accepted') {
          toast.success(t('problem_detail.solution_accepted'));
        } else {
          toast.error(`${t('problem_detail.verdict')}: ${judgeResult.verdict}`);
        }
      } else {
        throw new Error(data.error || t('problem_detail.submission_failed'));
      }
    } catch (e: any) {
      console.error('Submission error:', e);
      toast.error(e.message || t('problem_detail.submission_error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard Shortcuts
  const handleRunRef = useRef(handleRun);
  const handleSubmitRef = useRef(handleSubmit);

  useEffect(() => {
    handleRunRef.current = handleRun;
    handleSubmitRef.current = handleSubmit;
  }, [handleRun, handleSubmit]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Run: Ctrl+Enter or Cmd+Enter
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunRef.current();
      }
      // Submit: Ctrl+S or Cmd+S
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSubmitRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!problem) return <div className="p-8 text-center text-neutral-400">Loading...</div>;

  if (user?.is_banned) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center bg-black">
        <div className="text-center p-8 bg-neutral-900 border border-rose-500/30 rounded-2xl max-w-md">
          <AlertCircle className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-2xl font-serif text-white mb-2">Access Denied</h2>
          <p className="text-neutral-400 mb-6">You are banned from accessing problems.</p>
          <div className="text-sm text-rose-400 bg-rose-500/10 p-4 rounded-lg border border-rose-500/20">
            Reason: {user.ban_reason || 'Violation of terms'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row md:h-[calc(100vh-4rem)] h-auto overflow-y-auto md:overflow-hidden relative bg-black">

      {/* AI Modal */}
      <AnimatePresence>
        {showAiModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-900 border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className={`flex items-center gap-2 ${aiMode === 'hint' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {aiMode === 'hint' ? <Lightbulb className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                  <h3 className="font-serif font-medium text-lg">{aiMode === 'hint' ? t('problem_detail.ai_hint') : t('problem_detail.ai_analysis')}</h3>
                </div>
                <button 
                  onClick={() => setShowAiModal(false)}
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {isAskingAI ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className={`w-12 h-12 border-4 ${aiMode === 'hint' ? 'border-amber-500' : 'border-emerald-500'} border-t-transparent rounded-full animate-spin`} />
                    <p className="text-neutral-400 animate-pulse font-medium">
                      {aiMode === 'hint' ? t('problem_detail.ai_thinking') : t('problem_detail.ai_analyzing')}
                    </p>
                  </div>
                ) : (
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({node, inline, className, children, ...props}: any) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <div className="relative group">
                              <div className="absolute right-2 top-2 text-xs text-neutral-500 font-mono opacity-0 group-hover:opacity-100 transition-opacity">{match[1]}</div>
                              <pre className="bg-black/50 p-4 rounded-lg border border-white/10 overflow-x-auto my-4 text-sm">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            </div>
                          ) : (
                            <code className="bg-white/10 px-1.5 py-0.5 rounded text-sm font-mono text-emerald-300" {...props}>
                              {children}
                            </code>
                          )
                        },
                        ul: ({children}) => <ul className="list-disc pl-4 space-y-1 my-4 text-neutral-300">{children}</ul>,
                        ol: ({children}) => <ol className="list-decimal pl-4 space-y-1 my-4 text-neutral-300">{children}</ol>,
                        li: ({children}) => <li className="text-neutral-300">{children}</li>,
                        p: ({children}) => <p className="text-neutral-300 leading-relaxed mb-4 last:mb-0">{children}</p>,
                        h1: ({children}) => <h1 className="text-2xl font-serif text-white mb-4 mt-6">{children}</h1>,
                        h2: ({children}) => <h2 className="text-xl font-serif text-white mb-3 mt-5">{children}</h2>,
                        h3: ({children}) => <h3 className="text-lg font-serif text-emerald-400 mb-2 mt-4">{children}</h3>,
                        blockquote: ({children}) => <blockquote className="border-l-4 border-white/20 pl-4 italic text-neutral-400 my-4">{children}</blockquote>,
                      }}
                    >
                      {aiHint || ''}
                    </ReactMarkdown>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 flex justify-end bg-black/20 rounded-b-xl">
                <button
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm font-medium transition-colors border border-white/5"
                >
                  {t('problem_detail.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Problem Description Panel */}
      <div className="w-full md:w-1/2 md:h-full h-auto min-h-[50vh] overflow-y-auto border-r border-white/10 bg-neutral-900/50 p-6 custom-scrollbar">
        <div className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-serif text-white mb-2">{problem.title}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 text-neutral-300 text-xs border border-white/10 font-medium">
                {problem.difficulty}
              </span>
              {problem.deadline && (
                <span className="ml-2 text-neutral-500 text-xs font-mono">
                  {t('problem_detail.due')}: {new Date(problem.deadline).toLocaleString()}
                </span>
              )}
              {problem.daily_limit && (
                <span className={`ml-2 text-xs font-mono px-2 py-0.5 rounded border ${
                  (problem.user_daily_submissions || 0) >= problem.daily_limit 
                    ? 'bg-rose-900/20 border-rose-800 text-rose-400' 
                    : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                }`}>
                  Submissions: {problem.user_daily_submissions || 0}/{problem.daily_limit}
                </span>
              )}
            </div>
            {timeLeft && (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                timeLeft === 'EXPIRED' 
                  ? 'bg-rose-900/20 border-rose-800 text-rose-400' 
                  : 'bg-emerald-900/20 border-emerald-800 text-emerald-400'
              }`}>
                <Clock className="w-4 h-4" />
                <span className="font-mono font-medium text-sm">{timeLeft}</span>
              </div>
            )}
          </div>
        </div>

        <div className="prose prose-invert max-w-none">
          <h3 className="text-lg font-serif text-emerald-400 mt-8 mb-3 flex items-center gap-2">
            <Terminal className="w-4 h-4" /> {t('problem_detail.description')}
          </h3>
          <p className="text-neutral-300 whitespace-pre-wrap leading-relaxed">{problem.description}</p>

          <h3 className="text-lg font-serif text-emerald-400 mt-8 mb-3">{t('problem_detail.input_format')}</h3>
          <p className="text-neutral-300 whitespace-pre-wrap font-mono text-sm bg-black/30 p-4 rounded-lg border border-white/5">{problem.input_format}</p>

          <h3 className="text-lg font-serif text-emerald-400 mt-8 mb-3">{t('problem_detail.output_format')}</h3>
          <p className="text-neutral-300 whitespace-pre-wrap font-mono text-sm bg-black/30 p-4 rounded-lg border border-white/5">{problem.output_format}</p>

          <div className="grid gap-6 mt-8">
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider font-mono">{t('problem_detail.sample_input')}</h4>
              <pre className="bg-black/50 p-4 rounded-lg border border-white/10 text-neutral-300 font-mono text-sm">
                {problem.sample_input}
              </pre>
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-400 mb-2 uppercase tracking-wider font-mono">{t('problem_detail.sample_output')}</h4>
              <pre className="bg-black/50 p-4 rounded-lg border border-white/10 text-neutral-300 font-mono text-sm">
                {problem.sample_output}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Code Editor Panel */}
      <div className="w-full md:w-1/2 md:h-full h-[85vh] flex flex-col bg-black border-t md:border-t-0 border-white/10">
        <div className="flex items-center justify-between px-4 py-3 bg-neutral-900 border-b border-white/10 overflow-x-auto">
          <div className="flex items-center gap-4 min-w-max">
            <select 
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-black/50 text-neutral-300 text-sm rounded-lg border border-white/10 px-3 py-1.5 outline-none focus:border-emerald-500 transition-colors"
            >
              {ALL_LANGUAGES.filter(lang => 
                !problem.supported_languages || 
                problem.supported_languages.length === 0 || 
                problem.supported_languages.includes(lang.id)
              ).map(lang => (
                <option key={lang.id} value={lang.id}>{lang.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-max">
            <button
              onClick={() => handleFormat()}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-neutral-300 border border-white/10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Code2 className="w-4 h-4" /> <span className="hidden sm:inline">Format</span>
            </button>
            <button
              onClick={() => handleAskAI('hint')}
              disabled={isAskingAI}
              className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Lightbulb className="w-4 h-4" /> <span className="hidden sm:inline">{t('problem_detail.hint')}</span>
            </button>
            <button
              onClick={() => handleAskAI('analysis')}
              disabled={isAskingAI}
              className="flex items-center gap-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors mr-2 whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" /> <span className="hidden sm:inline">{t('problem_detail.ask_ai')}</span>
            </button>
            <button
              onClick={handleRun}
              disabled={isRunning || isSubmitting}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border border-white/5 whitespace-nowrap"
            >
              {isRunning ? t('problem_detail.running') : (
                <>
                  <Play className="w-4 h-4" /> <span className="hidden sm:inline">{t('problem_detail.run')}</span>
                </>
              )}
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || isRunning || (problem.daily_limit && (problem.user_daily_submissions || 0) >= problem.daily_limit)}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20 whitespace-nowrap"
              title={problem.daily_limit && (problem.user_daily_submissions || 0) >= problem.daily_limit ? t('problem_detail.daily_limit_reached') : ''}
            >
              {isSubmitting ? t('problem_detail.judging') : (
                <>
                  <CheckCircle className="w-4 h-4" /> <span className="hidden sm:inline">{t('problem_detail.submit')}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme="vs-dark"
            onMount={handleEditorMount}
            onChange={(value) => setCode(value || '')}
            loading={<div className="text-neutral-400 p-4">{t('problem_detail.loading_editor')}</div>}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              lineHeight: 24,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 16, bottom: 16 },
              renderLineHighlight: 'all',
              smoothScrolling: true,
              cursorBlinking: 'smooth',
              wordWrap: 'on',
              formatOnPaste: true,
              formatOnType: true,
            }}
          />
        </div>

        {/* Custom Input / Output Section */}
        <div className="bg-neutral-900 border-t border-white/10">
          <div className="flex items-center px-4 py-2 border-b border-white/10">
            <button 
              onClick={() => setShowCustomInput(!showCustomInput)}
              className="text-sm text-neutral-400 hover:text-white flex items-center gap-2 transition-colors"
            >
              <span className={showCustomInput ? 'text-emerald-400' : ''}>{t('problem_detail.custom_input')}</span>
            </button>
          </div>
          
          {showCustomInput && (
            <div className="p-4 h-32">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={t('problem_detail.custom_input_placeholder')}
                className="w-full h-full bg-black/50 text-neutral-300 font-mono text-sm p-3 rounded-lg border border-white/10 outline-none focus:border-emerald-500/50 resize-none transition-colors"
              />
            </div>
          )}

          {runOutput && (
            <div className="p-4 border-t border-white/10 bg-black/30">
              <h4 className="text-xs font-medium text-neutral-500 uppercase mb-2 font-mono tracking-wider">{t('problem_detail.output')}</h4>
              <pre className="text-neutral-300 font-mono text-sm whitespace-pre-wrap">{runOutput}</pre>
            </div>
          )}
        </div>

        {verdict && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-white/10 bg-neutral-900"
          >
            <div className={`px-4 py-3 flex items-center justify-between border-b border-white/5 ${
              verdict === 'Accepted' ? 'bg-emerald-500/10' : 
              verdict === 'Compilation Error' ? 'bg-amber-500/10' :
              'bg-rose-500/10'
            }`}>
              <div className="flex items-center gap-2">
                {verdict === 'Accepted' ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                ) : verdict === 'Compilation Error' ? (
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className={`font-medium ${
                  verdict === 'Accepted' ? 'text-emerald-400' : 
                  verdict === 'Compilation Error' ? 'text-amber-400' :
                  'text-rose-400'
                }`}>
                  {verdict === 'Accepted' ? t('problem_detail.accepted') : 
                   verdict === 'Wrong Answer' ? t('problem_detail.wrong_answer') :
                   verdict === 'Compilation Error' ? t('problem_detail.compilation_error') :
                   verdict === 'Time Limit Exceeded' ? t('problem_detail.time_limit_exceeded') :
                   verdict === 'Runtime Error' ? t('problem_detail.runtime_error') :
                   verdict}
                </span>
              </div>
              <button 
                onClick={() => setVerdict(null)}
                className="text-neutral-500 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto custom-scrollbar">
              {verdict === 'Accepted' ? (
                <div className="space-y-4">
                  <div className="text-emerald-400/80 text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('problem_detail.perfect_solution')}</span>
                  </div>
                  {submissionDetails?.output && (
                    <div className="space-y-2">
                      <div className="text-neutral-400 text-xs uppercase tracking-wider font-medium">
                        {t('problem_detail.output')}
                      </div>
                      <pre className="font-mono text-sm text-neutral-300 bg-black/50 p-3 rounded-lg border border-white/10 whitespace-pre-wrap">
                        {submissionDetails.output}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-neutral-400 text-xs uppercase tracking-wider font-medium">
                    {verdict === 'Compilation Error' ? t('problem_detail.compilation_error_log') : t('problem_detail.execution_output')}
                  </div>
                  <pre className="font-mono text-sm text-neutral-300 bg-black/50 p-3 rounded-lg border border-white/10 whitespace-pre-wrap">
                    {submissionDetails?.output || t('problem_detail.no_output')}
                  </pre>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
