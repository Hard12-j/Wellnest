import { chatClient } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage };

/**
 * Fetch all conversations for the current user/trainer, newest first.
 * @returns {Promise<Array<{id: number, otherUserId: number, lastMessage: string, lastMessageAt: string, unreadCount: number}>>}
 */
export const getConversations = async () => {
  const { data } = await chatClient.get('/api/chat/conversations');
  return data;
};

/**
 * Fetch paginated message history for a conversation.
 * The backend returns newest first (page 0 is the most recent messages).
 * @param {number|string} conversationId
 * @param {number} page
 * @param {number} size
 * @returns {Promise<{content: Array<{id: number, conversationId: number, senderId: number, content: string, sentAt: string, readAt: string|null}>, page: number, size: number, totalElements: number, totalPages: number}>}
 */
export const getMessages = async (conversationId, page = 0, size = 30) => {
  const { data } = await chatClient.get(`/api/chat/conversations/${conversationId}/messages`, {
    params: { page, size },
  });
  return data;
};

/**
 * Mark messages in a conversation as read.
 * @param {number|string} conversationId
 * @returns {Promise<{updated: number}>}
 */
export const markConversationAsRead = async (conversationId) => {
  const { data } = await chatClient.post(`/api/chat/conversations/${conversationId}/read`);
  return data;
};

/**
 * Fetch total unread messages count for navbar badge.
 * @returns {Promise<{unread: number}>}
 */
export const getUnreadCount = async () => {
  const { data } = await chatClient.get('/api/chat/unread-count');
  return data;
};
