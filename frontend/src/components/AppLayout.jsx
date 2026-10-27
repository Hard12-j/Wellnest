import Navbar from './Navbar';

const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-sand-50 text-gray-800 flex flex-col selection:bg-forest-100 selection:text-forest-900">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
      <footer className="border-t border-gray-200/60 bg-white/60 py-6 text-center text-xs text-gray-400">
        <p>© {new Date().getFullYear()} WellNest Health & Fitness. Built with precision and care.</p>
      </footer>
    </div>
  );
};

export default AppLayout;
