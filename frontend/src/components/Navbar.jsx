import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Leaf,
  LayoutDashboard,
  Activity,
  BarChart3,
  User,
  Users,
  BookOpen,
  LogOut,
  Menu,
  X,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { fetchAvatarBlobUrl } from '../api/profileApi';

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const { unreadCount } = useChat();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    let active = true;
    const loadAvatar = async () => {
      try {
        const url = await fetchAvatarBlobUrl();
        if (active && url) {
          setAvatarUrl(url);
        }
      } catch {
        // Fallback to initials
      }
    };
    loadAvatar();
    return () => {
      active = false;
    };
  }, [user]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout completed');
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const isTrainer = user?.role === 'TRAINER';

  const navLinks = isTrainer
    ? [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat', label: 'Chat', icon: MessageSquare, badge: unreadCount },
        { to: '/community', label: 'Community', icon: BookOpen },
        { to: '/profile', label: 'Profile', icon: User },
      ]
    : [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/chat', label: 'Chat', icon: MessageSquare, badge: unreadCount },
        { to: '/tracker', label: 'Tracker', icon: Activity },
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/trainers', label: 'Trainers', icon: Users },
        { to: '/community', label: 'Community', icon: BookOpen },
        { to: '/profile', label: 'Profile', icon: User },
      ];

  const initials = `${user?.first?.[0] || 'U'}${user?.last?.[0] || ''}`.toUpperCase();

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <NavLink to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-forest-700 to-forest-500 rounded-xl flex items-center justify-center shadow-md shadow-forest-500/20 group-hover:scale-105 transition-transform duration-200">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-forest-900 tracking-tight leading-tight">
                Well<span className="text-forest-600">Nest</span>
              </span>
              <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400">
                {isTrainer ? 'Trainer Portal' : 'Health & Wellness'}
              </span>
            </div>
          </NavLink>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-gray-50/80 p-1.5 rounded-2xl border border-gray-200/60">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-forest-700 shadow-sm border border-gray-200/50'
                        : 'text-gray-600 hover:text-forest-700 hover:bg-white/50'
                    }`
                  }
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {Boolean(link.badge && link.badge > 0) && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[11px] font-extrabold rounded-full bg-forest-600 text-white shadow-sm ring-2 ring-white animate-pulse">
                      {link.badge > 99 ? '99+' : link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* User profile & logout */}
          <div className="hidden md:flex items-center gap-3">
            <NavLink
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full hover:bg-forest-50/80 border border-transparent hover:border-forest-200 transition-all duration-200"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-forest-500/30"
                />
              ) : (
                <div className={`w-8 h-8 rounded-full font-bold text-xs flex items-center justify-center ring-2 ${
                  isTrainer
                    ? 'bg-emerald-100 text-emerald-800 ring-emerald-500/30'
                    : 'bg-forest-100 text-forest-700 ring-forest-500/20'
                }`}>
                  {initials}
                </div>
              )}
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-gray-800 leading-tight">
                    {user?.first} {user?.last}
                  </p>
                  {isTrainer && (
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-md">
                      Trainer
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-400 truncate max-w-[120px]">
                  {user?.username}
                </p>
              </div>
            </NavLink>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              title="Log out"
              className="flex items-center justify-center w-9 h-9 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-forest-600 hover:bg-forest-50 rounded-xl transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/95 px-4 pt-3 pb-5 space-y-2 animate-fade-in shadow-xl">
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-forest-50/60 mb-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-10 h-10 rounded-full object-cover ring-2 ring-forest-500"
              />
            ) : (
              <div className={`w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center ${
                isTrainer ? 'bg-emerald-200 text-emerald-800' : 'bg-forest-200 text-forest-800'
              }`}>
                {initials}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-gray-800">
                  {user?.first} {user?.last}
                </p>
                {isTrainer && (
                  <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                    Trainer
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{user?.username}</p>
            </div>
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all ${
                    isActive
                      ? 'bg-forest-600 text-white font-semibold shadow-md shadow-forest-600/20'
                      : 'text-gray-600 hover:text-forest-700 hover:bg-forest-50'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5" />
                  <span>{link.label}</span>
                </div>
                {Boolean(link.badge && link.badge > 0) && (
                  <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-forest-600 text-white">
                    {link.badge > 99 ? '99+' : link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}

          <button
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            disabled={loggingOut}
            className="w-full mt-2 flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors text-left"
          >
            {loggingOut ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
