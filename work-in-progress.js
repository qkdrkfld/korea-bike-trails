const regionName = new URLSearchParams(window.location.search).get('region');
const allowedRegions = new Set([
  '천안시', '공주시', '보령시', '서산시', '논산시', '계룡시', '당진시', '금산군',
  '부여군', '서천군', '청양군', '홍성군', '예산군', '태안군'
]);

if (regionName && allowedRegions.has(regionName)) {
  document.querySelector('#region-name').textContent = regionName;
  document.title = `${regionName} | 현재 작업중입니다`;
}