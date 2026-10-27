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
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as analyticsApi from '../api/analyticsApi';

const getISODate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(7); // 7, 14, 30

  const [goalProgress, setGoalProgress] = useState(null);
  const [insights, setInsights] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState(null);
  const [calorieBalance, setCalorieBalance] = useState(null);

  const fetchAnalytics = useCallback(async (days) => {
    setLoading(true);
    const to = getISODate(0);
    const from = getISODate(days - 1);

    try {
      const [goalRes, insightsRes, trendsRes, balanceRes] = await Promise.allSettled([
        analyticsApi.getGoalProgress(),
        analyticsApi.getInsights(),
        analyticsApi.getWeeklyTrends(from, to),
        analyticsApi.getCaloriesBalance(from, to),
      ]);

      if (goalRes.status === 'fulfilled') setGoalProgress(goalRes.value);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.insights || []);
      if (trendsRes.status === 'fulfilled') setWeeklyTrends(trendsRes.value);
      if (balanceRes.status === 'fulfilled') setCalorieBalance(balanceRes.value);
    } catch {
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(rangeDays);
  }, [rangeDays, fetchAnalytics]);

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
        <p className="text-sm font-medium text-gray-500">Generating your wellness analytics...</p>
      </div>
    );
  }

  const trendDays = weeklyTrends?.days || [];
  const statusInfo = getStatusBadge(goalProgress?.status);

  // Find max values for visual scaling
  const maxCalories = Math.max(
    ...trendDays.map((d) => Math.max(d.caloriesConsumed || 0, d.caloriesBurned || 0)),
    2000
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Goal Progress Hero Banner */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 text-white rounded-3xl relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-forest-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-600/60 backdrop-blur-md flex items-center justify-center text-white ring-2 ring-white/20">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-semibold text-forest-300 uppercase tracking-wider">
                  Goal Tracking
                </span>
                <h1 className="text-xl sm:text-2xl font-extrabold">
                  {goalProgress?.fitnessGoal
                    ? goalProgress.fitnessGoal.replace(/_/g, ' ')
                    : 'Personal Fitness Journey'}
                </h1>
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
              <p className="text-2xl font-bold mt-1">
                {goalProgress?.currentWeightKg ? `${goalProgress.currentWeightKg} kg` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Target Goal</span>
              <p className="text-2xl font-bold mt-1">
                {goalProgress?.targetWeightKg ? `${goalProgress.targetWeightKg} kg` : '—'}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10">
              <span className="text-xs text-forest-200">Last 7 Days Logged</span>
              <p className="text-2xl font-bold mt-1 text-mint-300">
                {goalProgress?.daysLoggedLast7 ?? 0} / 7 days
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {goalProgress?.progressPercent != null && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-forest-200">
                <span>Progress towards target</span>
                <span className="font-bold text-mint-300">
                  {Math.round(goalProgress.progressPercent)}%
                </span>
              </div>
              <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5">
                <div
                  className="bg-gradient-to-r from-mint-400 to-forest-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, Math.max(0, goalProgress.progressPercent))}%` }}
                />
              </div>
              {goalProgress.remainingKg != null && (
                <p className="text-xs text-forest-300 text-right">
                  {Math.abs(goalProgress.remainingKg).toFixed(1)} kg remaining
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Smart Rule-Based Insights Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-forest-600" />
              Smart Wellness Insights
            </h2>
            <p className="text-xs text-gray-500">
              AI & rule-based recommendations automatically generated from your log patterns.
            </p>
          </div>
        </div>

        {insights.length === 0 ? (
          <div className="card p-6 bg-gradient-to-r from-forest-50/50 to-mint-50/50 border border-forest-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-forest-900">Great job! Everything looks balanced.</h4>
              <p className="text-xs text-forest-700 mt-0.5">
                No hydration, sleep deficits, or calorie surplus warnings detected in your recent logs.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.map((ins, index) => {
              const isWarning = ins.severity === 'WARNING';
              return (
                <div
                  key={index}
                  className={`card p-5 border flex items-start gap-4 transition-all ${
                    isWarning
                      ? 'border-amber-200 bg-amber-50/40'
                      : 'border-blue-200 bg-blue-50/40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isWarning
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {isWarning ? (
                      <AlertTriangle className="w-5 h-5" />
                    ) : (
                      <Info className="w-5 h-5" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isWarning
                            ? 'bg-amber-200/60 text-amber-800'
                            : 'bg-blue-200/60 text-blue-800'
                        }`}
                      >
                        {ins.severity}
                      </span>
                      {ins.matchedDays > 0 && ins.windowDays > 0 && (
                        <span className="text-xs text-gray-500 font-medium">
                          {ins.matchedDays} of {ins.windowDays} days
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-800 leading-relaxed">
                      {ins.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Date Range Selector & Charts Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-forest-600" />
            Activity & Intake Trends
          </h2>
          <p className="text-xs text-gray-500">
            Compare calorie intake vs burned, sleep duration, and hydration.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
          {[
            { days: 7, label: '7 Days' },
            { days: 14, label: '14 Days' },
            { days: 30, label: '30 Days' },
          ].map((r) => (
            <button
              key={r.days}
              onClick={() => setRangeDays(r.days)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                rangeDays === r.days
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Daily Visual Bars: Calories Intake vs Burned */}
      <div className="card p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-3">
          <h3 className="text-sm font-bold text-gray-800">Calorie Dynamics (In vs Burned)</h3>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-amber-500" />
              <span className="text-gray-600">Consumed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-md bg-forest-600" />
              <span className="text-gray-600">Burned</span>
            </div>
          </div>
        </div>

        {trendDays.length === 0 ? (
          <p className="text-xs text-gray-400 py-8 text-center">No log points found for this range.</p>
        ) : (
          <div className="space-y-4">
            {trendDays.map((d) => {
              const dateLabel = new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'numeric',
                day: 'numeric',
              });
              const consumedPct = Math.min(100, (d.caloriesConsumed / maxCalories) * 100);
              const burnedPct = Math.min(100, (d.caloriesBurned / maxCalories) * 100);

              return (
                <div key={d.date} className="space-y-1.5">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">{dateLabel}</span>
                    <span className="text-[11px]">
                      +{Math.round(d.caloriesConsumed)} kcal / -{Math.round(d.caloriesBurned)} kcal (
                      <span
                        className={
                          d.netCalories > 0
                            ? 'text-amber-600 font-bold'
                            : 'text-forest-600 font-bold'
                        }
                      >
                        Net: {Math.round(d.netCalories)}
                      </span>
                      )
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 h-3.5 bg-gray-100 rounded-lg p-0.5">
                    {/* Consumed bar */}
                    <div className="w-full flex justify-end">
                      <div
                        className="h-full bg-amber-400 rounded-md transition-all duration-500"
                        style={{ width: `${consumedPct}%` }}
                        title={`${d.caloriesConsumed} kcal eaten`}
                      />
                    </div>
                    {/* Burned bar */}
                    <div className="w-full flex justify-start">
                      <div
                        className="h-full bg-forest-600 rounded-md transition-all duration-500"
                        style={{ width: `${burnedPct}%` }}
                        title={`${d.caloriesBurned} kcal burned`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid of Micro Charts: Hydration & Sleep */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Hydration Trends */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Daily Water Intake
            </h3>
            <span className="text-xs text-blue-600 font-semibold">2,000 ml target</span>
          </div>

          <div className="space-y-3">
            {trendDays.slice(-7).map((d) => {
              const dateLabel = new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
              });
              const pct = Math.min(100, Math.round((d.waterMl / 2000) * 100));

              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-gray-500 font-semibold">{dateLabel}</span>
                  <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.waterMl >= 2000 ? 'bg-blue-500' : 'bg-blue-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-bold text-gray-700">{d.waterMl} ml</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sleep Trends */}
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <Moon className="w-4 h-4 text-purple-600" />
              Daily Sleep Duration
            </h3>
            <span className="text-xs text-purple-600 font-semibold">7.0+ hrs ideal</span>
          </div>

          <div className="space-y-3">
            {trendDays.slice(-7).map((d) => {
              const dateLabel = new Date(`${d.date}T00:00:00`).toLocaleDateString('en-US', {
                weekday: 'short',
              });
              const pct = Math.min(100, Math.round((d.sleepHours / 10) * 100));

              return (
                <div key={d.date} className="flex items-center gap-3 text-xs">
                  <span className="w-10 text-gray-500 font-semibold">{dateLabel}</span>
                  <div className="flex-1 bg-gray-100 h-3 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        d.sleepHours >= 7 ? 'bg-purple-600' : 'bg-purple-300'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-14 text-right font-bold text-gray-700">
                    {d.sleepHours.toFixed(1)} hrs
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calorie Balance Summary */}
      {calorieBalance && (
        <div className="card p-6 bg-gradient-to-r from-forest-50/60 to-mint-50/60 border border-forest-100">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-forest-900">Total Balance for Period</h3>
              <p className="text-xs text-forest-700">
                {calorieBalance.from} to {calorieBalance.to}
              </p>
            </div>

            <div className="flex items-center gap-6 text-center">
              <div>
                <span className="text-xs text-gray-500 font-medium">Total Consumed</span>
                <p className="text-lg font-extrabold text-amber-600">
                  {Math.round(calorieBalance.totalConsumed)} kcal
                </p>
              </div>
              <div className="h-8 w-px bg-forest-200" />
              <div>
                <span className="text-xs text-gray-500 font-medium">Total Burned</span>
                <p className="text-lg font-extrabold text-forest-700">
                  {Math.round(calorieBalance.totalBurned)} kcal
                </p>
              </div>
              <div className="h-8 w-px bg-forest-200" />
              <div>
                <span className="text-xs text-gray-500 font-medium">Net Calories</span>
                <p
                  className={`text-lg font-extrabold ${
                    calorieBalance.totalNet > 0 ? 'text-amber-700' : 'text-forest-800'
                  }`}
                >
                  {Math.round(calorieBalance.totalNet)} kcal
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
