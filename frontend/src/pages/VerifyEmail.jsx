import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, Loader2, RotateCcw, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../components/AuthLayout';
import OtpInput from '../components/OtpInput';
import { verifyEmail, resendVerification, extractErrorMessage } from '../api/authApi';

const VerifyEmail = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [email] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Redirect if no email provided
  useEffect(() => {
    if (!email) {
      navigate('/register', { replace: true });
    }
  }, [email, navigate]);

  // Cooldown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      setOtpError('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyEmail({ username: email, otp });
      toast.success(result.message || 'Email verified successfully! 🎉');
      setVerified(true);
    } catch (error) {
      const message = extractErrorMessage(error);
      setOtpError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    setResending(true);
    try {
      const result = await resendVerification({ username: email });
      toast.success(result.message || 'A new code has been sent!');
      setCooldown(60);
      setOtp('');
      setOtpError('');
    } catch (error) {
      toast.error(extractErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  if (!email) return null;

  if (verified) {
    return (
      <AuthLayout
        headline="Account verified!"
        subtext="Your email has been confirmed. You're all set to start your wellness journey."
      >
        <div className="space-y-8 text-center">
          <div className="w-20 h-20 mx-auto bg-forest-100 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-forest-600" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Email verified!</h2>
            <p className="text-gray-500">
              Your account has been created successfully. You can now sign in and start using WellNest.
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
      headline="Almost there!"
      subtext="We've sent a verification code to your email. Enter it below to activate your account."
    >
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2 text-center">
          <div className="w-16 h-16 mx-auto bg-forest-100 rounded-2xl flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-forest-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Check your email</h2>
          <p className="text-gray-500 text-sm">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-gray-700">{email}</span>
          </p>
        </div>

        {/* OTP Form */}
        <form onSubmit={handleVerify} className="space-y-6">
          <OtpInput value={otp} onChange={setOtp} error={otpError} disabled={loading} />

          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="btn-primary flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Verify email
              </>
            )}
          </button>
        </form>

        {/* Resend */}
        <div className="text-center space-y-3">
          <p className="text-sm text-gray-500">Didn&apos;t receive the code?</p>
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || resending}
            className="text-sm link inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline"
          >
            <RotateCcw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending...' : 'Resend code'}
          </button>
        </div>

        {/* Back link */}
        <p className="text-center text-sm text-gray-500">
          Wrong email?{' '}
          <Link to="/register" className="link">
            Go back to registration
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
