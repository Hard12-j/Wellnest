import WellnessPanel from './WellnessPanel';
import { Leaf } from 'lucide-react';

const AuthLayout = ({ children, headline, subtext }) => {
  return (
    <div className="min-h-screen flex bg-sand-50">
      {/* Left: Wellness Panel (desktop only) */}
      <WellnessPanel headline={headline} subtext={subtext} />

      {/* Right: Form area */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-2 px-6 py-4 bg-forest-600">
          <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
            <Leaf className="w-5 h-5 text-mint-200" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">WellNest</span>
        </div>

        {/* Form container */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 sm:px-12 overflow-y-auto">
          <div className="w-full max-w-md animate-fade-in">{children}</div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} WellNest — Smart Health & Fitness Companion
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
