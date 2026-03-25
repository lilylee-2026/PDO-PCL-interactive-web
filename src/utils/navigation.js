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
 * HTML 하단 네비게이션 바의 활성화 상태(active) 및 배경색 업데이트
 * @param {string} sceneKey - 현재 활성화된 씬 이름
 */
export const updateExternalNav = (sceneKey) => {
  const navItems = document.querySelectorAll('.nav-item');

  // 1. 네비게이션 아이템 활성화 상태 업데이트
  navItems.forEach((item) => {
    // dataset.scene은 index.html의 data-scene="Scene1" 값을 읽어옵니다.
    if (item.dataset.scene === sceneKey) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 2. 씬에 따른 전체 배경색(Body) 변경
  if (sceneKey === 'Home') {
    // Home일 때 배경색 설정
    document.getElementById('game-container').style.backgroundColor = '#FAFAE3';
  } else if (sceneKey.startsWith('Scene')) {
    // Scene1, Scene2, Scene3 등 Scene으로 시작하는 경우 배경색 설정
    document.getElementById('game-container').style.backgroundColor = '#D1DDE9';
  }
};
