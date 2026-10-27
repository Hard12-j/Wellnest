import { useState, useEffect } from 'react';
import {
  Award,
  ShieldCheck,
  ShieldAlert,
  Save,
  Loader2,
  MapPin,
  Phone,
  Briefcase,
  Clock,
  Sparkles,
  UserCheck,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as trainerApi from '../api/trainerApi';
import AvailabilitySchedulePicker from '../components/AvailabilitySchedulePicker';

const SPECIALIZATION_SUGGESTIONS = [
  'Strength & Conditioning',
  'Weight Loss & Transformation',
  'CrossFit & Functional Fitness',
  'Bodybuilding & Hypertrophy',
  'Yoga, Mobility & Mindfulness',
  'HIIT & Athletic Performance',
  'Nutrition & Diet Coaching',
];

const TrainerProfile = () => {
  const { user, fetchCurrentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);

  const [form, setForm] = useState({
    first: '',
    last: '',
    specialization: '',
    location: '',
    experienceYears: '',
    contactNo: '',
    availability: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;

    const loadTrainerProfile = async () => {
      setLoading(true);
      try {
        const data = await trainerApi.getTrainerProfile();
        if (active && data) {
          setForm({
            first: data.first || user?.first || '',
            last: data.last || user?.last || '',
            specialization: data.specialization || '',
            location: data.location || '',
            experienceYears: data.experienceYears !== null && data.experienceYears !== undefined ? String(data.experienceYears) : '',
            contactNo: data.contactNo || '',
            availability: data.availability || '',
          });
          setVerified(Boolean(data.verified));
        }
      } catch (err) {
        // If profile doesn't exist yet, populate first & last from user
        if (active) {
          setForm((prev) => ({
            ...prev,
            first: user?.first || '',
            last: user?.last || '',
          }));
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadTrainerProfile();

    return () => {
      active = false;
    };
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.first.trim()) newErrors.first = 'First name is required';
    if (!form.last.trim()) newErrors.last = 'Last name is required';
    if (!form.specialization.trim()) newErrors.specialization = 'Specialization is required';
    if (form.experienceYears !== '') {
      const exp = Number(form.experienceYears);
      if (isNaN(exp) || exp < 0 || exp > 60) {
        newErrors.experienceYears = 'Experience must be between 0 and 60 years';
      }
    }
    if (form.contactNo && form.contactNo.length > 20) {
      newErrors.contactNo = 'Contact number cannot exceed 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const updated = await trainerApi.updateTrainerProfile(form);
      setVerified(Boolean(updated.verified));
      toast.success('Trainer profile updated successfully! 🌟');
      // Optionally sync auth user
      try {
        await fetchCurrentUser();
      } catch {
        // Ignore silent sync
      }
    } catch (error) {
      toast.error(trainerApi.extractErrorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading trainer profile...</p>
      </div>
    );
  }

  const initials = `${form.first?.[0] || user?.first?.[0] || 'T'}${form.last?.[0] || user?.last?.[0] || ''}`.toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Top Banner Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-700 via-teal-600 to-forest-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-50">
              {initials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {form.first || 'Trainer'} {form.last || ''}
                </h1>
                {verified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    Verified Coach
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    Standard Profile
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">
                {form.specialization || 'Professional Fitness Coach'}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1">
                {form.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-500" />
                    {form.location}
                  </span>
                )}
                {form.experienceYears && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                    {form.experienceYears} {Number(form.experienceYears) === 1 ? 'year' : 'years'} coaching
                  </span>
                )}
                {form.contactNo && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-gray-500" />
                    {form.contactNo}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-forest-50 border border-forest-100/80 text-xs text-forest-800 self-stretch sm:self-auto text-center">
            <span className="font-bold block text-sm text-forest-900">Trainer ID: #{user?.id}</span>
            <span className="text-[11px] text-forest-600">WellNest Coaching Network</span>
          </div>
        </div>
      </div>

      {/* Main Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">Coaching Profile Details</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Keep your bio and availability updated so users can discover and request coaching from you.
          </p>
        </div>

        {/* First & Last Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              First Name *
            </label>
            <input
              type="text"
              name="first"
              value={form.first}
              onChange={handleChange}
              placeholder="e.g. Alex"
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                errors.first ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              }`}
            />
            {errors.first && <p className="text-xs text-red-500">{errors.first}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Last Name *
            </label>
            <input
              type="text"
              name="last"
              value={form.last}
              onChange={handleChange}
              placeholder="e.g. Miller"
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                errors.last ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              }`}
            />
            {errors.last && <p className="text-xs text-red-500">{errors.last}</p>}
          </div>
        </div>

        {/* Specialization */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            Specialization / Coaching Focus *
          </label>
          <input
            type="text"
            name="specialization"
            value={form.specialization}
            onChange={handleChange}
            placeholder="e.g. Strength & Conditioning, Weight Loss"
            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              errors.specialization ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
            }`}
          />
          {errors.specialization && <p className="text-xs text-red-500">{errors.specialization}</p>}

          {/* Preset quick pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] text-gray-400 self-center mr-1">Suggestions:</span>
            {SPECIALIZATION_SUGGESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, specialization: item }))}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  form.specialization === item
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Experience & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Experience (Years)
            </label>
            <input
              type="number"
              min="0"
              max="60"
              name="experienceYears"
              value={form.experienceYears}
              onChange={handleChange}
              placeholder="e.g. 5"
              className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                errors.experienceYears ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
              }`}
            />
            {errors.experienceYears && <p className="text-xs text-red-500">{errors.experienceYears}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Location / City / Studio
            </label>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="e.g. Mumbai, Maharashtra"
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Contact Number */}
        <div className="space-y-1.5 max-w-md">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            Contact Number
          </label>
          <input
            type="text"
            name="contactNo"
            value={form.contactNo}
            onChange={handleChange}
            placeholder="e.g. +91 98765 43210"
            className={`w-full px-4 py-2.5 bg-white border rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
              errors.contactNo ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-emerald-500'
            }`}
          />
          {errors.contactNo && <p className="text-xs text-red-500">{errors.contactNo}</p>}
        </div>

        {/* Structured Availability Schedule Picker (Predefined format: Day Range & Time Range) */}
        <AvailabilitySchedulePicker
          value={form.availability}
          onChange={(newVal) => setForm((prev) => ({ ...prev, availability: newVal }))}
        />

        {/* Save button */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <div className="text-xs text-gray-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Changes reflect live across the trainer discovery directory
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary inline-flex items-center gap-2 cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainerProfile;
