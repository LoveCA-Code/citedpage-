/* CitedPage — 글 페이지 공용 스크립트
   스크롤 스파이: 지금 읽는 섹션을 좌측 목차 레일에 볼드로 표시 */
(function () {
  var links = Array.prototype.slice.call(document.querySelectorAll('.toc-rail a[href^="#"]'));
  if (!links.length) return;
  var heads = links.map(function (a) {
    return document.getElementById(a.getAttribute('href').slice(1));
  });

  function update() {
    var y = window.scrollY + 130; // 목차 클릭 도착 지점(120px)보다 살짝 아래 — 클릭 직후에도 해당 섹션이 볼드
    var cur = 0;
    for (var i = 0; i < heads.length; i++) {
      if (heads[i] && heads[i].offsetTop <= y) cur = i;
    }
    for (var j = 0; j < links.length; j++) {
      links[j].classList.toggle('active', j === cur);
    }
  }

  // scroll 이벤트 + 프레임 폴링 겸용 (어느 환경에서도 확실)
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  var lastY = -1;
  function loop() {
    if (window.scrollY !== lastY) { lastY = window.scrollY; update(); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  update();
})();
