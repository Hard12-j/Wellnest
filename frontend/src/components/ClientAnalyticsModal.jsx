import { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
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
  X,
  Plus,
  RefreshCw,
  Clock,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as analyticsApi from '../api/analyticsApi';
import {
  CaloriesChart,
  WorkoutChart,
  WaterAndSleepCharts,
  MyGoalsCards,
} from '../components/AnalyticsCharts';
import AssignGoalModal from './AssignGoalModal';

const getISODate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

export default function ClientAnalyticsModal({ client, onClose, onAssignPlan }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [goalCards, setGoalCards] = useState(null);
  const [goalProgress, setGoalProgress] = useState(null);
  const [insights, setInsights] = useState([]);
  const [weeklyTrends, setWeeklyTrends] = useState(null);

  // Assign Goals Drawer/Modal State
  const [isAssignGoalOpen, setIsAssignGoalOpen] = useState(false);

  const clientId = client?.userId;

  const fetchClientAnalytics = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    const to = getISODate(0);
    const from = getISODate(6); // 7 days: today minus 6 days

    try {
      const [cardsRes, goalRes, insightsRes, trendsRes] = await Promise.allSettled([
        analyticsApi.getClientGoalCards(clientId),
        analyticsApi.getClientGoalProgress(clientId),
        analyticsApi.getClientInsights(clientId),
        analyticsApi.getClientWeeklyTrends(clientId, from, to),
      ]);

      if (cardsRes.status === 'fulfilled') setGoalCards(cardsRes.value);
      if (goalRes.status === 'fulfilled') setGoalProgress(goalRes.value);
      if (insightsRes.status === 'fulfilled') setInsights(insightsRes.value?.insights || []);
      if (trendsRes.status === 'fulfilled') setWeeklyTrends(trendsRes.value);
    } catch {
      toast.error(`Failed to load analytics for Client #${clientId}`);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchClientAnalytics();
  }, [fetchClientAnalytics]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACHIEVED':
        return { label: 'Goal Achieved! 🎉', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      case 'IN_PROGRESS':
        return { label: 'In Progress 🚀', color: 'bg-forest-100 text-forest-800 border-forest-300' };
      case 'NO_TARGET':
        return { label: 'Target Not Set', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      default:
        return { label: 'Profile Incomplete', color: 'bg-gray-100 text-gray-700 border-gray-300' };
    }
  };

  const trendDays = weeklyTrends?.days || [];
  const statusInfo = getStatusBadge(goalProgress?.status);

  // Targets from goalCards
  const waterTargetL = goalCards?.water?.targetLitres || 3.0;
  const sleepTargetH = goalCards?.sleep?.targetHours || 6.0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 relative my-6 max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm">
                Client #{clientId}
              </span>
              <span className="text-xs font-bold text-gray-500">
                Primary Goal: <strong className="text-gray-800">{client?.fitnessGoal || 'General Fitness'}</strong>
              </span>
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              Client Health & Activity Analytics
            </h2>
            <p className="text-xs text-gray-500">
              Assigned goals, real-time activity graphs, and coaching observations.
            </p>
          </div>

          {/* Action Buttons & Range Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAssignGoalOpen(true)}
              className="px-3.5 py-2 bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-forest-600" />
              Assign Goals
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 border border-forest-200 text-forest-800 text-xs font-extrabold shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-forest-600" />
              Last 7 Days
            </div>

            <button
              onClick={() => fetchClientAnalytics()}
              disabled={loading}
              title="Refresh Analytics"
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-forest-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-gray-500">Retrieving client analytics & telemetry...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* ── 1. MY GOALS SECTION (IMAGE 2) ── */}
            <MyGoalsCards goals={goalCards} />

            {/* ── 2. GOAL PROGRESS & STREAK HERO CARD ── */}
            <div className="p-6 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-white rounded-3xl relative overflow-hidden shadow-lg border border-forest-700">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {goalProgress?.streakDays > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-amber-400" />
                        {goalProgress.streakDays}-Day Logging Streak
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-emerald-200">
                    Target: {goalProgress?.goal || client?.fitnessGoal || 'Overall Wellness'}
                  </h3>

                  {/* Weight Progress Stats */}
                  <div className="grid grid-cols-3 gap-4 pt-2 max-w-md">
                    <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 text-center">
                      <span className="text-[10px] text-forest-200 uppercase font-bold block">Start</span>
                      <span className="text-sm font-black">{goalProgress?.startWeightKg ? `${goalProgress.startWeightKg} kg` : '—'}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 text-center">
                      <span className="text-[10px] text-forest-200 uppercase font-bold block">Current</span>
                      <span className="text-sm font-black text-emerald-300">{goalProgress?.currentWeightKg ? `${goalProgress.currentWeightKg} kg` : '—'}</span>
                    </div>
                    <div className="bg-white/10 rounded-xl p-2.5 backdrop-blur-sm border border-white/10 text-center">
                      <span className="text-[10px] text-forest-200 uppercase font-bold block">Goal</span>
                      <span className="text-sm font-black text-teal-300">{goalProgress?.targetWeightKg ? `${goalProgress.targetWeightKg} kg` : '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-2xl p-4 border border-white/15 text-center min-w-[150px] flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-emerald-300">
                    {Math.round(goalProgress?.progressPct || 0)}%
                  </span>
                  <span className="text-xs text-forest-200 mt-0.5">Goal Achieved</span>
                  {goalProgress?.remainingKg !== null && goalProgress?.remainingKg !== undefined && (
                    <span className="text-[11px] text-amber-300 font-semibold mt-1">
                      {Math.abs(goalProgress.remainingKg).toFixed(1)} kg to target
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── 3. SMART COACHING ALERTS / INSIGHTS ── */}
            <div className="space-y-3">
              <h4 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Coaching Telemetry & Flags
              </h4>

              {insights.length === 0 ? (
                <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-800 font-medium">
                    No critical health alerts for this client in the past 7 days. Consistency is healthy!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {insights.map((ins, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 ${
                        ins.severity === 'WARNING'
                          ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                          : 'bg-blue-50/80 border-blue-200 text-blue-900'
                      }`}
                    >
                      {ins.severity === 'WARNING' ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="font-bold leading-tight">{ins.message}</p>
                        {ins.matchedDays && ins.windowDays && (
                          <span className="text-[10px] text-gray-500 mt-1 block">
                            Triggered on {ins.matchedDays} of last {ins.windowDays} days
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── 4. GRAPHS AT THE LAST / BOTTOM OF THE MODAL (IMAGE 1) ── */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center gap-2 border-t border-gray-200 pt-5">
                <BarChart3 className="w-5 h-5 text-forest-700" />
                <h3 className="text-lg font-black text-gray-900">Activity & Telemetry Graphs</h3>
              </div>

              <CaloriesChart days={trendDays} />
              <WorkoutChart days={trendDays} />
              <WaterAndSleepCharts
                days={trendDays}
                waterGoalL={waterTargetL}
                sleepGoalH={sleepTargetH}
              />
            </div>

            {/* ── 5. FOOTER QUICK ACTIONS ── */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsAssignGoalOpen(true)}
                className="px-4 py-2 bg-forest-50 hover:bg-forest-100 text-forest-800 font-extrabold text-xs rounded-xl border border-forest-200 transition-colors flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                Assign Specific Targets
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onAssignPlan) onAssignPlan(clientId);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Assign Custom Plan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: ASSIGN PARTICULAR GOALS (WATER, SLEEP, WORKOUTS) ── */}
        <AssignGoalModal
          isOpen={isAssignGoalOpen}
          client={client}
          onClose={() => setIsAssignGoalOpen(false)}
          onSuccess={() => fetchClientAnalytics()}
        />
      </div>
    </div>
  );
}
