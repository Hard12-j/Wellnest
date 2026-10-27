import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  MessageSquare,
  Search,
  Sparkles,
  ShieldCheck,
  MapPin,
  Briefcase,
  Clock,
  Phone,
  Send,
  CheckCircle2,
  Clock3,
  XCircle,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  Award,
  ArrowRight,
  UserCheck,
  Flame,
  ClipboardList,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as trainerApi from '../api/trainerApi';
import * as profileApi from '../api/profileApi';

const SPECIALIZATION_OPTIONS = [
  { value: 'ALL', label: 'All Specializations' },
  { value: 'Weight Loss', label: 'Weight Loss' },
  { value: 'Muscle Building', label: 'Muscle Building / Hypertrophy' },
  { value: 'Strength & Conditioning', label: 'Strength & Conditioning' },
  { value: 'HIIT & Cardio', label: 'HIIT & Cardio' },
  { value: 'Yoga & Flexibility', label: 'Yoga & Flexibility' },
  { value: 'Nutrition & Diet', label: 'Nutrition & Meal Planning' },
  { value: 'Rehabilitation & Posture', label: 'Rehab & Mobility' },
];

const Trainers = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Active navigation tab: 'recommended' | 'browse' | 'my-coaching'
  const [activeTab, setActiveTab] = useState('recommended');

  // Loading states
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [searching, setSearching] = useState(false);
  const [sendingRequestId, setSendingRequestId] = useState(null);

  // User Profile goal
  const [userProfile, setUserProfile] = useState(null);

  // Data states
  const [recommendedTrainers, setRecommendedTrainers] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myPlans, setMyPlans] = useState([]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(9);
  const [searchResults, setSearchResults] = useState({
    content: [],
    page: 0,
    size: 9,
    totalElements: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedTrainerForDetail, setSelectedTrainerForDetail] = useState(null);
  const [selectedTrainerForRequest, setSelectedTrainerForRequest] = useState(null);
  const [selectedPlanForView, setSelectedPlanForView] = useState(null);

  // Find accepted trainer request if any
  const acceptedRequest = useMemo(
    () => myRequests.find((r) => r.status === 'ACCEPTED'),
    [myRequests]
  );

  const hasActiveCoach = Boolean(acceptedRequest);

  // Load user profile, recommendations, requests, and plans
  const loadInitialData = useCallback(async () => {
    setLoadingInitial(true);
    try {
      const [profileRes, recommendedRes, requestsRes, plansRes] = await Promise.allSettled([
        profileApi.getProfile(),
        trainerApi.getRecommendedTrainers(),
        trainerApi.getMyRequests(),
        trainerApi.getMyPlans(),
      ]);

      if (profileRes.status === 'fulfilled') setUserProfile(profileRes.value);
      if (recommendedRes.status === 'fulfilled') setRecommendedTrainers(recommendedRes.value || []);
      if (requestsRes.status === 'fulfilled') setMyRequests(requestsRes.value || []);
      if (plansRes.status === 'fulfilled') setMyPlans(plansRes.value || []);
    } catch {
      toast.error('Unable to fetch trainer recommendations');
    } finally {
      setLoadingInitial(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Execute trainer directory search
  const executeSearch = useCallback(
    async (pageToFetch = 0) => {
      setSearching(true);
      try {
        const data = await trainerApi.searchTrainers({
          q: searchQuery,
          specialization: specializationFilter,
          location: locationFilter,
          page: pageToFetch,
          size: pageSize,
        });
        setSearchResults(data || { content: [], page: 0, size: pageSize, totalElements: 0, totalPages: 0 });
        setCurrentPage(pageToFetch);
      } catch (err) {
        toast.error('Failed to search trainers');
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, specializationFilter, locationFilter, pageSize]
  );

  // Trigger search when tab changes to browse
  useEffect(() => {
    if (activeTab === 'browse') {
      executeSearch(0);
    }
  }, [activeTab, specializationFilter]);

  // Handle Search Form Submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    executeSearch(0);
  };

  // Clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setSpecializationFilter('ALL');
    setLocationFilter('');
    executeSearch(0);
  };

  // Helper to determine request status for a specific trainer ID
  const getTrainerRequestStatus = (trainerUserId) => {
    const req = myRequests.find((r) => r.trainerId === trainerUserId);
    return req ? req.status : null;
  };

  // Send request confirmation
  const handleConfirmSendRequest = async () => {
    if (!selectedTrainerForRequest) return;
    const trainerId = selectedTrainerForRequest.userId;
    setSendingRequestId(trainerId);

    try {
      const response = await trainerApi.sendTrainerRequest(trainerId);
      toast.success(
        `Request sent to Coach ${selectedTrainerForRequest.first} ${selectedTrainerForRequest.last}! 🚀`
      );

      // Refresh requests and recommended list
      const [newRequests, newRecommended] = await Promise.all([
        trainerApi.getMyRequests(),
        trainerApi.getRecommendedTrainers(),
      ]);

      setMyRequests(newRequests || []);
      setRecommendedTrainers(newRecommended || []);

      // Also update search results in-place if present
      setSearchResults((prev) => ({
        ...prev,
        content: prev.content.map((t) =>
          t.userId === trainerId ? { ...t, requestStatus: 'PENDING' } : t
        ),
      }));

      setSelectedTrainerForRequest(null);
      if (selectedTrainerForDetail?.userId === trainerId) {
        setSelectedTrainerForDetail((prev) => ({ ...prev, requestStatus: 'PENDING' }));
      }
    } catch (err) {
      toast.error(trainerApi.extractErrorMessage(err));
    } finally {
      setSendingRequestId(null);
    }
  };

  // Initials generator
  const getInitials = (first, last) => {
    return `${first?.[0] || 'T'}${last?.[0] || ''}`.toUpperCase();
  };

  // Formatted goal string
  const formattedGoal = userProfile?.fitnessGoal
    ? userProfile.fitnessGoal.replace(/_/g, ' ')
    : 'Not Specified';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* ── Top Hero Banner ── */}
      <div className="bg-gradient-to-br from-forest-700 via-forest-800 to-forest-950 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-xl">
        <div className="absolute -top-16 -right-16 w-72 h-72 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-mint-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 text-forest-200 text-xs font-semibold px-3 py-1 bg-white/10 rounded-full backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Verified Expert Coaching
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Train With Elite Coaches
            </h1>
            <p className="text-forest-100/80 text-sm sm:text-base leading-relaxed">
              Discover certified personal trainers, get goal-matched recommendations, and receive
              tailored workout and nutrition routines designed for your body.
            </p>

            {/* Current user goal chip */}
            <div className="pt-1 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-forest-200/80">Your Target Focus:</span>
              <span className="px-3 py-1 rounded-full bg-forest-600/60 border border-forest-400/30 text-white font-bold inline-flex items-center gap-1.5 shadow-sm">
                <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                {formattedGoal}
              </span>
            </div>
          </div>

          {/* Coaching Status Pill */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-5 rounded-2xl flex items-center gap-4 min-w-[240px] shadow-lg">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                hasActiveCoach
                  ? 'bg-emerald-500 shadow-emerald-500/30'
                  : myRequests.some((r) => r.status === 'PENDING')
                  ? 'bg-amber-500 shadow-amber-500/30'
                  : 'bg-white/20'
              }`}
            >
              {hasActiveCoach ? (
                <UserCheck className="w-6 h-6" />
              ) : myRequests.some((r) => r.status === 'PENDING') ? (
                <Clock3 className="w-6 h-6" />
              ) : (
                <Users className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-forest-200 font-bold">
                Coaching Status
              </p>
              <p className="text-sm font-extrabold text-white">
                {hasActiveCoach
                  ? 'Active Coach Assigned'
                  : myRequests.some((r) => r.status === 'PENDING')
                  ? 'Request In Review'
                  : 'Ready to Connect'}
              </p>
              <p className="text-[11px] text-forest-200/80">
                {myPlans.length > 0 ? `${myPlans.length} assigned plans` : 'Explore trainers below'}
              </p>
              {hasActiveCoach && acceptedRequest && (
                <button
                  onClick={() => navigate(`/chat?trainerId=${acceptedRequest.trainerId}`)}
                  className="mt-2.5 px-3 py-1.5 bg-white hover:bg-forest-50 text-forest-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-forest-600" />
                  Chat with Coach
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200/80 pb-3">
        <div className="flex items-center gap-2 bg-gray-100/80 p-1.5 rounded-2xl border border-gray-200/60">
          <button
            onClick={() => setActiveTab('recommended')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'recommended'
                ? 'bg-white text-forest-700 shadow-sm border border-gray-200/50'
                : 'text-gray-600 hover:text-forest-700 hover:bg-white/50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            Recommended For You
            {recommendedTrainers.length > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-forest-100 text-forest-700 font-extrabold">
                {recommendedTrainers.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'browse'
                ? 'bg-white text-forest-700 shadow-sm border border-gray-200/50'
                : 'text-gray-600 hover:text-forest-700 hover:bg-white/50'
            }`}
          >
            <Search className="w-4 h-4" />
            Browse & Search
          </button>

          <button
            onClick={() => setActiveTab('my-coaching')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === 'my-coaching'
                ? 'bg-white text-forest-700 shadow-sm border border-gray-200/50'
                : 'text-gray-600 hover:text-forest-700 hover:bg-white/50'
            }`}
          >
            <Award className="w-4 h-4 text-emerald-600" />
            My Coaching & Plans
            {(hasActiveCoach || myRequests.length > 0 || myPlans.length > 0) && (
              <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-emerald-100 text-emerald-800 font-extrabold">
                {myPlans.length || myRequests.length}
              </span>
            )}
          </button>
        </div>

        <button
          onClick={loadInitialData}
          disabled={loadingInitial}
          title="Refresh trainers"
          className="p-2.5 text-gray-500 hover:text-forest-700 hover:bg-forest-50 rounded-xl transition-all border border-gray-200/80"
        >
          <RefreshCw className={`w-4 h-4 ${loadingInitial ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── TAB 1: RECOMMENDED TRAINERS ── */}
      {activeTab === 'recommended' && (
        <div className="space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Goal-Matched Recommendations
              </h2>
              <p className="text-xs text-gray-500">
                Coaches whose specialty aligns with your goal: <strong className="text-forest-700">{formattedGoal}</strong>
              </p>
            </div>
            <button
              onClick={() => setActiveTab('browse')}
              className="text-xs font-bold text-forest-600 hover:text-forest-700 inline-flex items-center gap-1 self-start sm:self-auto"
            >
              Browse all coaches <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {loadingInitial ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Finding the best coaches for your goal...</p>
            </div>
          ) : recommendedTrainers.length === 0 ? (
            <div className="card p-10 text-center space-y-4 max-w-xl mx-auto border-dashed border-2 border-gray-200">
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No Direct Matches For Current Goal</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                We couldn&apos;t find an exact specialty match for &ldquo;{formattedGoal}&rdquo; yet, or your profile goal
                is not updated. You can explore all our certified coaches in the directory!
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-5 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                >
                  Explore All Trainers
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedTrainers.map((trainer) => (
                <TrainerCard
                  key={trainer.userId}
                  trainer={trainer}
                  effectiveStatus={getTrainerRequestStatus(trainer.userId) || trainer.requestStatus}
                  hasActiveCoach={hasActiveCoach}
                  onViewDetails={() => setSelectedTrainerForDetail(trainer)}
                  onRequestClick={() => setSelectedTrainerForRequest(trainer)}
                  getInitials={getInitials}
                  isRecommended
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: BROWSE & SEARCH TRAINERS ── */}
      {activeTab === 'browse' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Filter Controls */}
          <div className="card p-6 border border-gray-100 shadow-sm space-y-4">
            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
              {/* Search text */}
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by trainer name or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-10 text-sm py-2.5"
                />
              </div>

              {/* Specialization Filter */}
              <div className="md:col-span-4">
                <select
                  value={specializationFilter}
                  onChange={(e) => setSpecializationFilter(e.target.value)}
                  className="input-field text-sm py-2.5 bg-white cursor-pointer"
                >
                  {SPECIALIZATION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Location input */}
              <div className="md:col-span-3 relative">
                <MapPin className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="City / Location..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="input-field pl-10 text-sm py-2.5"
                />
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center gap-2 text-gray-500">
                <Filter className="w-3.5 h-3.5 text-forest-600" />
                <span>
                  Found{' '}
                  <strong className="text-gray-800">{searchResults.totalElements}</strong> coaches
                </span>
                {(searchQuery || specializationFilter !== 'ALL' || locationFilter) && (
                  <button
                    onClick={handleClearFilters}
                    className="ml-2 text-forest-600 hover:underline font-semibold"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              <button
                onClick={() => executeSearch(0)}
                disabled={searching}
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-sm transition-all text-xs"
              >
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Search
              </button>
            </div>
          </div>

          {/* Results Grid */}
          {searching ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-forest-600 animate-spin" />
              <p className="text-sm text-gray-500 font-medium">Searching certified trainers...</p>
            </div>
          ) : searchResults.content.length === 0 ? (
            <div className="card p-12 text-center space-y-3 max-w-lg mx-auto">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800">No Trainers Found</h3>
              <p className="text-xs text-gray-500">
                No coaches matched your search criteria. Try loosening your filters or search keywords.
              </p>
              <button
                onClick={handleClearFilters}
                className="mt-2 px-4 py-2 bg-forest-50 text-forest-700 hover:bg-forest-100 rounded-xl text-xs font-bold transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.content.map((trainer) => (
                  <TrainerCard
                    key={trainer.userId}
                    trainer={trainer}
                    effectiveStatus={getTrainerRequestStatus(trainer.userId) || trainer.requestStatus}
                    hasActiveCoach={hasActiveCoach}
                    onViewDetails={() => setSelectedTrainerForDetail(trainer)}
                    onRequestClick={() => setSelectedTrainerForRequest(trainer)}
                    getInitials={getInitials}
                  />
                ))}
              </div>

              {/* Pagination controls */}
              {searchResults.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                  <button
                    onClick={() => executeSearch(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0 || searching}
                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-forest-50 hover:text-forest-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <span className="text-xs font-bold text-gray-600">
                    Page {currentPage + 1} of {searchResults.totalPages}
                  </span>

                  <button
                    onClick={() => executeSearch(Math.min(searchResults.totalPages - 1, currentPage + 1))}
                    disabled={currentPage >= searchResults.totalPages - 1 || searching}
                    className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-forest-50 hover:text-forest-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB 3: MY COACHING & PLANS ── */}
      {activeTab === 'my-coaching' && (
        <div className="space-y-8 animate-fade-in">
          {/* Active Coach Spotlight */}
          {hasActiveCoach ? (
            <div className="card p-6 sm:p-8 border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-white to-forest-50/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-forest-500 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-emerald-600/20">
                    {acceptedRequest.trainerId ? `C#${acceptedRequest.trainerId}` : 'C'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Assigned Personal Coach
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Connected
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Trainer ID: #{acceptedRequest.trainerId} • Goal:{' '}
                      <strong className="text-gray-700">{acceptedRequest.userGoal || formattedGoal}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-gray-400 uppercase tracking-wider block font-bold">
                    Connected Since
                  </span>
                  <span className="text-xs font-bold text-gray-700">
                    {acceptedRequest.respondedAt
                      ? new Date(acceptedRequest.respondedAt).toLocaleDateString()
                      : new Date(acceptedRequest.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Status Note */}
              <div className="mt-4 flex items-start gap-3 bg-white/80 p-4 rounded-xl border border-emerald-100 text-xs text-gray-600 leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p>
                  Your coach can view your target goals and assigned customized workout routines or
                  dietary guidelines. Check below for any updated plans assigned specifically to you!
                </p>
              </div>
            </div>
          ) : (
            <div className="card p-6 bg-amber-50/60 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">No Active Coach Yet</h4>
                  <p className="text-xs text-amber-800/80">
                    Find and request a certified coach from our recommended or discovery directory to get customized plans!
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('recommended')}
                className="px-4 py-2 bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all"
              >
                Find a Coach
              </button>
            </div>
          )}

          {/* Assigned Plans Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-forest-600" />
                Assigned Workout & Nutrition Plans
              </h3>
              <span className="text-xs text-gray-500 font-medium">
                {myPlans.length} {myPlans.length === 1 ? 'plan' : 'plans'} received
              </span>
            </div>

            {myPlans.length === 0 ? (
              <div className="card p-8 text-center space-y-2 border-dashed border-2 border-gray-200">
                <FileText className="w-8 h-8 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-gray-700">No Plans Assigned Yet</p>
                <p className="text-xs text-gray-400 max-w-md mx-auto">
                  Once your trainer reviews your profile and targets, they will publish personalized
                  workout regimens and nutrition plans here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {myPlans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanForView(plan)}
                    className="card p-5 hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 cursor-pointer border border-gray-100 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                        <span className="font-semibold flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </span>
                        <span className="bg-forest-50 text-forest-700 font-bold px-2 py-0.5 rounded-md text-[10px]">
                          Coach #{plan.trainerId}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-forest-700 transition-colors line-clamp-1">
                        {plan.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-2 line-clamp-3 leading-relaxed whitespace-pre-line">
                        {plan.details}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-forest-600">
                      <span>View Full Plan</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Booking Requests History */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-forest-600" />
              Request History
            </h3>

            {myRequests.length === 0 ? (
              <div className="card p-6 text-center text-xs text-gray-400">
                You haven&apos;t sent any trainer booking requests yet.
              </div>
            ) : (
              <div className="card overflow-hidden border border-gray-200/80">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-50/80 text-gray-500 font-semibold border-b border-gray-200/80">
                      <tr>
                        <th className="py-3 px-4">Trainer ID</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Submitted At</th>
                        <th className="py-3 px-4">Responded At</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {myRequests.map((req) => (
                        <tr key={req.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-gray-800">
                            Coach #{req.trainerId}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                req.status === 'ACCEPTED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : req.status === 'PENDING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {req.status === 'ACCEPTED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {req.status === 'PENDING' && <Clock3 className="w-3.5 h-3.5" />}
                              {req.status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                              {req.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {new Date(req.createdAt).toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-gray-500">
                            {req.respondedAt ? new Date(req.respondedAt).toLocaleString() : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {req.status === 'REJECTED' && !hasActiveCoach && (
                              <button
                                onClick={() =>
                                  setSelectedTrainerForRequest({
                                    userId: req.trainerId,
                                    first: `Coach #${req.trainerId}`,
                                    last: '',
                                    specialization: 'Personal Training',
                                  })
                                }
                                className="px-3 py-1 bg-forest-50 hover:bg-forest-100 text-forest-700 font-bold rounded-lg transition-colors text-[11px]"
                              >
                                Re-Apply
                              </button>
                            )}
                            {req.status === 'PENDING' && (
                              <span className="text-gray-400 italic text-[11px]">Awaiting response</span>
                            )}
                            {req.status === 'ACCEPTED' && (
                              <span className="text-emerald-600 font-bold text-[11px]">Active</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL: CONFIRM SEND REQUEST ── */}
      {selectedTrainerForRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Send Coaching Request</h3>
                <p className="text-xs text-gray-500">Connect with your chosen fitness expert</p>
              </div>
            </div>

            {/* Coach Summary */}
            <div className="p-4 rounded-2xl bg-forest-50/50 border border-forest-100 space-y-2">
              <p className="text-sm font-extrabold text-gray-800">
                Coach {selectedTrainerForRequest.first} {selectedTrainerForRequest.last}
              </p>
              <p className="text-xs text-forest-700 font-semibold">
                Specialization: {selectedTrainerForRequest.specialization}
              </p>
              {selectedTrainerForRequest.location && (
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {selectedTrainerForRequest.location}
                </p>
              )}
            </div>

            <div className="text-xs text-gray-600 leading-relaxed bg-gray-50 p-3.5 rounded-xl border border-gray-200/70">
              <p className="font-semibold text-gray-700 mb-1">What happens next?</p>
              Your target fitness goal (<strong>{formattedGoal}</strong>) will be shared with the trainer.
              Once accepted, you can receive personalized workout routines and nutrition guidelines.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTrainerForRequest(null)}
                className="btn-secondary py-2.5 text-xs flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSendRequest}
                disabled={Boolean(sendingRequestId)}
                className="btn-primary py-2.5 text-xs flex-1 flex items-center justify-center gap-2"
              >
                {sendingRequestId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Confirm & Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW TRAINER PROFILE DETAILS ── */}
      {selectedTrainerForDetail && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-forest-600 to-emerald-400 text-white font-extrabold text-xl flex items-center justify-center shadow-md">
                  {getInitials(selectedTrainerForDetail.first, selectedTrainerForDetail.last)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedTrainerForDetail.first} {selectedTrainerForDetail.last}
                    </h3>
                    {selectedTrainerForDetail.verified && (
                      <span title="Verified Coach" className="text-forest-600">
                        <ShieldCheck className="w-5 h-5 fill-forest-100" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-forest-700 font-bold mt-0.5">
                    {selectedTrainerForDetail.specialization}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedTrainerForDetail(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                  Experience
                </span>
                <span className="font-extrabold text-gray-800 text-sm">
                  {selectedTrainerForDetail.experienceYears != null
                    ? `${selectedTrainerForDetail.experienceYears} Years`
                    : 'Experienced'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                  Location
                </span>
                <span className="font-extrabold text-gray-800 text-sm truncate block">
                  {selectedTrainerForDetail.location || 'Remote / Online'}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 col-span-2">
                <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                  Availability & Schedule
                </span>
                {selectedTrainerForDetail.availability?.includes('|') ? (
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {selectedTrainerForDetail.availability.split('|').map((slot, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 text-xs font-semibold">
                        {slot.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="font-semibold text-gray-700">
                    {selectedTrainerForDetail.availability || 'Weekdays & Weekends (Flexible)'}
                  </span>
                )}
              </div>

              {selectedTrainerForDetail.contactNo && (
                <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 col-span-2">
                  <span className="text-gray-400 uppercase tracking-wider text-[10px] font-bold block mb-1">
                    Contact Information
                  </span>
                  <span className="font-semibold text-gray-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-forest-600" />
                    {selectedTrainerForDetail.contactNo}
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSelectedTrainerForDetail(null)}
                className="btn-secondary py-2.5 text-xs flex-1"
              >
                Close
              </button>

              {getTrainerRequestStatus(selectedTrainerForDetail.userId) === 'ACCEPTED' ? (
                <span className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Your Active Coach
                </span>
              ) : getTrainerRequestStatus(selectedTrainerForDetail.userId) === 'PENDING' ? (
                <span className="flex-1 py-2.5 px-4 rounded-xl bg-amber-100 text-amber-800 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <Clock3 className="w-4 h-4" />
                  Request Pending
                </span>
              ) : (
                <button
                  type="button"
                  disabled={hasActiveCoach}
                  onClick={() => {
                    const t = selectedTrainerForDetail;
                    setSelectedTrainerForDetail(null);
                    setSelectedTrainerForRequest(t);
                  }}
                  className="btn-primary py-2.5 text-xs flex-1 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {hasActiveCoach ? 'Already Have Coach' : 'Send Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: VIEW FULL PLAN DETAILS ── */}
      {selectedPlanForView && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-gray-100 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase tracking-wider font-extrabold text-forest-600 bg-forest-50 px-2.5 py-1 rounded-md">
                  Assigned Plan
                </span>
                <h3 className="text-xl font-extrabold text-gray-900 mt-2">
                  {selectedPlanForView.title}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  From Coach #{selectedPlanForView.trainerId} •{' '}
                  {new Date(selectedPlanForView.createdAt).toLocaleDateString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedPlanForView(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
              {selectedPlanForView.details}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPlanForView(null)}
                className="px-6 py-2.5 bg-forest-600 hover:bg-forest-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
              >
                Close Plan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Subcomponent: Trainer Card
 */
const TrainerCard = ({
  trainer,
  effectiveStatus,
  hasActiveCoach,
  onViewDetails,
  onRequestClick,
  getInitials,
  isRecommended = false,
}) => {
  const isAccepted = effectiveStatus === 'ACCEPTED';
  const isPending = effectiveStatus === 'PENDING';
  const isRejected = effectiveStatus === 'REJECTED';

  return (
    <div className="card p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group relative overflow-hidden">
      {isRecommended && (
        <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-400 to-amber-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-xl shadow-sm flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          Recommended
        </div>
      )}

      <div>
        {/* Profile Header */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest-600 to-emerald-400 text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-forest-600/20 group-hover:scale-105 transition-transform">
            {getInitials(trainer.first, trainer.last)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-gray-900 text-base leading-tight">
                {trainer.first} {trainer.last}
              </h3>
              {trainer.verified && (
                <span title="Verified Trainer" className="text-forest-600">
                  <ShieldCheck className="w-4 h-4 fill-forest-100" />
                </span>
              )}
            </div>
            <span className="inline-block mt-0.5 text-xs font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-md">
              {trainer.specialization}
            </span>
          </div>
        </div>

        {/* Badges / Metrics */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 my-4">
          <div className="flex items-center gap-1.5 bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-100">
            <Briefcase className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium truncate">
              {trainer.experienceYears != null ? `${trainer.experienceYears} yrs exp` : 'Certified'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-gray-50/80 px-2.5 py-1.5 rounded-xl border border-gray-100">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium truncate">{trainer.location || 'Online'}</span>
          </div>
        </div>

        {trainer.availability && (
          <p className="text-xs text-gray-500 line-clamp-1 mb-4 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="truncate">{trainer.availability}</span>
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
        <button
          type="button"
          onClick={onViewDetails}
          className="px-3 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200/80 transition-colors flex-1"
        >
          View Bio
        </button>

        {isAccepted ? (
          <span className="px-3 py-2 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 flex-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Connected
          </span>
        ) : isPending ? (
          <span className="px-3 py-2 bg-amber-100 text-amber-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 flex-1">
            <Clock3 className="w-3.5 h-3.5" />
            Pending
          </span>
        ) : isRejected ? (
          <button
            type="button"
            disabled={hasActiveCoach}
            onClick={onRequestClick}
            className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex-1"
          >
            Re-Apply
          </button>
        ) : (
          <button
            type="button"
            disabled={hasActiveCoach}
            onClick={onRequestClick}
            className="px-3 py-2 bg-forest-600 hover:bg-forest-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1 flex-1"
            title={hasActiveCoach ? 'You already have an active trainer' : 'Send booking request'}
          >
            <Send className="w-3 h-3" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
};

export default Trainers;
