import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Leaf,
  Activity,
  Dumbbell,
  BarChart3,
  Utensils,
  Droplets,
  Moon,
  Flame,
  ArrowRight,
  Sparkles,
  Target,
  Plus,
  Scale,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Calendar,
  Users,
  BookOpen,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as trackerApi from '../api/trackerApi';
import * as analyticsApi from '../api/analyticsApi';
import * as profileApi from '../api/profileApi';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState(null);
  const [goalProgress, setGoalProgress] = useState(null);
  const [bmiData, setBmiData] = useState(null);
  const [insights, setInsights] = useState([]);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let active = true;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [dailyRes, goalRes, bmiRes, insightsRes] = await Promise.allSettled([
          trackerApi.getDailyLog(todayStr),
          analyticsApi.getGoalProgress(),
          profileApi.getBmi(),
          analyticsApi.getInsights(),
        ]);

        if (active) {
          if (dailyRes.status === 'fulfilled') setDailyLog(dailyRes.value);
          if (goalRes.status === 'fulfilled') setGoalProgress(goalRes.value);
          if (bmiRes.status === 'fulfilled') setBmiData(bmiRes.value);
          if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.insights || []);
        }
      } catch {
        // Silently tolerate if microservices are cold starting
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      active = false;
    };
  }, [todayStr]);

  const handleQuickWater = async () => {
    try {
      await trackerApi.createHydration({
        date: todayStr,
        amountMl: 250,
      });
      toast.success('Logged +250ml water! 💧');
      const updated = await trackerApi.getDailyLog(todayStr);
      setDailyLog(updated);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-forest-700 via-forest-800 to-forest-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-forest-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-mint-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 text-forest-200 text-xs font-semibold px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Welcome back, {user?.first || 'Friend'}! 👋
            </h1>
            <p className="text-forest-100/80 text-sm sm:text-base max-w-xl">
              Track your daily nourishment, log workouts, and watch your wellness journey unfold.
            </p>
          </div>

          {/* Streak pill */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-lg">
              <div className="w-10 h-10 rounded-xl bg-amber-500/30 flex items-center justify-center text-amber-300">
                <Flame className="w-6 h-6 fill-amber-400" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-forest-200 font-bold">
                  Daily Streak
                </p>
                <p className="text-xl font-black text-white">
                  {goalProgress?.currentStreakDays ?? 0} Days
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Floating Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mr-1">
          Quick Actions:
        </span>
        <button
          onClick={() => navigate('/tracker')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-forest-50 hover:text-forest-700 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <Dumbbell className="w-3.5 h-3.5 text-forest-600" />
          Log Workout
        </button>
        <button
          onClick={() => navigate('/tracker')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-amber-50 hover:text-amber-800 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <Utensils className="w-3.5 h-3.5 text-amber-600" />
          Log Meal
        </button>
        <button
          onClick={handleQuickWater}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-blue-50 hover:text-blue-700 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <Droplets className="w-3.5 h-3.5 text-blue-500" />
          +250ml Water
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-purple-50 hover:text-purple-700 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <Scale className="w-3.5 h-3.5 text-purple-600" />
          Update Weight & Metrics
        </button>
        <button
          onClick={() => navigate('/trainers')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-emerald-50 hover:text-emerald-800 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          Find Trainers
        </button>
        <button
          onClick={() => navigate('/community')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-forest-50 hover:text-forest-700 text-gray-700 font-semibold text-xs rounded-xl border border-gray-200/80 shadow-sm transition-all"
        >
          <BookOpen className="w-3.5 h-3.5 text-forest-600" />
          Community & Tips
        </button>
      </div>

      {/* Today's Pulse Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-forest-600" />
            Today&apos;s Snapshot
          </h2>
          <Link
            to="/tracker"
            className="text-xs font-bold text-forest-600 hover:text-forest-700 flex items-center gap-1"
          >
            Open Full Tracker <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Net Calories */}
          <div className="card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Net Calories
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {dailyLog ? Math.round(dailyLog.netCalories) : 0}{' '}
              <span className="text-xs font-normal text-gray-400">kcal</span>
            </p>
            <p className="text-xs text-gray-500 mt-2">
              +{dailyLog?.caloriesConsumed || 0} in • -{Math.round(dailyLog?.caloriesBurned || 0)}{' '}
              burned
            </p>
          </div>

          {/* Water Intake */}
          <div className="card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Hydration
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {dailyLog?.hydrationMl || 0}{' '}
              <span className="text-xs font-normal text-gray-400">/ 2000 ml</span>
            </p>
            <div className="w-full bg-blue-100 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.round(((dailyLog?.hydrationMl || 0) / 2000) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Sleep */}
          <div className="card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Sleep</span>
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {dailyLog ? dailyLog.sleepHours.toFixed(1) : '0.0'}{' '}
              <span className="text-xs font-normal text-gray-400">hours</span>
            </p>
            <p className="text-xs text-purple-600 font-medium mt-2">
              {dailyLog && dailyLog.sleepHours >= 7 ? '✨ Rested & Recovered' : '😴 Target 7-8 hrs'}
            </p>
          </div>

          {/* Active Workouts */}
          <div className="card p-5 group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Workouts
              </span>
              <div className="w-8 h-8 rounded-xl bg-forest-50 text-forest-600 flex items-center justify-center">
                <Dumbbell className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-gray-900">
              {dailyLog?.workouts?.length || 0}{' '}
              <span className="text-xs font-normal text-gray-400">sessions</span>
            </p>
            <p className="text-xs text-forest-600 font-medium mt-2">
              {dailyLog?.workouts?.reduce((s, w) => s + (w.durationMin || 0), 0) || 0} active
              minutes
            </p>
          </div>
        </div>
      </div>

      {/* Main 2-column features showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Module Launchpad (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-gray-900">WellNest Service Modules</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tracker Service */}
            <div
              onClick={() => navigate('/tracker')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-forest-50 text-forest-600 group-hover:scale-110 transition-transform">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Daily Tracker</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Log your workouts, balanced meals, hydration glasses, and sleep quality in one
                  streamlined dashboard.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-forest-600">
                <span>Open Tracker</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Analytics Service */}
            <div
              onClick={() => navigate('/analytics')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-purple-50 text-purple-600 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Wellness Analytics</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Discover weekly calorie balances, goal progress streaks, and smart automated
                  insights tailored to you.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-purple-600">
                <span>View Analytics</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Profile Service */}
            <div
              onClick={() => navigate('/profile')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Fitness Profile & BMI</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Manage your height, weight, custom avatars, target goals, and receive instant BMI
                  evaluations.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-blue-600">
                <span>Edit Profile</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Nutrition & Habits */}
            <div
              onClick={() => navigate('/tracker')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
                  <Utensils className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Nutrition & Macros</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Track protein, carbs, and fat distributions for breakfast, lunch, dinner, and
                  healthy snacks.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-amber-600">
                <span>Log Meal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Personal Trainers & Coaches */}
            <div
              onClick={() => navigate('/trainers')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">Personal Coaches & Trainers</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Explore recommended trainers matching your target goal, send booking requests, and
                    receive customized workout routines and nutrition guidelines.
                  </p>
                </div>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>Find Trainers</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Community & Wellness Hub */}
            <div
              onClick={() => navigate('/community')}
              className="card p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border border-gray-100 flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-forest-50 text-forest-600 group-hover:scale-110 transition-transform mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-1">Community & Wellness Hub</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Browse evidence-based fitness guides, nutrition tips, daily wellness habits, and join
                  the discussion.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-forest-600">
                <span>Explore Community</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smart Insights & Goal Overview */}
        <div className="space-y-6">
          {/* Smart Insights preview */}
          <div className="card p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-forest-600" />
                Smart Insights
              </h3>
              <Link
                to="/analytics"
                className="text-[11px] font-bold text-forest-600 hover:underline"
              >
                View all
              </Link>
            </div>

            {insights.length === 0 ? (
              <p className="text-xs text-gray-400 py-3">
                No active health alerts. Keep logging your daily wellness to unlock personalized
                insights!
              </p>
            ) : (
              <div className="space-y-3">
                {insights.slice(0, 3).map((ins, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border text-xs leading-relaxed ${
                      ins.severity === 'WARNING'
                        ? 'border-amber-200 bg-amber-50/50 text-amber-900'
                        : 'border-blue-200 bg-blue-50/50 text-blue-900'
                    }`}
                  >
                    <span className="font-bold uppercase text-[10px] block mb-0.5">
                      {ins.severity}
                    </span>
                    {ins.message}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Goal & BMI Card */}
          <div className="card p-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
              <Target className="w-4 h-4 text-forest-600" />
              Goal Summary
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Current BMI</span>
                <span className="font-bold text-gray-800">
                  {bmiData?.bmi ? `${bmiData.bmi.toFixed(1)} (${bmiData.category})` : '—'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Target Goal</span>
                <span className="font-bold text-forest-700">
                  {goalProgress?.fitnessGoal
                    ? goalProgress.fitnessGoal.replace(/_/g, ' ')
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Progress</span>
                <span className="font-bold text-gray-800">
                  {goalProgress?.progressPercent != null
                    ? `${Math.round(goalProgress.progressPercent)}%`
                    : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
