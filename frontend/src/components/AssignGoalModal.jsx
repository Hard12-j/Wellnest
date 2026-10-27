import { useState, useEffect } from 'react';
import { Sliders, X, Loader2, Droplets, Moon, Dumbbell, ShieldCheck, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as analyticsApi from '../api/analyticsApi';

export default function AssignGoalModal({ isOpen, client, onClose, onSuccess }) {
  const { user } = useAuth();
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    workoutDaysPerWeek: 5,
    waterLitresPerDay: 3.0,
    sleepHoursPerNight: 6.0,
    trainerName: '',
  });

  const clientId = client?.userId || client?.id;

  useEffect(() => {
    if (!isOpen || !clientId) return;

    const loadExistingGoals = async () => {
      setLoadingInitial(true);
      try {
        const existing = await analyticsApi.getClientGoals(clientId);
        if (existing) {
          setForm({
            workoutDaysPerWeek: existing.workoutDaysPerWeek || 5,
            waterLitresPerDay: existing.waterLitresPerDay || 3.0,
            sleepHoursPerNight: existing.sleepHoursPerNight || 6.0,
            trainerName: existing.assignedByName || (user?.first ? `Coach ${user.first}` : 'Coach'),
          });
        }
      } catch {
        // Fallback to default
        setForm({
          workoutDaysPerWeek: 5,
          waterLitresPerDay: 3.0,
          sleepHoursPerNight: 6.0,
          trainerName: user?.first ? `Coach ${user.first}` : 'Coach',
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    loadExistingGoals();
  }, [isOpen, clientId, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!clientId) return;

    setSaving(true);
    try {
      await analyticsApi.assignClientGoals(clientId, {
        workoutDaysPerWeek: Number(form.workoutDaysPerWeek),
        waterLitresPerDay: Number(form.waterLitresPerDay),
        sleepHoursPerNight: Number(form.sleepHoursPerNight),
        trainerName: form.trainerName || (user?.first ? `Coach ${user.first}` : 'Coach'),
      });

      toast.success(`Target goals assigned for Client #${clientId}! 🎯`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(analyticsApi.extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-200 space-y-5 relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800">
            <Sliders className="w-3.5 h-3.5 text-forest-700" />
            Trainer Target Setting
          </div>
          <h3 className="text-xl font-black text-gray-900">
            Assign Particular Goals (Client #{clientId})
          </h3>
          <p className="text-xs text-gray-500">
            Set custom benchmarks such as &ldquo;drink at least 3L water per day&rdquo; or &ldquo;sleep at least 6 hours&rdquo;.
          </p>
        </div>

        {/* Color-Coded Feedback Guide Box */}
        <div className="p-3.5 bg-gradient-to-r from-gray-50 to-emerald-50/40 rounded-2xl border border-gray-200/90 text-xs text-gray-700 space-y-1.5">
          <span className="font-extrabold text-gray-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Live Color-Coded Target Status
          </span>
          <p className="text-[11px] leading-relaxed text-gray-600">
            Client&apos;s daily telemetry graph and goal cards will dynamically reflect compliance:
          </p>
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-bold">
            <div className="p-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-center">
              🔴 Red: Severe deficit<br /><span className="text-[10px] font-normal text-rose-600">e.g. 2h sleep / &lt;50% water</span>
            </div>
            <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 text-center">
              🟡 Yellow: In progress<br /><span className="text-[10px] font-normal text-amber-600">e.g. 4h sleep / 50-99% water</span>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-center">
              🟢 Green: Goal Met<br /><span className="text-[10px] font-normal text-emerald-600">&ge; target (6h sleep, 3L water)</span>
            </div>
          </div>
        </div>

        {loadingInitial ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-forest-600" />
            <span className="text-xs text-gray-500">Loading existing goals...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Coach Badge Display Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Coach Badge Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Coach Rahul"
                value={form.trainerName}
                onChange={(e) => setForm({ ...form, trainerName: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 font-medium text-gray-800"
              />
            </div>

            {/* Water Target (Litres/day) with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  Drink at least Water (Litres/day) *
                </label>
                <div className="flex gap-1">
                  {[2.5, 3.0, 3.5, 4.0].map((litres) => (
                    <button
                      key={litres}
                      type="button"
                      onClick={() => setForm({ ...form, waterLitresPerDay: litres })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        Number(form.waterLitresPerDay) === litres
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {litres}L
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="8.0"
                value={form.waterLitresPerDay}
                onChange={(e) => setForm({ ...form, waterLitresPerDay: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 font-medium text-gray-800"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Benchmark: 3.0L per day recommended for active hydration.
              </span>
            </div>

            {/* Sleep Target (Hours/night) with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <Moon className="w-3.5 h-3.5 text-purple-600" />
                  Sleep at least (Hours/night) *
                </label>
                <div className="flex gap-1">
                  {[6.0, 7.0, 8.0, 8.5].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setForm({ ...form, sleepHoursPerNight: hours })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        Number(form.sleepHoursPerNight) === hours
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                step="0.5"
                min="4.0"
                max="12.0"
                value={form.sleepHoursPerNight}
                onChange={(e) => setForm({ ...form, sleepHoursPerNight: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 font-medium text-gray-800"
              />
              <span className="text-[11px] text-gray-500 mt-1 block">
                Benchmark: 6.0 - 8.0 hours for muscular recovery and metabolic health.
              </span>
            </div>

            {/* Workout Days Target with Presets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1">
                  <Dumbbell className="w-3.5 h-3.5 text-emerald-600" />
                  Workout Days (per week) *
                </label>
                <div className="flex gap-1">
                  {[3, 4, 5, 6].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setForm({ ...form, workoutDaysPerWeek: days })}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                        Number(form.workoutDaysPerWeek) === days
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min="1"
                max="7"
                value={form.workoutDaysPerWeek}
                onChange={(e) => setForm({ ...form, workoutDaysPerWeek: Number(e.target.value) })}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 font-medium text-gray-800"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center gap-2 cursor-pointer shadow-md"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Save & Assign Goals
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
