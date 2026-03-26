import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene3 extends Scene {
  constructor() {
    super('Scene3');
    this.config = {
      cardW: 660, // 시뮬레이션 내용이 담기는 카드 너비
      cardH: 920, // 시뮬레이션 내용이 담기는 카드 높이
      spriteScale: 0.3, // 얼굴 근육 스프라이트 크기 배율
      triangleSize: 180, // 삼각형 레이아웃 배치를 위한 간격 크기
      mouthOffset: 55, // 근육 이미지 내에서 입 위치의 세로 오프셋
      maxDragDist: 100, // 아래로 당길 수 있는 최대 거리
      threadScale: 0.15, // 배치되는 실의 크기 배율
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
    this.cameras.main.setBackgroundColor('#D1DDE9');

    this.add
      .text(40, 60, '←', { fontSize: '40px', color: '#000000', fontFamily: 'Pretendard, Arial' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, this.cache.json.get('config').bottom[3].label, {
        fontSize: '32px',
        color: '#545454',
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
      let materialName = '';
      if (index === 1) materialName = 'PDO';
      else if (index === 2) materialName = 'PCL';

      if (index !== 0) {
        const threadX = pos.x + 55;
        const threadY = pos.y + 30;

        if (index === 1) {
          // PDO 실
          const threadPdo = this.add
            .image(threadX, threadY, 'thread_pdo')
            .setScale(threadScale)
            .setAngle(110)
            .setOrigin(0.5)
            .setTint(0x3498db);
          this.threads.push(threadPdo);
        } else if (index === 2) {
          // PCL 실 (회색 테두리 레이어 방식 적용)
          const threadPclBorder = this.add
            .image(threadX, threadY, 'thread_pcl')
            .setScale(threadScale + 0.002, threadScale + 0.01)
            .setAngle(110)
            .setOrigin(0.5)
            .setTint(0xbbbbbb);

          const threadPcl = this.add
            .image(threadX, threadY, 'thread_pcl')
            .setScale(threadScale)
            .setAngle(110)
            .setOrigin(0.5)
            .setTint(0xffffff)
            .setAlpha(0.6);

          this.threads.push(threadPcl);
        }

        this.add
          .text(pos.x, pos.y + 180, materialName, {
            fontSize: '26px',
            color: '#545454',
            fontFamily: 'Pretendard, Arial',
            fontWeight: 'bold',
          })
          .setOrigin(0.5);
      }

      // 3. 포인트 그래픽 (빨간 점)
      const pointY = pos.y + mouthOffset;
      const pg = this.add.graphics();
      pg.fillStyle(0xff0000, 0.8).lineStyle(2, 0xffffff, 1);
      pg.fillCircle(pos.x + 5, pointY, 12).strokeCircle(pos.x + 5, pointY, 12);
      this.pointGraphicsArr.push(pg);

      // 4. 히트 영역
      const hitArea = this.add
        .circle(pos.x + 5, pointY, 45, 0x000000, 0)
        .setInteractive({ useHandCursor: true, draggable: true })
        .setDepth(10);

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

      point.on('drag', (pointer, dragX, dragY) => {
        // [수정] 드래그 시작 시 포인터 그래픽을 숨깁니다. (다시 그리지 않음)
        graphics.setVisible(false);

        // Y좌표 Clamp (드래그한 위치 유지)
        point.y = Phaser.Math.Clamp(dragY, originY, originY + this.config.maxDragDist);

        const dist = point.y - originY;
        const progress = Phaser.Math.Clamp(dist / this.config.maxDragDist, 0, 1);

        // 소재별 프레임 설정
        let maxFrame = 9;
        if (index === 1) maxFrame = 3;
        else if (index === 2) maxFrame = 6;

        const frameIndex = Phaser.Math.Clamp(Math.round(progress * maxFrame), 0, maxFrame);
        muscle.setFrame(frameIndex);
      });

      // dragend 시 원복 로직을 넣지 않음으로써 '벌린 상태 유지'를 구현합니다.
    });
  }

  drawCardBg(x, y, title, desc) {
    const { cardW, cardH } = this.config;
    const graphics = this.add.graphics();
    graphics.setDepth(-1); // 배경 카드는 가장 뒤로
    graphics.fillStyle(0xfafae3, 1).fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    graphics
      .lineStyle(1.5, 0x30364f, 0)
      .strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);

    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 40, title, {
      fontSize: '30px',
      color: '#545454',
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
