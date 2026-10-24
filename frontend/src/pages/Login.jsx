import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import PasswordInput from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { extractErrorMessage } from '../api/authApi';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [form, setForm] = useState({ username: '', password: '' });
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
    if (!form.username.trim()) {
      newErrors.username = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.username)) {
      newErrors.username = 'Please enter a valid email address';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await loginUser({ username: form.username.trim(), password: form.password });
      toast.success('Welcome back! 🌿');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const message = extractErrorMessage(error);
      // Check if user is not verified
      if (message.toLowerCase().includes('not verified') || message.toLowerCase().includes('verify')) {
        toast.error('Please verify your email first.');
        navigate('/verify-email', { state: { email: form.username.trim() } });
      } else {
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome back</h2>
          <p className="text-gray-500">Sign in to continue your wellness journey</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormInput
            label="Email address"
            id="login-email"
            name="username"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.username}
            onChange={handleChange}
            error={errors.username}
            disabled={loading}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Link to="/forgot-password" className="text-sm link" tabIndex={-1}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="login-password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="link">
            Create one
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default Login;
