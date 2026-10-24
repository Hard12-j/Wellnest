import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import { register, extractErrorMessage, extractFieldErrors } from '../api/authApi';

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first: '',
    last: '',
    username: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

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
    if (!form.username.trim()) {
      newErrors.username = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
      newErrors.username = 'Please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await register({
        first: form.first.trim(),
        last: form.last.trim(),
        username: form.username.trim(),
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });
      toast.success('Verification code sent to your email! 📧');
      navigate('/verify-email', { state: { email: form.username.trim() } });
    } catch (error) {
      const fieldErrors = extractFieldErrors(error);
      if (fieldErrors) {
        setErrors(fieldErrors);
      }
      toast.error(extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Start your wellness journey today."
      subtext="Create an account to track fitness goals, monitor progress, and build healthier habits."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Create account</h2>
          <p className="text-gray-500">Join WellNest and take control of your health</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormInput
              label="First name"
              id="register-first"
              name="first"
              autoComplete="given-name"
              placeholder="Hardik"
              value={form.first}
              onChange={handleChange}
              error={errors.first}
              disabled={loading}
            />
            <FormInput
              label="Last name"
              id="register-last"
              name="last"
              autoComplete="family-name"
              placeholder="Joshi"
              value={form.last}
              onChange={handleChange}
              error={errors.last}
              disabled={loading}
            />
          </div>

          <FormInput
            label="Email address"
            id="register-email"
            name="username"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            disabled={loading}
          />

          <PasswordInput
            label="Password"
            id="register-password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            disabled={loading}
          />

          <PasswordInput
            label="Confirm password"
            id="register-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={loading}
          />

          {/* Role selection */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">I want to join as</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: 'USER' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                  form.role === 'USER'
                    ? 'border-forest-500 bg-forest-50 text-forest-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                🏃 User
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: 'TRAINER' }))}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium border-2 transition-all duration-200 ${
                  form.role === 'TRAINER'
                    ? 'border-forest-500 bg-forest-50 text-forest-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                💪 Trainer
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Register;
