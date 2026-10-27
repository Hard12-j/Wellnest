import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Heart,
  MessageSquare,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Sparkles,
  Calendar,
  User,
  ShieldCheck,
  ArrowRight,
  X,
  Image as ImageIcon,
  FileText,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Loader2,
  Lightbulb,
  Send,
  ExternalLink,
  Layers,
  Flame,
  CheckCircle2,
  Share2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import * as contentApi from '../api/contentApi';

const POST_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Post Categories' },
  { value: 'Daily Update', label: 'Daily Update' },
  { value: 'Workout Done', label: 'Workout Done' },
  { value: 'Nutrition Win', label: 'Nutrition & Meals' },
  { value: 'Motivation', label: 'Motivation & Mindset' },
  { value: 'Milestone', label: 'Milestone Celebration' },
  { value: 'Recovery', label: 'Recovery & Rest' },
  { value: 'General Wellness', label: 'Healthy Habits' },
];

const ARTICLE_CATEGORY_OPTIONS = [
  { value: 'ALL', label: 'All Article Topics' },
  { value: 'Fitness', label: 'Fitness & Workouts' },
  { value: 'Nutrition', label: 'Nutrition & Diet' },
  { value: 'Mental Health', label: 'Mental Wellness & Focus' },
  { value: 'Recovery', label: 'Recovery & Sleep' },
  { value: 'Weight Loss', label: 'Weight Loss Strategies' },
  { value: 'General Wellness', label: 'Healthy Habits' },
];

