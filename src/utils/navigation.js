/**
 * Phaser Scene 전환 함수
 * @param {Phaser.Scene} scene - 현재 씬 객체
 * @param {string} target - 이동할 씬의 Key
 */
export const navigateTo = (scene, target) => {
  // 1. Phaser 씬 전환
  scene.scene.start(target);

  // 2. 외부 HTML UI 업데이트
  updateExternalNav(target);
};

/**
 * HTML 하단 네비게이션 바의 활성화 상태(active), 표시 여부 및 배경색 업데이트
 * @param {string} sceneKey - 현재 활성화된 씬 이름
 */
export const updateExternalNav = (sceneKey) => {
  const nav = document.querySelector('.bottom-nav');
  const navItems = document.querySelectorAll('.nav-item');
  const gameContainer = document.getElementById('game-container');

  if (!nav) return;

  // 1. Password 씬일 때는 내비게이션 바 숨김 처리
  if (sceneKey === 'Password' || sceneKey === 'Boot' || sceneKey === 'Preloader') {
    nav.classList.add('hidden');
  } else {
    nav.classList.remove('hidden');
    nav.classList.add('active');
  }

  // 2. 네비게이션 아이템 활성화 상태 업데이트
  navItems.forEach((item) => {
    // dataset.scene은 index.html의 data-scene 값을 읽어옵니다.
    if (item.dataset.scene === sceneKey) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 3. 씬에 따른 배경색 변경 (Password와 Home은 동일 색상)
  let bgColor = '#D1DDE9'; // 기본 Scene 배경색

  if (sceneKey === 'Home' || sceneKey === 'Password') {
    bgColor = '#FAFAE3';
  }

  // DOM 요소들에 배경색 적용
  if (gameContainer) {
    gameContainer.style.backgroundColor = bgColor;
  }
  document.body.style.backgroundColor = bgColor;
};
