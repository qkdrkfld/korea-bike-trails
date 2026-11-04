const MAX_JSON_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;

const rateBuckets = new Map();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
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
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_JSON_BYTES) throw new Error('요청이 너무 큽니다.');
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
  const { results: rows } = await env.DB.prepare(`
    SELECT p.id, p.nickname, p.title, p.content, p.created_at AS createdAt,
      (SELECT COUNT(*) FROM likes l WHERE l.post_id = p.id) AS likes,
      CASE WHEN ? IS NULL THEN 0 ELSE EXISTS(
        SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.visitor_id_hash = ?
      ) END AS viewerLiked
    FROM posts p ORDER BY p.created_at DESC LIMIT 100
  `).bind(visitor, visitor).all();

  const posts = await Promise.all(rows.map(async (post) => {
    const { results: comments } = await env.DB.prepare(`
      SELECT id, nickname, content, created_at AS createdAt
      FROM comments WHERE post_id = ? ORDER BY created_at ASC
    `).bind(post.id).all();
    return { ...post, likedBy: post.viewerLiked ? ['current'] : [], comments };
  }));
  return json({ posts });
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
  const existing = await env.DB.prepare('SELECT 1 AS liked FROM likes WHERE post_id = ? AND visitor_id_hash = ?')
    .bind(postId, hash).first();
  if (existing) {
    await env.DB.prepare('DELETE FROM likes WHERE post_id = ? AND visitor_id_hash = ?').bind(postId, hash).run();
    return json({ liked: false });
  }
  await env.DB.prepare('INSERT INTO likes (post_id, visitor_id_hash) VALUES (?, ?)').bind(postId, hash).run();
  return json({ liked: true });
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
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);
    if (!['GET', 'POST'].includes(request.method)) return json({ error: '지원하지 않는 메서드입니다.' }, 405);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    if (request.method === 'POST' && isRateLimited(`${ip}:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}`)) {
      return json({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.' }, 429);
    }

    try {
      return await handleApi(request, env, url.pathname);
    } catch (error) {
      if (error instanceof Error && /요청/.test(error.message)) return json({ error: error.message }, 400);
      console.error('Board API error:', error);
      return json({ error: '서버에서 요청을 처리하지 못했습니다.' }, 500);
    }
  },
};