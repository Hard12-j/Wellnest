import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import { getAccessToken } from '../api/axiosInstance';
import * as chatApi from '../api/chatApi';

const ChatContext = createContext(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

const getWsBrokerUrl = () => {
  if (import.meta.env.VITE_CHAT_WS_URL) {
    return import.meta.env.VITE_CHAT_WS_URL;
  }
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

export const ChatProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'reconnecting' | 'disconnected'
  const stompClientRef = useRef(null);
  const messageListenersRef = useRef(new Set());
  const reconnectListenersRef = useRef(new Set());
  const activeConversationIdRef = useRef(null);
  const hasConnectedOnceRef = useRef(false);

  // Fetch total unread count from API
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await chatApi.getUnreadCount();
      if (res && typeof res.unread === 'number') {
        setUnreadCount(res.unread);
      }
    } catch {
      // Ignore network errors on background poll
    }
  }, [isAuthenticated]);

  // Set currently viewed conversation ID (so we don't increment unread when already looking at it)
  const setActiveConversationId = useCallback((id) => {
    activeConversationIdRef.current = id ? Number(id) : null;
  }, []);

  // Register listener for incoming messages
  const registerMessageListener = useCallback((listener) => {
    messageListenersRef.current.add(listener);
    return () => {
      messageListenersRef.current.delete(listener);
    };
  }, []);

  // Register listener for reconnect event (to trigger refetch)
  const registerReconnectListener = useCallback((listener) => {
    reconnectListenersRef.current.add(listener);
    return () => {
      reconnectListenersRef.current.delete(listener);
    };
  }, []);

  // Publish message via STOMP
  const sendMessage = useCallback((conversationId, content) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) {
      throw new Error('Chat service is disconnected. Please wait for reconnection.');
    }
    const cleanContent = (content || '').trim();
    if (!cleanContent) return;
    if (cleanContent.length > 2000) {
      throw new Error('Message exceeds 2000 characters limit.');
    }

    stompClientRef.current.publish({
      destination: '/app/chat.send',
      body: JSON.stringify({
        conversationId: Number(conversationId),
        content: cleanContent,
      }),
    });
  }, []);

  // Initialize STOMP connection when user logs in
  useEffect(() => {
    if (!isAuthenticated || !user) {
      if (stompClientRef.current) {
        stompClientRef.current.deactivate();
        stompClientRef.current = null;
      }
      setConnectionStatus('disconnected');
      setUnreadCount(0);
      hasConnectedOnceRef.current = false;
      return;
    }

    refreshUnreadCount();

    const brokerURL = getWsBrokerUrl();
    const token = getAccessToken();

    setConnectionStatus('connecting');

    const client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: token ? `Bearer ${token}` : '',
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      beforeConnect: () => {
        // Always grab latest access token before reconnecting
        const freshToken = getAccessToken();
        client.connectHeaders = {
          Authorization: freshToken ? `Bearer ${freshToken}` : '',
        };
      },
      onConnect: () => {
        setConnectionStatus('connected');

        // Subscribe to user messages
        client.subscribe('/user/queue/messages', (message) => {
          try {
            const data = JSON.parse(message.body);

            // Notify all registered listeners (e.g. active Chat component)
            messageListenersRef.current.forEach((listener) => {
              try {
                listener(data);
              } catch (err) {
                console.error('Error in chat message listener:', err);
              }
            });

            // If message is not from current user and not for current active open chat:
            const isMine = data.senderId === user.id;
            const isOpenChat = activeConversationIdRef.current === data.conversationId;

            if (!isMine && !isOpenChat) {
              setUnreadCount((prev) => prev + 1);
            }
          } catch (err) {
            console.error('Failed to parse incoming chat message frame:', err);
          }
        });

        // Subscribe to chat errors
        client.subscribe('/user/queue/errors', (message) => {
          try {
            const data = JSON.parse(message.body);
            const msg = data.message || 'Chat error occurred';
            toast.error(msg);
          } catch {
            toast.error('Chat error occurred');
          }
        });

        // If this is a reconnect, trigger refetch listeners & unread count
        if (hasConnectedOnceRef.current) {
          refreshUnreadCount();
          reconnectListenersRef.current.forEach((listener) => {
            try {
              listener();
            } catch (err) {
              console.error('Error in chat reconnect listener:', err);
            }
          });
        }
        hasConnectedOnceRef.current = true;
      },
      onDisconnect: () => {
        setConnectionStatus('disconnected');
      },
      onWebSocketClose: () => {
        setConnectionStatus('reconnecting');
      },
      onStompError: (frame) => {
        console.warn('STOMP broker reported error: ' + frame.headers['message']);
        setConnectionStatus('reconnecting');
      },
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      client.deactivate();
      stompClientRef.current = null;
      setConnectionStatus('disconnected');
    };
  }, [isAuthenticated, user?.id, refreshUnreadCount]);

  const value = {
    unreadCount,
    setUnreadCount,
    refreshUnreadCount,
    connectionStatus,
    isConnected: connectionStatus === 'connected',
    isReconnecting: connectionStatus === 'reconnecting',
    isConnecting: connectionStatus === 'connecting',
    sendMessage,
    registerMessageListener,
    registerReconnectListener,
    setActiveConversationId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
