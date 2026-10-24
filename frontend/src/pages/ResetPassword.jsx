import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Loader2, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import OtpInput from '../components/OtpInput';
import { resetPassword, extractErrorMessage } from '../api/authApi';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: location.state?.email || '',
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.username.trim()) {
      newErrors.username = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
      newErrors.username = 'Please enter a valid email address';
    }
    if (!form.otp || form.otp.length !== 6 || !/^\d{6}$/.test(form.otp)) {
      newErrors.otp = 'Please enter a valid 6-digit code';
    }
    if (!form.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (form.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (form.newPassword !== form.confirmPassword) {
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
      // Only send username, otp, newPassword — confirmPassword is frontend-only
      await resetPassword({
        username: form.username.trim(),
        otp: form.otp,
        newPassword: form.newPassword,
      });
      toast.success('Password reset successfully! 🔐');
      setSuccess(true);
      // Clear sensitive state
      setForm({ username: '', otp: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      const message = extractErrorMessage(error);
      toast.error(message);
      if (message.toLowerCase().includes('otp') || message.toLowerCase().includes('code')) {
        setErrors((prev) => ({ ...prev, otp: message }));
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        headline="Password reset!"
        subtext="Your password has been updated. Sign in with your new credentials."
      >
        <div className="space-y-8 text-center">
          <div className="w-20 h-20 mx-auto bg-forest-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-forest-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Password updated!</h2>
            <p className="text-gray-500">
              Your password has been changed successfully. You can now sign in with your new password.
            </p>
          </div>
          <Link to="/login" className="btn-primary inline-flex items-center justify-center gap-2">
            Continue to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      headline="Reset your password"
      subtext="Enter the code sent to your email and choose a new password."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-forest-100 rounded-2xl flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Set new password</h2>
          <p className="text-gray-500 text-sm">
            Enter the 6-digit code sent to your email and create a new password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <FormInput
            label="Email address"
            id="reset-email"
            name="username"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            disabled={loading}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Verification code</label>
            <OtpInput
              value={form.otp}
              onChange={(val) => {
                setForm((prev) => ({ ...prev, otp: val }));
                if (errors.otp) setErrors((prev) => ({ ...prev, otp: '' }));
              }}
              error={errors.otp}
              disabled={loading}
            />
          </div>

          <PasswordInput
            label="New password"
            id="reset-password"
            name="newPassword"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={form.newPassword}
            onChange={handleChange}
            error={errors.newPassword}
            disabled={loading}
          />

          <PasswordInput
            label="Confirm new password"
            id="reset-confirm"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            disabled={loading}
          />

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting password...
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Reset password
              </>
            )}
          </button>
        </form>

        {/* Back link */}
        <p className="text-center text-sm text-gray-500">
          Remember your password?{' '}
          <Link to="/login" className="link">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;
