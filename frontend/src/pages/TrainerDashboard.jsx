import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  ClipboardList,
  Award,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Calendar,
  Target,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FileText,
  ChevronRight,
  Filter,
  BookOpen,
  BarChart3,
  Activity,
  Flame,
  Droplets,
  Moon,
  Dumbbell,
  Sliders,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as trainerApi from '../api/trainerApi';
import ClientAnalyticsModal from '../components/ClientAnalyticsModal';
import AssignGoalModal from '../components/AssignGoalModal';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [clients, setClients] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [plans, setPlans] = useState([]);

  // Active Tab: 'clients' | 'requests' | 'plans' | 'analytics'
  const [activeTab, setActiveTab] = useState('clients');

  // Client Analytics & Goal Assignment Selection
  const [selectedClientForAnalytics, setSelectedClientForAnalytics] = useState(null);
  const [selectedClientForAssignGoal, setSelectedClientForAssignGoal] = useState(null);
  const [analyticsTabClientId, setAnalyticsTabClientId] = useState('');

  // Client search & plan filter
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientForPlanFilter, setSelectedClientForPlanFilter] = useState('ALL');

  // Assign Plan Modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planForm, setPlanForm] = useState({ userId: '', title: '', details: '' });
  const [assigningPlan, setAssigningPlan] = useState(false);

  // Request Action Loading
  const [processingRequestId, setProcessingRequestId] = useState(null);

  // Load all trainer data
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [profileRes, clientsRes, requestsRes, plansRes] = await Promise.allSettled([
        trainerApi.getTrainerProfile(),
        trainerApi.getClients(),
        trainerApi.getPendingRequests(),
        trainerApi.getGivenPlans(),
      ]);

      if (profileRes.status === 'fulfilled') setProfile(profileRes.value);
      if (clientsRes.status === 'fulfilled') setClients(clientsRes.value || []);
      if (requestsRes.status === 'fulfilled') setPendingRequests(requestsRes.value || []);
      if (plansRes.status === 'fulfilled') setPlans(plansRes.value || []);
    } catch (err) {
      toast.error('Failed to load trainer data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Handle Accept Client Request
  const handleAcceptRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    try {
      await trainerApi.acceptRequest(requestId);
      toast.success('Client request accepted! 🎉');
      // Refresh clients and requests
      const [newClients, newRequests] = await Promise.all([
        trainerApi.getClients(),
        trainerApi.getPendingRequests(),
      ]);
      setClients(newClients || []);
      setPendingRequests(newRequests || []);
    } catch (error) {
      toast.error(trainerApi.extractErrorMessage(error));
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Handle Reject Client Request
  const handleRejectRequest = async (requestId) => {
    setProcessingRequestId(requestId);
    try {
      await trainerApi.rejectRequest(requestId);
      toast.info('Client request declined');
      const newRequests = await trainerApi.getPendingRequests();
      setPendingRequests(newRequests || []);
    } catch (error) {
      toast.error(trainerApi.extractErrorMessage(error));
    } finally {
      setProcessingRequestId(null);
    }
  };

  // Open Assign Plan modal prefilled with client
  const handleOpenAssignModal = (clientId = '') => {
    setPlanForm({
      userId: clientId ? String(clientId) : (clients[0]?.userId ? String(clients[0].userId) : ''),
      title: '',
      details: '',
    });
    setIsPlanModalOpen(true);
  };

  // Submit Plan Assignment
  const handleAssignPlanSubmit = async (e) => {
    e.preventDefault();
    if (!planForm.userId) {
      toast.error('Please select or specify a Client ID');
      return;
    }
    if (!planForm.title.trim()) {
      toast.error('Please enter a plan title');
      return;
    }
    if (!planForm.details.trim()) {
      toast.error('Please enter the plan details');
      return;
    }

    setAssigningPlan(true);
    try {
      await trainerApi.assignPlan({
        userId: Number(planForm.userId),
        title: planForm.title,
        details: planForm.details,
      });
      toast.success('Workout & diet plan assigned successfully!');
      setIsPlanModalOpen(false);
      setPlanForm({ userId: '', title: '', details: '' });
      // Refresh plans
      const newPlans = await trainerApi.getGivenPlans();
      setPlans(newPlans || []);
      setActiveTab('plans');
    } catch (error) {
      toast.error(trainerApi.extractErrorMessage(error));
    } finally {
      setAssigningPlan(false);
    }
  };

  // Filter clients
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const query = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        String(c.userId).includes(query) ||
        (c.fitnessGoal && c.fitnessGoal.toLowerCase().includes(query))
    );
  }, [clients, clientSearch]);

  // Filter plans
  const filteredPlans = useMemo(() => {
    if (selectedClientForPlanFilter === 'ALL') return plans;
    return plans.filter((p) => String(p.userId) === String(selectedClientForPlanFilter));
  }, [plans, selectedClientForPlanFilter]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-gray-500">Loading trainer dashboard...</p>
      </div>
    );
  }

  const trainerName = profile?.first || user?.first || 'Coach';

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-teal-900 to-forest-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold backdrop-blur-sm border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Trainer Command Center
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Welcome back, {trainerName} 👋
            </h1>
            <p className="text-emerald-100/80 text-sm sm:text-base max-w-2xl leading-relaxed">
              Monitor active clients, approve coaching requests, and assign personalized workout and nutrition plans.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleOpenAssignModal()}
              disabled={clients.length === 0}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-900 font-bold text-sm shadow-lg hover:bg-emerald-50 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Assign New Plan
            </button>
            <button
              onClick={() => navigate('/community')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/20 active:scale-95 transition-all cursor-pointer"
            >
              <BookOpen className="w-4 h-4" />
              Community & Articles
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Metric 1: Active Clients */}
        <div
          onClick={() => setActiveTab('clients')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'clients' ? 'border-emerald-500 ring-2 ring-emerald-500/10 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Active Clients</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{clients.length}</span>
            <span className="text-xs text-gray-400 font-medium">currently coached</span>
          </div>
        </div>

        {/* Metric 2: Pending Requests */}
        <div
          onClick={() => setActiveTab('requests')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'requests' ? 'border-amber-500 ring-2 ring-amber-500/10 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Pending Requests</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center relative">
              <UserPlus className="w-5 h-5" />
              {pendingRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{pendingRequests.length}</span>
            <span className="text-xs text-amber-600 font-semibold">
              {pendingRequests.length === 1 ? 'awaiting response' : 'awaiting responses'}
            </span>
          </div>
        </div>

        {/* Metric 3: Plans Created */}
        <div
          onClick={() => setActiveTab('plans')}
          className={`cursor-pointer bg-white rounded-2xl p-5 border transition-all duration-200 hover:shadow-md ${
            activeTab === 'plans' ? 'border-teal-500 ring-2 ring-teal-500/10 shadow-sm' : 'border-gray-200/80'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Assigned Plans</span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <ClipboardList className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{plans.length}</span>
            <span className="text-xs text-gray-400 font-medium">routines delivered</span>
          </div>
        </div>

        {/* Metric 4: Trainer Profile Status */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Trainer Status</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profile?.verified ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
              profile?.verified
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {profile?.verified ? 'Verified Coach' : 'Standard Profile'}
            </span>
            <span className="text-xs text-gray-500 truncate max-w-[120px]">
              {profile?.specialization || 'Fitness'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('clients')}
          className={`flex items-center gap-2.5 pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'clients'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Active Clients
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'clients' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {clients.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          className={`flex items-center gap-2.5 pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'requests'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2.5 pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'plans'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Assigned Plans
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'plans' ? 'bg-teal-100 text-teal-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {plans.length}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveTab('analytics');
            if (!analyticsTabClientId && clients.length > 0) {
              setAnalyticsTabClientId(String(clients[0].userId));
            }
          }}
          className={`flex items-center gap-2.5 pb-4 px-4 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Client Analytics
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === 'analytics' ? 'bg-forest-100 text-forest-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {clients.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Active Clients View */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* Search bar & count */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search clients by goal or ID..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
            <span className="text-xs text-gray-400 font-medium">
              Showing {filteredClients.length} of {clients.length} clients
            </span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No active clients yet</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                When users book you for fitness coaching, their requests will appear in the{' '}
                <strong className="text-emerald-700">Pending Requests</strong> tab. Once accepted, you can track them here and deliver tailored plans.
              </p>
              {pendingRequests.length > 0 && (
                <button
                  onClick={() => setActiveTab('requests')}
                  className="btn-primary inline-flex items-center gap-2 mt-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Review {pendingRequests.length} Pending Requests
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClients.map((client) => {
                const clientPlansCount = plans.filter((p) => p.userId === client.userId).length;
                const clientDate = client.since
                  ? new Date(client.since).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Recent';

                return (
                  <div
                    key={client.userId}
                    className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Client Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-500/20">
                            #{client.userId}
                          </div>
                          <div>
                            <h4 className="text-base font-bold text-gray-900 leading-tight">
                              Client #{client.userId}
                            </h4>
                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />
                              Since {clientDate}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Active
                        </span>
                      </div>

                      {/* Fitness Goal Card */}
                      <div className="bg-forest-50/60 rounded-xl p-3 border border-forest-100/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-forest-800 mb-1">
                          <Target className="w-3.5 h-3.5 text-forest-600" />
                          Primary Goal
                        </div>
                        <p className="text-sm font-semibold text-gray-800">
                          {client.fitnessGoal || 'General Fitness & Health'}
                        </p>
                      </div>

                      {/* Coaching summary */}
                      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                        <span>Plans assigned:</span>
                        <span className="font-bold text-gray-800">{clientPlansCount} routines</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-5 pt-4 border-t border-gray-100 flex items-center gap-2">
                      <button
                        onClick={() => setSelectedClientForAnalytics(client)}
                        className="py-2 px-2.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 font-bold text-xs flex items-center justify-center gap-1 border border-forest-200/80 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="View client activity, workouts, and health analytics"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-forest-700" />
                        Analytics
                      </button>
                      <button
                        onClick={() => setSelectedClientForAssignGoal(client)}
                        className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1 border border-emerald-200/80 transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                        title="Assign particular goals (e.g. 3L water, 6h sleep)"
                      >
                        <Sliders className="w-3.5 h-3.5 text-emerald-700" />
                        Goals
                      </button>
                      <button
                        onClick={() => handleOpenAssignModal(client.userId)}
                        className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Plan
                      </button>
                      <button
                        onClick={() => {
                          setSelectedClientForPlanFilter(String(client.userId));
                          setActiveTab('plans');
                        }}
                        className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-98 text-gray-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                        title="View assigned plans history"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        History
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Pending Requests View */}
      {activeTab === 'requests' && (
        <div className="space-y-4">
          {pendingRequests.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">All caught up!</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You have no pending client requests right now. New booking requests will appear here instantly.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((req) => {
                const reqDate = req.createdAt
                  ? new Date(req.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Pending';

                const isProcessing = processingRequestId === req.id;

                return (
                  <div
                    key={req.id}
                    className="bg-white rounded-2xl p-5 border border-amber-200/60 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 font-black text-sm flex items-center justify-center border border-amber-200/80 shrink-0">
                        #{req.userId}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-gray-900">
                            Coaching Request from User #{req.userId}
                          </h4>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            Pending Approval
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Target className="w-3.5 h-3.5 text-forest-600" />
                          <span className="font-semibold text-gray-700">Fitness Goal:</span>{' '}
                          {req.userGoal || 'Not specified'}
                        </p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Received on {reqDate}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <button
                        onClick={() => handleAcceptRequest(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Accept Client
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        disabled={isProcessing}
                        className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 font-semibold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Assigned Plans View */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-gray-600">Filter by client:</span>
              <select
                value={selectedClientForPlanFilter}
                onChange={(e) => setSelectedClientForPlanFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="ALL">All Clients ({plans.length})</option>
                {clients.map((c) => (
                  <option key={c.userId} value={String(c.userId)}>
                    Client #{c.userId} ({c.fitnessGoal || 'Fitness'})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleOpenAssignModal()}
              disabled={clients.length === 0}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign New Plan
            </button>
          </div>

          {filteredPlans.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No workout or diet plans found</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                You haven&apos;t assigned any plans to this client yet. Create one now to help them reach their fitness milestones.
              </p>
              {clients.length > 0 && (
                <button
                  onClick={() => handleOpenAssignModal()}
                  className="btn-primary inline-flex items-center gap-2 mt-2"
                >
                  <Plus className="w-4 h-4" />
                  Assign First Plan
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {filteredPlans.map((plan) => {
                const planDate = plan.createdAt
                  ? new Date(plan.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent';

                return (
                  <div
                    key={plan.id}
                    className="bg-white rounded-2xl p-5 border border-gray-200/80 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60">
                            Client #{plan.userId}
                          </span>
                          <h4 className="text-base font-bold text-gray-900 leading-snug">
                            {plan.title}
                          </h4>
                        </div>
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">
                          {planDate}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-mono text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                        {plan.details}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                      <span>Plan ID: #{plan.id}</span>
                      <button
                        onClick={() => handleOpenAssignModal(plan.userId)}
                        className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        Update or Add Routine
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Client Analytics View */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {clients.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-gray-200/80 shadow-sm max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">No client telemetry yet</h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                Once clients book you for training, their real-time workout logs, calorie balance, sleep, and goal progress will be tracked here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Client Selection Bar */}
              <div className="card p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
                    <BarChart3 className="w-5 h-5 text-emerald-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      Client Performance & Wellness Telemetry
                    </h3>
                    <p className="text-xs text-gray-500">
                      Select an active client to view their logs, goal completion, and health indicators.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-500 hidden sm:inline">Active Client:</span>
                  <select
                    value={analyticsTabClientId || (clients[0]?.userId ? String(clients[0].userId) : '')}
                    onChange={(e) => setAnalyticsTabClientId(e.target.value)}
                    className="px-4 py-2 text-xs font-extrabold bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/20 text-gray-800"
                  >
                    {clients.map((c) => (
                      <option key={c.userId} value={String(c.userId)}>
                        Client #{c.userId} — {c.fitnessGoal || 'General Fitness'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Client Cards for Quick Analytics Trigger */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {clients.map((c) => {
                  const isSelected = String(c.userId) === (analyticsTabClientId || String(clients[0]?.userId));
                  return (
                    <div
                      key={c.userId}
                      className={`card p-5 bg-white border rounded-2xl transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'border-gray-200/80 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => setAnalyticsTabClientId(String(c.userId))}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black text-xs flex items-center justify-center shadow-sm">
                            #{c.userId}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">Client #{c.userId}</h4>
                            <p className="text-xs text-gray-500 line-clamp-1">{c.fitnessGoal || 'Fitness Goal'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientForAssignGoal(c);
                            }}
                            className="px-2.5 py-1.5 bg-forest-50 hover:bg-forest-100 text-forest-800 font-extrabold text-xs rounded-xl border border-forest-200 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                            title="Assign particular goals (e.g. 3L water, 6h sleep)"
                          >
                            <Sliders className="w-3.5 h-3.5 text-forest-700" />
                            Assign Goals
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientForAnalytics(c);
                            }}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl border border-emerald-200/80 transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                            Full Analytics
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Embedded Detailed View for the Selected Client */}
              {(() => {
                const activeClientObj = clients.find(
                  (c) => String(c.userId) === (analyticsTabClientId || String(clients[0]?.userId))
                ) || clients[0];

                if (!activeClientObj) return null;

                return (
                  <div className="card p-6 bg-white border border-gray-200/90 rounded-3xl space-y-6 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                      <div>
                        <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                          Telemetry & Goals for Client #{activeClientObj.userId}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Goal: {activeClientObj.fitnessGoal || 'General Wellness'} &bull; Real-time tracking of water, sleep, and workouts.
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedClientForAssignGoal(activeClientObj)}
                          className="px-3.5 py-2 bg-forest-50 hover:bg-forest-100 text-forest-800 font-extrabold text-xs rounded-xl border border-forest-200 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <Sliders className="w-3.5 h-3.5 text-forest-700" />
                          Assign Specific Goals (3L Water / 6h Sleep)
                        </button>

                        <button
                          onClick={() => setSelectedClientForAnalytics(activeClientObj)}
                          className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <BarChart3 className="w-4 h-4" />
                          Open Comprehensive Telemetry Dashboard
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      Assign custom targets like <strong>&ldquo;Drink at least 3.0 Litres water per day&rdquo;</strong> or <strong>&ldquo;Sleep at least 6.0 hours&rdquo;</strong>.
                      Clients who track below target will be highlighted with red (e.g. 2h sleep / severe deficit) and yellow (e.g. 4h sleep / in progress), and green upon achieving target goals.
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* Modal: Assign Plan */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Assign Workout / Diet Plan</h3>
                  <p className="text-xs text-gray-400">Design a customized routine for your client</p>
                </div>
              </div>
              <button
                onClick={() => setIsPlanModalOpen(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignPlanSubmit} className="space-y-4">
              {/* Select Client */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Select Client *
                </label>
                {clients.length > 0 ? (
                  <select
                    value={planForm.userId}
                    onChange={(e) => setPlanForm({ ...planForm, userId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="" disabled>Choose a client...</option>
                    {clients.map((c) => (
                      <option key={c.userId} value={String(c.userId)}>
                        Client #{c.userId} — {c.fitnessGoal || 'General Fitness'}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    placeholder="Enter Client User ID"
                    value={planForm.userId}
                    onChange={(e) => setPlanForm({ ...planForm, userId: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Plan Title */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Plan Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 4-Week Hypertrophy & Protein Nutrition Plan"
                  value={planForm.title}
                  onChange={(e) => setPlanForm({ ...planForm, title: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Plan Details */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Plan Details & Instructions *
                </label>
                <textarea
                  rows={5}
                  placeholder={`- Day 1: Upper Body (Bench Press 4x8, Lat Pulldown 4x10)
- Day 2: Cardio & Core (30m Zone 2, Planks 3x1m)
- Daily Target: 140g Protein, 2.5L Water, 2,100 kcal`}
                  value={planForm.details}
                  onChange={(e) => setPlanForm({ ...planForm, details: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-mono text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 leading-relaxed"
                />
              </div>

              {/* Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assigningPlan}
                  className="btn-primary inline-flex items-center gap-2 cursor-pointer"
                >
                  {assigningPlan ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <ClipboardList className="w-4 h-4" />
                      Assign Plan
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Client Analytics */}
      {selectedClientForAnalytics && (
        <ClientAnalyticsModal
          client={selectedClientForAnalytics}
          onClose={() => setSelectedClientForAnalytics(null)}
          onAssignPlan={(cid) => {
            setSelectedClientForAnalytics(null);
            handleOpenAssignModal(cid);
          }}
        />
      )}

      {/* Modal: Assign Custom Goals (Water, Sleep, Workouts) */}
      {selectedClientForAssignGoal && (
        <AssignGoalModal
          isOpen={Boolean(selectedClientForAssignGoal)}
          client={selectedClientForAssignGoal}
          onClose={() => setSelectedClientForAssignGoal(null)}
          onSuccess={() => {
            toast.success(`Target goals saved for Client #${selectedClientForAssignGoal?.userId}! 🎯`);
          }}
        />
      )}
    </div>
  );
};

export default TrainerDashboard;
