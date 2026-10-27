import { useState, useEffect, useRef } from 'react';
import {
  User,
  Scale,
  Target,
  Sparkles,
  Camera,
  Save,
  Loader2,
  Mail,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as profileApi from '../api/profileApi';

const FITNESS_GOALS = [
  { value: 'LOSE_WEIGHT', label: 'Lose Weight', icon: '🔥', desc: 'Burn fat and reduce overall weight' },
  { value: 'GAIN_MUSCLE', label: 'Gain Muscle', icon: '💪', desc: 'Build lean strength and hypertrophy' },
  { value: 'MAINTAIN_WEIGHT', label: 'Maintain Weight', icon: '⚖️', desc: 'Keep steady energy and balanced physique' },
  { value: 'IMPROVE_ENDURANCE', label: 'Improve Endurance', icon: '🏃', desc: 'Boost cardio health and stamina' },
  { value: 'IMPROVE_FLEXIBILITY', label: 'Improve Flexibility', icon: '🧘', desc: 'Enhance mobility, balance, and recovery' },
  { value: 'GENERAL_FITNESS', label: 'General Fitness', icon: '✨', desc: 'All-around daily wellness and vitality' },
];

const Profile = () => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);

  const [formData, setFormData] = useState({
    age: '',
    heightCm: '',
    weightKg: '',
    targetWeightKg: '',
    fitnessGoal: 'GENERAL_FITNESS',
  });

  const [bmiData, setBmiData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [profile, bmi, avatar] = await Promise.allSettled([
        profileApi.getProfile(),
        profileApi.getBmi(),
        profileApi.fetchAvatarBlobUrl(),
      ]);

      if (profile.status === 'fulfilled' && profile.value) {
        setFormData({
          age: profile.value.age ?? '',
          heightCm: profile.value.heightCm ?? '',
          weightKg: profile.value.weightKg ?? '',
          targetWeightKg: profile.value.targetWeightKg ?? '',
          fitnessGoal: profile.value.fitnessGoal || 'GENERAL_FITNESS',
        });
      }

      if (bmi.status === 'fulfilled' && bmi.value) {
        setBmiData(bmi.value);
      }

      if (avatar.status === 'fulfilled' && avatar.value) {
        setAvatarUrl(avatar.value);
      }
    } catch {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGoalSelect = (goal) => {
    setFormData((prev) => ({ ...prev, fitnessGoal: goal }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.updateProfile(formData);
      toast.success('Fitness profile updated successfully!');
      // Re-fetch BMI to get updated analysis
      try {
        const updatedBmi = await profileApi.getBmi();
        setBmiData(updatedBmi);
      } catch {
        // BMI optional
      }
    } catch (err) {
      toast.error(profileApi.extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      await profileApi.uploadAvatar(file);
      toast.success('Avatar updated successfully!');
      const newUrl = await profileApi.fetchAvatarBlobUrl();
      if (newUrl) setAvatarUrl(newUrl);
    } catch (err) {
      toast.error(profileApi.extractErrorMessage(err));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getBmiBadgeColor = (category = '') => {
    const lower = category.toLowerCase();
    if (lower.includes('normal')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (lower.includes('underweight')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (lower.includes('overweight')) return 'bg-orange-50 text-orange-700 border-orange-200';
    return 'bg-rose-50 text-rose-700 border-rose-200';
  };

  const initials = `${user?.first?.[0] || 'U'}${user?.last?.[0] || ''}`.toUpperCase();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading your wellness profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Profile Hero Card */}
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-forest-700 via-forest-800 to-forest-950 text-white relative overflow-hidden shadow-xl rounded-3xl">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-forest-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 -bottom-16 w-56 h-56 bg-mint-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Avatar Area */}
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile Avatar"
                className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover ring-4 ring-white/30 shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-forest-600/60 ring-4 ring-white/20 flex items-center justify-center text-3xl font-extrabold text-white shadow-2xl">
                {initials}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute -bottom-2 -right-2 p-2.5 bg-forest-500 hover:bg-forest-400 text-white rounded-2xl shadow-lg ring-2 ring-forest-900 transition-all duration-200 active:scale-95 disabled:opacity-50"
              title="Upload new avatar"
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {/* User Basic Info */}
          <div className="flex-1 text-center md:text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-forest-200 backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-mint-300" />
              Personal Fitness Profile
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {user?.first} {user?.last}
            </h1>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-forest-100/90 pt-1">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-forest-300" />
                <span>{user?.username}</span>
              </div>
              <span className="opacity-40">•</span>
              <div className="flex items-center gap-1.5">
                {user?.verifiedUser ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-300 font-medium">Verified Member</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-amber-300" />
                    <span className="text-amber-200 font-medium">Unverified</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Form (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="card p-6 sm:p-8 space-y-8">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-forest-600" />
                Body Metrics & Target Goals
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Keep your height and weight accurate so the tracker and analytics can calculate precise calorie burns.
              </p>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Age (years)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="age"
                    min="10"
                    max="120"
                    placeholder="e.g. 28"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-medium">
                    yrs
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Height (cm)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="heightCm"
                    step="0.1"
                    min="50"
                    max="260"
                    placeholder="e.g. 175"
                    value={formData.heightCm}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-medium">
                    cm
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Current Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="weightKg"
                    step="0.1"
                    min="20"
                    max="500"
                    placeholder="e.g. 72.5"
                    value={formData.weightKg}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-medium">
                    kg
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Target Weight (kg)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="targetWeightKg"
                    step="0.1"
                    min="20"
                    max="500"
                    placeholder="e.g. 68.0"
                    value={formData.targetWeightKg}
                    onChange={handleChange}
                    className="input-field"
                  />
                  <span className="absolute right-4 top-3.5 text-xs text-gray-400 font-medium">
                    kg
                  </span>
                </div>
              </div>
            </div>

            {/* Fitness Goal Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                Primary Fitness Goal
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FITNESS_GOALS.map((goal) => {
                  const isSelected = formData.fitnessGoal === goal.value;
                  return (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => handleGoalSelect(goal.value)}
                      className={`p-4 rounded-2xl border text-left transition-all duration-200 flex items-start gap-3.5 ${
                        isSelected
                          ? 'border-forest-600 bg-forest-50/60 ring-2 ring-forest-500/20 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50'
                      }`}
                    >
                      <span className="text-2xl">{goal.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold ${isSelected ? 'text-forest-900' : 'text-gray-800'}`}>
                            {goal.label}
                          </p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{goal.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="btn-primary sm:w-auto px-8 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Fitness Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Real-time BMI & Metrics Summary */}
        <div className="space-y-6">
          {/* BMI Card */}
          <div className="card p-6 bg-gradient-to-b from-white to-sand-50/60 border border-gray-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-forest-700 font-bold text-sm">
                <Scale className="w-4 h-4" />
                <span>BMI Analysis</span>
              </div>
              {bmiData?.category && (
                <span
                  className={`px-3 py-1 text-xs font-bold rounded-full border ${getBmiBadgeColor(
                    bmiData.category
                  )}`}
                >
                  {bmiData.category}
                </span>
              )}
            </div>

            {bmiData ? (
              <div className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-extrabold text-gray-900">
                    {bmiData.bmi ? bmiData.bmi.toFixed(1) : '—'}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">kg/m²</span>
                </div>

                {/* Visual Scale Meter */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden flex">
                    <div className="h-full bg-amber-400 w-1/4" title="Underweight (< 18.5)" />
                    <div className="h-full bg-emerald-500 w-1/4" title="Normal (18.5 - 24.9)" />
                    <div className="h-full bg-orange-400 w-1/4" title="Overweight (25 - 29.9)" />
                    <div className="h-full bg-rose-500 w-1/4" title="Obese (>= 30)" />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 font-medium">
                    <span>18.5</span>
                    <span>25.0</span>
                    <span>30.0</span>
                  </div>
                </div>

                {/* Guidance Text */}
                {bmiData.guidance && (
                  <div className="p-3.5 bg-forest-50/60 rounded-xl border border-forest-100 text-xs text-forest-900 leading-relaxed">
                    <span className="font-bold text-forest-800">Guidance: </span>
                    {bmiData.guidance}
                  </div>
                )}

                {/* Weight to target */}
                {bmiData.kgToTarget != null && (
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-500">Distance to Target</span>
                    <span
                      className={`text-xs font-bold flex items-center gap-1 ${
                        bmiData.kgToTarget > 0
                          ? 'text-orange-600'
                          : bmiData.kgToTarget < 0
                          ? 'text-blue-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {bmiData.kgToTarget > 0 ? (
                        <>
                          <TrendingDown className="w-3.5 h-3.5" />
                          {Math.abs(bmiData.kgToTarget).toFixed(1)} kg to lose
                        </>
                      ) : bmiData.kgToTarget < 0 ? (
                        <>
                          <TrendingUp className="w-3.5 h-3.5" />
                          {Math.abs(bmiData.kgToTarget).toFixed(1)} kg to gain
                        </>
                      ) : (
                        '🎯 Target reached!'
                      )}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400 text-xs">
                Enter your height and weight to view your BMI analysis.
              </div>
            )}
          </div>

          {/* Account Profile Summary Card */}
          <div className="card p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Account Overview
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Member ID</span>
                <span className="font-semibold text-gray-800">#{user?.id || '—'}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Full Name</span>
                <span className="font-semibold text-gray-800">
                  {user?.first} {user?.last}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500">Account Type</span>
                <span className="font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md text-xs">
                  {user?.role || 'USER'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Email Status</span>
                <span
                  className={`font-semibold text-xs px-2 py-0.5 rounded-md ${
                    user?.verifiedUser
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {user?.verifiedUser ? 'Verified' : 'Pending Verification'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