export default function Community() {
  const { user } = useAuth();
  const isTrainer = user?.role === 'TRAINER';

  // Primary Tabs: 'posts' | 'articles'
  const [activeTab, setActiveTab] = useState('posts');

  // Daily Tip
  const [tipOfTheDay, setTipOfTheDay] = useState(null);
  const [loadingTip, setLoadingTip] = useState(true);

  // ── POSTS STATE (Short updates: both User and Trainer) ──
  const [posts, setPosts] = useState({ content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [postSearch, setPostSearch] = useState('');
  const [postCategory, setPostCategory] = useState('ALL');
  const [postPage, setPostPage] = useState(0);

  // ── ARTICLES STATE (Detailed guides: Trainer only creation) ──
  const [articles, setArticles] = useState({ content: [], page: 0, size: 9, totalElements: 0, totalPages: 0 });
  const [loadingArticles, setLoadingArticles] = useState(true);
  const [articleSearch, setArticleSearch] = useState('');
  const [articleCategory, setArticleCategory] = useState('ALL');
  const [articlePage, setArticlePage] = useState(0);
  const [articleViewMode, setArticleViewMode] = useState('all'); // 'all' | 'mine' (trainer only)

  // ── POST CREATOR MODAL (User & Trainer) ──
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [postForm, setPostForm] = useState({
    title: '',
    category: 'Daily Update',
    content: '',
  });
  const [savingPost, setSavingPost] = useState(false);

  // ── ARTICLE CREATOR / EDITOR MODAL (Trainer only) ──
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
  const [editingArticleId, setEditingArticleId] = useState(null);
  const [articleForm, setArticleForm] = useState({
    title: '',
    category: 'Fitness',
    content: '',
    status: 'PUBLISHED',
    imageUrl: '',
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [savingArticle, setSavingArticle] = useState(false);

  // ── READER / COMMENTS MODAL (For both posts and articles) ──
  const [readingItem, setReadingItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Like loading state tracker
  const [likingId, setLikingId] = useState(null);

  // Current display name
  const currentAuthorName = useMemo(() => {
    const fullName = `${user?.first || ''} ${user?.last || ''}`.trim();
    return fullName || user?.username || (isTrainer ? 'Certified Coach' : 'Wellness Member');
  }, [user, isTrainer]);

  // ── FETCH DAILY TIP ──
  const loadTip = useCallback(async () => {
    setLoadingTip(true);
    try {
      const data = await contentApi.getTipOfTheDay();
      setTipOfTheDay(data);
    } catch {
      setTipOfTheDay({ text: 'Consistency is your greatest superpower. Small healthy choices every day yield massive results.' });
    } finally {
      setLoadingTip(false);
    }
  }, []);

  // ── FETCH POSTS ──
  const fetchPosts = useCallback(
    async (pageToLoad = 0) => {
      setLoadingPosts(true);
      try {
        const data = await contentApi.listBlogs({
          category: postCategory,
          contentType: 'POST',
          q: postSearch,
          page: pageToLoad,
          size: 10,
        });
        setPosts(data || { content: [], page: 0, size: 10, totalElements: 0, totalPages: 0 });
        setPostPage(pageToLoad);
      } catch (err) {
        toast.error('Failed to load community posts');
      } finally {
        setLoadingPosts(false);
      }
    },
    [postCategory, postSearch]
  );

  // ── FETCH ARTICLES ──
  const fetchArticles = useCallback(
    async (pageToLoad = 0) => {
      setLoadingArticles(true);
      try {
        if (articleViewMode === 'mine' && isTrainer) {
          const data = await contentApi.listMyBlogs({ page: pageToLoad, size: 9 });
          // Filter to articles if needed
          const filtered = {
            ...data,
            content: (data?.content || []).filter((item) => item.contentType === 'ARTICLE'),
          };
          setArticles(filtered);
          setArticlePage(pageToLoad);
        } else {
          const data = await contentApi.listBlogs({
            category: articleCategory,
            contentType: 'ARTICLE',
            q: articleSearch,
            page: pageToLoad,
            size: 9,
          });
          setArticles(data || { content: [], page: 0, size: 9, totalElements: 0, totalPages: 0 });
          setArticlePage(pageToLoad);
        }
      } catch (err) {
        toast.error('Failed to load articles');
      } finally {
        setLoadingArticles(false);
      }
    },
    [articleCategory, articleSearch, articleViewMode, isTrainer]
  );

  // Initial load
  useEffect(() => {
    loadTip();
  }, [loadTip]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts(0);
    } else {
      fetchArticles(0);
    }
  }, [activeTab, fetchPosts, fetchArticles]);

  // ── LIKE / UNLIKE HANDLER ──
  const handleToggleLike = async (item, e) => {
    if (e) e.stopPropagation();
    setLikingId(item.id);

    try {
      const res = await contentApi.toggleLikeBlog(item.id);

      // Update in posts list
      setPosts((prev) => ({
        ...prev,
        content: prev.content.map((b) =>
          b.id === item.id ? { ...b, likedByMe: res.liked, likesCount: res.likesCount } : b
        ),
      }));

      // Update in articles list
      setArticles((prev) => ({
        ...prev,
        content: prev.content.map((b) =>
          b.id === item.id ? { ...b, likedByMe: res.liked, likesCount: res.likesCount } : b
        ),
      }));

      // Update in active modal if open
      if (readingItem && readingItem.id === item.id) {
        setReadingItem((prev) => ({
          ...prev,
          likedByMe: res.liked,
          likesCount: res.likesCount,
        }));
      }
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    } finally {
      setLikingId(null);
    }
  };

  // ── READER & COMMENTS ──
  const handleOpenReader = async (item) => {
    setReadingItem(item);
    setLoadingComments(true);
    setComments([]);
    setNewCommentText('');

    try {
      const commentsData = await contentApi.listComments(item.id, { page: 0, size: 50 });
      setComments(commentsData?.content || []);
    } catch {
      // Non-blocking
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !readingItem) return;

    setSubmittingComment(true);
    try {
      const created = await contentApi.addComment(readingItem.id, {
        commentText: newCommentText,
        userName: currentAuthorName,
      });

      setComments((prev) => [...prev, created]);
      setNewCommentText('');
      toast.success('Comment posted!');

      // Update comment count on items
      const updateCounts = (prev) => ({
        ...prev,
        content: prev.content.map((b) =>
          b.id === readingItem.id ? { ...b, commentsCount: (b.commentsCount || 0) + 1 } : b
        ),
      });
      setPosts(updateCounts);
      setArticles(updateCounts);
      setReadingItem((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : null));
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await contentApi.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      toast.success('Comment removed');

      const decrementCounts = (prev) => ({
        ...prev,
        content: prev.content.map((b) =>
          b.id === readingItem?.id ? { ...b, commentsCount: Math.max(0, (b.commentsCount || 1) - 1) } : b
        ),
      });
      setPosts(decrementCounts);
      setArticles(decrementCounts);
      setReadingItem((prev) => (prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 1) - 1) } : null));
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    }
  };

  // ── DELETE POST OR ARTICLE ──
  const handleDeleteItem = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this publication? This action cannot be undone.')) return;

    try {
      await contentApi.deleteBlog(id);
      toast.success('Deleted successfully');
      setPosts((prev) => ({
        ...prev,
        content: prev.content.filter((b) => b.id !== id),
        totalElements: Math.max(0, prev.totalElements - 1),
      }));
      setArticles((prev) => ({
        ...prev,
        content: prev.content.filter((b) => b.id !== id),
        totalElements: Math.max(0, prev.totalElements - 1),
      }));
      if (readingItem?.id === id) {
        setReadingItem(null);
      }
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    }
  };

  // ── SUBMIT POST (User & Trainer) ──
  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!postForm.title.trim()) {
      toast.error('Please enter a title for your post');
      return;
    }
    if (!postForm.content.trim()) {
      toast.error('Please write something in your post');
      return;
    }

    setSavingPost(true);
    try {
      await contentApi.createPost({
        title: postForm.title,
        category: postForm.category,
        content: postForm.content,
        authorName: currentAuthorName,
      });

      toast.success('Post shared with the community!');
      setIsPostModalOpen(false);
      setPostForm({ title: '', category: 'Daily Update', content: '' });
      fetchPosts(0);
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    } finally {
      setSavingPost(false);
    }
  };

  // ── SUBMIT ARTICLE (Trainer Only) ──
  const handleOpenArticleCreate = () => {
    setEditingArticleId(null);
    setArticleForm({
      title: '',
      category: 'Fitness',
      content: '',
      status: 'PUBLISHED',
      imageUrl: '',
      imageFile: null,
    });
    setImagePreview(null);
    setIsArticleModalOpen(true);
  };

  const handleOpenArticleEdit = (article, e) => {
    if (e) e.stopPropagation();
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title || '',
      category: article.category || 'Fitness',
      content: article.content || '',
      status: article.status || 'PUBLISHED',
      imageUrl: article.imageUrl || '',
      imageFile: null,
    });
    setImagePreview(contentApi.resolveImageUrl(article.imageUrl));
    setIsArticleModalOpen(true);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setArticleForm((prev) => ({ ...prev, imageFile: file, imageUrl: '' }));
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmitArticle = async (e) => {
    e.preventDefault();
    if (!articleForm.title.trim()) {
      toast.error('Please enter an article title');
      return;
    }
    if (!articleForm.content.trim()) {
      toast.error('Please enter article content');
      return;
    }

    setSavingArticle(true);
    try {
      if (editingArticleId) {
        await contentApi.updateBlog(editingArticleId, {
          title: articleForm.title,
          category: articleForm.category,
          content: articleForm.content,
          authorName: currentAuthorName,
          imageUrl: articleForm.imageUrl,
          status: articleForm.status,
          contentType: 'ARTICLE',
          imageFile: articleForm.imageFile,
        });
        toast.success('Article updated successfully!');
      } else {
        await contentApi.createArticle({
          title: articleForm.title,
          category: articleForm.category,
          content: articleForm.content,
          authorName: currentAuthorName,
          imageUrl: articleForm.imageUrl,
          status: articleForm.status,
          imageFile: articleForm.imageFile,
        });
        toast.success('Article published successfully!');
      }

      setIsArticleModalOpen(false);
      fetchArticles(0);
    } catch (err) {
      toast.error(contentApi.extractErrorMessage(err));
    } finally {
      setSavingArticle(false);
    }
  };

  // Helper date formatter
  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Helper read time estimator
  const estimateReadTime = (text) => {
    if (!text) return '1 min read';
    const words = text.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* ── HERO BANNER ── */}
      <div className="card p-8 bg-gradient-to-br from-forest-900 via-forest-800 to-forest-950 text-white rounded-3xl relative overflow-hidden shadow-2xl border border-forest-700/50">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wide border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              Community & Wellness Hub
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Connect, Inspire & Grow
            </h1>
            <p className="text-forest-100/80 text-sm sm:text-base leading-relaxed">
              Share your daily workouts and wins in <span className="text-emerald-300 font-semibold">Posts</span>,
              or discover in-depth guides and coaching knowledge in <span className="text-emerald-300 font-semibold">Articles</span>.
            </p>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Create Post: Both user & trainer can create posts */}
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Create Post
            </button>

            {/* Write Article: Only trainer can create articles */}
            {isTrainer ? (
              <button
                onClick={handleOpenArticleCreate}
                className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold text-xs sm:text-sm rounded-2xl backdrop-blur-md flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <BookOpen className="w-4 h-4 text-emerald-300" />
                Write Article
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/15 rounded-2xl text-xs text-forest-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Trainer-verified articles</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DAILY TIP BANNER ── */}
      <div className="card p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-emerald-500/10 border-2 border-amber-200/60 rounded-3xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-amber-500/20">
          <Lightbulb className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-extrabold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Tip of the Day
            </span>
            <span className="text-xs text-gray-400">Micro wellness habit</span>
          </div>
          <p className="text-sm font-bold text-gray-800 leading-snug">
            {loadingTip ? 'Loading daily wellness tip...' : tipOfTheDay?.text}
          </p>
        </div>
        <button
          onClick={loadTip}
          disabled={loadingTip}
          title="Refresh tip"
          className="p-2.5 text-gray-400 hover:text-amber-700 hover:bg-amber-100/50 rounded-xl transition-all self-end md:self-center"
        >
          <RefreshCw className={`w-4 h-4 ${loadingTip ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── 2 PRIMARY NAVIGATION TABS (POSTS vs ARTICLES) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/70">
          {/* TAB 1: POSTS */}
          <button
            onClick={() => setActiveTab('posts')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'posts'
                ? 'bg-white text-forest-700 shadow-md border border-gray-200/70 scale-[1.01]'
                : 'text-gray-500 hover:text-forest-700 hover:bg-white/50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>Posts</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              Daily Updates
            </span>
          </button>

          {/* TAB 2: ARTICLES */}
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm font-extrabold transition-all duration-200 ${
              activeTab === 'articles'
                ? 'bg-white text-forest-700 shadow-md border border-gray-200/70 scale-[1.01]'
                : 'text-gray-500 hover:text-forest-700 hover:bg-white/50'
            }`}
          >
            <BookOpen className="w-4 h-4 text-forest-600" />
            <span>Articles</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
              Coaching Guides
            </span>
          </button>
        </div>

        {/* Tab-context Action Button */}
        {activeTab === 'posts' ? (
          <button
            onClick={() => setIsPostModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 rounded-xl font-bold text-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-600 stroke-[3]" />
            Share What You Did Today
          </button>
        ) : isTrainer ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setArticleViewMode((prev) => (prev === 'all' ? 'mine' : 'all'))}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                articleViewMode === 'mine'
                  ? 'bg-forest-700 text-white border-forest-800 shadow-sm'
                  : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {articleViewMode === 'mine' ? 'Showing: My Publications' : 'Show My Publications'}
            </button>
            <button
              onClick={handleOpenArticleCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              New Article
            </button>
          </div>
        ) : (
          <div className="text-xs text-gray-500 flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Articles written by certified coaches</span>
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── TAB 1 CONTENT: POSTS (Short Daily Updates) ─────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'posts' && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Share Composer Trigger */}
          <div
            onClick={() => setIsPostModalOpen(true)}
            className="card p-4 sm:p-5 bg-white border border-gray-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-4 group"
          >
            <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-forest-600 to-emerald-500 text-white font-extrabold flex items-center justify-center flex-shrink-0 shadow-sm">
              {currentAuthorName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 group-hover:text-gray-700 transition-colors flex items-center justify-between">
              <span>What did you accomplish today? Share a quick update...</span>
              <Send className="w-4 h-4 text-emerald-600 opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPostModalOpen(true);
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Post
            </button>
          </div>

          {/* Filters Bar for Posts */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search daily updates and workout posts..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchPosts(0);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
              />
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={postCategory}
                onChange={(e) => {
                  setPostCategory(e.target.value);
                  fetchPosts(0);
                }}
                className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium text-gray-700"
              >
                {POST_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchPosts(postPage)}
                disabled={loadingPosts}
                title="Refresh posts"
                className="p-2.5 text-gray-400 hover:text-forest-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingPosts ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Posts Feed */}
          {loadingPosts ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              <p className="text-sm text-gray-500 font-medium">Loading community updates...</p>
            </div>
          ) : posts.content.length === 0 ? (
            <div className="card p-12 text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800">No community posts found</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Be the first to share today’s workout, nutrition win, or fitness milestone with everyone!
                </p>
              </div>
              <button
                onClick={() => setIsPostModalOpen(true)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Share First Update
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.content.map((post) => {
                const isAuthor = user?.id && String(user.id) === String(post.authorId);
                const isAuthorTrainer = post.authorType === 'TRAINER';

                return (
                  <div
                    key={post.id}
                    onClick={() => handleOpenReader(post)}
                    className="card p-5 bg-white border border-gray-200/80 rounded-2xl hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between group space-y-4"
                  >
                    {/* Post Author & Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            isAuthorTrainer
                              ? 'bg-gradient-to-tr from-forest-700 to-emerald-600'
                              : 'bg-gradient-to-tr from-slate-600 to-slate-500'
                          }`}
                        >
                          {(post.authorName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-gray-800 leading-tight">
                              {post.authorName || (isAuthorTrainer ? 'Coach' : 'Member')}
                            </span>
                            {isAuthorTrainer ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <ShieldCheck className="w-3 h-3" />
                                Trainer
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                                Member
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400 font-medium">
                            {formatDate(post.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-forest-50 text-forest-700 border border-forest-100">
                          {post.category}
                        </span>
                        {isAuthor && (
                          <button
                            onClick={(e) => handleDeleteItem(post.id, e)}
                            title="Delete post"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Title & Content */}
                    <div className="space-y-1.5">
                      <h4 className="text-base font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 whitespace-pre-line">
                        {post.content}
                      </p>
                    </div>

                    {/* Engagement Actions */}
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-4">
                        {/* Like Button */}
                        <button
                          onClick={(e) => handleToggleLike(post, e)}
                          disabled={likingId === post.id}
                          className={`flex items-center gap-1.5 font-bold transition-colors ${
                            post.likedByMe ? 'text-rose-600' : 'text-gray-500 hover:text-rose-600'
                          }`}
                        >
                          <Heart
                            className={`w-4 h-4 transition-transform active:scale-125 ${
                              post.likedByMe ? 'fill-rose-600 text-rose-600' : ''
                            } ${likingId === post.id ? 'animate-pulse' : ''}`}
                          />
                          <span>{post.likesCount || 0}</span>
                        </button>

                        {/* Comments count */}
                        <div className="flex items-center gap-1.5 font-medium hover:text-forest-700 transition-colors">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span>{post.commentsCount || 0} comments</span>
                        </div>
                      </div>

                      <span className="text-[11px] font-bold text-emerald-600 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View discussion <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Posts Pagination */}
          {posts.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchPosts(postPage - 1)}
                disabled={postPage === 0 || loadingPosts}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs font-bold text-gray-600 px-3">
                Page {postPage + 1} of {posts.totalPages}
              </span>
              <button
                onClick={() => fetchPosts(postPage + 1)}
                disabled={postPage >= posts.totalPages - 1 || loadingPosts}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── TAB 2 CONTENT: ARTICLES (Detailed Guides) ──────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {activeTab === 'articles' && (
        <div className="space-y-6 animate-fade-in">
          {/* Trainer Quick Header when on Articles */}
          <div className="card p-5 bg-gradient-to-r from-forest-50 via-emerald-50/40 to-teal-50/30 border border-emerald-200/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-sm">
                <BookOpen className="w-5 h-5 text-emerald-300" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-forest-900">
                  Comprehensive Coaching Guides & Research
                </h3>
                <p className="text-xs text-forest-700/80">
                  In-depth articles with detailed fitness programming, nutrition strategies, and recovery guides.
                </p>
              </div>
            </div>

            {isTrainer && (
              <button
                onClick={handleOpenArticleCreate}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all self-start md:self-auto"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                Write New Article
              </button>
            )}
          </div>

          {/* Filters Bar for Articles */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search detailed articles by title or keyword..."
                value={articleSearch}
                onChange={(e) => setArticleSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') fetchArticles(0);
                }}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/30 focus:border-forest-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={articleCategory}
                onChange={(e) => {
                  setArticleCategory(e.target.value);
                  fetchArticles(0);
                }}
                className="px-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/30 font-medium text-gray-700"
              >
                {ARTICLE_CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => fetchArticles(articlePage)}
                disabled={loadingArticles}
                title="Refresh articles"
                className="p-2.5 text-gray-400 hover:text-forest-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loadingArticles ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Articles Grid */}
          {loadingArticles ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-forest-700" />
              <p className="text-sm text-gray-500 font-medium">Loading coaching articles...</p>
            </div>
          ) : articles.content.length === 0 ? (
            <div className="card p-12 text-center bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
                <BookOpen className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-800">No articles available</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  {isTrainer
                    ? 'You have not written any articles in this category yet. Share your coaching expertise!'
                    : 'Check back soon! Certified trainers publish in-depth workout and wellness tutorials here.'}
                </p>
              </div>
              {isTrainer && (
                <button
                  onClick={handleOpenArticleCreate}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  Write First Article
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.content.map((art) => {
                const resolvedCover = contentApi.resolveImageUrl(art.imageUrl);
                const isAuthor = user?.id && String(user.id) === String(art.authorId);

                return (
                  <div
                    key={art.id}
                    onClick={() => handleOpenReader(art)}
                    className="card bg-white border border-gray-200/90 rounded-3xl overflow-hidden hover:shadow-xl hover:border-forest-300 transition-all cursor-pointer flex flex-col justify-between group"
                  >
                    <div>
                      {/* Article Cover Image with Fallback */}
                      <div className="h-48 w-full bg-gradient-to-tr from-forest-800 to-emerald-700 relative overflow-hidden">
                        {resolvedCover ? (
                          <img
                            src={resolvedCover}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-white/40 p-4 text-center">
                            <BookOpen className="w-12 h-12 mb-2 stroke-[1.5]" />
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300/80">
                              WellNest In-Depth Guide
                            </span>
                          </div>
                        )}

                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-forest-900/80 backdrop-blur-md text-emerald-300 border border-emerald-400/30 shadow-md">
                            {art.category}
                          </span>
                        </div>

                        {art.status === 'DRAFT' && (
                          <div className="absolute top-3 right-3">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white shadow-md">
                              DRAFT
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Article Metadata & Body */}
                      <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(art.createdAt)}
                          </span>
                          <span>{estimateReadTime(art.content)}</span>
                        </div>

                        <h3 className="text-lg font-extrabold text-gray-900 group-hover:text-forest-700 transition-colors line-clamp-2 leading-snug">
                          {art.title}
                        </h3>

                        <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed">
                          {art.content}
                        </p>
                      </div>
                    </div>

                    {/* Author Footer & Engagement */}
                    <div className="p-6 pt-0 space-y-4">
                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                        {/* Trainer Info */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-forest-100 text-forest-800 font-bold text-xs flex items-center justify-center border border-forest-200">
                            {(art.authorName || 'C').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-gray-800">
                                {art.authorName || 'Certified Trainer'}
                              </span>
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            </div>
                            <span className="text-[10px] text-gray-400">Coach</span>
                          </div>
                        </div>

                        {/* Trainer Owner Actions */}
                        {isAuthor && isTrainer && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleOpenArticleEdit(art, e)}
                              title="Edit article"
                              className="p-1.5 text-gray-400 hover:text-forest-700 hover:bg-forest-50 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteItem(art.id, e)}
                              title="Delete article"
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Engagement Counters & CTA */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={(e) => handleToggleLike(art, e)}
                            disabled={likingId === art.id}
                            className={`flex items-center gap-1 font-bold ${
                              art.likedByMe ? 'text-rose-600' : 'text-gray-500 hover:text-rose-600'
                            }`}
                          >
                            <Heart
                              className={`w-4 h-4 ${art.likedByMe ? 'fill-rose-600 text-rose-600' : ''}`}
                            />
                            <span>{art.likesCount || 0}</span>
                          </button>
                          <span className="flex items-center gap-1 text-gray-400">
                            <MessageSquare className="w-4 h-4" />
                            {art.commentsCount || 0}
                          </span>
                        </div>

                        <span className="text-xs font-extrabold text-forest-700 group-hover:text-emerald-600 flex items-center gap-1">
                          Read Guide <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Articles Pagination */}
          {articles.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => fetchArticles(articlePage - 1)}
                disabled={articlePage === 0 || loadingArticles}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <span className="text-xs font-bold text-gray-600 px-3">
                Page {articlePage + 1} of {articles.totalPages}
              </span>
              <button
                onClick={() => fetchArticles(articlePage + 1)}
                disabled={articlePage >= articles.totalPages - 1 || loadingArticles}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── MODAL 1: CREATE POST (Short Daily Update) ──────────── */}
      {/* ── Accessible to BOTH User and Trainer ─────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative">
            <button
              onClick={() => setIsPostModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                <MessageSquare className="w-3.5 h-3.5" />
                Community Post
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">Share Daily Update</h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Share what you achieved today, your workout log, or a quick motivational thought.
              </p>
            </div>

            {/* Post Form */}
            <form onSubmit={handleSubmitPost} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Category
                </label>
                <select
                  value={postForm.category}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium text-gray-800"
                >
                  {POST_CATEGORY_OPTIONS.filter((c) => c.value !== 'ALL').map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Headline / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Completed a 5k morning run & hit my macros!"
                  value={postForm.title}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={200}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-800"
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Update Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  placeholder="Today I accomplished my goal by... Feeling great and ready for tomorrow's session!"
                  value={postForm.content}
                  onChange={(e) => setPostForm((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-800 leading-relaxed"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Keep it brief and inspiring for the community.
                </p>
              </div>

              {/* Author badge preview */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 flex items-center justify-between text-xs text-gray-600">
                <span className="font-medium">Posting as:</span>
                <span className="font-extrabold text-forest-800 flex items-center gap-1.5">
                  {currentAuthorName}
                  {isTrainer && <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                </span>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPost}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Publish Post
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── MODAL 2: WRITE / EDIT ARTICLE (Detailed Guide) ─────── */}
      {/* ── Strictly Trainer Only ───────────────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isArticleModalOpen && isTrainer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative my-8">
            <button
              onClick={() => setIsArticleModalOpen(false)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Title */}
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-forest-100 text-forest-800">
                <BookOpen className="w-3.5 h-3.5" />
                Coaching Article
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900">
                {editingArticleId ? 'Edit Article' : 'Write In-Depth Article'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Create comprehensive training guides, nutrition strategies, or health tutorials.
              </p>
            </div>

            {/* Article Form */}
            <form onSubmit={handleSubmitArticle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Category
                  </label>
                  <select
                    value={articleForm.category}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30 font-medium text-gray-800"
                  >
                    {ARTICLE_CATEGORY_OPTIONS.filter((c) => c.value !== 'ALL').map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                    Publication Status
                  </label>
                  <select
                    value={articleForm.status}
                    onChange={(e) => setArticleForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30 font-medium text-gray-800"
                  >
                    <option value="PUBLISHED">Published (Visible to All)</option>
                    <option value="DRAFT">Draft (Only Visible to You)</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Article Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master the Deadlift: Biomechanics, Safety & Progression"
                  value={articleForm.title}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, title: e.target.value }))}
                  maxLength={200}
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30 text-gray-800 font-bold"
                />
              </div>

              {/* Cover Image Upload & URL */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">
                  Cover Image (File Upload or URL)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-forest-50 hover:bg-forest-100 text-forest-700 border border-forest-200 rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-2 transition-colors">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span>Choose Image File</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-gray-400">or enter image URL</span>
                  <input
                    type="url"
                    placeholder="https://example.com/cover.jpg"
                    value={articleForm.imageUrl}
                    onChange={(e) => {
                      setArticleForm((prev) => ({ ...prev, imageUrl: e.target.value, imageFile: null }));
                      setImagePreview(e.target.value);
                    }}
                    className="flex-1 px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30"
                  />
                </div>

                {/* Image Preview Box */}
                {imagePreview && (
                  <div className="relative h-36 w-full rounded-2xl overflow-hidden border border-gray-200 mt-2 bg-gray-100">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={() => setImagePreview(null)}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setArticleForm((prev) => ({ ...prev, imageUrl: '', imageFile: null }));
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Detailed Content */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Detailed Article Content <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={8}
                  placeholder="Write your comprehensive coaching article, step-by-step breakdown, scientific insights, or nutrition protocol..."
                  value={articleForm.content}
                  onChange={(e) => setArticleForm((prev) => ({ ...prev, content: e.target.value }))}
                  required
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-forest-500/30 text-gray-800 leading-relaxed font-normal"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Supports multi-paragraph formatting and in-depth tutorial explanations.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsArticleModalOpen(false)}
                  className="px-5 py-2.5 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingArticle}
                  className="px-6 py-2.5 bg-forest-800 hover:bg-forest-900 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-forest-900/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {savingArticle ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Article...
                    </>
                  ) : (
                    <>
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      {editingArticleId ? 'Save Changes' : 'Publish Article'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* ── MODAL 3: FULL READER & COMMENTS ────────────────────── */}
      {/* ─────────────────────────────────────────────────────────── */}
      {readingItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-gray-200 space-y-6 relative my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setReadingItem(null)}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Type badge */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                    readingItem.contentType === 'ARTICLE'
                      ? 'bg-forest-100 text-forest-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {readingItem.contentType === 'ARTICLE' ? 'Coaching Article' : 'Community Post'}
                </span>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                  {readingItem.category}
                </span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {readingItem.title}
              </h2>

              {/* Author & Timestamp */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-forest-700 text-white font-bold text-xs flex items-center justify-center">
                    {(readingItem.authorName || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-gray-800">
                      <span>{readingItem.authorName || 'Community Member'}</span>
                      {readingItem.authorType === 'TRAINER' && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">
                          <ShieldCheck className="w-3 h-3" /> Coach
                        </span>
                      )}
                    </div>
                    <span>{formatDate(readingItem.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleLike(readingItem)}
                    disabled={likingId === readingItem.id}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      readingItem.likedByMe
                        ? 'bg-rose-50 border-rose-200 text-rose-600'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        readingItem.likedByMe ? 'fill-rose-600 text-rose-600' : ''
                      }`}
                    />
                    <span>{readingItem.likesCount || 0} Likes</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Cover Image (for Articles) */}
            {readingItem.imageUrl && (
              <div className="rounded-2xl overflow-hidden border border-gray-200 max-h-80 w-full bg-gray-100">
                <img
                  src={contentApi.resolveImageUrl(readingItem.imageUrl)}
                  alt={readingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Body Content */}
            <div className="text-gray-800 text-sm sm:text-base leading-relaxed whitespace-pre-line border-b border-gray-200 pb-6">
              {readingItem.content}
            </div>

            {/* Interactive Comments Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                Comments & Discussion ({comments.length})
              </h3>

              {/* Add Comment Form */}
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Share your thoughts or ask a question..."
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  maxLength={500}
                  className="flex-1 px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-gray-800"
                />
                <button
                  type="submit"
                  disabled={submittingComment || !newCommentText.trim()}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-40"
                >
                  {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Post</span>
                </button>
              </form>

              {/* Comments List */}
              {loadingComments ? (
                <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-xs text-gray-400 italic py-2">No comments yet. Start the conversation!</p>
              ) : (
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  {comments.map((comm) => {
                    const isMyComment = user?.id && String(user.id) === String(comm.userId);
                    return (
                      <div
                        key={comm.id}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200/70 flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-gray-900">
                              {comm.userName || 'Community Member'}
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">
                              {formatDate(comm.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 leading-normal">{comm.commentText}</p>
                        </div>

                        {isMyComment && (
                          <button
                            onClick={() => handleDeleteComment(comm.id)}
                            title="Delete comment"
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
