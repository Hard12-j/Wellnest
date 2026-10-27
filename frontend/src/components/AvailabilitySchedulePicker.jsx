import { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Check,
  Sparkles,
  Copy,
  Sliders,
  Sunrise,
  Sun,
  Sunset,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

const DAYS = [
  { key: 'Mon', full: 'Monday' },
  { key: 'Tue', full: 'Tuesday' },
  { key: 'Wed', full: 'Wednesday' },
  { key: 'Thu', full: 'Thursday' },
  { key: 'Fri', full: 'Friday' },
  { key: 'Sat', full: 'Saturday' },
  { key: 'Sun', full: 'Sunday' },
];

const TIME_OPTIONS = [
  '05:00 AM', '05:30 AM', '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM', '10:00 PM', '10:30 PM',
];

const QUICK_DAY_PRESETS = [
  { label: 'Mon, Wed, Fri (MWF)', days: ['Mon', 'Wed', 'Fri'] },
  { label: 'Tue, Thu, Sat (TTS)', days: ['Tue', 'Thu', 'Sat'] },
  { label: 'Mon - Fri (Weekdays)', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
  { label: 'Mon - Sat', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] },
  { label: 'Weekends (Sat & Sun)', days: ['Sat', 'Sun'] },
  { label: 'All 7 Days', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
];

const TIME_SLOT_SHORTCUTS = [
  { label: 'Morning (6AM - 12PM)', from: '06:00 AM', to: '12:00 PM', icon: Sunrise },
  { label: 'Daytime (9AM - 6PM)', from: '09:00 AM', to: '06:00 PM', icon: Sun },
  { label: 'Evening (4PM - 9PM)', from: '04:00 PM', to: '09:00 PM', icon: Sunset },
  { label: 'Full Day (7AM - 8PM)', from: '07:00 AM', to: '08:00 PM', icon: Clock },
];

/**
 * Generate formatted availability string from day schedules
 */
const formatScheduleString = (schedule, isSameHoursMode, globalFromTime, globalToTime) => {
  const activeDays = DAYS.filter((d) => schedule[d.key]?.enabled);

  if (activeDays.length === 0) {
    return 'Flexible / By Appointment';
  }

  if (isSameHoursMode) {
    // Check if consecutive range e.g. Mon, Tue, Wed, Thu, Fri -> Mon - Fri
    const keys = activeDays.map((d) => d.key);
    let dayStr = '';

    if (keys.length === 5 && keys.join(',') === 'Mon,Tue,Wed,Thu,Fri') {
      dayStr = 'Mon - Fri';
    } else if (keys.length === 6 && keys.join(',') === 'Mon,Tue,Wed,Thu,Fri,Sat') {
      dayStr = 'Mon - Sat';
    } else if (keys.length === 7) {
      dayStr = 'All Week (Mon - Sun)';
    } else if (keys.length === 2 && keys.join(',') === 'Sat,Sun') {
      dayStr = 'Sat - Sun';
    } else {
      dayStr = keys.join(', ');
    }

    return `${dayStr}: ${globalFromTime} - ${globalToTime}`;
  }

  // Individual mode: check if all active days happen to share same times
  const firstTime = `${schedule[activeDays[0].key].fromTime} - ${schedule[activeDays[0].key].toTime}`;
  const allSame = activeDays.every(
    (d) => `${schedule[d.key].fromTime} - ${schedule[d.key].toTime}` === firstTime
  );

  if (allSame) {
    const keys = activeDays.map((d) => d.key);
    let dayStr = '';
    if (keys.length === 5 && keys.join(',') === 'Mon,Tue,Wed,Thu,Fri') {
      dayStr = 'Mon - Fri';
    } else if (keys.length === 6 && keys.join(',') === 'Mon,Tue,Wed,Thu,Fri,Sat') {
      dayStr = 'Mon - Sat';
    } else if (keys.length === 7) {
      dayStr = 'All Week (Mon - Sun)';
    } else if (keys.length === 2 && keys.join(',') === 'Sat,Sun') {
      dayStr = 'Sat - Sun';
    } else {
      dayStr = keys.join(', ');
    }
    return `${dayStr}: ${firstTime}`;
  }

  // Truly distinct times per day
  return activeDays
    .map((d) => `${d.key}: ${schedule[d.key].fromTime} - ${schedule[d.key].toTime}`)
    .join(' | ');
};

export default function AvailabilitySchedulePicker({ value, onChange }) {
  // Mode: "same" (all selected days share one time) vs "individual" (specify time for each day)
  const [isSameHoursMode, setIsSameHoursMode] = useState(true);

  // Global time for "same hours" mode
  const [globalFromTime, setGlobalFromTime] = useState('06:00 AM');
  const [globalToTime, setGlobalToTime] = useState('12:00 PM');

  // Day-by-day state
  const [schedule, setSchedule] = useState({
    Mon: { enabled: true, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Tue: { enabled: false, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Wed: { enabled: true, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Thu: { enabled: false, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Fri: { enabled: true, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Sat: { enabled: false, fromTime: '06:00 AM', toTime: '12:00 PM' },
    Sun: { enabled: false, fromTime: '06:00 AM', toTime: '12:00 PM' },
  });

  // Parse initial incoming value if present
  useEffect(() => {
    if (!value) return;

    if (value === 'Flexible / By Appointment') {
      setSchedule((prev) => {
        const next = { ...prev };
        DAYS.forEach((d) => {
          next[d.key] = { ...next[d.key], enabled: false };
        });
        return next;
      });
      return;
    }

    // Check if it's formatted as distinct days with '|'
    if (value.includes('|')) {
      setIsSameHoursMode(false);
      const segments = value.split('|').map((s) => s.trim());
      setSchedule((prev) => {
        const next = { ...prev };
        // Disable all first
        DAYS.forEach((d) => {
          next[d.key] = { ...next[d.key], enabled: false };
        });

        segments.forEach((seg) => {
          // e.g. "Mon: 06:00 AM - 12:00 PM"
          const [dayKey, timeRange] = seg.split(':').map((s) => s.trim());
          if (next[dayKey] && timeRange) {
            const [fTime, tTime] = timeRange.split('-').map((s) => s.trim());
            next[dayKey] = {
              enabled: true,
              fromTime: TIME_OPTIONS.includes(fTime) ? fTime : next[dayKey].fromTime,
              toTime: TIME_OPTIONS.includes(tTime) ? tTime : next[dayKey].toTime,
            };
          }
        });
        return next;
      });
      return;
    }

    // Format: "Mon, Wed, Fri: 06:00 AM - 12:00 PM" or "Mon - Fri, 09:00 AM - 06:00 PM"
    const delimiter = value.includes(':') ? ':' : ',';
    const [dayPart, timePart] = value.split(delimiter).map((s) => s.trim());

    if (timePart) {
      const [fTime, tTime] = timePart.split('-').map((s) => s.trim());
      const validFrom = TIME_OPTIONS.includes(fTime) ? fTime : '06:00 AM';
      const validTo = TIME_OPTIONS.includes(tTime) ? tTime : '12:00 PM';
      setGlobalFromTime(validFrom);
      setGlobalToTime(validTo);

      setSchedule((prev) => {
        const next = { ...prev };
        DAYS.forEach((d) => {
          next[d.key] = { ...next[d.key], enabled: false, fromTime: validFrom, toTime: validTo };
        });

        if (dayPart.includes('-')) {
          // Range e.g. Mon - Fri
          const [d1, d2] = dayPart.split('-').map((s) => s.trim().substring(0, 3));
          const i1 = DAYS.findIndex((d) => d.key === d1);
          const i2 = DAYS.findIndex((d) => d.key === d2);
          if (i1 !== -1 && i2 !== -1) {
            const startIdx = Math.min(i1, i2);
            const endIdx = Math.max(i1, i2);
            for (let i = startIdx; i <= endIdx; i++) {
              next[DAYS[i].key].enabled = true;
            }
          }
        } else {
          // List e.g. Mon, Wed, Fri
          const dayKeys = dayPart.split(',').map((s) => s.trim().substring(0, 3));
          dayKeys.forEach((k) => {
            if (next[k]) next[k].enabled = true;
          });
        }

        return next;
      });
    }
  }, []);

  // Sync formatted value to parent
  const emitChange = (newSched, sameMode, gFrom, gTo) => {
    const formatted = formatScheduleString(newSched, sameMode, gFrom, gTo);
    onChange(formatted);
  };

  // Toggle individual day ON / OFF
  const toggleDay = (dayKey) => {
    setSchedule((prev) => {
      const next = {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          enabled: !prev[dayKey].enabled,
          fromTime: isSameHoursMode ? globalFromTime : prev[dayKey].fromTime,
          toTime: isSameHoursMode ? globalToTime : prev[dayKey].toTime,
        },
      };
      emitChange(next, isSameHoursMode, globalFromTime, globalToTime);
      return next;
    });
  };

  // Apply a quick day preset (e.g. MWF)
  const applyDayPreset = (presetDays) => {
    setSchedule((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d.key] = {
          ...next[d.key],
          enabled: presetDays.includes(d.key),
          fromTime: isSameHoursMode ? globalFromTime : next[d.key].fromTime,
          toTime: isSameHoursMode ? globalToTime : next[d.key].toTime,
        };
      });
      emitChange(next, isSameHoursMode, globalFromTime, globalToTime);
      return next;
    });
  };

  // Change individual day's time
  const updateDayTime = (dayKey, field, timeVal) => {
    setSchedule((prev) => {
      const next = {
        ...prev,
        [dayKey]: {
          ...prev[dayKey],
          [field]: timeVal,
        },
      };
      emitChange(next, isSameHoursMode, globalFromTime, globalToTime);
      return next;
    });
  };

  // Change global time in "same hours" mode
  const updateGlobalTime = (field, timeVal) => {
    if (field === 'from') setGlobalFromTime(timeVal);
    if (field === 'to') setGlobalToTime(timeVal);

    setSchedule((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        next[d.key] = {
          ...next[d.key],
          fromTime: field === 'from' ? timeVal : globalFromTime,
          toTime: field === 'to' ? timeVal : globalToTime,
        };
      });
      emitChange(next, isSameHoursMode, field === 'from' ? timeVal : globalFromTime, field === 'to' ? timeVal : globalToTime);
      return next;
    });
  };

  // Copy one day's times to all other active days
  const copyTimeToAllActive = (sourceDayKey) => {
    const src = schedule[sourceDayKey];
    setSchedule((prev) => {
      const next = { ...prev };
      DAYS.forEach((d) => {
        if (next[d.key].enabled) {
          next[d.key] = {
            ...next[d.key],
            fromTime: src.fromTime,
            toTime: src.toTime,
          };
        }
      });
      emitChange(next, isSameHoursMode, src.fromTime, src.toTime);
      return next;
    });
  };

  const activeDays = DAYS.filter((d) => schedule[d.key]?.enabled);
  const currentFormatted = formatScheduleString(schedule, isSameHoursMode, globalFromTime, globalToTime);

  return (
    <div className="space-y-5 p-5 bg-gradient-to-br from-emerald-50/50 via-white to-gray-50/80 rounded-3xl border border-emerald-200/80 shadow-sm">
      {/* ── HEADER & PREVIEW PILL ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div>
          <label className="text-xs font-black uppercase tracking-wider text-gray-800 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Availability & Working Days Schedule
          </label>
          <p className="text-[11px] text-gray-500">
            Pick your exact working days (e.g. <strong className="text-emerald-700">Mon, Wed, Fri</strong>) and specify hours per day or for all days.
          </p>
        </div>

        {/* Live Formatted Output Badge */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white font-mono text-xs font-bold shadow-sm flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
            <span className="truncate max-w-[280px]" title={currentFormatted}>
              {currentFormatted}
            </span>
          </div>
        </div>
      </div>

      {/* ── STEP 1: SELECT EACH WORKING DAY ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-forest-600" />
            1. Select Working Days (Click to toggle on/off)
          </span>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            {activeDays.length} {activeDays.length === 1 ? 'day' : 'days'} active
          </span>
        </div>

        {/* 7-Day Interactive Chips */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {DAYS.map((d) => {
            const isEnabled = schedule[d.key]?.enabled;
            return (
              <button
                key={d.key}
                type="button"
                onClick={() => toggleDay(d.key)}
                className={`py-3 px-1 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                  isEnabled
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20 scale-[1.02]'
                    : 'bg-white hover:bg-gray-100/80 text-gray-500 border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xs sm:text-sm font-black">{d.key}</span>
                <span className={`text-[9px] font-bold uppercase mt-0.5 ${isEnabled ? 'text-emerald-100' : 'text-gray-400'}`}>
                  {isEnabled ? 'Working' : 'Off'}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Day Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] text-gray-400 font-bold uppercase mr-1">Quick Select:</span>
          {QUICK_DAY_PRESETS.map((p) => {
            const isMatch =
              p.days.length === activeDays.length &&
              p.days.every((k) => schedule[k]?.enabled);
            return (
              <button
                key={p.label}
                type="button"
                onClick={() => applyDayPreset(p.days)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all cursor-pointer border ${
                  isMatch
                    ? 'bg-forest-800 text-white border-forest-800 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── STEP 2: TIME CONFIGURATION MODE SWITCHER ── */}
      <div className="pt-3 border-t border-gray-100 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-gray-700 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-forest-600" />
            2. Configure Working Hours
          </span>

          {/* Mode Switcher Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold border border-gray-200 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setIsSameHoursMode(true);
                emitChange(schedule, true, globalFromTime, globalToTime);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                isSameHoursMode
                  ? 'bg-white text-emerald-800 shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Same hours for active days
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSameHoursMode(false);
                emitChange(schedule, false, globalFromTime, globalToTime);
              }}
              className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                !isSameHoursMode
                  ? 'bg-white text-emerald-800 shadow-sm font-black'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              Specify time for each day
            </button>
          </div>
        </div>

        {/* ── SUB-VIEW A: SAME HOURS FOR ALL ACTIVE DAYS ── */}
        {isSameHoursMode && (
          <div className="p-4 bg-white rounded-2xl border border-gray-200/90 space-y-3.5 shadow-sm">
            {/* Quick Time Slot Shortcuts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {TIME_SLOT_SHORTCUTS.map((slot) => {
                const Icon = slot.icon;
                const isSelected = globalFromTime === slot.from && globalToTime === slot.to;
                return (
                  <button
                    key={slot.label}
                    type="button"
                    onClick={() => {
                      updateGlobalTime('from', slot.from);
                      updateGlobalTime('to', slot.to);
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-gray-50 hover:bg-emerald-50/60 text-gray-700 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-1 text-xs font-extrabold mb-0.5">
                      <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                      {slot.label}
                    </div>
                    <span className={`text-[10px] block font-mono ${isSelected ? 'text-emerald-100' : 'text-gray-400'}`}>
                      {slot.from} - {slot.to}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Global Time Range */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Start Time</span>
                <select
                  value={globalFromTime}
                  onChange={(e) => updateGlobalTime('from', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <span className="text-gray-400 font-bold self-end pb-2.5">to</span>

              <div className="flex-1 space-y-1">
                <span className="text-[10px] font-bold text-gray-500 uppercase">End Time</span>
                <select
                  value={globalToTime}
                  onChange={(e) => updateGlobalTime('to', e.target.value)}
                  className="w-full px-3 py-2 text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800"
                >
                  {TIME_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-VIEW B: SPECIFY TIME FOR EACH DAY INDIVIDUALLY ── */}
        {!isSameHoursMode && (
          <div className="space-y-2.5">
            {activeDays.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                No active working days selected. Click day chips above to enable days.
              </div>
            ) : (
              activeDays.map((d) => {
                const dayData = schedule[d.key];
                return (
                  <div
                    key={d.key}
                    className="p-3 sm:p-3.5 bg-white rounded-2xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-[120px]">
                      <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center">
                        {d.key}
                      </span>
                      <div>
                        <span className="text-xs font-bold text-gray-800 block">{d.full}</span>
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase">Active</span>
                      </div>
                    </div>

                    {/* Start Time & End Time */}
                    <div className="flex items-center gap-2 flex-1 max-w-md">
                      <select
                        value={dayData.fromTime}
                        onChange={(e) => updateDayTime(d.key, 'fromTime', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      <span className="text-gray-400 text-xs font-bold">to</span>

                      <select
                        value={dayData.toTime}
                        onChange={(e) => updateDayTime(d.key, 'toTime', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 text-xs font-bold font-mono bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>

                      {/* Quick copy button */}
                      <button
                        type="button"
                        onClick={() => copyTimeToAllActive(d.key)}
                        title={`Copy ${d.key}'s time (${dayData.fromTime} - ${dayData.toTime}) to all other active days`}
                        className="p-1.5 rounded-lg border border-gray-200 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 transition-colors cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
