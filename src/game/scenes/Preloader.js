import { Scene } from 'phaser';

export class Preloader extends Scene {
  constructor() {
    super('Preloader');
  }

  init() {
    // 방문자 트래킹 시작 (비동기로 실행하여 로딩을 방해하지 않음)
    this.handleVisitorLog();
  }

  async handleVisitorLog() {
    let uuid = localStorage.getItem('user_uuid');

    // UUID가 없으면 새로 생성
    if (!uuid) {
      // crypto.randomUUID()는 HTTPS 환경에서만 작동합니다.
      uuid = window.crypto?.randomUUID() || this.generateFallbackUUID();
      localStorage.setItem('user_uuid', uuid);
    }

    try {
      // Vercel API 호출
      await fetch('/api/count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uuid }),
      });
    } catch (err) {
      console.warn('Visitor logging failed:', err);
    }
  }

  // crypto.randomUUID()를 사용할 수 없는 환경을 위한 대체 함수
  generateFallbackUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0,
        v = c == 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  preload() {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // 1. 로딩 바 그래픽 추가
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();

    // 로딩 바 배경 (회색)
    progressBox.fillStyle(0xa8c5de, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);

    // 로딩 텍스트
    const loadingText = this.add
      .text(width / 2, height / 2 - 50, 'Loading...', {
        fontSize: '20px',
        fontFamily: 'Pretendard, Arial',
        fill: '#000000',
      })
      .setOrigin(0.5, 0.5);

    const percentText = this.add
      .text(width / 2, height / 2, '0%', {
        fontSize: '18px',
        fontFamily: 'Pretendard, Arial',
        fill: '#ffffff',
      })
      .setOrigin(0.5, 0.5);

    // 2. 진행률 이벤트 리스너 설정
    this.load.on('progress', (value) => {
      percentText.setText(parseInt(value * 100) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xa8c5de, 1); // 로딩 바 채우기 색상
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
    });

    // 3. 파일 로드 완료 이벤트
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
    });

    // [Scene 1] 실, 피부 표면 이미지
    this.load.image('skin_texture', '/assets/images/skin_texture.png');
    this.load.image('thread_lifting', '/assets/images/thread_lifting.png');
    this.load.image('thread_fix', '/assets/images/thread_fix.png');

    // [Scene 2] PDO, PCL 실 이미지
    this.load.image('thread_pdo', '/assets/images/thread_lifting.png');
    this.load.image('thread_pcl', '/assets/images/thread_lifting.png');
    this.load.image('weight', '/assets/images/weight.png');

    // [Scene 3] 얼굴 근육 스프라이트 시트
    this.load.spritesheet('face_muscle', '/assets/sprites/face_muscle_sheet.png', {
      frameWidth: 721,
      frameHeight: 1001,
    });

    // 외부 설정 JSON 파일 로드 (title, desc 등을 사용자가 변경 가능)
    this.load.json('config', 'assets/config/config.json');
  }

  create() {
    /**
     * ==========================================
     * 🛠️ 개발 모드: URL 파라미터로 지정한 씬으로 점프
     * ==========================================
     */
    if (process.env.NODE_ENV === 'development') {
      const start = new URLSearchParams(location.search).get('start');

      if (start) {
        console.log(`Development: jump to ${start}`);
        this.scene.start(start); // ✅ 해당 씬으로 즉시 이동
        return;
      }
    }

    this.scene.start('Home');
  }
}
