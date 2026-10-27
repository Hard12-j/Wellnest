import { useMemo } from 'react';
import {
  Flame,
  Dumbbell,
  Droplets,
  Moon,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

/**
 * Format ISO date string into day of week abbreviation (Mon, Tue, etc.)
 */
const getDayLabel = (dateStr) => {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  } catch {
    return dateStr;
  }
};

/**
 * ── 1. CALORIES CONSUMED VS BURNED CHART ─────────────────────────────
 * Grouped bars, one pair per day. Shows surplus or deficit at a glance.
 */
export function CaloriesChart({ days = [] }) {
  const chartDays = useMemo(() => {
    return days.slice(-7).map((d) => ({
      ...d,
      dayName: getDayLabel(d.date),
      consumed: Math.round(d.caloriesConsumed || 0),
      burned: Math.round(d.caloriesBurned || 0),
    }));
  }, [days]);

  const maxVal = Math.max(
    ...chartDays.map((d) => Math.max(d.consumed, d.burned)),
    3000
  );

  const yTicks = [3000, 2500, 2000, 1500, 1000, 500, 0];

  return (
    <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm space-y-5">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">
            1. Calories consumed vs burned
          </h3>
          <p className="text-xs text-gray-500">
            Grouped bars, one pair per day. Shows surplus or deficit at a glance.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-blue-600 inline-block shadow-sm" />
            <span className="text-gray-700">Consumed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm bg-orange-600 inline-block shadow-sm" />
            <span className="text-gray-700">Burned</span>
          </div>
        </div>
      </div>

      {/* Grouped Bar Chart Container */}
      <div className="relative pt-6 pb-2">
        <div className="flex items-end h-64 gap-2 sm:gap-4 border-b border-gray-200 pl-8 relative">
          {/* Y-Axis Grid Lines & Labels */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[11px] font-semibold text-gray-400 select-none">
            {yTicks.map((val) => (
              <span key={val} className="w-6 text-right">
                {val}
              </span>
            ))}
          </div>

          {/* Grid horizontal lines */}
          <div className="absolute left-8 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            {yTicks.map((val) => (
              <div key={val} className="w-full border-t border-gray-100" />
            ))}
          </div>

          {/* Bars group per day */}
          <div className="flex-1 flex justify-around items-end h-full z-10">
            {chartDays.map((d, idx) => {
              const consumedHeight = Math.min(100, Math.max(4, (d.consumed / maxVal) * 100));
              const burnedHeight = Math.min(100, Math.max(4, (d.burned / maxVal) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end max-w-[56px] group">
                  {/* Bars Pair */}
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    {/* Consumed Bar (Blue) */}
                    <div className="w-1/2 flex flex-col items-center justify-end h-full">
                      {d.consumed > 0 && (
                        <span className="text-[10px] font-black text-blue-700 mb-1 opacity-90 group-hover:opacity-100">
                          {d.consumed}
                        </span>
                      )}
                      <div
                        style={{ height: `${consumedHeight}%` }}
                        className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all duration-300 shadow-sm"
                        title={`${d.dayName}: ${d.consumed} kcal consumed`}
                      />
                    </div>

                    {/* Burned Bar (Orange) */}
                    <div className="w-1/2 flex flex-col items-center justify-end h-full">
                      {d.burned > 0 && (
                        <span className="text-[10px] font-black text-orange-700 mb-1 opacity-90 group-hover:opacity-100">
                          {d.burned}
                        </span>
                      )}
                      <div
                        style={{ height: `${burnedHeight}%` }}
                        className="w-full bg-orange-600 hover:bg-orange-700 rounded-t-md transition-all duration-300 shadow-sm"
                        title={`${d.dayName}: ${d.burned} kcal burned`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Day Labels */}
        <div className="flex justify-around pl-8 pt-2">
          {chartDays.map((d, idx) => (
            <div key={idx} className="flex-1 text-center max-w-[56px]">
              <span className="text-xs font-bold text-gray-700">{d.dayName}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ── 2. WORKOUT FREQUENCY AND DURATION CHART ──────────────────────────
 * Bar height = minutes trained. Label under each day = number of sessions.
 */
export function WorkoutChart({ days = [] }) {
  const chartDays = useMemo(() => {
    return days.slice(-7).map((d) => ({
      ...d,
      dayName: getDayLabel(d.date),
      minutes: Math.round(d.workoutMinutes || 0),
      sessions: d.workoutCount || 0,
    }));
  }, [days]);

  const maxVal = Math.max(...chartDays.map((d) => d.minutes), 100);
  const yTicks = [100, 80, 60, 40, 20, 0];

  return (
    <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm space-y-5">
      {/* Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">
            2. Workout frequency and duration
          </h3>
          <p className="text-xs text-gray-500">
            Bar height = minutes trained. Label under each day = number of sessions.
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <span className="w-3.5 h-3.5 rounded-sm bg-emerald-600 inline-block shadow-sm" />
          <span className="text-gray-700">Duration (min)</span>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative pt-6 pb-2">
        <div className="flex items-end h-64 gap-2 sm:gap-4 border-b border-gray-200 pl-8 relative">
          {/* Y-Axis */}
          <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[11px] font-semibold text-gray-400 select-none">
            {yTicks.map((val) => (
              <span key={val} className="w-6 text-right">
                {val}
              </span>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute left-8 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
            {yTicks.map((val) => (
              <div key={val} className="w-full border-t border-gray-100" />
            ))}
          </div>

          {/* Bars */}
          <div className="flex-1 flex justify-around items-end h-full z-10">
            {chartDays.map((d, idx) => {
              const barHeight = d.minutes > 0 ? Math.min(100, Math.max(6, (d.minutes / maxVal) * 100)) : 0;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end max-w-[56px] group">
                  {d.minutes > 0 && (
                    <span className="text-[11px] font-black text-emerald-700 mb-1 group-hover:scale-105 transition-transform">
                      {d.minutes} min
                    </span>
                  )}
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-10 rounded-t-lg transition-all duration-300 shadow-sm ${
                      d.minutes > 0
                        ? 'bg-emerald-500 hover:bg-emerald-600'
                        : 'bg-transparent'
                    }`}
                    title={`${d.dayName}: ${d.minutes} min (${d.sessions} sessions)`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-Axis Labels: Day Name + Session Count */}
        <div className="flex justify-around pl-8 pt-2">
          {chartDays.map((d, idx) => (
            <div key={idx} className="flex-1 text-center max-w-[56px] space-y-0.5">
              <span className="text-xs font-bold text-gray-800 block">{d.dayName}</span>
              <span className={`text-[11px] font-medium block ${d.sessions > 0 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>
                {d.sessions > 0 ? `${d.sessions} session${d.sessions > 1 ? 's' : ''}` : 'rest'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ── 3. WATER INTAKE AND SLEEP TRACKING ───────────────────────────────
 * Two charts, same days, each against its daily goal (dashed line).
 * Color-coded achievement:
 * Red: severe deficit (< 50% or e.g. 2h sleep / low water)
 * Yellow: in progress (50% - 99%, e.g. 4h sleep)
 * Green: reached / exceeded target (≥ 100%, e.g. 6-8h sleep, 3L water)
 */
export function WaterAndSleepCharts({ days = [], waterGoalL = 3.0, sleepGoalH = 6.0 }) {
  const chartDays = useMemo(() => {
    return days.slice(-7).map((d) => ({
      ...d,
      dayName: getDayLabel(d.date),
      waterL: Math.round(((d.waterMl || 0) / 1000.0) * 10) / 10,
      sleepH: Math.round((d.sleepHours || 0) * 10) / 10,
    }));
  }, [days]);

  const waterYTicks = [4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.0];
  const sleepYTicks = [10, 8, 6, 4, 2, 0];

  const waterGoalPercent = Math.min(100, (waterGoalL / 4.0) * 100);
  const sleepGoalPercent = Math.min(100, (sleepGoalH / 10.0) * 100);

  return (
    <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-lg font-extrabold text-gray-900">
            3. Water intake and sleep tracking
          </h3>
          <p className="text-xs text-gray-500">
            Two charts, same days, each against its daily goal (dashed line). Color indicates target status.
          </p>
        </div>

        {/* Color Legend indicator */}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold bg-gray-50 px-3.5 py-1.5 rounded-xl border border-gray-200/80">
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-sm" />
            🔴 Low / Deficit (e.g. 2h sleep / &lt;50% water)
          </span>
          <span className="flex items-center gap-1.5 text-amber-600">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shadow-sm" />
            🟡 In Progress (e.g. 4h sleep / 50-99% water)
          </span>
          <span className="flex items-center gap-1.5 text-emerald-600">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
            🟢 Target Achieved (e.g. &ge;6h sleep / &ge;3L water)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* LEFT: WATER INTAKE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Droplets className="w-4 h-4 text-blue-600" />
              Water (litres per day)
            </h4>
            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
              Target: at least {waterGoalL} L/day
            </span>
          </div>

          <div className="relative pt-4 pb-2">
            <div className="flex items-end h-56 gap-2 border-b border-gray-200 pl-8 relative">
              {/* Y-Axis */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-semibold text-gray-400 select-none">
                {waterYTicks.map((val) => (
                  <span key={val} className="w-6 text-right">
                    {val.toFixed(1)}
                  </span>
                ))}
              </div>

              {/* Grid lines */}
              <div className="absolute left-8 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                {waterYTicks.map((val) => (
                  <div key={val} className="w-full border-t border-gray-100" />
                ))}
              </div>

              {/* Dashed Goal Line */}
              <div
                style={{ bottom: `${waterGoalPercent}%` }}
                className="absolute left-8 right-0 border-t-2 border-dashed border-emerald-500 z-10 flex items-center justify-end pr-2 pointer-events-none"
              >
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200 -translate-y-2.5 shadow-sm">
                  goal {waterGoalL} L
                </span>
              </div>

              {/* Water Bars with Adaptive Color: Red (<50%), Yellow (50-99%), Green (>=goal) */}
              <div className="flex-1 flex justify-around items-end h-full z-10">
                {chartDays.map((d, idx) => {
                  const barHeight = Math.min(100, Math.max(4, (d.waterL / 4.0) * 100));

                  // Color coding:
                  // < 50% target -> Red (e.g. 1L out of 3L)
                  // 50% - 99% target -> Yellow (e.g. 2L out of 3L)
                  // >= 100% target -> Green (e.g. >= 3L)
                  let barColor = 'bg-rose-500 hover:bg-rose-600';
                  let textColor = 'text-rose-600';
                  if (d.waterL >= waterGoalL) {
                    barColor = 'bg-emerald-500 hover:bg-emerald-600';
                    textColor = 'text-emerald-700 font-bold';
                  } else if (d.waterL >= waterGoalL * 0.5) {
                    barColor = 'bg-amber-500 hover:bg-amber-600';
                    textColor = 'text-amber-600 font-semibold';
                  }

                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end max-w-[42px] group">
                      {d.waterL > 0 && (
                        <span className={`text-[10px] font-black mb-1 ${textColor}`}>
                          {d.waterL}
                        </span>
                      )}
                      <div
                        style={{ height: `${barHeight}%` }}
                        className={`w-7 rounded-t-md transition-all duration-300 shadow-sm ${barColor}`}
                        title={`${d.dayName}: ${d.waterL} L (Goal: ${waterGoalL} L)`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-Axis */}
            <div className="flex justify-around pl-8 pt-2">
              {chartDays.map((d, idx) => (
                <div key={idx} className="flex-1 text-center max-w-[42px]">
                  <span className="text-xs font-bold text-gray-700">{d.dayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: SLEEP TRACKING */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-purple-600" />
              Sleep (hours per night)
            </h4>
            <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
              Target: at least {sleepGoalH} h/night
            </span>
          </div>

          <div className="relative pt-4 pb-2">
            <div className="relative h-56 border-b border-gray-200 pl-8">
              {/* Y-Axis */}
              <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-[10px] font-semibold text-gray-400 select-none">
                {sleepYTicks.map((val) => (
                  <span key={val} className="w-6 text-right">
                    {val}
                  </span>
                ))}
              </div>

              {/* Grid lines */}
              <div className="absolute left-8 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                {sleepYTicks.map((val) => (
                  <div key={val} className="w-full border-t border-gray-100" />
                ))}
              </div>

              {/* Dashed Goal Line */}
              <div
                style={{ bottom: `${sleepGoalPercent}%` }}
                className="absolute left-8 right-0 border-t-2 border-dashed border-emerald-500 z-10 flex items-center justify-start pl-2 pointer-events-none"
              >
                <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50/90 px-1.5 py-0.5 rounded border border-emerald-200 -translate-y-2.5 shadow-sm">
                  goal {sleepGoalH} h
                </span>
              </div>

              {/* SVG Line Graph */}
              <svg className="absolute left-8 right-0 top-0 bottom-0 w-[calc(100%-2rem)] h-full overflow-visible z-20">
                {chartDays.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartDays
                      .map((d, idx) => {
                        const x = ((idx + 0.5) / chartDays.length) * 100;
                        const y = 100 - (Math.min(10, Math.max(0, d.sleepH)) / 10.0) * 100;
                        return `${x}%,${y}%`;
                      })
                      .join(' ')}
                  />
                )}

                {/* Nodes & Data Labels with Adaptive Colors: Red (2h), Yellow (4h), Green (>=goal) */}
                {chartDays.map((d, idx) => {
                  const cx = `${((idx + 0.5) / chartDays.length) * 100}%`;
                  const cy = `${100 - (Math.min(10, Math.max(0, d.sleepH)) / 10.0) * 100}%`;

                  let nodeColor = '#ef4444'; // Red (severe deficit)
                  if (d.sleepH >= sleepGoalH) {
                    nodeColor = '#10b981'; // Green (goal met)
                  } else if (d.sleepH >= sleepGoalH * 0.6) {
                    nodeColor = '#f59e0b'; // Yellow (moderate, e.g. 4h)
                  }

                  return (
                    <g key={idx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="6"
                        fill={nodeColor}
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        className="cursor-pointer hover:r-7 transition-all shadow"
                      />
                      <text
                        x={cx}
                        y={cy}
                        dy={d.sleepH >= 8 ? -10 : 18}
                        textAnchor="middle"
                        style={{ fill: nodeColor }}
                        className="text-[11px] font-black select-none"
                      >
                        {d.sleepH > 0 ? d.sleepH : ''}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* X-Axis */}
            <div className="flex justify-around pl-8 pt-2">
              {chartDays.map((d, idx) => (
                <div key={idx} className="flex-1 text-center max-w-[42px]">
                  <span className="text-xs font-bold text-gray-700">{d.dayName}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * ── MY GOALS SECTION (Image 2) ───────────────────────────────────────
 * Workouts, Water, and Sleep cards with badge, progress, countdown, and tip.
 * Dynamic progress bar and status badge color-coded by achievement:
 * - Red (Deficit / Low, e.g. 2h sleep, <50% water)
 * - Yellow (In progress / Moderate, e.g. 4h sleep)
 * - Green (Goal achieved / Optimal, e.g. >= 6-8h sleep, >= 3L water)
 */
export function MyGoalsCards({ goals }) {
  if (!goals) return null;

  const { workouts, water, sleep } = goals;

  // Workouts Color Coding
  let workoutBarColor = 'bg-rose-500';
  let workoutTextColor = 'text-rose-600';
  let workoutBadgeInfo = { label: 'Needs Boost', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (workouts) {
    if (workouts.percentage >= 100) {
      workoutBarColor = 'bg-emerald-500';
      workoutTextColor = 'text-emerald-600';
      workoutBadgeInfo = { label: 'Goal Met! 🎉', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    } else if (workouts.percentage >= 50) {
      workoutBarColor = 'bg-amber-500';
      workoutTextColor = 'text-amber-600';
      workoutBadgeInfo = { label: 'In Progress 🏃', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  }

  // Water Color Coding: Red (<50%, e.g. 1L), Yellow (50-99%, e.g. 2L), Green (>=100%, e.g. >=3L)
  let waterBarColor = 'bg-rose-500';
  let waterTextColor = 'text-rose-600';
  let waterBadgeInfo = { label: 'Low Intake 🔴', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (water) {
    if (water.percentage >= 100) {
      waterBarColor = 'bg-emerald-500';
      waterTextColor = 'text-emerald-600';
      waterBadgeInfo = { label: 'Goal Met! 🟢', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    } else if (water.percentage >= 50) {
      waterBarColor = 'bg-amber-500';
      waterTextColor = 'text-amber-600';
      waterBadgeInfo = { label: 'In Progress 🟡', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  }

  // Sleep Color Coding: Red (e.g. 2h / <50%), Yellow (e.g. 4h / 50-99%), Green (>=goal, e.g. >=6h)
  let sleepBarColor = 'bg-rose-500';
  let sleepTextColor = 'text-rose-600';
  let sleepBadgeInfo = { label: 'Severe Deficit 🔴', bg: 'bg-rose-50 text-rose-700 border-rose-200' };
  if (sleep) {
    if (sleep.percentage >= 100) {
      sleepBarColor = 'bg-emerald-500';
      sleepTextColor = 'text-emerald-600';
      sleepBadgeInfo = { label: 'Goal Met! 🟢', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    } else if (sleep.percentage >= 50) {
      sleepBarColor = 'bg-amber-500';
      sleepTextColor = 'text-amber-600';
      sleepBadgeInfo = { label: 'In Progress 🟡', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">My goals</h2>
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          Assigned by trainer or set by you
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* CARD 1: WORKOUTS */}
        {workouts && (
          <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Workouts</h3>
                  <p className="text-xs text-gray-500">{workouts.subtitle}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${workoutBadgeInfo.bg}`}
                  >
                    {workoutBadgeInfo.label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                      workouts.badge && workouts.badge !== 'Your goal'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {workouts.badge}
                  </span>
                </div>
              </div>

              {/* Big Stat & Percentage */}
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{workouts.completedDays}</span>
                  <span className="text-sm font-bold text-gray-400">/ {workouts.targetDays} days</span>
                </div>
                <span className={`text-xl font-black ${workoutTextColor}`}>{workouts.percentage}%</span>
              </div>

              {/* Progress Bar (Color Coded) */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, workouts.percentage)}%` }}
                  className={`${workoutBarColor} h-full rounded-full transition-all duration-500`}
                />
              </div>

              {/* Countdown / Status row */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
                <span>{workouts.moreToGo > 0 ? `${workouts.moreToGo} more to go` : 'Goal crushed!'}</span>
                <span>{workouts.daysLeft} days left</span>
              </div>
            </div>

            {/* Tip note */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic leading-snug">
                &ldquo;{workouts.tip}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* CARD 2: WATER */}
        {water && (
          <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Water</h3>
                  <p className="text-xs text-gray-500">{water.subtitle}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${waterBadgeInfo.bg}`}
                  >
                    {waterBadgeInfo.label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                      water.badge && water.badge !== 'Your goal'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {water.badge}
                  </span>
                </div>
              </div>

              {/* Big Stat & Percentage */}
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{water.currentLitres}</span>
                  <span className="text-sm font-bold text-gray-400">/ {water.targetLitres} L</span>
                </div>
                <span className={`text-xl font-black ${waterTextColor}`}>{water.percentage}%</span>
              </div>

              {/* Progress Bar (Color Coded: Red <50%, Yellow 50-99%, Green >=100%) */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, water.percentage)}%` }}
                  className={`${waterBarColor} h-full rounded-full transition-all duration-500`}
                />
              </div>

              {/* Countdown / Status row */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
                <span>{water.remainingLitres > 0 ? `${water.remainingLitres} L to go` : 'Target met!'}</span>
                <span>Streak: {water.streakDays} days</span>
              </div>
            </div>

            {/* Tip note */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic leading-snug">
                &ldquo;{water.tip}&rdquo;
              </p>
            </div>
          </div>
        )}

        {/* CARD 3: SLEEP */}
        {sleep && (
          <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl shadow-sm flex flex-col justify-between hover:shadow-md transition-all space-y-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900">Sleep</h3>
                  <p className="text-xs text-gray-500">{sleep.subtitle}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap justify-end">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${sleepBadgeInfo.bg}`}
                  >
                    {sleepBadgeInfo.label}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                      sleep.badge && sleep.badge !== 'Your goal'
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {sleep.badge}
                  </span>
                </div>
              </div>

              {/* Big Stat & Percentage */}
              <div className="flex items-baseline justify-between pt-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-gray-900">{sleep.avgHours}</span>
                  <span className="text-sm font-bold text-gray-400">/ {sleep.targetHours} h</span>
                </div>
                <span className={`text-xl font-black ${sleepTextColor}`}>{sleep.percentage}%</span>
              </div>

              {/* Progress Bar (Color Coded: Red for 2h, Yellow for 4h, Green for >=goal) */}
              <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, sleep.percentage)}%` }}
                  className={`${sleepBarColor} h-full rounded-full transition-all duration-500`}
                />
              </div>

              {/* Countdown / Status row */}
              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 pt-1">
                <span>{sleep.comparisonText}</span>
                <span>Best: {sleep.bestHours} h</span>
              </div>
            </div>

            {/* Tip note */}
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 italic leading-snug">
                &ldquo;{sleep.tip}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
