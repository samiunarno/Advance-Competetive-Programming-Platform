import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { Plus, Trash2, Edit2, Ban, CheckCircle, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';

interface User {
  _id: string;
  username: string;
  email: string;
  role: string;
  is_banned: boolean;
  total_submissions: number;
  created_at: string;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.users.getAll();
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        const res = await api.users.update(editingUser._id, {
          username: formData.username,
          email: formData.email,
          role: formData.role
        });
        if (res.ok) {
          toast.success('User updated successfully');
          fetchUsers();
          closeModal();
        } else {
          toast.error('Failed to update user');
        }
      } else {
        const res = await api.users.create(formData);
        if (res.ok) {
          toast.success('User created successfully');
          fetchUsers();
          closeModal();
        } else {
          const error = await res.json();
          toast.error(error.message || 'Failed to create user');
        }
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await api.users.delete(id);
      if (res.ok) {
        toast.success('User deleted successfully');
        setUsers(users.filter(u => u._id !== id));
      } else {
        toast.error('Failed to delete user');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const [banReason, setBanReason] = useState('');
  const [isBanModalOpen, setIsBanModalOpen] = useState(false);
  const [userToBan, setUserToBan] = useState<User | null>(null);

  const handleBanClick = (user: User) => {
    if (user.is_banned) {
      handleBanToggle(user);
    } else {
      setUserToBan(user);
      setBanReason('');
      setIsBanModalOpen(true);
    }
  };

  const confirmBan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToBan) return;
    try {
      const res = await api.users.ban(userToBan._id, banReason);
      if (res.ok) {
        toast.success('User banned successfully');
        fetchUsers();
        setIsBanModalOpen(false);
        setUserToBan(null);
      } else {
        toast.error('Failed to ban user');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const handleBanToggle = async (user: User) => {
    try {
      const res = await api.users.unban(user._id);
      if (res.ok) {
        toast.success('User unbanned successfully');
        fetchUsers();
      } else {
        toast.error('Action failed');
      }
    } catch (error) {
      toast.error('An error occurred');
    }
  };

  const openModal = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        email: user.email,
        password: '', // Password not editable directly here for security, usually separate flow or just reset
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'user'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(search.toLowerCase()) ||
    user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif text-white">User Management</h1>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
        <input 
          type="text" 
          placeholder="Search users..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
        />
      </div>

      <div className="bg-neutral-900/50 border border-white/5 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-neutral-400 font-mono text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submissions</th>
                <th className="px-6 py-4">Joined</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">Loading users...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-neutral-500">No users found</td></tr>
              ) : (
                filteredUsers.map(user => (
                  <tr 
                    key={user._id} 
                    className={`transition-colors border-b border-white/5 ${
                      user.is_banned 
                        ? 'bg-rose-900/20 hover:bg-rose-900/30 border-l-4 border-l-rose-500' 
                        : 'hover:bg-white/5 border-l-4 border-l-transparent'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-white flex items-center gap-2">
                          {user.username}
                          {user.is_banned && (
                            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 text-rose-400" title="Banned User">
                              <Ban className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-neutral-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === 'admin' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.is_banned ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}>
                        {user.is_banned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-neutral-300 font-mono">{user.total_submissions}</td>
                    <td className="px-6 py-4 text-neutral-500 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleBanClick(user)}
                          className={`p-2 rounded-lg transition-colors ${
                            user.is_banned 
                              ? 'text-emerald-400 hover:bg-emerald-500/10' 
                              : 'text-amber-400 hover:bg-amber-500/10'
                          }`}
                          title={user.is_banned ? 'Unban User' : 'Ban User'}
                        >
                          {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => openModal(user)}
                          className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                          title="Edit User"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(user._id)}
                          className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ban Reason Modal */}
      <AnimatePresence>
        {isBanModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-rose-500/30 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-white flex items-center gap-2">
                  <Ban className="w-5 h-5 text-rose-500" /> Ban User
                </h2>
                <button onClick={() => setIsBanModalOpen(false)} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={confirmBan} className="space-y-4">
                <p className="text-neutral-300">
                  Are you sure you want to ban <span className="font-bold text-white">{userToBan?.username}</span>?
                </p>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Reason for Ban</label>
                  <textarea 
                    required
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-rose-500/50 focus:outline-none"
                    rows={3}
                    placeholder="e.g. Violation of community guidelines..."
                  />
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={() => setIsBanModalOpen(false)}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Confirm Ban
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit/Create User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif text-white">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h2>
                <button onClick={closeModal} className="text-neutral-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOrUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Username</label>
                  <input 
                    type="text" 
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Email</label>
                  <input 
                    type="email" 
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-400 mb-1">Password</label>
                    <input 
                      type="password" 
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-neutral-400 mb-1">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2.5 text-white focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button" 
                    onClick={closeModal}
                    className="px-4 py-2 text-neutral-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
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
