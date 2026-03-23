import Phaser from 'phaser';
import WebFontLoader from 'webfontloader';
import { Boot } from './scenes/Boot';
import { Preloader } from './scenes/Preloader';
import { Home } from './scenes/Home';
import { Scene1 } from './scenes/Scene1';
import { Scene2 } from './scenes/Scene2';
import { Scene3 } from './scenes/Scene3';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 720,
  height: 1160, // 1280(전체) - 120(하단바)
  backgroundColor: '#ffffff',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: {
    activePointers: 1,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: true,
    },
  },
  scene: [Boot, Preloader, Home, Scene1, Scene2, Scene3],
};

// WebFontLoader를 사용하여 폰트 로드
WebFontLoader.load({
  // Pretendard 폰트 로드
  custom: {
    families: ['Pretendard'],
  },
  active: function () {
    // 폰트 로드가 완료되면 게임 인스턴스 생성
    const game = new Phaser.Game(config);

    // --- 외부 HTML에서 Phaser 제어하기 ---
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach((item) => {
      item.addEventListener('click', () => {
        const sceneKey = item.getAttribute('data-scene');

        // 1. 모든 활성화된 씬 정지 (Boot, Preloader 제외)
        game.scene.getScenes(true).forEach((s) => {
          if (s.scene.key !== 'Boot' && s.scene.key !== 'Preloader') {
            game.scene.stop(s.scene.key);
          }
        });

        // 2. 선택한 씬 실행
        game.scene.start(sceneKey);

        // 3. UI 활성화 스타일 변경
        navItems.forEach((nav) => nav.classList.remove('active'));
        item.classList.add('active');
      });
    });
  },
});

function updateHeight() {
  const wrapper = document.getElementById('app-wrapper');
  if (wrapper) {
    // window.innerHeight가 실제 툴바를 제외한 영역을 반환합니다.
    wrapper.style.height = `${window.innerHeight}px`;
  }
}

// 초기 로드 시 실행
window.addEventListener('load', updateHeight);
// 브라우저 크기 변경 시(툴바가 숨거나 나타날 때) 실행
window.addEventListener('resize', updateHeight);
// 터치 스크롤 시에도 간혹 변경되므로 추가
window.addEventListener('orientationchange', updateHeight);
