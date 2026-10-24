import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import FormInput from '../components/FormInput';
import { forgotPassword, extractErrorMessage } from '../api/authApi';

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!username.trim()) {
      setError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username)) {
      setError('Please enter a valid email address');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await forgotPassword({ username: username.trim() });
      toast.success('If that email is registered, a reset code has been sent.');
      navigate('/reset-password', { state: { email: username.trim() } });
    } catch (err) {
      // Still show a neutral message to avoid user enumeration
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      headline="Forgot your password?"
      subtext="No worries! Enter your email and we'll send you a reset code."
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <div className="w-16 h-16 bg-forest-100 rounded-2xl flex items-center justify-center mb-4">
            <KeyRound className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Reset password</h2>
          <p className="text-gray-500 text-sm">
            Enter the email address associated with your account and we&apos;ll send you a code to reset your password.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <FormInput
            label="Email address"
            id="forgot-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError('');
            }}
            error={error}
            disabled={loading}
          />

          <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send reset code'
            )}
          </button>
        </form>

        {/* Back link */}
        <Link
          to="/login"
          className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to sign in
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
