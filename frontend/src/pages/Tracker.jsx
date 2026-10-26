import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Flame,
  Droplets,
  Moon,
  Dumbbell,
  Utensils,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Sparkles,
  PieChart,
  Star,
  Zap,
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as trackerApi from '../api/trackerApi';

const WORKOUT_TYPES = [
  { value: 'WALKING', label: 'Walking', icon: '🚶' },
  { value: 'RUNNING', label: 'Running', icon: '🏃' },
  { value: 'CYCLING', label: 'Cycling', icon: '🚴' },
  { value: 'SWIMMING', label: 'Swimming', icon: '🏊' },
  { value: 'YOGA', label: 'Yoga & Stretch', icon: '🧘' },
  { value: 'STRENGTH', label: 'Strength Training', icon: '🏋️' },
  { value: 'HIIT', label: 'HIIT & Circuit', icon: '⚡' },
  { value: 'OTHER', label: 'Other Activity', icon: '🎯' },
];

const MEAL_TYPES = [
  { value: 'BREAKFAST', label: 'Breakfast', icon: '🍳' },
  { value: 'LUNCH', label: 'Lunch', icon: '🥗' },
  { value: 'DINNER', label: 'Dinner', icon: '🍲' },
  { value: 'SNACK', label: 'Snack', icon: '🍎' },
];

const INTENSITIES = [
  { value: 'LOW', label: 'Low', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'MODERATE', label: 'Moderate', color: 'bg-amber-50 text-amber-700' },
  { value: 'HIGH', label: 'High', color: 'bg-rose-50 text-rose-700' },
];

const getTodayString = () => new Date().toISOString().split('T')[0];

