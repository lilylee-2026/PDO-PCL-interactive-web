import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene2 extends Scene {
  constructor() {
    super('Scene2');
    this.config = {
      cardW: 660,
      cardH: 920,
      pdoElasticity: 0.1,
      pclElasticity: 0.5,
      weightPower: 50,
    };

    this.isPdoHung = false;
    this.isPclHung = false;
  }

  create() {
    const { width } = this.scale;
    const centerX = width / 2;
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

    this.createContentLayout(centerX);
  }

  createContentLayout(centerX) {
    const configData = this.cache.json.get('config');
    const screenData = configData?.scene2 || [];

    this.drawCardBg(centerX, 650, screenData.title, screenData.desc);

    const threadTopY = 390;
    const offsetX = 100;
    const threadScale = 0.7;

    this.thread1 = this.add
      .image(centerX - offsetX - 50, threadTopY, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(0, 0.5)
      .setTint(0x3498db);
    this.add
      .text(centerX - offsetX - 50, threadTopY - 40, 'PDO', {
        fontSize: '24px',
        color: '#000000',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    this.thread2 = this.add
      .image(centerX + offsetX - 50, threadTopY, 'thread_lifting')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(0, 0.5)
      .setAlpha(0.6);
    this.add
      .text(centerX + offsetX - 50, threadTopY - 40, 'PCL', {
        fontSize: '24px',
        color: '#000000',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    this.sourceWeight = this.add
      .image(centerX + 220, 800, 'weight')
      .setScale(0.1)
      .setInteractive({ draggable: true });

    this.isPdoHung = false;
    this.isPclHung = false;

    this.setupWeightInteraction(threadTopY, threadScale);
  }

  setupWeightInteraction(topY, baseScale) {
    const startX = this.sourceWeight.x;
    const startY = this.sourceWeight.y;

    this.sourceWeight.on('drag', (pointer, dragX, dragY) => {
      this.sourceWeight.x = dragX;
      this.sourceWeight.y = dragY;
    });

    this.sourceWeight.on('dragend', (pointer) => {
      const isOverPDO =
        Math.abs(this.sourceWeight.x - this.thread1.x) < 100 && this.sourceWeight.y > topY + 100;
      const isOverPCL =
        Math.abs(this.sourceWeight.x - this.thread2.x) < 100 && this.sourceWeight.y > topY + 100;

      if (isOverPDO && !this.isPdoHung) {
        // 🚨 드랍된 좌표(pointer.x, pointer.y)를 전달합니다.
        this.attachNewWeight(
          this.thread1,
          this.config.pdoElasticity,
          topY,
          baseScale,
          'PDO',
          pointer.x,
          pointer.y,
        );
      } else if (isOverPCL && !this.isPclHung) {
        this.attachNewWeight(
          this.thread2,
          this.config.pclElasticity,
          topY,
          baseScale,
          'PCL',
          pointer.x,
          pointer.y,
        );
      }

      this.tweens.add({
        targets: [this.sourceWeight],
        x: startX,
        y: startY,
        duration: 300,
        ease: 'Cubic.easeOut',
      });

      if (this.isPdoHung && this.isPclHung) {
        this.tweens.add({
          targets: [this.sourceWeight],
          alpha: 0,
          duration: 500,
          onComplete: () => this.sourceWeight.setVisible(false),
        });
      }
    });
  }

  attachNewWeight(thread, elasticity, topY, baseScale, type, dropX, dropY) {
    if (type === 'PDO') this.isPdoHung = true;
    else this.isPclHung = true;

    // 1. 현재 실의 하단 끝 지점 계산 (늘어나기 전)
    const startThreadLength = thread.width * baseScale;
    const startBottomY = topY + startThreadLength;

    // 2. 최종 늘어날 지점 계산
    const targetScale = baseScale + this.config.weightPower * elasticity * 0.005;
    const targetThreadLength = thread.width * targetScale;
    const targetBottomY = topY + targetThreadLength;

    // 🚨 3. 새로운 무게 추 생성: 드랍된 X위치에서 즉시 실의 X위치로 붙입니다.
    // 시작 위치는 드랍된 Y 혹은 실의 현재 끝부분으로 설정
    const hungWeight = this.add.image(thread.x, dropY, 'weight').setScale(0.1);

    // 4. 실 늘어남과 무게 추 이동 동기화
    this.tweens.add({
      targets: thread,
      scaleX: targetScale,
      duration: 1000,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: hungWeight,
      y: targetBottomY + 10, // 실 끝에 매달릴 최종 위치
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        // 5. 자연스러운 흔들림 애니메이션 (3회)
        this.tweens.add({
          targets: thread,
          scaleX: targetScale + 0.015,
          duration: 800,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });

        this.tweens.add({
          targets: hungWeight,
          y: '+=8',
          duration: 800,
          yoyo: true,
          repeat: 2,
          ease: 'Sine.easeInOut',
        });
      },
    });
  }

  drawCardBg(x, y, title, desc) {
    const { cardW, cardH } = this.config;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1).fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    graphics
      .lineStyle(1.5, 0xa8c5de, 0.2)
      .strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 40, title, {
      fontSize: '30px',
      color: '#1f2937',
      fontFamily: 'Pretendard',
      fontWeight: 'bold',
    });
    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 85, desc, {
      fontSize: '20px',
      color: '#9ca3af',
      fontFamily: 'Pretendard',
    });
  }
}
