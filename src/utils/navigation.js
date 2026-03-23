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
 * HTML 하단 네비게이션 바의 활성화 상태(active) 업데이트
 * @param {string} sceneKey - 현재 활성화된 씬 이름
 */
export const updateExternalNav = (sceneKey) => {
  const navItems = document.querySelectorAll('.nav-item');

  navItems.forEach((item) => {
    // dataset.scene은 index.html의 data-scene="Scene1" 값을 읽어옵니다.
    if (item.dataset.scene === sceneKey) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });
};