const Tracker = () => {
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [loading, setLoading] = useState(true);
  const [dailyLog, setDailyLog] = useState(null);
  const [activeTab, setActiveTab] = useState('workouts'); // 'workouts' | 'meals' | 'hydration' | 'sleep'

  // Modal / Form toggles
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [showMealModal, setShowMealModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [workoutForm, setWorkoutForm] = useState({
    type: 'RUNNING',
    durationMin: 30,
    intensity: 'MODERATE',
    caloriesBurned: '',
    notes: '',
  });

  const [mealForm, setMealForm] = useState({
    mealType: 'BREAKFAST',
    name: '',
    calories: '',
    proteinG: '',
    carbsG: '',
    fatG: '',
  });

  const [sleepForm, setSleepForm] = useState({
    hours: 7.5,
    quality: 4,
  });

  const [customHydration, setCustomHydration] = useState('');

  // Fetch daily summary
  const fetchDayData = useCallback(async (date) => {
    setLoading(true);
    try {
      const data = await trackerApi.getDailyLog(date);
      setDailyLog(data);
    } catch {
      toast.error('Failed to load tracker logs for this date');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDayData(selectedDate);
  }, [selectedDate, fetchDayData]);

  // Date controls
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleToday = () => {
    setSelectedDate(getTodayString());
  };

  // Workout handlers
  const handleCreateWorkout = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await trackerApi.createWorkout({
        ...workoutForm,
        date: selectedDate,
      });
      toast.success('Workout logged successfully!');
      setShowWorkoutModal(false);
      setWorkoutForm({
        type: 'RUNNING',
        durationMin: 30,
        intensity: 'MODERATE',
        caloriesBurned: '',
        notes: '',
      });
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorkout = async (id) => {
    if (!window.confirm('Delete this workout log?')) return;
    try {
      await trackerApi.deleteWorkout(id);
      toast.success('Workout deleted');
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    }
  };

  // Meal handlers
  const handleCreateMeal = async (e) => {
    e.preventDefault();
    if (!mealForm.name.trim() || !mealForm.calories) {
      toast.error('Please enter meal name and calories');
      return;
    }
    setSubmitting(true);
    try {
      await trackerApi.createMeal({
        ...mealForm,
        date: selectedDate,
      });
      toast.success('Meal logged successfully!');
      setShowMealModal(false);
      setMealForm({
        mealType: 'BREAKFAST',
        name: '',
        calories: '',
        proteinG: '',
        carbsG: '',
        fatG: '',
      });
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (id) => {
    if (!window.confirm('Delete this meal entry?')) return;
    try {
      await trackerApi.deleteMeal(id);
      toast.success('Meal deleted');
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    }
  };

  // Hydration handlers
  const handleQuickAddWater = async (amountMl) => {
    try {
      await trackerApi.createHydration({
        date: selectedDate,
        amountMl,
      });
      toast.success(`+${amountMl}ml logged! 💧`);
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    }
  };

  const handleCustomHydrationSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(customHydration);
    if (!amount || amount <= 0) return;
    await handleQuickAddWater(amount);
    setCustomHydration('');
  };

  // Sleep handlers
  const handleCreateSleep = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await trackerApi.createSleep({
        ...sleepForm,
        date: selectedDate,
      });
      toast.success('Sleep logged successfully!');
      setShowSleepModal(false);
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSleep = async (id) => {
    if (!window.confirm('Delete this sleep record?')) return;
    try {
      await trackerApi.deleteSleep(id);
      toast.success('Sleep record removed');
      fetchDayData(selectedDate);
    } catch (err) {
      toast.error(trackerApi.extractErrorMessage(err));
    }
  };

  // Calculations
  const hydrationGoal = 2000;
  const currentHydration = dailyLog?.hydrationMl || 0;
  const hydrationPercent = Math.min(100, Math.round((currentHydration / hydrationGoal) * 100));

  const workouts = dailyLog?.workouts || [];
  const meals = dailyLog?.meals || [];
  const sleepRecords = dailyLog?.sleep || [];

  const totalWorkoutMinutes = workouts.reduce((sum, w) => sum + (w.durationMin || 0), 0);

  // Macro sums
  const totalProtein = meals.reduce((sum, m) => sum + (m.proteinG || 0), 0);
  const totalCarbs = meals.reduce((sum, m) => sum + (m.carbsG || 0), 0);
  const totalFat = meals.reduce((sum, m) => sum + (m.fatG || 0), 0);

  const formattedDate = new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Date Navigation Bar */}
      <div className="card p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 bg-white shadow-sm border border-gray-200/80">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleToday}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
              selectedDate === getTodayString()
                ? 'bg-forest-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-forest-600 hidden sm:block" />
          <span className="font-bold text-gray-800 text-base sm:text-lg">{formattedDate}</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs sm:text-sm font-semibold px-3 py-1.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 bg-gray-50"
          />
        </div>
      </div>

      {/* Top Daily Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Calories Card */}
        <div className="card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Net Calories
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {dailyLog ? Math.round(dailyLog.netCalories) : 0}
            </span>
            <span className="text-xs text-gray-400 font-medium">kcal net</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>+{dailyLog?.caloriesConsumed || 0} in</span>
            <span>-{Math.round(dailyLog?.caloriesBurned || 0)} burned</span>
          </div>
        </div>

        {/* Hydration Card */}
        <div className="card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Water Intake
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Droplets className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{currentHydration}</span>
            <span className="text-xs text-gray-400 font-medium">/ {hydrationGoal} ml</span>
          </div>
          <div className="mt-3 space-y-1">
            <div className="w-full bg-blue-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${hydrationPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-gray-400">
              <span>{hydrationPercent}% goal</span>
              <button
                onClick={() => handleQuickAddWater(250)}
                className="text-blue-600 font-bold hover:underline"
              >
                +250ml quick
              </button>
            </div>
          </div>
        </div>

        {/* Sleep Card */}
        <div className="card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Sleep Duration
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Moon className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">
              {dailyLog ? dailyLog.sleepHours.toFixed(1) : '0.0'}
            </span>
            <span className="text-xs text-gray-400 font-medium">hours</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>
              {sleepRecords.length} {sleepRecords.length === 1 ? 'session' : 'sessions'}
            </span>
            <span className="text-purple-600 font-medium">
              {dailyLog && dailyLog.sleepHours >= 7 ? 'Optimal rest' : 'Need more sleep'}
            </span>
          </div>
        </div>

        {/* Workouts Card */}
        <div className="card p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Active Exercise
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Dumbbell className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{totalWorkoutMinutes}</span>
            <span className="text-xs text-gray-400 font-medium">min total</span>
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <span>{workouts.length} workouts logged</span>
            <span className="text-emerald-600 font-medium">
              {Math.round(dailyLog?.caloriesBurned || 0)} kcal
            </span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        {[
          { id: 'workouts', label: 'Workouts', icon: Dumbbell, count: workouts.length },
          { id: 'meals', label: 'Meals & Food', icon: Utensils, count: meals.length },
          { id: 'hydration', label: 'Hydration', icon: Droplets, count: null },
          { id: 'sleep', label: 'Sleep Logs', icon: Moon, count: sleepRecords.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-forest-600 text-white shadow-md shadow-forest-600/20'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Workouts */}
      {activeTab === 'workouts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Workouts & Exercise</h2>
              <p className="text-xs text-gray-500">
                Track training sessions, duration, intensity, and calorie expenditure.
              </p>
            </div>
            <button
              onClick={() => setShowWorkoutModal(true)}
              className="btn-primary sm:w-auto px-4 py-2 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Log Workout
            </button>
          </div>

          {workouts.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 bg-forest-50 text-forest-600 rounded-3xl mx-auto flex items-center justify-center">
                <Dumbbell className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-700">No workouts logged for this day</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Keep your momentum going! Log a run, gym session, yoga practice, or casual walk.
              </p>
              <button
                onClick={() => setShowWorkoutModal(true)}
                className="btn-secondary sm:w-auto mx-auto text-xs px-5 py-2 mt-2"
              >
                + Log First Workout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {workouts.map((w) => {
                const typeObj = WORKOUT_TYPES.find((t) => t.value === w.type) || {
                  label: w.type,
                  icon: '🏃',
                };
                return (
                  <div
                    key={w.id}
                    className="card p-5 hover:shadow-md transition-shadow duration-200 border border-gray-100 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-forest-50 text-2xl flex items-center justify-center shrink-0">
                        {typeObj.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-gray-900 text-sm">{typeObj.label}</h4>
                          {w.intensity && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                INTENSITIES.find((i) => i.value === w.intensity)?.color ||
                                'bg-gray-100'
                              }`}
                            >
                              {w.intensity}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            {w.durationMin} mins
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 font-semibold text-amber-600">
                            <Flame className="w-3.5 h-3.5" />
                            {w.caloriesBurned ? `${Math.round(w.caloriesBurned)} kcal` : 'Estimated'}
                          </span>
                        </div>
                        {w.notes && (
                          <p className="text-xs text-gray-500 italic pt-1">{w.notes}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteWorkout(w.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete workout"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Meals & Nutrition */}
      {activeTab === 'meals' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Nutrition & Food Log</h2>
              <p className="text-xs text-gray-500">
                Track meals, calorie intake, and macronutrient balance.
              </p>
            </div>
            <button
              onClick={() => setShowMealModal(true)}
              className="btn-primary sm:w-auto px-4 py-2 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Log Meal
            </button>
          </div>

          {/* Daily Macro Breakdown Card */}
          {meals.length > 0 && (
            <div className="card p-5 bg-gradient-to-r from-forest-50/60 to-mint-50/60 border border-forest-100 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-forest-600 text-white flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-forest-900">Total Intake Breakdown</h4>
                  <p className="text-xs text-forest-700 font-medium">
                    {dailyLog?.caloriesConsumed || 0} kcal consumed
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-bold">
                <div className="px-3 py-1.5 rounded-xl bg-white shadow-sm border border-gray-200">
                  <span className="text-blue-600">Protein: </span>
                  <span className="text-gray-800">{totalProtein.toFixed(1)}g</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white shadow-sm border border-gray-200">
                  <span className="text-amber-600">Carbs: </span>
                  <span className="text-gray-800">{totalCarbs.toFixed(1)}g</span>
                </div>
                <div className="px-3 py-1.5 rounded-xl bg-white shadow-sm border border-gray-200">
                  <span className="text-rose-600">Fat: </span>
                  <span className="text-gray-800">{totalFat.toFixed(1)}g</span>
                </div>
              </div>
            </div>
          )}

          {meals.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl mx-auto flex items-center justify-center">
                <Utensils className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-700">No meals logged for this day</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Log breakfast, lunch, dinner, or snacks to keep accurate calorie track.
              </p>
              <button
                onClick={() => setShowMealModal(true)}
                className="btn-secondary sm:w-auto mx-auto text-xs px-5 py-2 mt-2"
              >
                + Log First Meal
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {meals.map((m) => {
                const mealTypeObj = MEAL_TYPES.find((t) => t.value === m.mealType) || {
                  label: m.mealType,
                  icon: '🍽️',
                };
                return (
                  <div
                    key={m.id}
                    className="card p-5 hover:shadow-md transition-shadow duration-200 border border-gray-100 flex items-start justify-between"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-2xl flex items-center justify-center shrink-0">
                        {mealTypeObj.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            {mealTypeObj.label}
                          </span>
                          <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                            {m.calories} kcal
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-sm">{m.name}</h4>
                        {(m.proteinG != null || m.carbsG != null || m.fatG != null) && (
                          <div className="flex items-center gap-2 text-[11px] text-gray-500 pt-0.5">
                            {m.proteinG != null && <span>P: {m.proteinG}g</span>}
                            {m.carbsG != null && <span>C: {m.carbsG}g</span>}
                            {m.fatG != null && <span>F: {m.fatG}g</span>}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMeal(m.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete meal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Hydration */}
      {activeTab === 'hydration' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Hydration & Water Tracking</h2>
              <p className="text-xs text-gray-500">
                Aim for at least 2,000 ml each day to support metabolism and focus.
              </p>
            </div>
          </div>

          <div className="card p-8 bg-gradient-to-br from-blue-500 to-sky-600 text-white rounded-3xl relative overflow-hidden shadow-lg">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
                  Total Intake for {formattedDate}
                </span>
                <div className="flex items-baseline justify-center md:justify-start gap-3">
                  <span className="text-5xl font-extrabold tracking-tight">{currentHydration}</span>
                  <span className="text-xl text-blue-100 font-semibold">/ {hydrationGoal} ml</span>
                </div>
                <p className="text-sm text-blue-100">
                  {currentHydration >= hydrationGoal
                    ? '🎉 Goal achieved! You are well hydrated today.'
                    : `${hydrationGoal - currentHydration} ml remaining to hit your daily target.`}
                </p>
              </div>

              {/* Quick Tap Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { ml: 250, label: 'Cup (250ml)', icon: '🥛' },
                  { ml: 500, label: 'Bottle (500ml)', icon: '💧' },
                  { ml: 750, label: 'Flask (750ml)', icon: '🧊' },
                  { ml: 1000, label: 'Jug (1000ml)', icon: '🫗' },
                ].map((item) => (
                  <button
                    key={item.ml}
                    onClick={() => handleQuickAddWater(item.ml)}
                    className="p-3 bg-white/10 hover:bg-white/20 active:scale-95 backdrop-blur-md rounded-2xl border border-white/20 text-center transition-all duration-200"
                  >
                    <div className="text-2xl mb-1">{item.icon}</div>
                    <div className="text-xs font-bold leading-tight">+{item.ml}ml</div>
                    <div className="text-[10px] text-blue-100 opacity-80">{item.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Custom Amount Form */}
          <div className="card p-6 border border-gray-100 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              Log Custom Water Amount
            </h3>
            <form onSubmit={handleCustomHydrationSubmit} className="flex gap-3">
              <input
                type="number"
                min="1"
                max="5000"
                placeholder="Amount in ml (e.g. 350)"
                value={customHydration}
                onChange={(e) => setCustomHydration(e.target.value)}
                className="input-field"
              />
              <button type="submit" className="btn-primary sm:w-auto px-6 whitespace-nowrap">
                Add Water
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab 4: Sleep */}
      {activeTab === 'sleep' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Sleep & Rest Tracking</h2>
              <p className="text-xs text-gray-500">
                Log duration and rating to maintain optimal energy levels and recovery.
              </p>
            </div>
            <button
              onClick={() => setShowSleepModal(true)}
              className="btn-primary sm:w-auto px-4 py-2 flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Log Sleep
            </button>
          </div>

          {sleepRecords.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 space-y-3">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-3xl mx-auto flex items-center justify-center">
                <Moon className="w-8 h-8" />
              </div>
              <h3 className="font-bold text-gray-700">No sleep records logged for this day</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                Track how much rest you had and rate your sleep quality from 1 to 5 stars.
              </p>
              <button
                onClick={() => setShowSleepModal(true)}
                className="btn-secondary sm:w-auto mx-auto text-xs px-5 py-2 mt-2"
              >
                + Log Sleep
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sleepRecords.map((s) => (
                <div
                  key={s.id}
                  className="card p-5 hover:shadow-md transition-shadow duration-200 border border-gray-100 flex items-start justify-between"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                      <Moon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-extrabold text-gray-900">
                          {s.hours} hours
                        </span>
                        <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                          {s.hours >= 7 ? 'Good Sleep' : 'Short Sleep'}
                        </span>
                      </div>
                      {s.quality && (
                        <div className="flex items-center gap-1 text-amber-500 pt-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= s.quality ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-400 ml-1">({s.quality}/5)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSleep(s.id)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Workout Modal */}
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-forest-600" />
                Log Exercise Session
              </h3>
              <button
                onClick={() => setShowWorkoutModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWorkout} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Workout Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {WORKOUT_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setWorkoutForm({ ...workoutForm, type: t.value })}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        workoutForm.type === t.value
                          ? 'border-forest-600 bg-forest-50 text-forest-800 ring-2 ring-forest-500/20'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="720"
                    required
                    value={workoutForm.durationMin}
                    onChange={(e) =>
                      setWorkoutForm({ ...workoutForm, durationMin: e.target.value })
                    }
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Intensity
                  </label>
                  <select
                    value={workoutForm.intensity}
                    onChange={(e) => setWorkoutForm({ ...workoutForm, intensity: e.target.value })}
                    className="input-field"
                  >
                    {INTENSITIES.map((i) => (
                      <option key={i.value} value={i.value}>
                        {i.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Calories Burned (Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  placeholder="Auto-calculated if left blank"
                  value={workoutForm.caloriesBurned}
                  onChange={(e) =>
                    setWorkoutForm({ ...workoutForm, caloriesBurned: e.target.value })
                  }
                  className="input-field"
                />
                <span className="text-[11px] text-gray-400 mt-1 block">
                  Leave blank to automatically calculate based on MET and your profile weight.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Notes / Workout Description
                </label>
                <textarea
                  rows="2"
                  placeholder="e.g. 5k morning run, intervals on track"
                  value={workoutForm.notes}
                  onChange={(e) => setWorkoutForm({ ...workoutForm, notes: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowWorkoutModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary sm:w-auto px-6 py-2.5 text-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                  Save Workout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meal Modal */}
      {showMealModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-amber-600" />
                Log Meal & Nutrition
              </h3>
              <button
                onClick={() => setShowMealModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMeal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Meal Type
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {MEAL_TYPES.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setMealForm({ ...mealForm, mealType: t.value })}
                      className={`p-3 rounded-xl border text-center text-xs font-bold transition-all ${
                        mealForm.mealType === t.value
                          ? 'border-amber-600 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                          : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-xl mb-1">{t.icon}</div>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Meal / Food Item Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grilled Chicken Salad with Quinoa"
                  value={mealForm.name}
                  onChange={(e) => setMealForm({ ...mealForm, name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5000"
                  required
                  placeholder="e.g. 520"
                  value={mealForm.calories}
                  onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Protein (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="35"
                    value={mealForm.proteinG}
                    onChange={(e) => setMealForm({ ...mealForm, proteinG: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Carbs (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="45"
                    value={mealForm.carbsG}
                    onChange={(e) => setMealForm({ ...mealForm, carbsG: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                    Fat (g)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="12"
                    value={mealForm.fatG}
                    onChange={(e) => setMealForm({ ...mealForm, fatG: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowMealModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary sm:w-auto px-6 py-2.5 text-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                  Save Meal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sleep Modal */}
      {showSleepModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 sm:p-8 max-w-md w-full animate-fade-in space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Moon className="w-5 h-5 text-purple-600" />
                Log Sleep
              </h3>
              <button
                onClick={() => setShowSleepModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSleep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Hours Slept
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="24"
                  required
                  value={sleepForm.hours}
                  onChange={(e) => setSleepForm({ ...sleepForm, hours: e.target.value })}
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">
                  Sleep Quality Rating
                </label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-200">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSleepForm({ ...sleepForm, quality: star })}
                      className="p-1 hover:scale-110 transition-transform"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= sleepForm.quality
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSleepModal(false)}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary sm:w-auto px-6 py-2.5 text-sm flex items-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <SaveIcon />}
                  Save Sleep
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const SaveIcon = () => <Zap className="w-4 h-4" />;

export default Tracker;
