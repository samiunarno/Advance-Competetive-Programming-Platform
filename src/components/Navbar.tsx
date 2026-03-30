import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link } from 'react-router-dom';
import { Code2, LogOut, Plus, LayoutDashboard, History, Globe, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="bg-[#050505]/80 backdrop-blur-md border-b border-white/10 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-2 font-serif text-2xl tracking-tight text-white hover:text-neutral-300 transition-colors">
            XiaoXuan
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6 font-sans text-sm tracking-wide">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              title={t('nav.switch_language')}
            >
              <Globe className="w-4 h-4" />
              <span className="uppercase">{language}</span>
            </button>

            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  {t('nav.problems')}
                </Link>

                <Link 
                  to="/contests" 
                  className="text-neutral-400 hover:text-white transition-colors"
                >
                  Contests
                </Link>

                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    {t('nav.admin')}
                  </Link>
                )}

                <span className="text-neutral-500">
                  <Link to="/profile" className="text-white hover:underline">{user.username}</Link>
                </span>
                
                {user.role === 'admin' && (
                  <Link 
                    to="/admin/create" 
                    className="flex items-center gap-1 text-white hover:text-emerald-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </Link>
                )}

                <Link 
                  to="/submissions" 
                  className="text-neutral-400 hover:text-white transition-colors"
                  title={t('nav.my_submissions')}
                >
                  <History className="w-4 h-4" />
                </Link>

                <button 
                  onClick={logout}
                  className="text-neutral-400 hover:text-rose-400 transition-colors"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex gap-8 items-center">
                <Link to="/login" className="text-neutral-400 hover:text-white transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="text-white border border-white/20 px-6 py-2 rounded-full hover:bg-white hover:text-black transition-all">{t('auth.signup_link')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-neutral-400 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#050505] border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              <button
                onClick={() => { toggleLanguage(); closeMobileMenu(); }}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors"
              >
                <Globe className="w-4 h-4" />
                <span className="uppercase">{language === 'en' ? 'English' : '中文'}</span>
              </button>

              {user ? (
                <>
                  <Link 
                    to="/dashboard" 
                    onClick={closeMobileMenu}
                    className="text-lg text-neutral-300 hover:text-white"
                  >
                    {t('nav.problems')}
                  </Link>

                  <Link 
                    to="/contests" 
                    onClick={closeMobileMenu}
                    className="text-lg text-neutral-300 hover:text-white"
                  >
                    Contests
                  </Link>

                  {user.role === 'admin' && (
                    <Link 
                      to="/admin" 
                      onClick={closeMobileMenu}
                      className="text-lg text-emerald-400 hover:text-emerald-300"
                    >
                      {t('nav.admin')}
                    </Link>
                  )}

                  <Link 
                    to="/profile" 
                    onClick={closeMobileMenu}
                    className="text-lg text-neutral-300 hover:text-white"
                  >
                    {t('profile.title')} ({user.username})
                  </Link>
                  
                  {user.role === 'admin' && (
                    <Link 
                      to="/admin/create" 
                      onClick={closeMobileMenu}
                      className="text-lg text-neutral-300 hover:text-white flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" /> Create Problem
                    </Link>
                  )}

                  <Link 
                    to="/submissions" 
                    onClick={closeMobileMenu}
                    className="text-lg text-neutral-300 hover:text-white"
                  >
                    {t('nav.my_submissions')}
                  </Link>

                  <button 
                    onClick={() => { logout(); closeMobileMenu(); }}
                    className="text-lg text-rose-400 hover:text-rose-300 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.logout')}
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <Link 
                    to="/login" 
                    onClick={closeMobileMenu}
                    className="text-lg text-neutral-300 hover:text-white"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link 
                    to="/register" 
                    onClick={closeMobileMenu}
                    className="text-center bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
                  >
                    {t('auth.signup_link')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
