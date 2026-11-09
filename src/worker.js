// Enough room for 5,000 four-byte UTF-8 characters plus JSON field overhead.
const MAX_JSON_BYTES = 24_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const POST_PAGE_SIZE = 20;

const rateBuckets = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
      'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    },
  });
}

function visitorHash(request, env) {
  const visitorId = request.headers.get('X-Visitor-Id') || '';
  if (!/^[\w-]{16,100}$/.test(visitorId)) return null;
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${env.VISITOR_HASH_SALT || 'local-only-salt'}:${visitorId}`))
    .then((hash) => [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join(''));
}

function isRateLimited(key) {
  const now = Date.now();
  if (rateBuckets.size > 5000) {
    for (const [bucketKey, bucket] of rateBuckets) {
      if (now - bucket.start >= RATE_LIMIT_WINDOW_MS) rateBuckets.delete(bucketKey);
    }
  }
  const current = rateBuckets.get(key);
  if (!current || now - current.start >= RATE_LIMIT_WINDOW_MS) {
    rateBuckets.set(key, { start: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_MAX;
}

async function readJson(request) {
  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_JSON_BYTES) throw new Error('요청이 너무 큽니다.');
  if (!request.body) throw new Error('JSON 요청 형식이 올바르지 않습니다.');
  const reader = request.body.getReader();
  const chunks = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new Error('요청이 너무 큽니다.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const text = new TextDecoder().decode(buffer);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('JSON 요청 형식이 올바르지 않습니다.');
  }
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return null;
  const result = value.trim();
  if (!result || result.length > maxLength) return null;
  return result;
}

async function listPosts(request, env) {
  const visitor = await visitorHash(request, env);
  const url = new URL(request.url);
  const rawCursor = url.searchParams.get('cursor');
  let cursorId = null;
  let cursorCreatedAt = null;
  if (rawCursor) {
    try {
      if (rawCursor.length > 512) throw new Error('invalid cursor');
      const cursor = JSON.parse(atob(rawCursor));
      if (typeof cursor.id !== 'string' || cursor.id.length > 128 || typeof cursor.createdAt !== 'string' || cursor.createdAt.length > 64 || Number.isNaN(Date.parse(cursor.createdAt))) {
        throw new Error('invalid cursor');
      }
      cursorId = cursor.id;
      cursorCreatedAt = cursor.createdAt;
    } catch {
      return json({ error: '페이지 커서 값이 올바르지 않습니다.' }, 400);
    }
  }
  const { results: rows } = await env.DB.prepare(`
    SELECT p.id, p.nickname, p.title, p.content, p.created_at AS createdAt,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
      CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
        SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.visitor_id_hash = ?
      ) END AS viewerLiked
    FROM posts p
    WHERE (? IS NULL OR p.created_at < ? OR (p.created_at = ? AND p.id < ?))
    ORDER BY p.created_at DESC, p.id DESC
    LIMIT ?
  `).bind(visitor, visitor, cursorId, cursorCreatedAt, cursorCreatedAt, cursorId, POST_PAGE_SIZE + 1).all();

  const hasMore = rows.length > POST_PAGE_SIZE;
  const pageRows = hasMore ? rows.slice(0, POST_PAGE_SIZE) : rows;
  const commentsByPost = new Map(pageRows.map((post) => [post.id, []]));
  if (pageRows.length) {
    const placeholders = pageRows.map(() => '?').join(', ');
    const { results: comments } = await env.DB.prepare(`
      SELECT id, post_id AS postId, nickname, content, created_at AS createdAt
      FROM comments WHERE post_id IN (${placeholders}) ORDER BY created_at ASC, id ASC
    `).bind(...pageRows.map((post) => post.id)).all();
    for (const comment of comments) commentsByPost.get(comment.postId)?.push(comment);
  }
  const posts = pageRows.map((post) => ({
    ...post,
    likedBy: post.viewerLiked ? ['current'] : [],
    comments: commentsByPost.get(post.id) || [],
  }));
  const lastPost = pageRows.at(-1);
  const nextCursor = hasMore && lastPost
    ? btoa(JSON.stringify({ id: lastPost.id, createdAt: lastPost.createdAt }))
    : null;
  return json({ posts, nextCursor });
}

async function createPost(request, env) {
  const body = await readJson(request);
  const nickname = cleanText(body.nickname, 24);
  const title = cleanText(body.title, 100);
  const content = cleanText(body.content, 5000);
  if (!nickname || !title || !content) return json({ error: '닉네임, 제목, 내용을 확인해 주세요.' }, 400);
  const id = crypto.randomUUID();
  await env.DB.prepare('INSERT INTO posts (id, nickname, title, content) VALUES (?, ?, ?, ?)')
    .bind(id, nickname, title, content).run();
  return json({ id }, 201);
}

async function addComment(request, env, postId) {
  const body = await readJson(request);
  const nickname = cleanText(body.nickname, 24);
  const content = cleanText(body.content, 1000);
  if (!nickname || !content) return json({ error: '닉네임과 댓글 내용을 확인해 주세요.' }, 400);
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  await env.DB.prepare('INSERT INTO comments (id, post_id, nickname, content) VALUES (?, ?, ?, ?)')
    .bind(crypto.randomUUID(), postId, nickname, content).run();
  return json({ ok: true }, 201);
}

async function toggleLike(request, env, postId) {
  const hash = await visitorHash(request, env);
  if (!hash) return json({ error: '방문자 식별 정보가 없습니다. 페이지를 새로고침해 주세요.' }, 400);
  const post = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(postId).first();
  if (!post) return json({ error: '게시글을 찾을 수 없습니다.' }, 404);
  const deleted = await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND visitor_id_hash = ? RETURNING post_id')
    .bind(postId, hash).first();
  if (deleted) {
    return json({ liked: false });
  }
  await env.DB.prepare('INSERT OR IGNORE INTO likes (post_id, visitor_id_hash) VALUES (?, ?)').bind(postId, hash).run();
  return json({ liked: true });
}

function secureAssetResponse(response, request) {
  const headers = new Headers(response.headers);
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: blob: https://server.arcgisonline.com; connect-src 'self'; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'");
  if (new URL(request.url).protocol === 'https:') headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

async function handleApi(request, env, pathname) {
  if (request.method === 'GET' && pathname === '/api/posts') return listPosts(request, env);
  if (request.method === 'POST' && pathname === '/api/posts') return createPost(request, env);

  let match = pathname.match(/^\/api\/posts\/([\w-]+)\/comments$/);
  if (request.method === 'POST' && match) return addComment(request, env, match[1]);

  match = pathname.match(/^\/api\/posts\/([\w-]+)\/likes$/);
  if (request.method === 'POST' && match) return toggleLike(request, env, match[1]);

  return json({ error: 'API 경로를 찾을 수 없습니다.' }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/api/')) {
      return secureAssetResponse(await env.ASSETS.fetch(request), request);
    }
    if (!['GET', 'POST'].includes(request.method)) {
      return secureAssetResponse(json({ error: '지원하지 않는 메서드입니다.' }, 405), request);
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (request.method === 'POST' && isRateLimited(`${ip}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}`)) {
      return secureAssetResponse(json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429), request);
    }

    try {
      return secureAssetResponse(await handleApi(request, env, url.pathname), request);
    } catch (error) {
      if (error instanceof Error && /요청/.test(error.message)) {
        return secureAssetResponse(json({ error: error.message }, 400), request);
      }
      console.error('Board API error:', error?.stack || error);
      return secureAssetResponse(json({ error: '서버에서 요청을 처리하지 못했습니다.' }, 500), request);
    }
  },
};