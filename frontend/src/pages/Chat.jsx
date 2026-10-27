import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  ChevronLeft,
  Clock,
  Check,
  CheckCheck,
  WifiOff,
  RefreshCw,
  Users,
  UserCheck,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import * as chatApi from '../api/chatApi';
import * as trainerApi from '../api/trainerApi';

const MAX_MESSAGE_LENGTH = 2000;

// Format timestamp for conversation list preview
const formatConversationTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Yesterday';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// Format timestamp for message bubbles
const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date header for message groups
const formatMessageDateHeader = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isToday) return 'Today';

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return 'Yesterday';

  return date.toLocaleDateString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

const Chat = () => {
  const { user } = useAuth();
  const {
    sendMessage,
    registerMessageListener,
    registerReconnectListener,
    setActiveConversationId,
    isConnected,
    isReconnecting,
    refreshUnreadCount,
  } = useChat();

  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const isTrainer = user?.role === 'TRAINER';

  // Conversations list & active selection
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Messages state
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Input state
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);

  // User metadata cache: { [userId]: { name, subtitle, initials } }
  const [userMetaCache, setUserMetaCache] = useState({});

  // Mobile layout state
  const [mobileShowChat, setMobileShowChat] = useState(false);

  // Refs
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);
  const isFirstLoadRef = useRef(true);
  const selectedConversationRef = useRef(null);

  // Keep ref in sync
  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
    setActiveConversationId(selectedConversation?.id || null);
  }, [selectedConversation, setActiveConversationId]);

  // Load name metadata for otherUserId
  const resolveUserMeta = useCallback(
    async (otherUserId) => {
      if (!otherUserId || userMetaCache[otherUserId]) return;

      if (isTrainer) {
        // Trainer looking at a client
        try {
          const clients = await trainerApi.getClients();
          const match = (clients || []).find((c) => c.userId === otherUserId);
          const meta = {
            name: `Client #${otherUserId}`,
            subtitle: match?.fitnessGoal ? `Goal: ${match.fitnessGoal}` : 'Client',
            initials: `C${otherUserId}`,
          };
          setUserMetaCache((prev) => ({ ...prev, [otherUserId]: meta }));
        } catch {
          const fallbackMeta = {
            name: `Client #${otherUserId}`,
            subtitle: 'Client',
            initials: `C${otherUserId}`,
          };
          setUserMetaCache((prev) => ({ ...prev, [otherUserId]: fallbackMeta }));
        }
      } else {
        // Client looking at a trainer
        try {
          const trainer = await trainerApi.getTrainerById(otherUserId);
          if (trainer && (trainer.first || trainer.last)) {
            const name = `${trainer.first || ''} ${trainer.last || ''}`.trim();
            const initials = `${trainer.first?.[0] || 'T'}${trainer.last?.[0] || ''}`.toUpperCase();
            const meta = {
              name: name || `Trainer #${otherUserId}`,
              subtitle: trainer.specialization || 'Fitness Coach',
              initials,
            };
            setUserMetaCache((prev) => ({ ...prev, [otherUserId]: meta }));
            return;
          }
        } catch {
          // Fallback
        }
        const fallbackMeta = {
          name: `Trainer #${otherUserId}`,
          subtitle: 'Trainer',
          initials: `T${otherUserId}`,
        };
        setUserMetaCache((prev) => ({ ...prev, [otherUserId]: fallbackMeta }));
      }
    },
    [isTrainer, userMetaCache]
  );

  // Fetch all conversations
  const fetchConversationsList = useCallback(
    async (selectFirst = false, selectId = null) => {
      try {
        const data = await chatApi.getConversations();
        const convList = data || [];
        setConversations(convList);

        // Pre-resolve metadata for each conversation's otherUserId
        convList.forEach((c) => {
          if (c.otherUserId) resolveUserMeta(c.otherUserId);
        });

        // Determine if we should select one
        if (selectId) {
          const target = convList.find((c) => String(c.id) === String(selectId));
          if (target) {
            setSelectedConversation(target);
            setMobileShowChat(true);
            return;
          }
        }

        // If currently selected conversation exists in new list, update it
        if (selectedConversationRef.current) {
          const updatedCurrent = convList.find(
            (c) => c.id === selectedConversationRef.current.id
          );
          if (updatedCurrent) {
            setSelectedConversation(updatedCurrent);
            return;
          }
        }

        // Auto select first conversation on desktop if requested
        if (selectFirst && convList.length > 0 && window.innerWidth >= 768) {
          setSelectedConversation(convList[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoadingConversations(false);
      }
    },
    [resolveUserMeta]
  );

  // Initial load
  useEffect(() => {
    const urlConvId = searchParams.get('conversationId');
    const targetUserId = searchParams.get('userId') || searchParams.get('trainerId');

    const init = async () => {
      setLoadingConversations(true);
      try {
        const data = await chatApi.getConversations();
        const convList = data || [];
        setConversations(convList);

        convList.forEach((c) => {
          if (c.otherUserId) resolveUserMeta(c.otherUserId);
        });

        let target = null;
        if (urlConvId) {
          target = convList.find((c) => String(c.id) === String(urlConvId));
        } else if (targetUserId) {
          target = convList.find((c) => String(c.otherUserId) === String(targetUserId));
        }

        if (target) {
          setSelectedConversation(target);
          setMobileShowChat(true);
        } else if (convList.length > 0 && window.innerWidth >= 768) {
          setSelectedConversation(convList[0]);
        }
      } catch (err) {
        toast.error('Failed to load conversations');
      } finally {
        setLoadingConversations(false);
      }
    };

    init();
  }, [searchParams, resolveUserMeta]);

  // Fetch messages for selected conversation
  const loadMessagesForConversation = useCallback(
    async (convId, pageToLoad = 0, appendOlder = false) => {
      if (!convId) return;

      if (appendOlder) {
        setLoadingOlder(true);
      } else {
        setLoadingMessages(true);
      }

      try {
        const res = await chatApi.getMessages(convId, pageToLoad, 30);
        const pageContent = res.content || [];
        // The API returns newest first; reverse so oldest is displayed first
        const reversed = [...pageContent].reverse();

        if (appendOlder) {
          // Prepend older messages
          const scrollContainer = messagesContainerRef.current;
          const oldScrollHeight = scrollContainer ? scrollContainer.scrollHeight : 0;

          setMessages((prev) => [...reversed, ...prev]);
          setPage(res.page);
          setTotalPages(res.totalPages);

          // Preserve scroll position
          requestAnimationFrame(() => {
            if (scrollContainer) {
              const newScrollHeight = scrollContainer.scrollHeight;
              scrollContainer.scrollTop = newScrollHeight - oldScrollHeight;
            }
          });
        } else {
          setMessages(reversed);
          setPage(res.page);
          setTotalPages(res.totalPages);

          // Mark conversation as read
          try {
            await chatApi.markConversationAsRead(convId);
            refreshUnreadCount();
            setConversations((prev) =>
              prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
            );
          } catch {
            // Non-critical
          }

          // Scroll to bottom
          requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop =
                messagesContainerRef.current.scrollHeight;
            }
          });
        }
      } catch (err) {
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
        setLoadingOlder(false);
      }
    },
    [refreshUnreadCount]
  );

  // When selected conversation changes, fetch its messages
  useEffect(() => {
    if (selectedConversation?.id) {
      isFirstLoadRef.current = true;
      loadMessagesForConversation(selectedConversation.id, 0, false);
      if (selectedConversation.otherUserId) {
        resolveUserMeta(selectedConversation.otherUserId);
      }
    } else {
      setMessages([]);
    }
  }, [selectedConversation?.id, loadMessagesForConversation, resolveUserMeta]);

  // Handle incoming STOMP message
  useEffect(() => {
    const unsubscribeMessage = registerMessageListener((incomingMsg) => {
      const activeConv = selectedConversationRef.current;

      // 1. If message belongs to active conversation:
      if (activeConv && incomingMsg.conversationId === activeConv.id) {
        setMessages((prev) => {
          // Check if replacing temporary sending message
          const withoutTemp = prev.filter(
            (m) =>
              !(
                m.isTemporary &&
                m.content === incomingMsg.content &&
                m.senderId === incomingMsg.senderId
              )
          );
          // Check if already present
          if (withoutTemp.some((m) => m.id === incomingMsg.id)) {
            return withoutTemp;
          }
          return [...withoutTemp, incomingMsg];
        });

        // Mark read if incoming from other person
        if (incomingMsg.senderId !== user?.id) {
          chatApi.markConversationAsRead(activeConv.id).catch(() => {});
          refreshUnreadCount();
        }

        // Scroll to bottom
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop =
              messagesContainerRef.current.scrollHeight;
          }
        }, 50);

        // Update conversation list preview
        setConversations((prev) => {
          const updated = prev.map((c) => {
            if (c.id === incomingMsg.conversationId) {
              return {
                ...c,
                lastMessage: incomingMsg.content,
                lastMessageAt: incomingMsg.sentAt,
                unreadCount: 0,
              };
            }
            return c;
          });
          // Move this conversation to the top
          const targetIndex = updated.findIndex((c) => c.id === incomingMsg.conversationId);
          if (targetIndex > 0) {
            const [item] = updated.splice(targetIndex, 1);
            updated.unshift(item);
          }
          return updated;
        });
      } else {
        // 2. Belongs to a different conversation:
        setConversations((prev) => {
          let found = false;
          const updated = prev.map((c) => {
            if (c.id === incomingMsg.conversationId) {
              found = true;
              return {
                ...c,
                lastMessage: incomingMsg.content,
                lastMessageAt: incomingMsg.sentAt,
                unreadCount: (c.unreadCount || 0) + 1,
              };
            }
            return c;
          });

          // Move to top
          const targetIndex = updated.findIndex((c) => c.id === incomingMsg.conversationId);
          if (targetIndex > 0) {
            const [item] = updated.splice(targetIndex, 1);
            updated.unshift(item);
          } else if (!found) {
            // New conversation arrived: refetch conversations
            fetchConversationsList(false);
          }
          return updated;
        });
      }
    });

    // Reconnection listener
    const unsubscribeReconnect = registerReconnectListener(() => {
      fetchConversationsList(false);
      if (selectedConversationRef.current?.id) {
        loadMessagesForConversation(selectedConversationRef.current.id, 0, false);
      }
    });

    return () => {
      unsubscribeMessage();
      unsubscribeReconnect();
    };
  }, [
    registerMessageListener,
    registerReconnectListener,
    user?.id,
    fetchConversationsList,
    loadMessagesForConversation,
    refreshUnreadCount,
  ]);

  // Handle scroll to top to load older messages
  const handleScroll = (e) => {
    const { scrollTop } = e.currentTarget;
    if (scrollTop < 40 && !loadingOlder && !loadingMessages && page + 1 < totalPages) {
      if (selectedConversation?.id) {
        loadMessagesForConversation(selectedConversation.id, page + 1, true);
      }
    }
  };

  // Handle Send Message
  const handleSendMessage = () => {
    const text = inputText.trim();
    if (!text || sending || !selectedConversation) return;

    if (!isConnected) {
      toast.error('Cannot send message: Chat is currently reconnecting.');
      return;
    }

    if (text.length > MAX_MESSAGE_LENGTH) {
      toast.error(`Message exceeds ${MAX_MESSAGE_LENGTH} characters limit.`);
      return;
    }

    // Optimistic temporary message
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      conversationId: selectedConversation.id,
      senderId: user?.id,
      content: text,
      sentAt: new Date().toISOString(),
      readAt: null,
      isTemporary: true,
    };

    setMessages((prev) => [...prev, tempMsg]);
    setInputText('');

    // Update conversation list preview optimistically
    setConversations((prev) => {
      const updated = prev.map((c) => {
        if (c.id === selectedConversation.id) {
          return {
            ...c,
            lastMessage: text,
            lastMessageAt: tempMsg.sentAt,
          };
        }
        return c;
      });
      const targetIndex = updated.findIndex((c) => c.id === selectedConversation.id);
      if (targetIndex > 0) {
        const [item] = updated.splice(targetIndex, 1);
        updated.unshift(item);
      }
      return updated;
    });

    // Scroll to bottom
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop =
          messagesContainerRef.current.scrollHeight;
      }
    }, 20);

    try {
      sendMessage(selectedConversation.id, text);
    } catch (err) {
      toast.error(err.message || 'Failed to send message');
      // Remove temp message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    }
  };

  // Handle KeyDown (Enter sends, Shift+Enter new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter((c) => {
      const meta = userMetaCache[c.otherUserId];
      const name = meta?.name?.toLowerCase() || '';
      const last = c.lastMessage?.toLowerCase() || '';
      return name.includes(q) || last.includes(q);
    });
  }, [conversations, searchQuery, userMetaCache]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const groups = [];
    let currentDateHeader = null;

    messages.forEach((msg) => {
      const header = formatMessageDateHeader(msg.sentAt);
      if (header !== currentDateHeader) {
        currentDateHeader = header;
        groups.push({ type: 'date', header });
      }
      groups.push({ type: 'message', data: msg });
    });

    return groups;
  }, [messages]);

  const activeMeta = selectedConversation
    ? userMetaCache[selectedConversation.otherUserId] || {
        name: isTrainer
          ? `Client #${selectedConversation.otherUserId}`
          : `Trainer #${selectedConversation.otherUserId}`,
        subtitle: isTrainer ? 'Client' : 'Trainer',
        initials: isTrainer ? 'C' : 'T',
      }
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-forest-500/10 text-forest-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5 text-forest-600" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                Messages
              </h1>
              <p className="text-sm text-gray-500">
                {isTrainer
                  ? 'Connect and guide your active coaching clients in real time.'
                  : 'Chat directly with your certified fitness coach.'}
              </p>
            </div>
          </div>
        </div>

        {/* Connection status badge */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {isReconnecting && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Reconnecting to Chat...
            </div>
          )}
          {!isConnected && !isReconnecting && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-semibold">
              <WifiOff className="w-3.5 h-3.5" />
              Offline
            </div>
          )}
          {isConnected && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Live Connection
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white rounded-3xl border border-gray-200/80 shadow-sm overflow-hidden flex h-[760px] max-h-[82vh]">
        {/* ========================================================================= */}
        {/* LEFT PANEL: Conversation List */}
        {/* ========================================================================= */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-gray-100 flex flex-col bg-gray-50/40 ${
            mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-100 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 hover:bg-gray-100/70 focus:bg-white text-sm text-gray-800 rounded-xl border border-gray-200/80 focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-500 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100/60">
            {loadingConversations ? (
              <div className="p-8 flex flex-col items-center justify-center text-center text-gray-400 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-forest-600" />
                <p className="text-xs font-semibold">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center text-gray-500 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center text-forest-600">
                  <Users className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-800">
                    {conversations.length === 0
                      ? 'No conversations yet'
                      : 'No matches found'}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-[240px] leading-relaxed">
                    {conversations.length === 0
                      ? isTrainer
                        ? 'Your clients will appear here once you accept their requests.'
                        : 'Once a trainer accepts your request you can chat here.'
                      : 'Try adjusting your search query.'}
                  </p>
                </div>
                {conversations.length === 0 && (
                  <button
                    onClick={() => navigate(isTrainer ? '/dashboard' : '/trainers')}
                    className="mt-2 px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-bold shadow-md shadow-forest-600/20 transition-all cursor-pointer"
                  >
                    {isTrainer ? 'Go to Dashboard' : 'Explore Trainers'}
                  </button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const meta = userMetaCache[conv.otherUserId] || {
                  name: isTrainer
                    ? `Client #${conv.otherUserId}`
                    : `Trainer #${conv.otherUserId}`,
                  subtitle: isTrainer ? 'Client' : 'Trainer',
                  initials: isTrainer ? `C${conv.otherUserId}` : `T${conv.otherUserId}`,
                };

                const isSelected = selectedConversation?.id === conv.id;

                return (
                  <button
                    key={conv.id}
                    onClick={() => {
                      setSelectedConversation(conv);
                      setMobileShowChat(true);
                      setSearchParams({ conversationId: conv.id });
                    }}
                    className={`w-full text-left p-4 flex items-start gap-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-forest-50/80 border-r-4 border-forest-600'
                        : 'hover:bg-white/80'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-2xl font-black text-sm flex items-center justify-center shadow-sm ${
                          isTrainer
                            ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-emerald-500/20'
                            : 'bg-gradient-to-tr from-forest-700 to-forest-500 text-white shadow-forest-500/20'
                        }`}
                      >
                        {meta.initials}
                      </div>
                      {Boolean(conv.unreadCount && conv.unreadCount > 0) && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-forest-600 text-white text-[10px] font-extrabold flex items-center justify-center ring-2 ring-white animate-pulse">
                          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                        </span>
                      )}
                    </div>

                    {/* Preview details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm truncate font-bold ${
                            conv.unreadCount > 0 ? 'text-gray-950 font-extrabold' : 'text-gray-800'
                          }`}
                        >
                          {meta.name}
                        </h4>
                        <span className="text-[11px] font-medium text-gray-400 shrink-0 ml-1">
                          {formatConversationTime(conv.lastMessageAt)}
                        </span>
                      </div>

                      <p
                        className={`text-xs truncate ${
                          conv.unreadCount > 0
                            ? 'text-gray-900 font-semibold'
                            : 'text-gray-500'
                        }`}
                      >
                        {conv.lastMessage || 'No messages yet'}
                      </p>

                      <div className="mt-1 flex items-center gap-1.5">
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">
                          {meta.subtitle}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT PANEL: Selected Conversation */}
        {/* ========================================================================= */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !mobileShowChat ? 'hidden md:flex' : 'flex'
          }`}
        >
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="h-18 px-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Mobile Back Button */}
                  <button
                    onClick={() => setMobileShowChat(false)}
                    className="md:hidden p-2 -ml-2 text-gray-600 hover:text-forest-700 hover:bg-forest-50 rounded-xl transition-colors cursor-pointer"
                    title="Back to conversations"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Header Avatar */}
                  <div
                    className={`w-11 h-11 rounded-2xl font-black text-sm flex items-center justify-center shrink-0 shadow-sm ${
                      isTrainer
                        ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white'
                        : 'bg-gradient-to-tr from-forest-700 to-forest-500 text-white'
                    }`}
                  >
                    {activeMeta?.initials}
                  </div>

                  {/* Header Details */}
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-gray-900 truncate">
                      {activeMeta?.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span>{activeMeta?.subtitle}</span>
                    </p>
                  </div>
                </div>

                {/* Header Action: View Profile/Dashboard */}
                <div>
                  <button
                    onClick={() => {
                      if (isTrainer) {
                        navigate('/dashboard');
                      } else {
                        navigate(`/trainers`);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-700 text-xs font-bold transition-all cursor-pointer border border-forest-100 flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>{isTrainer ? 'Client Details' : 'Trainer Profile'}</span>
                  </button>
                </div>
              </div>

              {/* Reconnecting Banner */}
              {isReconnecting && (
                <div className="bg-amber-50/90 border-b border-amber-200/80 px-4 py-2 flex items-center justify-center gap-2 text-xs font-semibold text-amber-800 animate-fade-in shrink-0">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
                  <span>Reconnecting to chat service... Send is temporarily disabled.</span>
                </div>
              )}

              {/* Messages Container */}
              <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-gray-50/30"
              >
                {/* Loading older indicator */}
                {loadingOlder && (
                  <div className="flex items-center justify-center py-2 text-gray-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-forest-600" />
                    <span className="text-xs font-semibold">Loading older messages...</span>
                  </div>
                )}

                {loadingMessages ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3">
                    <Loader2 className="w-7 h-7 animate-spin text-forest-600" />
                    <p className="text-xs font-semibold">Loading message history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-3 p-6">
                    <div className="w-14 h-14 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center shadow-sm">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-800">No messages yet</h4>
                      <p className="text-xs text-gray-500 mt-1 max-w-xs">
                        Say hello to begin your conversation with {activeMeta?.name}!
                      </p>
                    </div>
                  </div>
                ) : (
                  groupedMessages.map((item, idx) => {
                    if (item.type === 'date') {
                      return (
                        <div key={`header-${idx}`} className="flex justify-center my-3">
                          <span className="px-3 py-1 rounded-full bg-gray-200/70 text-gray-600 text-[11px] font-bold shadow-xs">
                            {item.header}
                          </span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    const isMine = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap ${
                            isMine
                              ? 'bg-gradient-to-r from-forest-600 to-forest-500 text-white rounded-br-xs'
                              : 'bg-white text-gray-800 border border-gray-200/80 rounded-bl-xs'
                          }`}
                        >
                          {msg.content}
                        </div>

                        {/* Message timestamp & status */}
                        <div className="flex items-center gap-1 mt-1 px-1 text-[11px] text-gray-400 font-medium">
                          <span>{formatMessageTime(msg.sentAt)}</span>
                          {isMine && (
                            <span>
                              {msg.isTemporary ? (
                                <Clock className="w-3 h-3 text-gray-400 animate-pulse" />
                              ) : msg.readAt ? (
                                <CheckCheck className="w-3.5 h-3.5 text-forest-600" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-gray-400" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-end gap-2.5 bg-gray-50 rounded-2xl p-2 border border-gray-200/80 focus-within:border-forest-500 focus-within:ring-2 focus-within:ring-forest-500/20 transition-all">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isReconnecting || !isConnected}
                    placeholder={
                      isReconnecting || !isConnected
                        ? 'Reconnecting to chat...'
                        : 'Write a message... (Enter to send, Shift+Enter for new line)'
                    }
                    maxLength={MAX_MESSAGE_LENGTH}
                    className="flex-1 bg-transparent border-0 resize-none px-3 py-1.5 text-sm text-gray-800 focus:outline-none placeholder:text-gray-400 max-h-32 disabled:opacity-50"
                  />

                  {/* Send Button */}
                  <button
                    onClick={handleSendMessage}
                    disabled={
                      !inputText.trim() ||
                      isReconnecting ||
                      !isConnected ||
                      sending
                    }
                    className="p-2.5 rounded-xl bg-forest-600 hover:bg-forest-700 disabled:bg-gray-200 text-white disabled:text-gray-400 shadow-md shadow-forest-600/20 disabled:shadow-none transition-all duration-200 cursor-pointer disabled:cursor-not-allowed shrink-0"
                    title="Send message"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                {/* Character Counter warning */}
                {inputText.length > 1800 && (
                  <div className="flex justify-end mt-1 px-1">
                    <span
                      className={`text-[10px] font-bold ${
                        inputText.length >= MAX_MESSAGE_LENGTH
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {inputText.length} / {MAX_MESSAGE_LENGTH}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* No conversation selected (desktop state) */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-500 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-forest-50 text-forest-600 flex items-center justify-center shadow-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div className="max-w-sm">
                <h3 className="text-base font-extrabold text-gray-900">
                  Select a Conversation
                </h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  Choose a chat from the left panel to message your coach or client.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
