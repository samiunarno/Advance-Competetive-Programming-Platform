/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import CreateProblem from './pages/CreateProblem';
import ProblemDetail from './pages/ProblemDetail';
import Submissions from './pages/Submissions';
import Contests from './pages/Contests';
import ContestDetail from './pages/ContestDetail';
import Login from './pages/Login';
import Register from './pages/Register';

import LandingPage from './pages/LandingPage';

import AdminLayout from './pages/admin/AdminLayout';
import UserManagement from './pages/admin/UserManagement';
import ProblemManagement from './pages/admin/ProblemManagement';
import ContestManagement from './pages/admin/ContestManagement';
import CreateContest from './pages/admin/CreateContest';
import AdminInbox from './pages/admin/AdminInbox';
import TagManagement from './pages/admin/TagManagement';

import Profile from './pages/Profile';

import SupportChat from './components/SupportChat';
import AIChatAssistant from './components/AIChatAssistant';
import BanNotification from './components/BanNotification';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">{t('app.loading')}</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">{t('app.loading')}</div>;
  if (!user || user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans relative">
      {/* Global Ban Overlay - Blocks interaction with everything except high z-index elements */}
      {user?.is_banned && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px] cursor-not-allowed flex items-center justify-center">
          <div className="text-center opacity-50 pointer-events-none select-none">
            <h1 className="text-9xl font-black text-rose-900/20 tracking-widest uppercase">BANNED</h1>
          </div>
        </div>
      )}

      <Navbar />
      <BanNotification />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* User Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/contests" element={<ProtectedRoute><Contests /></ProtectedRoute>} />
        <Route path="/contest/:id" element={<ProtectedRoute><ContestDetail /></ProtectedRoute>} />
        <Route path="/problem/:id" element={<ProtectedRoute><ProblemDetail /></ProtectedRoute>} />
        <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/users" replace />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="problems" element={<ProblemManagement />} />
          <Route path="create" element={<CreateProblem />} />
          <Route path="edit/:id" element={<CreateProblem />} />
          <Route path="contests" element={<ContestManagement />} />
          <Route path="contests/create" element={<CreateContest />} />
          <Route path="contests/edit/:id" element={<CreateContest />} />
          <Route path="inbox" element={<AdminInbox />} />
          <Route path="tags" element={<TagManagement />} />
        </Route>
      </Routes>
      <SupportChat />
      <AIChatAssistant />
      <Toaster position="bottom-right" toastOptions={{
        style: {
          background: '#1e293b',
          color: '#fff',
          border: '1px solid #334155',
        },
      }} />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

