const BOARD_API = '/api';
const BOARD_STORAGE_KEY = 'korea-bike-trails-board-v1';
const BOARD_VISITOR_KEY = 'korea-bike-trails-visitor-v1';

const postForm = document.querySelector('#post-form');
const postList = document.querySelector('#post-list');
const postSearch = document.querySelector('#board-search');
const postSort = document.querySelector('#board-sort');
const postCount = document.querySelector('#board-count');
const emptyBoard = document.querySelector('#board-empty');
const boardFeedback = document.querySelector('#board-feedback');
const storageNotice = document.querySelector('#board-storage-notice');

let posts = [];
let currentVisitorId = getOrCreateVisitorId();

function getOrCreateVisitorId() {
  try {
    let visitorId = localStorage.getItem(BOARD_VISITOR_KEY);
    if (!visitorId) {
      visitorId = crypto.randomUUID().replaceAll('-', '');
      localStorage.setItem(BOARD_VISITOR_KEY, visitorId);
    }
    return visitorId;
  } catch {
    return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

function readLocalPosts() {
  try {
    const storedPosts = JSON.parse(localStorage.getItem(BOARD_STORAGE_KEY) || '[]');
    return Array.isArray(storedPosts) ? storedPosts : [];
  } catch {
    return [];
  }
}

function readLocalReactions() {
  try {
    const reactions = JSON.parse(localStorage.getItem(`${BOARD_STORAGE_KEY}:reactions`) || '{}');
    return reactions && typeof reactions === 'object' ? reactions : {};
  } catch {
    return {};
  }
}

function saveLocalPosts() {
  localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(posts));
}

function getLocalReaction(postId) {
  return readLocalReactions()[postId] === currentVisitorId;
}

function setLocalReaction(postId, liked) {
  const reactions = readLocalReactions();
  if (liked) reactions[postId] = currentVisitorId;
  else delete reactions[postId];
  localStorage.setItem(`${BOARD_STORAGE_KEY}:reactions`, JSON.stringify(reactions));
}

async function requestBoard(path, options = {}) {
  const response = await fetch(`${BOARD_API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-Visitor-Id': currentVisitorId,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || '요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  return response.json();
}

function formatPostTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '시간 정보 없음';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(date);
}

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'board-post';
  article.dataset.postId = post.id;

  const head = document.createElement('div');
  head.className = 'board-post-head';
  const author = document.createElement('strong');
  author.className = 'post-author';
  author.textContent = post.nickname;
  const time = document.createElement('time');
  time.className = 'post-time';
  time.dateTime = post.createdAt;
  time.textContent = formatPostTime(post.createdAt);
  head.append(author, time);

  const title = document.createElement('h3');
  title.className = 'post-title';
  title.textContent = post.title;
  const content = document.createElement('p');
  content.className = 'post-content';
  content.textContent = post.content;

  const actions = document.createElement('div');
  actions.className = 'post-actions';
  const likeButton = document.createElement('button');
  const isLiked = Boolean(post.likedBy?.includes('current'));
  likeButton.className = `post-like${isLiked ? ' is-liked' : ''}`;
  likeButton.type = 'button';
  likeButton.dataset.action = 'like';
  likeButton.setAttribute('aria-pressed', String(isLiked));
  likeButton.innerHTML = '<span aria-hidden="true">♥</span> 좋아요 <b></b>';
  likeButton.querySelector('b').textContent = String(post.likes ?? post.likedBy?.length ?? 0);
  const commentToggle = document.createElement('button');
  commentToggle.className = 'post-comment-toggle';
  commentToggle.type = 'button';
  commentToggle.dataset.action = 'comments';
  commentToggle.textContent = `댓글 ${post.comments?.length || 0}`;
  actions.append(likeButton, commentToggle);

  const commentsRegion = document.createElement('div');
  commentsRegion.className = 'post-comments';
  commentsRegion.hidden = true;
  const commentList = document.createElement('ol');
  commentList.className = 'comment-list';
  for (const comment of post.comments || []) {
    const item = document.createElement('li');
    item.className = 'post-comment';
    const meta = document.createElement('div');
    meta.className = 'comment-meta';
    const commentAuthor = document.createElement('strong');
    commentAuthor.textContent = comment.nickname;
    const commentTime = document.createElement('time');
    commentTime.dateTime = comment.createdAt;
    commentTime.textContent = formatPostTime(comment.createdAt);
    const commentContent = document.createElement('p');
    commentContent.textContent = comment.content;
    meta.append(commentAuthor, commentTime);
    item.append(meta, commentContent);
    commentList.append(item);
  }

  const commentForm = document.createElement('form');
  commentForm.className = 'comment-form';
  commentForm.dataset.action = 'add-comment';
  commentForm.innerHTML = '<label><span class="sr-only">닉네임</span><input name="nickname" maxlength="24" placeholder="닉네임" required autocomplete="nickname"></label><label class="comment-input"><span class="sr-only">댓글</span><input name="content" maxlength="1000" placeholder="댓글을 남겨보세요." required></label><button type="submit">등록</button>';
  commentsRegion.append(commentList, commentForm);

  article.append(head, title, content, actions, commentsRegion);
  return article;
}

function renderPosts() {
  const query = postSearch.value.trim().toLocaleLowerCase('ko');
  const sortedPosts = [...posts].sort((a, b) => {
    if (postSort.value === 'likes') return (b.likes || 0) - (a.likes || 0) || b.createdAt.localeCompare(a.createdAt);
    return b.createdAt.localeCompare(a.createdAt);
  });
  const filteredPosts = sortedPosts.filter((post) => `${post.title} ${post.content} ${post.nickname}`.toLocaleLowerCase('ko').includes(query));
  postList.replaceChildren(...filteredPosts.map(createPostElement));
  postCount.textContent = `게시글 ${posts.length}`;
  emptyBoard.hidden = filteredPosts.length !== 0;
  if (posts.length && !filteredPosts.length) emptyBoard.textContent = '검색 결과가 없습니다.';
  else emptyBoard.textContent = '아직 게시글이 없습니다. 첫 이야기를 남겨보세요.';
}

async function loadPosts() {
  try {
    const result = await requestBoard('/posts');
    posts = result.posts || [];
    const isLocalDemo = result.mode === 'local';
    storageNotice.hidden = !isLocalDemo;
    renderPosts();
  } catch (error) {
    storageNotice.textContent = `게시판 API에 연결할 수 없습니다. ${error.message}`;
    storageNotice.classList.add('is-error');
    boardFeedback.textContent = error.message;
  }
}

postForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(postForm);
  const nickname = String(formData.get('nickname') || '').trim();
  const title = String(formData.get('title') || '').trim();
  const content = String(formData.get('content') || '').trim();
  if (!nickname || !title || !content) return;

  try {
    await requestBoard('/posts', { method: 'POST', body: JSON.stringify({ nickname, title, content }) });
    await loadPosts();
    postForm.reset();
    boardFeedback.textContent = '게시글을 등록했습니다.';
  } catch (error) {
    boardFeedback.textContent = error.message;
  }
});

postList.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const article = button.closest('[data-post-id]');
  const post = posts.find((item) => item.id === article?.dataset.postId);
  if (!post) return;

  if (button.dataset.action === 'comments') {
    const region = article.querySelector('.post-comments');
    region.hidden = !region.hidden;
    return;
  }

  try {
    await requestBoard(`/posts/${encodeURIComponent(post.id)}/likes`, { method: 'POST' });
    await loadPosts();
  } catch (error) {
    boardFeedback.textContent = error.message;
  }
});

postList.addEventListener('submit', async (event) => {
  const form = event.target.closest('form[data-action="add-comment"]');
  if (!form) return;
  event.preventDefault();
  const article = form.closest('[data-post-id]');
  const post = posts.find((item) => item.id === article?.dataset.postId);
  const formData = new FormData(form);
  const nickname = String(formData.get('nickname') || '').trim();
  const content = String(formData.get('content') || '').trim();
  if (!post || !nickname || !content) return;

  try {
    await requestBoard(`/posts/${encodeURIComponent(post.id)}/comments`, { method: 'POST', body: JSON.stringify({ nickname, content }) });
    await loadPosts();
    boardFeedback.textContent = '댓글을 등록했습니다.';
  } catch (error) {
    boardFeedback.textContent = error.message;
  }
});

postSearch.addEventListener('input', renderPosts);
postSort.addEventListener('change', renderPosts);
loadPosts();