import { Leaf } from 'lucide-react';

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-sand-50 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Logo */}
        <div className="w-16 h-16 bg-forest-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Leaf className="w-9 h-9 text-white" />
        </div>

        {/* Brand */}
        <h1 className="text-2xl font-bold text-forest-800 tracking-tight">WellNest</h1>

        {/* Spinner */}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-forest-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        <p className="text-sm text-gray-500">Loading your wellness dashboard...</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
