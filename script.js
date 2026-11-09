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
    region: '안동댐–낙동강 하굿둑',
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
const centersPanel = document.querySelector('#centers-panel');
const centerList = document.querySelector('#center-list');
const centersSource = document.querySelector('#centers-source');
const mapStage = document.querySelector('#map-stage');
let activeFilter = 'all';
let officialRouteData = null;

const officialRoutes = [
  { id: 'ara', title: '아라자전거길', roadSn: 1, category: 'arterial', color: '#d28c33' },
  { id: 'hangang', title: '한강종주자전거길(서울구간)', roadSn: 2, category: 'river', color: '#e77845' },
  { id: 'namhan', title: '남한강자전거길', roadSn: 3, category: 'river', color: '#e77845' },
  { id: 'bukhan', title: '북한강자전거길', roadSn: 8, category: 'river', color: '#e77845' },
  { id: 'saejae', title: '새재자전거길', roadSn: 4, category: 'crossing', color: '#477b69' },
  { id: 'nakdong', title: '낙동강자전거길', roadSn: 5, category: 'river', color: '#477b69' },
  { id: 'geum', title: '금강자전거길', roadSn: 6, category: 'river', color: '#bf8b34' },
  { id: 'yeongsan', title: '영산강자전거길', roadSn: 7, category: 'river', color: '#6387a8' },
  { id: 'seomjin', title: '섬진강자전거길', roadSn: 9, category: 'river', color: '#a86c8d' },
  { id: 'ocheon', title: '오천자전거길', roadSn: 10, category: 'river', color: '#7779ab' },
  { id: 'eastGangwon', title: '동해안자전거길(강원)', roadSn: 11, category: 'coast', color: '#3284a0' },
  { id: 'eastGyeongbuk', title: '동해안자전거길(경북)', roadSn: 12, category: 'coast', color: '#3284a0' },
  { id: 'jeju', title: '제주환상자전거길', roadSn: 13, category: 'coast', color: '#d95f4a' }
];

const cardRouteToGeometry = {
  hangang: ['ara', 'hangang', 'namhan', 'bukhan'],
  nakdong: ['nakdong'],
  geum: ['geum'],
  jeju: ['jeju'],
  saejae: ['saejae'],
  ocheon: ['ocheon'],
  yeongsan: ['yeongsan'],
  seomjin: ['seomjin'],
  eastGangwon: ['eastGangwon'],
  eastGyeongbuk: ['eastGyeongbuk']
};

const miniMapColors = {
  hangang: '#e77845',
  namhan: '#e77845',
  bukhan: '#e77845',
  ara: '#d28c33',
  saejae: '#477b69',
  nakdong: '#477b69',
  geum: '#bf8b34',
  jeju: '#d95f4a',
  yeongsan: '#6387a8',
  seomjin: '#a86c8d',
  ocheon: '#7779ab',
  eastGangwon: '#3284a0',
  eastGyeongbuk: '#3284a0'
};

const geometryToCardRoute = Object.fromEntries(
  Object.entries(cardRouteToGeometry).flatMap(([cardRoute, geometryIds]) =>
    geometryIds.map((geometryId) => [geometryId, cardRoute]))
);

