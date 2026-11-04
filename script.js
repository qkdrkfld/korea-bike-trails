const routes = {
  hangang: {
    name: '한강 자전거길',
    distance: '56 km · 서울 구간',
    region: '아라한강갑문–팔당대교',
    level: '여유롭게',
    description: '서울 도심의 한강변에서 출발해 남한강의 풍경으로 이어지는 길입니다. 구간별로 나누어 달리기 좋아 처음 자전거 여행을 시작하는 분께도 잘 어울립니다.'
  },
  nakdong: {
    name: '낙동강 자전거길',
    distance: '389 km',
    region: '상주 상풍교–낙동강 하굿둑',
    level: '도전 코스',
    description: '안동에서 부산 을숙도까지 낙동강 물길을 따라 내려가는 긴 여정입니다. 강과 산, 여러 도시를 지나며 장거리 종주에 도전할 수 있습니다.'
  },
  geum: {
    name: '금강 자전거길',
    distance: '146 km',
    region: '대청댐–금강 하구둑',
    level: '여유롭게',
    description: '대전과 공주, 세종, 부여를 거쳐 금강 하구까지 이어집니다. 백제의 역사와 강변 풍경을 함께 만나는 코스입니다.'
  },
  jeju: {
    name: '제주 환상 자전거길',
    distance: '234 km',
    region: '제주 해안 일주',
    level: '도전 코스',
    description: '제주 해안선을 따라 섬을 한 바퀴 도는 순환 코스입니다. 바람과 날씨의 영향을 받을 수 있으니 출발 전 구간별 상황을 꼭 확인하세요.'
  }
};

const cards = [...document.querySelectorAll('.route-card')];
const filters = [...document.querySelectorAll('.filter-button')];
const searchInput = document.querySelector('#route-search');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#route-dialog');
const dialogClose = document.querySelector('.dialog-close');
const centersPanel = document.querySelector('#centers-panel');
const centerList = document.querySelector('#center-list');
const centersSource = document.querySelector('#centers-source');
let activeFilter = 'all';

