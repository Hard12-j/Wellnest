import { Leaf, Heart, Activity, Dumbbell } from 'lucide-react';

const WellnessPanel = ({ headline, subtext }) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-forest-700 via-forest-600 to-forest-800">
      {/* Decorative background elements */}
      <div className="absolute inset-0">
        {/* Large gradient circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-forest-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -left-20 w-96 h-96 bg-mint-400/15 rounded-full blur-3xl animate-float-reverse" />
        <div className="absolute top-1/2 right-10 w-48 h-48 bg-forest-400/10 rounded-full blur-2xl animate-gentle-pulse" />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-12">
          <div className="w-12 h-12 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
            <Leaf className="w-7 h-7 text-mint-200" />
          </div>
          <span className="text-2xl font-bold tracking-tight">WellNest</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
          {headline || 'Your wellness journey starts here.'}
        </h1>
        <p className="text-lg text-forest-100/80 leading-relaxed mb-12 max-w-md">
          {subtext ||
            'Build healthier habits, track your progress, and take control of your wellbeing.'}
        </p>

        {/* Feature cards */}
        <div className="space-y-4">
          <FeatureCard
            icon={<Activity className="w-5 h-5" />}
            title="Smart Tracking"
            description="Monitor your health metrics in real-time"
          />
          <FeatureCard
            icon={<Heart className="w-5 h-5" />}
            title="Personalized Plans"
            description="AI-powered fitness programs tailored to you"
          />
          <FeatureCard
            icon={<Dumbbell className="w-5 h-5" />}
            title="Expert Guidance"
            description="Connect with certified fitness trainers"
          />
        </div>
      </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/8 backdrop-blur-sm border border-white/10 hover:bg-white/12 transition-all duration-300">
    <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0 text-mint-200">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-sm">{title}</h3>
      <p className="text-xs text-forest-200/70">{description}</p>
    </div>
  </div>
);

export default WellnessPanel;
