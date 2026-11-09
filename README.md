# 대한민국 국토종주 자전거길 안내

대한민국 국토종주 자전거길 코스와 인증 지점을 확인하고, 라이더 게시판에서 코스 이야기를 나눌 수 있는 웹사이트입니다.

## 배포 사이트

배포된 사이트는 아래 링크에서 이용할 수 있습니다.

[대한민국 국토종주 자전거길 안내](https://korea-bike-trails.qwerty123a03-975.workers.dev)

## 구현 방식

사이트 화면은 HTML, CSS, JavaScript로 구성했습니다. 자전거길 코스와 인증 지점은 좌표 데이터를 이용해 지도와 카드에 표시하고, 코스를 선택하면 상세 정보와 공식 안내 링크를 확인할 수 있습니다.

Cloudflare Workers가 정적 사이트 파일을 제공하고 게시판 API를 처리합니다. 게시글, 댓글, 좋아요 데이터는 Cloudflare D1에 저장하며, 테이블 구조와 변경 내역은 `migrations/`의 SQL 마이그레이션으로 관리합니다.

## 로컬 개발 및 배포

Node.js와 npm을 설치한 뒤 프로젝트 루트에서 아래 명령을 실행합니다.

```bash
npm install
npm run dev
```

사이트 파일을 `public/`에 빌드하고 Cloudflare Workers에 배포하려면 다음 명령을 사용합니다.

```bash
npm run deploy
```

D1 마이그레이션은 로컬 개발 DB에 `npm run db:local`, 운영 DB에 `npm run db:remote`를 실행해 적용합니다. 운영 배포와 원격 데이터베이스 작업에는 Cloudflare 인증이 필요합니다.