const routeDetails = {
  hangang: {
    totalDistance: '56 km · 서울 구간',
    course: '아라한강갑문 → 여의도 → 뚝섬전망콤플렉스 또는 광나루자전거공원 → 팔당대교',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176973579&bbsCtgrySn=8&bbsCtgrySubSn=45',
    sourceLabel: '한강 종주 자전거길 공식 안내',
    map: 'https://www.bike.go.kr/resource/bike/img/content/sub01/info_map02.jpg',
    centers: [
    ['아라한강갑문', '출발점', '한강 종주 자전거길 시작'],
    ['여의도', '구간 거리 미확인', '한강 하류 인증 지점'],
    ['뚝섬전망콤플렉스', '구간 거리 미확인', '서울 한강변 인증 지점'],
    ['광나루 자전거공원', '분기 대안', '뚝섬 대신 선택 가능한 공식 인증 지점'],
    ['팔당대교', '도착점', '공식 서울 구간 종점']
    ],
    note: '공식 자전거행복나눔 안내는 아라한강갑문–팔당대교 56 km를 제시합니다. 여의도·뚝섬전망콤플렉스·광나루를 거치는 경로 선택이 있어 센터별 정확한 구간 km는 공식 안내에 별도 제공되지 않습니다.'
  },
  nakdong: {
    totalDistance: '389 km',
    course: '상주 상풍교 → 낙동강 하굿둑',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176974907&bbsCtgrySn=8&bbsCtgrySubSn=49',
    sourceLabel: '낙동강 자전거길 공식 안내',
    map: 'https://www.bike.go.kr/resource/bike/img/content/sub01/info_map06.jpg',
    centers: [
      ['상주 상풍교', '출발점', '새재 자전거길과 연결'],
      ['상주보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['낙단보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['구미보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['칠곡보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['강정고령보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['달성보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['합천창녕보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['창녕함안보', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['양산 물문화관', '구간 거리 미확인', '정확한 구간 km는 공식 자료에서 별도 제공되지 않음'],
      ['낙동강 하굿둑', '도착점', '공식 종점']
    ],
    note: '공식 코스 순서와 총거리는 자전거행복나눔 안내를 따릅니다. 공식 공개자료에서 구간별 거리는 확인되지 않아 임의의 km를 기재하지 않았습니다.'
  },
  geum: {
    totalDistance: '146 km',
    course: '대청댐 → 금강 하구둑',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2008068569235&bbsCtgrySn=8&bbsCtgrySubSn=50',
    sourceLabel: '금강 자전거길 공식 안내',
    map: 'https://www.bike.go.kr/resource/bike/img/content/sub01/info_map07.jpg',
    centers: [
    ['대청댐', '출발점', '대전·청주 인근'],
      ['세종보', '구간 거리 미확인', '대청댐 하류'],
      ['공주보', '구간 거리 미확인', '세종–공주 구간'],
      ['백제보', '구간 거리 미확인', '공주–부여 구간'],
      ['익산 성당포구', '구간 거리 미확인', '부여–익산 구간'],
    ['금강하굿둑 (철새조망대)', '구간 거리 미확인', '군산 쪽 하굿둑 인증 지점'],
    ['금강하굿둑 (조류생태전시관)', '도착점', '서천 쪽 하굿둑 인증 지점']
    ],
    note: '공식 코스 순서와 총거리는 자전거행복나눔 안내 기준입니다. 구간별 거리는 공식 공개자료에서 확인되지 않아 임의의 km를 기재하지 않았습니다.'
  },
  jeju: {
    totalDistance: '234 km · 순환 코스',
    course: '용두암에서 시계 반대 방향으로 제주 해안 일주',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176979144&bbsCtgrySn=8&bbsCtgrySubSn=56',
    sourceLabel: '제주환상 자전거길 공식 안내',
    map: 'https://www.bike.go.kr/resource/bike/img/content/sub01/info_map13.jpg',
    centers: [
      ['용두암', '출발·도착', '제주환상 자전거길 시작점'],
      ['다락쉼터', '구간 거리 미확인', '제주 서북 해안'],
      ['해거름마을공원', '구간 거리 미확인', '한경면 해안'],
      ['송악산', '구간 거리 미확인', '제주 남서부'],
      ['법환바당', '구간 거리 미확인', '서귀포 해안'],
      ['쇠소깍', '구간 거리 미확인', '서귀포 동남부'],
      ['표선해변', '구간 거리 미확인', '제주 동남 해안'],
      ['성산일출봉', '구간 거리 미확인', '제주 동부'],
      ['김녕성세기해변', '구간 거리 미확인', '제주 북동 해안'],
      ['함덕서우봉해변', '구간 거리 미확인', '제주시 동쪽'],
      ['용두암', '구간 거리 미확인', '순환 종점']
    ],
    note: '공식 안내의 주요 인증센터 순서 및 234 km 순환 구간을 반영했습니다. 공식 인증센터 표와 코스 경유지 목록의 명칭이 일부 달라 표에 등록된 센터를 기준으로 정리했습니다. 공식 페이지에 센터별 구간 거리가 없어 임의의 km는 표시하지 않았습니다.'
  }
};

function showCenters(routeKey) {
  const route = routes[routeKey];
  const detail = routeDetails[routeKey];
  if (!route || !detail) return;

  document.querySelector('#centers-title').textContent = `${route.name} 인증센터`;
  const total = document.createElement('strong');
  total.textContent = detail.totalDistance;
  const course = document.createElement('span');
  course.textContent = detail.course;
  const summary = document.querySelector('#centers-summary');
  summary.replaceChildren(total, course);
  centersPanel.querySelector('.centers-note').textContent = detail.note;
  centersSource.href = detail.source;
  centersSource.textContent = `${detail.sourceLabel} ↗`;
  centerList.replaceChildren();
  const officialMap = document.createElement('img');
  officialMap.className = 'official-route-map';
  officialMap.src = detail.map;
  officialMap.alt = `${route.name} 공식 노선 참고 지도`;
  officialMap.loading = 'lazy';
  centerList.parentElement.insertBefore(officialMap, centerList);
  centersPanel.querySelectorAll(".official-route-map").forEach((image) => {
    if (image !== officialMap) image.remove();
  });
  detail.centers.forEach(([name, distance, sublabel], index) => {
    const item = document.createElement('li');
    item.className = 'center-stop';
    item.innerHTML = `<span class="stop-order">${String(index + 1).padStart(2, '0')}</span><span class="stop-name"><strong></strong><small></small></span><span class="stop-distance"></span>`;
    item.querySelector('strong').textContent = name;
    item.querySelector('small').textContent = sublabel;
    item.querySelector('.stop-distance').textContent = distance;
    centerList.appendChild(item);
  });
  centersPanel.hidden = false;
  centersPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function filterRoutes() {
  const query = searchInput.value.trim().toLocaleLowerCase('ko');
  let visibleCount = 0;

  cards.forEach((card) => {
    const matchesFilter = activeFilter === 'all' || card.dataset.tags.split(' ').includes(activeFilter);
    const matchesSearch = !query || card.dataset.search.toLocaleLowerCase('ko').includes(query);
    const visible = matchesFilter && matchesSearch;
    card.hidden = !visible;
    if (visible) visibleCount += 1;
  });

  emptyState.hidden = visibleCount !== 0;
}

function clearSearch() {
  if (!searchInput.value) return;
  searchInput.value = '';
  filterRoutes();
}

filters.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    filters.forEach((filter) => {
      const selected = filter === button;
      filter.classList.toggle('is-active', selected);
      filter.setAttribute('aria-pressed', String(selected));
    });
    filterRoutes();
  });
});

searchInput.addEventListener('input', filterRoutes);

document.querySelectorAll('.card-open').forEach((button) => {
  button.addEventListener('click', () => {
    const route = routes[button.dataset.route];
    if (!route) return;
    showCenters(button.dataset.route);
  });
});

document.querySelector('.centers-close').addEventListener('click', () => {
  centersPanel.hidden = true;
});

dialogClose.addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  if (event.target === dialog) dialog.close();
});
dialog.addEventListener('close', clearSearch);

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
});