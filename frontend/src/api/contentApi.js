import { contentClient, CONTENT_API_URL } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage, CONTENT_API_URL };

/**
 * Resolves full image URL for uploaded or external images.
 */
export const resolveImageUrl = (imageUrl) => {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://') || imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  if (imageUrl.startsWith('/api/content')) {
    return `${CONTENT_API_URL}${imageUrl}`;
  }
  return imageUrl;
};

/**
 * List published articles and posts with filters.
 */
export const listBlogs = async ({ category, contentType, q, page = 0, size = 9 } = {}) => {
  const params = {};
  if (category && category !== 'ALL') params.category = category;
  if (contentType && contentType !== 'ALL') params.contentType = contentType;
  if (q && q.trim()) params.q = q.trim();
  params.page = page;
  params.size = size;

  const { data } = await contentClient.get('/api/content/blogs', { params });
  return data; // PageResponse<BlogResponse>
};

/**
 * List the current author's (trainer's) blogs, including drafts.
 */
export const listMyBlogs = async ({ page = 0, size = 10 } = {}) => {
  const { data } = await contentClient.get('/api/content/blogs/mine', {
    params: { page, size },
  });
  return data; // PageResponse<BlogResponse>
};

/**
 * Get a single blog article or post by ID.
 */
export const getBlogById = async (id) => {
  const { data } = await contentClient.get(`/api/content/blogs/${id}`);
  return data; // BlogResponse
};

/**
 * Create a new blog (trainer only).
 * Supports JSON or Multipart with an uploaded image.
 */
export const createBlog = async ({ title, category, content, authorName, imageUrl, status, contentType, imageFile }) => {
  const blogPayload = {
    title: title.trim(),
    category: category.trim(),
    content: content.trim(),
    authorName: authorName ? authorName.trim() : null,
    imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
    status: status || 'PUBLISHED',
    contentType: contentType || 'ARTICLE',
  };

  if (imageFile) {
    const formData = new FormData();
    formData.append('blog', new Blob([JSON.stringify(blogPayload)], { type: 'application/json' }));
    formData.append('image', imageFile);

    const { data } = await contentClient.post('/api/content/blogs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await contentClient.post('/api/content/blogs', blogPayload);
  return data;
};

/**
 * Create a short community post (both User and Trainer).
 * Consists of title, category, content (e.g. daily update, workout check-in).
 */
export const createPost = async ({ title, category, content, authorName }) => {
  return createBlog({
    title,
    category,
    content,
    authorName,
    contentType: 'POST',
    status: 'PUBLISHED',
  });
};

/**
 * Create an in-depth article (Trainer only).
 * Consists of title, category, content, cover image, and status.
 */
export const createArticle = async ({ title, category, content, authorName, imageUrl, status = 'PUBLISHED', imageFile }) => {
  return createBlog({
    title,
    category,
    content,
    authorName,
    imageUrl,
    status,
    contentType: 'ARTICLE',
    imageFile,
  });
};

/**
 * Update an existing blog (trainer only, must be owner).
 */
export const updateBlog = async (id, { title, category, content, authorName, imageUrl, status, contentType, imageFile }) => {
  const blogPayload = {
    title: title.trim(),
    category: category.trim(),
    content: content.trim(),
    authorName: authorName ? authorName.trim() : null,
    imageUrl: imageUrl && imageUrl.trim() ? imageUrl.trim() : null,
    status: status || 'PUBLISHED',
    contentType: contentType || 'ARTICLE',
  };

  if (imageFile) {
    const formData = new FormData();
    formData.append('blog', new Blob([JSON.stringify(blogPayload)], { type: 'application/json' }));
    formData.append('image', imageFile);

    const { data } = await contentClient.put(`/api/content/blogs/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  }

  const { data } = await contentClient.put(`/api/content/blogs/${id}`, blogPayload);
  return data;
};

/**
 * Delete a blog (trainer only, must be owner).
 */
export const deleteBlog = async (id) => {
  await contentClient.delete(`/api/content/blogs/${id}`);
};

/**
 * Toggle like/unlike for a blog.
 */
export const toggleLikeBlog = async (id) => {
  const { data } = await contentClient.post(`/api/content/blogs/${id}/like`);
  return data; // LikeResponse { liked, likesCount }
};

/**
 * Fetch paginated comments for a blog.
 */
export const listComments = async (blogId, { page = 0, size = 20 } = {}) => {
  const { data } = await contentClient.get(`/api/content/blogs/${blogId}/comments`, {
    params: { page, size },
  });
  return data; // PageResponse<CommentResponse>
};

/**
 * Post a new comment on a blog.
 */
export const addComment = async (blogId, { commentText, userName }) => {
  const payload = {
    commentText: commentText.trim(),
    userName: userName ? userName.trim() : null,
  };
  const { data } = await contentClient.post(`/api/content/blogs/${blogId}/comments`, payload);
  return data; // CommentResponse
};

/**
 * Delete a comment (by comment owner or blog author).
 */
export const deleteComment = async (commentId) => {
  await contentClient.delete(`/api/content/comments/${commentId}`);
};

/**
 * Fetch daily wellness tip.
 */
export const getTipOfTheDay = async () => {
  const { data } = await contentClient.get('/api/content/tip-of-the-day');
  return data; // TipResponse { id, text }
};
