import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Flame,
  Award,
  AlertTriangle,
  Info,
  Calendar,
  Droplets,
  Moon,
  Dumbbell,
  CheckCircle2,
  Loader2,
  Sparkles,
  ArrowRight,
  Target,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as analyticsApi from '../api/analyticsApi';
import {
  CaloriesChart,
  WorkoutChart,
  WaterAndSleepCharts,
  MyGoalsCards,
} from '../components/AnalyticsCharts';

const getISODate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [goalCards, setGoalCards] = useState(null);
  const [goalProgress, setGoalProgress] = useState(null);
  const [insights, setInsights] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState(null);

  const fetchAnalytics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const to = getISODate(0);
    const from = getISODate(6); // 7 days: today minus 6 days

    try {
      const [cardsRes, goalRes, insightsRes, trendsRes] = await Promise.allSettled([
        analyticsApi.getGoalCards(),
        analyticsApi.getGoalProgress(),
        analyticsApi.getInsights(),
        analyticsApi.getWeeklyTrends(from, to),
      ]);

      if (cardsRes.status === 'fulfilled') setGoalCards(cardsRes.value);
      if (goalRes.status === 'fulfilled') setGoalProgress(goalRes.value);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.insights || []);
      if (trendsRes.status === 'fulfilled') setWeeklyTrends(trendsRes.value);
    } catch {
      toast.error('Failed to load analytics telemetry');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Goal Achieved! 🎉', color: 'bg-emerald-100 text-emerald-800' };
      case 'IN_PROGRESS':
        return { label: 'In Progress 🚀', color: 'bg-forest-100 text-forest-800' };
      case 'NO_TARGET':
        return { label: 'Target Not Set', color: 'bg-amber-100 text-amber-800' };
      default:
        return { label: 'Setup Profile', color: 'bg-gray-100 text-gray-700' };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Generating your wellness analytics & graphs...</p>
      </div>
    );
  }

  const trendDays = weeklyTrends?.days || [];
  const statusInfo = getStatusBadge(goalProgress?.status);

  // Targets from goalCards
  const waterTargetL = goalCards?.water?.targetLitres || 3.0;
  const sleepTargetH = goalCards?.sleep?.targetHours || 8.0;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* ── 1. TOP HEADER & TIMEFRAME SWITCHER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200/80 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            Wellness Analytics & Health Telemetry
          </h1>
          <p className="text-sm text-gray-500">
            Real-time tracking of workouts, nutrition balance, hydration streaks, and recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 text-xs font-extrabold shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-forest-600" />
            Last 7 Days
          </div>

          <button
            onClick={() => fetchAnalytics(7, true)}
            disabled={refreshing}
            title="Refresh data"
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-forest-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── 2. MY GOALS SECTION (IMAGE 2) ── */}
      <MyGoalsCards goals={goalCards} />

      {/* ── 3. WEIGHT & FITNESS GOAL HERO BANNER ── */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 text-white rounded-3xl relative overflow-hidden shadow-xl border border-forest-700">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-600/60 backdrop-blur-md flex items-center justify-center text-white ring-2 ring-white/20">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-forest-300 uppercase tracking-wider">
                  Weight & Transformation Journey
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold">
                  {goalProgress?.fitnessGoal
                    ? goalProgress.fitnessGoal.replace(/_/g, ' ')
                    : 'Personal Fitness Journey'}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-extrabold">
                <Flame className="w-4 h-4 fill-amber-400" />
                <span>{goalProgress?.currentStreakDays || 0} Day Streak</span>
              </div>
            </div>
          </div>

          {/* Goal Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Starting Weight</span>
              <p className="text-2xl font-bold mt-1">
                {goalProgress?.startWeightKg ? `${goalProgress.startWeightKg} kg` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Current Weight</span>
              <p className="text-2xl font-bold mt-1 text-emerald-300">
                {goalProgress?.currentWeightKg ? `${goalProgress.currentWeightKg} kg` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Target Goal</span>
              <p className="text-2xl font-bold mt-1 text-teal-300">
                {goalProgress?.targetWeightKg ? `${goalProgress.targetWeightKg} kg` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Remaining</span>
              <p className="text-2xl font-bold mt-1 text-amber-300">
                {goalProgress?.remainingKg !== null && goalProgress?.remainingKg !== undefined
                  ? `${Math.abs(goalProgress.remainingKg)} kg`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. SMART INSIGHTS ALERTS ── */}
      {insights.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-600" />
            <h3 className="text-base font-extrabold text-gray-900">Personalized Coaching Observations</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {insights.map((ins, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
                  ins.severity === 'WARNING'
                    ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                }`}
              >
                {ins.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-bold">{ins.message}</p>
                  {ins.matchedDays && ins.windowDays && (
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Triggered on {ins.matchedDays} of last {ins.windowDays} days
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. GRAPHS AT THE LAST OF THE PAGE (IMAGE 1) ── */}
      <div className="space-y-6 pt-2">
        <div className="flex items-center gap-2 border-t border-gray-200 pt-6">
          <BarChart3 className="w-5 h-5 text-forest-700" />
          <h2 className="text-xl font-black text-gray-900">Detailed Activity & Telemetry Graphs</h2>
        </div>

        {/* Graph 1: Calories consumed vs burned */}
        <CaloriesChart days={trendDays} />

        {/* Graph 2: Workout frequency and duration */}
        <WorkoutChart days={trendDays} />

        {/* Graph 3: Water intake and sleep tracking (Side-by-side with threshold highlights) */}
        <WaterAndSleepCharts
          days={trendDays}
          waterGoalL={waterTargetL}
          sleepGoalH={sleepTargetH}
        />
      </div>
    </div>
  );
};

export default Analytics;
