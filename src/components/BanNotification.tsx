import { useAuth } from '../context/AuthContext';
import { AlertTriangle, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useEffect, useState } from 'react';

export default function BanNotification() {
  const { user } = useAuth();
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (user?.is_banned) {
      const interval = setInterval(() => {
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }, 5000); // Shake every 5 seconds to "disturb"
      return () => clearInterval(interval);
    }
  }, [user?.is_banned]);

  if (!user?.is_banned) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ 
          opacity: 1,
          x: shake ? [0, -10, 10, -10, 10, 0] : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-24 left-6 z-50 w-80"
      >
        <div className="bg-rose-600 text-white p-6 rounded-2xl shadow-[0_0_50px_rgba(225,29,72,0.6)] border-2 border-white/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Ban className="w-24 h-24" />
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-white/20 rounded-lg animate-pulse">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl font-serif">ACCESS DENIED</h3>
            </div>
            
            <div className="space-y-3">
              <p className="font-medium text-rose-100 leading-relaxed">
                Your account has been suspended. You cannot access any features.
              </p>
              
              <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                <p className="text-xs text-rose-200 uppercase tracking-wider font-bold mb-1">Reason</p>
                <p className="text-sm font-medium">{user.ban_reason || 'Violation of Terms of Service'}</p>
              </div>

              <p className="text-xs text-rose-200 italic">
                * Please contact support via the chat widget to appeal this decision.
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