const officialRouteDetails = {
  ara: {
    totalDistance: '21 km', course: '아라서해갑문 → 아라한강갑문',
    description: '경인아라뱃길을 따라 곧게 이어지는 자전거길입니다.',
    centers: [['아라서해갑문', '출발점', '공식 지도 안내'], ['아라한강갑문', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=1&roadType=1&xp=37.570595&yp=126.699981&key=2008148358544&zm=12'
  },
  hangang: {
    totalDistance: '56 km · 서울 구간', course: '아라한강갑문 → 팔당대교',
    description: '한강을 따라 도시 속 휴식처를 지나는 산책하듯 편안한 코스입니다.',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176973579&bbsCtgrySn=8&bbsCtgrySubSn=45'
  },
  namhan: {
    totalDistance: '132 km', course: '팔당대교 → 충주 탄금대',
    description: '옛 중앙선 폐철도 구간을 지나는 남한강 자전거길입니다.',
    centers: [['팔당대교', '출발점', '공식 지도 안내'], ['능내역', '인증센터', '공식 지도 안내'], ['양평자전거쉼터', '경유지', '공식 지도 안내'], ['이포보', '인증센터', '공식 지도 안내'], ['여주보', '인증센터', '공식 지도 안내'], ['강천보', '인증센터', '공식 지도 안내'], ['비내섬', '인증센터', '공식 지도 안내'], ['목행교', '경유지', '공식 지도 안내'], ['충주 탄금대', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=3&roadType=1&xp=37.3264&yp=127.605&key=2008148358544&zm=10'
  },
  bukhan: {
    totalDistance: '99 km', course: '북한강 자전거길',
    description: '청평호반과 의암호반 등 호수와 산의 풍경을 지나는 코스입니다.',
    centers: [['밝은광장', '출발점', '공식 지도 안내'], ['샛터삼거리', '인증센터', '공식 지도 안내'], ['경강교', '인증센터', '공식 지도 안내'], ['신매대교', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=8&roadType=1&xp=37.7373013&yp=127.5152776&key=2008148358544&zm=10'
  },
  saejae: {
    totalDistance: '100 km', course: '충주 탄금대 → 상주 상풍교',
    description: '한강과 낙동강을 잇고 이화령 고개를 넘는 종주 코스입니다.',
    centers: [['충주 탄금대', '출발점', '공식 지도 안내'], ['수안보온천', '인증센터', '공식 지도 안내'], ['이화령휴게소', '인증센터', '공식 지도 안내'], ['문경불정역', '인증센터', '공식 지도 안내'], ['상주 상풍교', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=4&roadType=1&xp=36.7583339&yp=128.0777724&key=2008148358544&zm=10'
  },
  nakdong: {
    totalDistance: '389 km', course: '안동댐 → 낙동강 하굿둑',
    description: '상주에서 낙동강 하구까지 이어지는 장거리 자전거길입니다.',
    centers: [['안동댐', '출발점', '공식 지도 안내'], ['상주 상풍교', '인증센터', '공식 지도 안내'], ['상주보', '인증센터', '공식 지도 안내'], ['낙단보', '인증센터', '공식 지도 안내'], ['구미보', '인증센터', '공식 지도 안내'], ['칠곡보', '인증센터', '공식 지도 안내'], ['강정고령보', '인증센터', '공식 지도 안내'], ['달성보', '인증센터', '공식 지도 안내'], ['합천창녕보', '인증센터', '공식 지도 안내'], ['창녕함안보', '인증센터', '공식 지도 안내'], ['양산물문화관', '인증센터', '공식 지도 안내'], ['낙동강 하굿둑', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176974907&bbsCtgrySn=8&bbsCtgrySubSn=49'
  },
  geum: {
    totalDistance: '146 km', course: '대청댐 → 금강 하구둑',
    description: '대청댐에서 금강 하구둑까지 백제의 숨결과 강 풍경을 따라갑니다.',
    centers: [['대청댐', '출발점', '공식 지도 안내'], ['세종보', '인증센터', '공식 지도 안내'], ['공주보', '인증센터', '공식 지도 안내'], ['백제보', '인증센터', '공식 지도 안내'], ['익산성당포구', '인증센터', '공식 지도 안내'], ['금강하굿둑', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=6&roadType=1&xp=36.2581401&yp=127.1116202&key=2008148358544&zm=10'
  },
  yeongsan: {
    totalDistance: '133 km', course: '담양댐 → 영산강 하구둑',
    description: '담양에서 영산강 하구까지 남도의 풍경을 따라 이어집니다.',
    centers: [['담양댐', '출발점', '공식 지도 안내'], ['메타세콰이아길', '인증센터', '공식 지도 안내'], ['담양대나무숲', '인증센터', '공식 지도 안내'], ['승촌보', '인증센터', '공식 지도 안내'], ['죽산보', '인증센터', '공식 지도 안내'], ['느러지 전망관람대', '인증센터', '공식 지도 안내'], ['영산강 하굿둑', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=7&roadType=1&xp=35.0733548&yp=126.7343273&key=2008148358544&zm=10'
  },
  seomjin: {
    totalDistance: '149 km', course: '섬진강 생활체육공원 → 광양 배알도 해수욕장',
    description: '전북 임실에서 전남 광양까지 섬진강 물길을 따라 이어지는 자전거길입니다.',
    centers: [['섬진강댐', '출발점', '공식 지도 안내'], ['장군목', '인증센터', '공식 지도 안내'], ['향가유원지', '인증센터', '공식 지도 안내'], ['횡탄정', '인증센터', '공식 지도 안내'], ['사성암', '인증센터', '공식 지도 안내'], ['남도대교', '인증센터', '공식 지도 안내'], ['매화마을', '인증센터', '공식 지도 안내'], ['배알도수변공원', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=9&roadType=1&xp=35.2480973&yp=127.3993046&key=2008148358544&zm=10'
  },
  ocheon: {
    totalDistance: '105 km', course: '충북 괴산 → 세종',
    description: '괴산·증평·청원을 거쳐 다섯 하천을 따라 세종까지 이어집니다.',
    centers: [['합강공원', '종점', '공식 지도 안내'], ['무심천교', '인증센터', '공식 지도 안내'], ['행촌교차로', '인증센터', '공식 지도 안내'], ['백로공원', '인증센터', '공식 지도 안내'], ['괴강교', '출발점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=10&roadType=1&xp=36.6430611&yp=127.6615165&key=2008148358544&zm=10'
  },
  eastGangwon: {
    totalDistance: '242 km', course: '통일전망대 → 고포마을',
    description: '강원 동해안을 따라 항구와 해변 풍경을 잇는 자전거길입니다.',
    centers: [['통일전망대(민통선 내)', '출발점', '공식 지도 안내'], ['북천철교', '인증센터', '공식 지도 안내'], ['봉포해변', '인증센터', '공식 지도 안내'], ['영금정', '인증센터', '공식 지도 안내'], ['동호해변', '경유지', '공식 지도 안내'], ['경포해변', '경유지', '공식 지도 안내'], ['정동진', '경유지', '공식 지도 안내'], ['추암촛대바위', '경유지', '공식 지도 안내'], ['임원', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=11&roadType=1&xp=38.1136786&yp=128.7221259&key=2008148358544&zm=10'
  },
  eastGyeongbuk: {
    totalDistance: '76 km', course: '울진 은어다리 → 해맞이공원',
    description: '경북 동해안을 따라 해안 풍경을 즐기는 자전거길입니다.',
    centers: [['울진 은어다리', '출발점', '공식 지도 안내'], ['망양휴게소', '인증센터', '공식 지도 안내'], ['월송정', '인증센터', '공식 지도 안내'], ['고래불해변', '인증센터', '공식 지도 안내'], ['해맞이공원', '도착점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=12&roadType=1&xp=36.7441&yp=129.462&key=2008148358544&zm=10'
  },
  jeju: {
    totalDistance: '234 km', course: '제주 해안 일주',
    description: '제주 해안도로를 따라 해변과 송악산, 쇠소깍, 성산일출봉을 지나는 순환 코스입니다.',
    centers: [['용두암', '출발점', '공식 지도 안내'], ['다락쉼터', '인증 지점', '공식 지도 안내'], ['해거름마을공원', '인증 지점', '공식 지도 안내'], ['송악산', '인증 지점', '공식 지도 안내'], ['법환바당', '인증 지점', '공식 지도 안내'], ['쇠소깍', '인증 지점', '공식 지도 안내'], ['표선해변', '인증 지점', '공식 지도 안내'], ['성산일출봉', '인증 지점', '공식 지도 안내'], ['김녕성세기해변', '인증 지점', '공식 지도 안내'], ['함덕서우봉해변', '인증 지점', '공식 지도 안내']],
    source: 'https://www.bike.go.kr/map/roadMap.do?roadSn=13&roadType=1&xp=33.3974515&yp=126.4972971&key=2008148358544&zm=11'
  }
};

const routeMapCenters = {
  ara: [37.570595, 126.699981, 12],
  hangang: [37.549826, 126.983513, 11],
  namhan: [37.3264, 127.605, 10],
  bukhan: [37.7373013, 127.5152776, 10],
  saejae: [36.7583339, 128.0777724, 10],
  nakdong: [35.8485767, 128.6245911, 10],
  geum: [36.2581401, 127.1116202, 10],
  yeongsan: [35.0733548, 126.7343273, 10],
  seomjin: [35.2480973, 127.3993046, 10],
  ocheon: [36.6430611, 127.6615165, 10],
  eastGangwon: [38.1136786, 128.7221259, 10],
  eastGyeongbuk: [36.7441, 129.462, 10],
  jeju: [33.3974515, 126.4972971, 11]
};

function openOfficialRoute(routeId) {
  const route = officialRoutes.find((item) => item.id === routeId);
  const center = routeMapCenters[routeId];
  if (!route || !center) return;
  const [latitude, longitude, zoom] = center;
  const url = `https://www.bike.go.kr/map/roadMap.do?roadSn=${route.roadSn}&roadType=1&xp=${latitude}&yp=${longitude}&key=2008148358544&zm=${zoom}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function routeMapUrl(routeId) {
  const route = officialRoutes.find((item) => item.id === routeId);
  const center = routeMapCenters[routeId];
  if (!route || !center) return 'https://www.bike.go.kr/';
  const [latitude, longitude, zoom] = center;
  return `https://www.bike.go.kr/map/roadMap.do?roadSn=${route.roadSn}&roadType=1&xp=${latitude}&yp=${longitude}&key=2008148358544&zm=${zoom}`;
}

// 전체 지도와 카드 지도가 같은 바탕·선 굵기·축척을 쓰도록 공통으로 만든다.
const routeLineWeight = 3.5;
const overviewProjection = { west: 124.5, east: 132, north: 38.9, south: 33, width: 1771.626, height: 1672.413 };

let leafletPromise;
function ensureLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.querySelector('link[data-leaflet-styles]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      link.dataset.leafletStyles = 'true';
      document.head.append(link);
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.async = true;
    script.onload = () => window.L ? resolve(window.L) : reject(new Error('지도 라이브러리를 사용할 수 없습니다.'));
    script.onerror = () => reject(new Error('지도 라이브러리를 불러오지 못했습니다.'));
    document.head.append(script);
  }).catch((error) => {
    leafletPromise = null;
    throw error;
  });

  return leafletPromise;
}

function createRouteMap(element) {
  const map = L.map(element, {
    zoomControl: false,
    dragging: false,
    touchZoom: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    boxZoom: false,
    keyboard: false,
    tap: false,
    zoomSnap: 0.25,
  });
  map.attributionControl.setPrefix(false);
  L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
    maxNativeZoom: 16,
    maxZoom: 18,
    attribution: 'Tiles © <a href="https://www.esri.com/" target="_blank" rel="noreferrer">Esri</a>',
  }).addTo(map);
  L.control.scale({ position: 'bottomright', imperial: false, maxWidth: 70 }).addTo(map);
  return map;
}

const toLatLngs = (path) => path.map(([longitude, latitude]) => [latitude, longitude]);

function projectOverviewPoint([longitude, latitude]) {
  const radians = Math.max(-85, Math.min(85, latitude)) * Math.PI / 180;
  const northRadians = overviewProjection.north * Math.PI / 180;
  const southRadians = overviewProjection.south * Math.PI / 180;
  const mercator = Math.log(Math.tan(Math.PI / 4 + radians / 2));
  const north = Math.log(Math.tan(Math.PI / 4 + northRadians / 2));
  const south = Math.log(Math.tan(Math.PI / 4 + southRadians / 2));
  return [
    (longitude - overviewProjection.west) / (overviewProjection.east - overviewProjection.west) * overviewProjection.width,
    (north - mercator) / (north - south) * overviewProjection.height,
  ];
}

function simplifyRoutePoints(points, tolerance = 0.003) {
  if (points.length <= 2) return points;
  const [startX, startY] = points[0];
  const [endX, endY] = points[points.length - 1];
  const dx = endX - startX;
  const dy = endY - startY;
  let farthestIndex = 0;
  let farthestDistance = 0;
  const denominator = dx * dx + dy * dy;
  for (let index = 1; index < points.length - 1; index += 1) {
    const [x, y] = points[index];
    const projection = denominator
      ? Math.max(0, Math.min(1, ((x - startX) * dx + (y - startY) * dy) / denominator))
      : 0;
    const distance = Math.hypot(x - (startX + projection * dx), y - (startY + projection * dy));
    if (distance > farthestDistance) {
      farthestDistance = distance;
      farthestIndex = index;
    }
  }
  if (farthestDistance <= tolerance) return [points[0], points.at(-1)];
  const left = simplifyRoutePoints(points.slice(0, farthestIndex + 1), tolerance);
  const right = simplifyRoutePoints(points.slice(farthestIndex), tolerance);
  return [...left.slice(0, -1), ...right];
}

function renderOfficialRoutes(data) {
  const layer = document.querySelector('#official-route-layers');
  layer.replaceChildren();
  officialRoutes.forEach((route) => {
    data[route.id]?.paths.forEach((rawCoordinates, pathIndex) => {
      const coordinates = simplifyRoutePoints(rawCoordinates);
      if (coordinates.length < 2) return;
      const projected = coordinates.map(projectOverviewPoint);
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.classList.add('official-route-line', `route-${route.category}`);
      path.dataset.route = route.id;
      path.dataset.cardRoute = geometryToCardRoute[route.id] || route.id;
      path.dataset.routeName = route.title;
      path.style.setProperty('--route-color', route.color);
      path.style.setProperty('--route-opacity', pathIndex === 0 ? '1' : '.82');
      path.setAttribute('d', projected.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' '));
      path.setAttribute('aria-label', `${route.title} · 공식 노선`);
      path.setAttribute('tabindex', '0');
      path.setAttribute('role', 'button');
      path.addEventListener('click', () => selectMapRoute(route.id));
      path.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectMapRoute(route.id);
        }
      });
      path.addEventListener('dblclick', (event) => {
        event.preventDefault();
        openOfficialRoute(route.id);
      });
      layer.appendChild(path);
    });
  });
  mapStage.dataset.mapReady = 'true';
}

function renderCardRouteMaps(data) {
  const renderOneCardMap = (element) => {
    const cardRoute = element.dataset.routeMap;
    const geometryIds = cardRouteToGeometry[cardRoute] || [cardRoute];
    const allPaths = geometryIds.flatMap((id) => data[id]?.paths || [])
      .filter((path) => path.length > 1)
      .map((path) => simplifyRoutePoints(path));
    if (!allPaths.length) return;

    const projectMiniPoint = ([longitude, latitude]) => {
      const radians = Math.max(-85, Math.min(85, latitude)) * Math.PI / 180;
      const mercatorY = Math.log(Math.tan(Math.PI / 4 + radians / 2));
      return [(longitude + 180) / 360, (1 - mercatorY / Math.PI) / 2];
    };
    const projectedPaths = allPaths.map((path) => path.map(projectMiniPoint));
    const points = projectedPaths.flat();
    const routeColor = miniMapColors[cardRoute] || '#477b69';
    const left = Math.min(...points.map(([x]) => x));
    const right = Math.max(...points.map(([x]) => x));
    const top = Math.min(...points.map(([, y]) => y));
    const bottom = Math.max(...points.map(([, y]) => y));
    const spanX = Math.max(right - left, 0.00001);
    const spanY = Math.max(bottom - top, 0.00001);
    const padX = spanX * 0.14;
    const padY = spanY * 0.18;
    const bounds = { left: left - padX, top: top - padY, width: spanX + padX * 2, height: spanY + padY * 2 };
    const width = 320;
    const height = 160;
    const scale = Math.min(width / bounds.width, height / bounds.height);
    const offsetX = (width - bounds.width * scale) / 2;
    const offsetY = (height - bounds.height * scale) / 2;
    const toSvg = ([x, y]) => [offsetX + (x - bounds.left) * scale, offsetY + (y - bounds.top) * scale];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    svg.setAttribute('aria-hidden', 'true');
    const routeLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const endpoints = [];
    projectedPaths.forEach((path) => {
      const projected = path.map(toSvg);
      const d = projected.map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
      const halo = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      halo.setAttribute('d', d);
      halo.setAttribute('class', 'mini-route-halo');
      routeLayer.appendChild(halo);
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      line.setAttribute('d', d);
      line.setAttribute('class', 'mini-route-line');
      line.style.setProperty('--mini-route-color', routeColor);
      routeLayer.appendChild(line);
      endpoints.push(projected[0], projected.at(-1));
    });
    svg.appendChild(routeLayer);

    endpoints.filter(([x, y], index) => !endpoints.slice(0, index).some(([otherX, otherY]) => Math.hypot(x - otherX, y - otherY) < 1.5))
      .forEach(([cx, cy]) => {
        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        marker.setAttribute('cx', cx.toFixed(2));
        marker.setAttribute('cy', cy.toFixed(2));
        marker.setAttribute('r', '3');
        marker.setAttribute('class', 'mini-route-point');
        marker.style.setProperty('--mini-route-color', routeColor);
        svg.appendChild(marker);
      });

    // Approximate scale at the route midpoint; the route geometry itself remains in Web Mercator.
    const meanLatitude = allPaths.flat().reduce((sum, [, lat]) => sum + lat, 0) / allPaths.flat().length;
    const metersPerPixel = 156543.03392 * Math.cos(meanLatitude * Math.PI / 180) / (2 ** 7);
    const scaleLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    const scaleLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const scaleText = metersPerPixel * 42 >= 1000 ? `${Math.round(metersPerPixel * 42 / 1000)} km` : `${Math.round(metersPerPixel * 4.2) * 10} m`;
    scaleLabel.textContent = scaleText;
    scaleLabel.setAttribute('x', '258');
    scaleLabel.setAttribute('y', '137');
    scaleLabel.setAttribute('class', 'mini-map-scale-label');
    scaleLine.setAttribute('d', 'M258 142h42m-42-3v6m42-6v6');
    scaleLine.setAttribute('class', 'mini-map-scale-line');
    svg.append(scaleLine, scaleLabel);

    element.replaceChildren(svg);
    element.dataset.mapReady = 'true';
  };

  document.querySelectorAll('.mini-route-map[data-route-map]').forEach(renderOneCardMap);
}

fetch(new URL('route-data.json', document.currentScript?.src || location.href))
  .then((response) => {
    if (!response.ok) throw new Error('공식 노선 데이터를 불러오지 못했습니다.');
    return response.json();
  })
  .then((data) => {
    officialRouteData = data;
    renderOfficialRoutes(data);
    renderCardRouteMaps(data);
    mapStage.dataset.routesUnavailable = 'false';
  })
  .catch((error) => {
    mapStage.dataset.routesUnavailable = 'true';
    console.error('Failed to load official route data:', error);
  });

fetch(new URL('center-data.json', document.currentScript?.src || location.href))
  .then((response) => (response.ok ? response.json() : null))
  .then((data) => { centerData = data; })
  .catch((error) => console.error('Failed to load center data:', error));

const routeDetails = {
  hangang: {
    totalDistance: '56 km · 서울 구간',
    course: '아라한강갑문 → 여의도 → 뚝섬전망콤플렉스 또는 광나루자전거공원 → 팔당대교',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176973579&bbsCtgrySn=8&bbsCtgrySubSn=45',
    sourceLabel: '한강 종주 자전거길 공식 안내',
    mapUrl: 'https://www.bike.go.kr/map/roadMap.do?roadSn=2&roadType=1&xp=37.549826&yp=126.983513&key=2008148358544&zm=11',
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
    course: '안동댐 → 낙동강 하굿둑',
    source: 'https://www.bike.go.kr/bbs/road.do?key=2006176974907&bbsCtgrySn=8&bbsCtgrySubSn=49',
    sourceLabel: '낙동강 자전거길 공식 안내',
    mapUrl: 'https://www.bike.go.kr/map/roadMap.do?roadSn=5&roadType=1&xp=35.8485767&yp=128.6245911&key=2008148358544&zm=10',
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
    mapUrl: 'https://www.bike.go.kr/map/roadMap.do?roadSn=6&roadType=1&xp=36.2581401&yp=127.1116202&key=2008148358544&zm=10',
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
    mapUrl: 'https://www.bike.go.kr/map/roadMap.do?roadSn=13&roadType=1&xp=33.3974515&yp=126.4972971&key=2008148358544&zm=11',
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

let centersMap = null;

// 선택한 길의 큰 지도: 노선선과 번호가 붙은 인증센터 핀
async function renderCentersMap(routeId) {
  const element = document.querySelector('#centers-map');
  centersMap?.remove();
  centersMap = null;
  const paths = (officialRouteData?.[routeId]?.paths || []).filter((path) => path.length > 1);
  element.hidden = !paths.length;
  if (element.hidden) return;

  element.dataset.loading = 'true';
  try {
    await ensureLeaflet();
    if (centersPanel.hidden || element.dataset.routeId !== routeId) return;
    centersMap?.remove();
    const map = centersMap = createRouteMap(element);
    const color = officialRoutes.find((route) => route.id === routeId)?.color || '#477b69';
    const lines = paths.map((path) => L.polyline(toLatLngs(path), {
      color, weight: routeLineWeight, lineJoin: 'round', interactive: false,
    }).addTo(map));
    (centerData?.[routeId]?.centers || []).forEach((center, index) => {
      if (center.lat == null) return;
      const icon = L.divIcon({ className: 'center-pin', html: `<span style="border-color:${color}">${index + 1}</span>`, iconSize: [22, 22] });
      L.marker([center.lat, center.lon], { icon, title: center.name, keyboard: false }).addTo(map);
    });
    map.fitBounds(L.featureGroup(lines).getBounds(), { padding: [28, 28] });
    element.dataset.loading = 'false';
    element.dataset.mapReady = 'true';
  } catch (error) {
    element.dataset.loading = 'false';
    console.error('Failed to load detailed map:', error);
  }
}

let centerData = null;
const centerTypeLabels = { '수·종': '수첩판매·종주인증센터', 종: '종주인증센터', 무: '무인인증센터', '': '노선 시·종점' };
const loopRoutes = ['jeju'];

// 공식 인증센터 목록(주소·유형)과, 공식 지도 경로 좌표를 따라 계산한 센터 간 거리로 목록을 다시 그린다.
function renderCalculatedCenters(routeId) {
  const data = centerData?.[routeId];
  if (!data) return;
  centerList.replaceChildren();
  data.centers.forEach((center, index) => {
    const item = document.createElement('li');
    item.className = 'center-stop';
    item.innerHTML = '<span class="stop-order"></span><span class="stop-name"><strong></strong><small></small></span><span class="stop-distance"></span>';
    item.querySelector('.stop-order').textContent = String(index + 1).padStart(2, '0');
    item.querySelector('.stop-name strong').textContent = center.name;
    item.querySelector('.stop-name small').textContent = `${centerTypeLabels[center.type] || center.type} · ${center.address}`;
    let distance = '구간 거리 미산정';
    if (center.legKm != null) distance = index === 0 && loopRoutes.includes(routeId) ? `순환 복귀 ${center.legKm} km` : `${center.legKm} km`;
    else if (index === 0) distance = '출발점';
    item.querySelector('.stop-distance').textContent = distance;
    centerList.appendChild(item);
  });
  const first = data.centers[0].name;
  const last = data.centers[data.centers.length - 1].name;
  if (data.officialKm) {
    const total = document.createElement('strong');
    total.textContent = `${data.officialKm} km`;
    const course = document.createElement('span');
    course.textContent = loopRoutes.includes(routeId) ? `${first} 순환` : `${first} → ${last}`;
    document.querySelector('#centers-summary').replaceChildren(total, course);
  }
  const basis = '인증센터 이름·주소는 자전거행복나눔 공식 안내 기준이고 센터 간 거리는 공식 지도 경로 좌표를 따라 계산한 약 값입니다.';
  const detail = data.complete && data.scaledToOfficial
    ? `계산값은 공식 노선 길이(${data.officialKm} km)에 맞춰 보정했습니다.`
    : `좌표를 찾지 못한 센터 주변 구간은 '구간 거리 미산정'으로 표시하며, 이 목록의 합계(${data.computedKm} km)는 공식 길이(${data.officialKm} km)와 다를 수 있습니다.`;
  centersPanel.querySelector('.centers-note').textContent = `${basis} ${detail} 주행 전 최신 노선과 통제 정보를 공식 안내에서 확인하세요.`;
}

function showCenters(routeKey) {
  const route = routes[routeKey];
  const detail = routeDetails[routeKey];
  if (!detail) return;

  document.querySelector('#centers-title').textContent = `${route.name} 인증센터`;
  document.querySelector('#centers-map').dataset.routeId = routeKey;
  document.querySelector('#centers-map').dataset.mapReady = 'false';
  const total = document.createElement('strong');
  total.textContent = detail.totalDistance;
  const course = document.createElement('span');
  course.textContent = detail.course;
  const summary = document.querySelector('#centers-summary');
  summary.replaceChildren(total, course);
  centersPanel.querySelector('.centers-note').textContent = detail.note;
  centersSource.href = detail.source;
  centersSource.textContent = `${detail.sourceLabel} ↗`;
  document.querySelector('#centers-map-link').href = detail.mapUrl;
  centerList.replaceChildren();
  detail.centers.forEach(([name, distance, sublabel], index) => {
    const item = document.createElement('li');
    item.className = 'center-stop';
    item.innerHTML = `<span class="stop-order">${String(index + 1).padStart(2, '0')}</span><span class="stop-name"><strong></strong><small></small></span><span class="stop-distance"></span>`;
    item.querySelector('strong').textContent = name;
    item.querySelector('small').textContent = sublabel;
    item.querySelector('.stop-distance').textContent = distance;
    centerList.appendChild(item);
  });
  renderCalculatedCenters(routeKey);
  centersPanel.hidden = false;
  renderCentersMap(routeKey);
  centersPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showOfficialRouteDetails(routeId) {
  const route = officialRoutes.find((item) => item.id === routeId);
  const detail = officialRouteDetails[routeId];
  if (!route || !detail) return;

  document.querySelector('#centers-title').textContent = route.title;
  const summary = document.querySelector('#centers-summary');
  const distance = document.createElement('strong');
  distance.textContent = detail.totalDistance;
  const course = document.createElement('span');
  course.textContent = detail.course;
  summary.replaceChildren(distance, course);

  centersPanel.querySelector('.centers-note').textContent = detail.description;
  centersSource.href = detail.source;
  centersSource.textContent = `${route.title} 공식 코스 정보 ↗`;
  document.querySelector('#centers-map-link').href = routeMapUrl(routeId);
  centerList.replaceChildren();
  (detail.centers || []).forEach(([name, status, note], index) => {
    const item = document.createElement('li');
    item.className = 'center-stop';
    item.innerHTML = '<span class="stop-order"></span><span class="stop-name"><strong></strong><small></small></span><span class="stop-distance"></span>';
    item.querySelector('.stop-order').textContent = String(index + 1).padStart(2, '0');
    item.querySelector('.stop-name strong').textContent = name;
    item.querySelector('.stop-name small').textContent = note;
    item.querySelector('.stop-distance').textContent = status;
    centerList.appendChild(item);
  });
  renderCalculatedCenters(routeId);
  centersPanel.hidden = false;
  renderCentersMap(routeId);
  centersPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function selectMapRoute(routeKey) {
  const cardRoute = geometryToCardRoute[routeKey] || routeKey;
  const geometryRoutes = cardRouteToGeometry[cardRoute] || [routeKey];
  mapStage.dataset.activeRoute = routeKey;
  document.querySelectorAll('.official-route-line').forEach((path) => {
    path.classList.toggle('is-active-route', path.dataset.route === routeKey);
  });
  document.querySelectorAll('.route-card').forEach((card) => {
    const selected = card.querySelector(`.card-open[data-route="${cardRoute}"]`) !== null;
    card.classList.toggle('is-route-selected', selected);
  });

  if (routeKey === cardRoute && routeDetails[cardRoute]) showCenters(cardRoute);
  else if (officialRouteDetails[routeKey]) showOfficialRouteDetails(routeKey);

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
    selectMapRoute(button.dataset.route);
  });
});

document.querySelectorAll('.route-layer[data-route]').forEach((path) => {
  path.addEventListener('click', () => selectMapRoute(path.dataset.route));
  path.setAttribute('tabindex', '0');
  path.setAttribute('role', 'button');
  path.setAttribute('aria-label', `${routes[path.dataset.route]?.name || '자전거길'} 강조`);
  path.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectMapRoute(path.dataset.route);
    }
  });
});

document.querySelector('.centers-close').addEventListener('click', () => {
  centersPanel.hidden = true;
});

document.querySelector('#centers-map').addEventListener('click', () => {
  centersPanel.hidden = true;
});

document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    searchInput.focus();
  }
});