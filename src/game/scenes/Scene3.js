import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene3 extends Scene {
  constructor() {
    super('Scene3');
    this.config = {
      cardW: 660,
      cardH: 920,
      spriteScale: 0.3,
      triangleSize: 180,
      mouthOffset: 55,
      maxDragDist: 100,
      threadScale: 0.15,
    };

    this.muscles = [];
    this.points = [];
    this.pointGraphicsArr = [];
    this.threads = [];
  }

  create() {
    const configData = this.cache.json.get('config');
    const screenData = configData?.scene3 || [];

    // 1. 씬 진입 시 입력 매니저 강제 리셋 (Scene2의 드래그 잔상 제거)
    this.input.enabled = true;
    this.input.resetPointers();

    // 2. 변수 초기화 (씬 재진입 시 중복 데이터 방지)
    this.muscles = [];
    this.points = [];
    this.pointGraphicsArr = [];
    this.threads = [];

    const { width } = this.scale;
    const centerX = width / 2;
    const centerY = 650;
    this.cameras.main.setBackgroundColor('#ffffff');

    this.add
      .text(40, 60, '←', { fontSize: '40px', color: '#000000', fontFamily: 'Pretendard, Arial' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, 'PDO VS PCL', {
        fontSize: '32px',
        color: '#1f2937',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    this.drawCardBg(centerX, centerY, screenData.title, screenData.desc);

    this.createTriangularLayout(centerX, centerY + 50);
    this.setupPointDrags();
  }

  createTriangularLayout(centerX, centerY) {
    const size = this.config.triangleSize;
    const mouthOffset = this.config.mouthOffset;
    const threadScale = this.config.threadScale;

    const positions = [
      { x: centerX, y: centerY - size }, // Zone 1
      { x: centerX - size, y: centerY + size * 0.7 }, // Zone 2
      { x: centerX + size, y: centerY + size * 0.7 }, // Zone 3
    ];

    positions.forEach((pos, index) => {
      // 1. 얼굴 근육 스프라이트
      const muscle = this.add
        .sprite(pos.x, pos.y, 'face_muscle')
        .setScale(this.config.spriteScale)
        .setOrigin(0.5)
        .setFrame(0);
      this.muscles.push(muscle);

      // 2. 실 배치 및 소재 라벨링
      let thread = null;
      let materialName = '';

      if (index === 1) materialName = 'PDO';
      else if (index === 2) materialName = 'PCL';

      if (index !== 0) {
        const threadX = pos.x + 55;
        const threadY = pos.y + 30;
        thread = this.add
          .image(threadX, threadY, 'thread_lifting')
          .setScale(threadScale)
          .setAngle(110)
          .setOrigin(0.5);

        if (index === 2) {
          thread
            .setTint(0xffffff) // 중요: 연한 그레이 톤을 주어야 흰 배경에서 형태가 보입니다.
            .setAlpha(0.5); // 중요: 0.5 정도가 가장 '반투명한 플라스틱' 느낌이 납니다.
        } // PCL 시각화

        this.add
          .text(pos.x, pos.y + 180, materialName, {
            fontSize: '26px',
            color: '#000000',
            fontFamily: 'Pretendard, Arial',
          })
          .setOrigin(0.5);
      }
      this.threads.push(thread);

      // 3. 포인트 그래픽
      const pointY = pos.y + mouthOffset;
      const pg = this.add.graphics();
      pg.fillStyle(0xff0000, 0.8).lineStyle(2, 0xffffff, 1);
      pg.fillCircle(pos.x + 5, pointY, 12).strokeCircle(pos.x + 5, pointY, 12);
      this.pointGraphicsArr.push(pg);

      // 4. 히트 영역 (깊이 설정 추가)
      const hitArea = this.add
        .circle(pos.x + 5, pointY, 40, 0x000000, 0)
        .setInteractive({ useHandCursor: true, draggable: true })
        .setDepth(10); // 다른 그래픽에 가려져 클릭이 씹히는 것을 방지

      hitArea.setData('originY', pointY);
      hitArea.setData('index', index);
      this.points.push(hitArea);
    });
  }

  setupPointDrags() {
    this.points.forEach((point) => {
      const index = point.getData('index');
      const muscle = this.muscles[index];
      const graphics = this.pointGraphicsArr[index];
      const originY = point.getData('originY');

      // pointerdown 이벤트를 통해 드래그 시작 시 입력 매니저를 다시 한번 리셋할 수도 있습니다.
      point.on('drag', (pointer, dragX, dragY) => {
        graphics.setVisible(false);

        // Y좌표 Clamp
        point.y = Phaser.Math.Clamp(dragY, originY, originY + this.config.maxDragDist);

        const dist = point.y - originY;
        const progress = Phaser.Math.Clamp(dist / this.config.maxDragDist, 0, 1);

        let maxFrame = 9;
        if (index === 1) maxFrame = 3;
        else if (index === 2) maxFrame = 6;

        const frameIndex = Phaser.Math.Clamp(Math.round(progress * maxFrame), 0, maxFrame);
        muscle.setFrame(frameIndex);
      });
    });
  }

  drawCardBg(x, y, title, desc) {
    const { cardW, cardH } = this.config;
    const graphics = this.add.graphics();
    graphics.setDepth(-1); // 배경 카드는 가장 뒤로
    graphics.fillStyle(0xffffff, 1).fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    graphics
      .lineStyle(1.5, 0xa8c5de, 0.2)
      .strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);

    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 40, title, {
      fontSize: '30px',
      color: '#1f2937',
      fontWeight: 'bold',
      fontFamily: 'Pretendard',
    });
    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 85, desc, {
      fontSize: '20px',
      color: '#9ca3af',
      fontFamily: 'Pretendard',
    });
  }
}
