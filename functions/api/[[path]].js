// pages.dev는 Worker를 직접 붙일 수 없어서 /api/* 요청만 Workers(D1 연결됨)로 넘긴다.
const WORKER_ORIGIN = 'https://korea-bike-trails.qwerty123a03-975.workers.dev';

export function onRequest({ request }) {
  const { pathname, search } = new URL(request.url);
  return fetch(new Request(`${WORKER_ORIGIN}${pathname}${search}`, request));
}
