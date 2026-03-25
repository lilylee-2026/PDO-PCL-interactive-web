import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene2 extends Scene {
  constructor() {
    super('Scene2');
    this.config = {
      cardW: 660,
      cardH: 920,
      pdoElasticity: 0.1, // PDO: 단단함 (적게 늘어남)
      pclElasticity: 0.5, // PCL: 부드러움 (많이 늘어남)
      weightPower: 50,
    };

    this.isPdoHung = false;
    this.isPclHung = false;
  }

  create() {
    const { width } = this.scale;
    const centerX = width / 2;
    // 배경색 설정
    this.cameras.main.setBackgroundColor('#D1DDE9');

    this.add
      .text(40, 60, '←', { fontSize: '40px', color: '#000000', fontFamily: 'Pretendard, Arial' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, '탄성력 테스트', {
        fontSize: '32px',
        color: '#545454',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    this.createContentLayout(centerX);
  }

  createContentLayout(centerX) {
    const configData = this.cache.json.get('config');
    const screenData = configData?.scene2 || {
      title: 'PDO VS PCL',
      desc: '실의 소재에 따른 탄성 비교',
    };

    this.drawCardBg(centerX, 650, screenData.title, screenData.desc);

    const threadTopY = 390;
    const offsetX = 100;
    const threadScale = 0.7;

    // --- 1. PDO 실 (기존 파란색 유지) ---
    this.thread1 = this.add
      .image(centerX - offsetX - 50, threadTopY, 'thread_pdo')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(0, 0.5)
      .setTint(0x3498db);
    this.add
      .text(centerX - offsetX - 50, threadTopY - 40, 'PDO', {
        fontSize: '24px',
        color: '#545454',
        fontFamily: 'Pretendard, Arial',
        fontWeight: 'bold',
      })
      .setOrigin(0.5);

    // --- 2. PCL 실 (회색 테두리 레이어 방식 적용) ---
    // 테두리용 레이어: 본체보다 아주 미세하게 크게 설정하여 테두리처럼 보이게 함
    this.thread2Border = this.add
      .image(centerX + offsetX - 50, threadTopY, 'thread_pcl')
      .setScale(threadScale + 0.005, threadScale + 0.04) // 세로(두께) 방향으로 더 확장
      .setAngle(90)
      .setOrigin(0, 0.5)
      .setTint(0xbbbbbb); // 연한 회색 테두리

    // 본체 실
    this.thread2 = this.add
      .image(centerX + offsetX - 50, threadTopY, 'thread_pcl')
      .setScale(threadScale)
      .setAngle(90)
      .setOrigin(0, 0.5)
      .setTint(0xffffff)
      .setAlpha(0.6);

    this.add
      .text(centerX + offsetX - 50, threadTopY - 40, 'PCL', {
        fontSize: '24px',
        color: '#545454',
        fontFamily: 'Pretendard, Arial',
        fontWeight: 'bold',
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
      if (this.tweens.isTweening(this.sourceWeight)) return;
      this.sourceWeight.x = dragX;
      this.sourceWeight.y = dragY;
    });

    this.sourceWeight.on('dragend', (pointer) => {
      if (this.tweens.isTweening(this.sourceWeight)) return;

      const isOverPDO =
        Math.abs(this.sourceWeight.x - this.thread1.x) < 100 && this.sourceWeight.y > topY + 100;
      const isOverPCL =
        Math.abs(this.sourceWeight.x - this.thread2.x) < 100 && this.sourceWeight.y > topY + 100;

      if (isOverPDO && !this.isPdoHung) {
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
        // PCL일 경우 테두리 레이어도 함께 전달
        this.attachNewWeight(
          this.thread2,
          this.config.pclElasticity,
          topY,
          baseScale,
          'PCL',
          pointer.x,
          pointer.y,
          this.thread2Border,
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

  attachNewWeight(thread, elasticity, topY, baseScale, type, dropX, dropY, borderLayer = null) {
    if (type === 'PDO') this.isPdoHung = true;
    else this.isPclHung = true;

    const targetScale = baseScale + this.config.weightPower * elasticity * 0.005;
    const targetThreadLength = thread.width * targetScale;
    const targetBottomY = topY + targetThreadLength;

    const hungWeight = this.add.image(thread.x, dropY, 'weight').setScale(0.1);

    // 실 늘어남 애니메이션 (테두리가 있다면 함께 애니메이션)
    const animTargets = borderLayer ? [thread, borderLayer] : [thread];

    this.tweens.add({
      targets: animTargets,
      scaleX: targetScale,
      duration: 1000,
      ease: 'Cubic.easeOut',
    });

    this.tweens.add({
      targets: hungWeight,
      y: targetBottomY + 10,
      duration: 1000,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        if (type !== 'PDO') {
          this.tweens.add({
            targets: animTargets,
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
        }
      },
    });
  }

  drawCardBg(x, y, title, desc) {
    const { cardW, cardH } = this.config;
    const graphics = this.add.graphics();
    graphics.fillStyle(0xfafae3, 1).fillRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);
    graphics
      .lineStyle(1.5, 0x30364f, 1)
      .strokeRoundedRect(x - cardW / 2, y - cardH / 2, cardW, cardH, 32);

    this.add.text(x - cardW / 2 + 40, y - cardH / 2 + 40, title, {
      fontSize: '30px',
      color: '#545454',
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
