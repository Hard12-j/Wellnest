import { useNavigate } from 'react-router-dom';
import {
  Leaf,
  LogOut,
  User,
  Mail,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Activity,
  Dumbbell,
  BarChart3,
  Heart,
  Utensils,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logoutUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch {
      toast.error('Logout failed. Please try again.');
      // Still navigate away — don't leave user in a misleading state
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const upcomingSections = [
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Fitness Profile',
      description: 'Set your goals, body metrics, and fitness preferences',
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: <Dumbbell className="w-6 h-6" />,
      title: 'Workouts',
      description: 'Personalized workout plans and exercise tracking',
      color: 'bg-blue-50 text-blue-600',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      description: 'Detailed insights and progress tracking dashboards',
      color: 'bg-purple-50 text-purple-600',
    },
    {
      icon: <Heart className="w-6 h-6" />,
      title: 'Health Monitoring',
      description: 'Track heart rate, sleep patterns, and vital signs',
      color: 'bg-rose-50 text-rose-600',
    },
    {
      icon: <Utensils className="w-6 h-6" />,
      title: 'Nutrition',
      description: 'Meal planning, calorie tracking, and dietary goals',
      color: 'bg-amber-50 text-amber-600',
    },
  ];

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-forest-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-forest-800 tracking-tight">WellNest</span>
            </div>

            {/* User area */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <div className="w-8 h-8 bg-forest-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-forest-600" />
                </div>
                <span className="font-medium text-gray-800">
                  {user?.first} {user?.last}
                </span>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 disabled:opacity-50"
              >
                {loggingOut ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {/* Welcome card */}
        <div className="bg-gradient-to-br from-forest-600 via-forest-700 to-forest-800 rounded-3xl p-8 sm:p-10 text-white mb-8 relative overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white/5 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 text-forest-200 text-sm font-medium mb-2">
              <Leaf className="w-4 h-4" />
              Welcome to WellNest
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2">
              Hello, {user?.first || 'there'}! 👋
            </h1>
            <p className="text-forest-100/80 text-lg max-w-xl">
              Your wellness dashboard is ready. Start building healthier habits today.
            </p>
          </div>
        </div>

        {/* User info cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <InfoCard
            icon={<User className="w-5 h-5" />}
            label="Full Name"
            value={`${user?.first || '—'} ${user?.last || ''}`}
            color="text-forest-600 bg-forest-50"
          />
          <InfoCard
            icon={<Mail className="w-5 h-5" />}
            label="Email"
            value={user?.username || '—'}
            color="text-blue-600 bg-blue-50"
          />
          <InfoCard
            icon={<Shield className="w-5 h-5" />}
            label="Role"
            value={user?.role || '—'}
            color="text-purple-600 bg-purple-50"
          />
          <InfoCard
            icon={
              user?.verifiedUser ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <ShieldAlert className="w-5 h-5" />
              )
            }
            label="Status"
            value={user?.verifiedUser ? 'Verified' : 'Unverified'}
            color={user?.verifiedUser ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}
          />
        </div>

        {/* Coming soon sections */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Coming Soon</h2>
            <p className="text-sm text-gray-500">
              Exciting features are on the way. Here&apos;s a sneak peek at what&apos;s next.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingSections.map((section) => (
              <div
                key={section.title}
                className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-default"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${section.color} transition-transform duration-300 group-hover:scale-110`}
                >
                  {section.icon}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{section.title}</h3>
                <p className="text-sm text-gray-500">{section.description}</p>
                <div className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                  🔒 Coming soon
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

const InfoCard = ({ icon, label, value, color }) => (
  <div className="card p-5">
    <div className="flex items-center gap-3 mb-2">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">{label}</span>
    </div>
    <p className="text-sm font-semibold text-gray-800 truncate" title={value}>
      {value}
    </p>
  </div>
);

export default Dashboard;
