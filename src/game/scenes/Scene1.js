import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene1 extends Scene {
  constructor() {
    super('Scene1');

    this.config = {
      // --- [리프팅 실 (Lifting) 설정] ---
      liftStrength: 0.02,
      bulgeStrength: 0,
      maxDragRange: 30,
      cardW: 660,
      cardH: 450,

      // --- [리프팅 피부 초기 주름 설정] ---
      initialBumpyIntensity: 0.05,
      initialBumpyFrequency: 4,
      initialBumpyRange: 0.2,
      flattenFactor: 1.0,

      // --- [리프팅 실 놓았을 때(시술 후) 주름 설정] ---
      postLiftBumpyIntensity: 0,
      postLiftBumpyFrequency: 4,
      postLiftBumpyRange: 0.2,

      // --- [고정용 실 (Fixing) 설정] ---
      bumpyIntensity: 0.005,
      bumpyFrequency: 4,
      bumpyDepthFix: 10,
      fixDragSensitivity: 0.1,

      // --- [고정용 피부 초기 주름 설정] ---
      initialFixBumpyIntensity: 0.025,
      initialFixBumpyFrequency: 6,
      initialFixBumpyRange: 0.2,

      // --- [고정용 피부 기울어졌을 때 주름 설정] ---
      tiltFixBumpyIntensity: 0,
      tiltFixBumpyFrequency: 4,
      tiltFixBumpyRange: 0.2,

      // --- [클릭 어포던스 설정] ---
      affordanceColor: '#ffffff',
      affordanceFontSize: '60px',
    };

    this.baseThreadScale = 0.6;
    this.threadStretchDenom = 300;
  }

  preload() {
    this.load.json('config', 'assets/config/config.json');
  }

  create() {
    // 상태 초기화
    this.isSection2Failed = false;
    this.maxLiftingDist = 0;
    this.maxFixedDist = 0;
    this.currentLiftBumpyIntensity = this.config.initialBumpyIntensity;
    this.currentFixBumpyIntensity = this.config.initialFixBumpyIntensity;

    const { width } = this.scale;
    const centerX = width / 2;
    this.cameras.main.setBackgroundColor('#ffffff');

    this.add
      .text(40, 60, '←', { fontSize: '40px', color: '#000000', fontFamily: 'Pretendard, Arial' })
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => navigateTo(this, 'Home'));

    this.add
      .text(centerX, 60, '리프팅 VS 고정용', {
        fontSize: '32px',
        color: '#1f2937',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5);

    this.createSimulationLayout(centerX);
  }

  createSimulationLayout(centerX) {
    this.startX = centerX;
    const visualThreadWidth = 740 * this.baseThreadScale;
    this.threadInsertionX = centerX - visualThreadWidth / 2;

    const configData = this.cache.json.get('config');
    const screenData = configData?.scene1 || {
      liftingSection: { title: 'Lifting', desc: '' },
      fixingSection: { title: 'Fixing', desc: '' },
    };

    // --- 1. 리프팅 섹션 ---
    this.drawCardBg(centerX, 415, screenData.liftingSection.title, screenData.liftingSection.desc);
    this.liftingSkin = this.add.plane(centerX, 460, 'skin_texture', null, 32, 64).setScale(1.2);
    this.liftingSkin.ignoreDirtyCache = true;
    this.originalVertices = this.liftingSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));
    this.updateLiftingSkin(0);
    this.liftingThread = this.add
      .image(this.threadInsertionX, 420, 'thread_lifting')
      .setScale(this.baseThreadScale)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true, draggable: true });

    // --- 2. 고정용 섹션 (컨테이너) ---
    this.drawCardBg(centerX, 885, screenData.fixingSection.title, screenData.fixingSection.desc);
    this.fixContainer = this.add.container(centerX, 920);

    this.fixSkin = this.add.plane(0, 0, 'skin_texture', null, 32, 32).setScale(1.2);
    this.fixSkin.ignoreDirtyCache = true;
    this.fixOriginalVertices = this.fixSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));

    const localThreadX = this.threadInsertionX - centerX;
    this.fixThread = this.add
      .image(localThreadX, -40, 'thread_fix')
      .setScale(this.baseThreadScale)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true, draggable: true });

    this.fixContainer.add([this.fixSkin, this.fixThread]);

    this.errorMark = this.add
      .text(centerX, 920, '✕', { fontSize: '200px', color: '#ff0000', fontWeight: 'bold' })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(10);
    this.clickAffordance = this.add
      .text(centerX, 920, '+', {
        fontSize: this.config.affordanceFontSize,
        color: this.config.affordanceColor,
        fontWeight: 'bold',
        fontFamily: 'Pretendard, Arial',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setDepth(11);

    if (this.affordanceTween) this.affordanceTween.remove();
    this.affordanceTween = this.tweens.add({
      targets: this.clickAffordance,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    this.updateFixedSkin(0);
    this.setupDragEvents();
  }

  setupDragEvents() {
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      // 애니메이션 중에는 드래그 차단
      if (this.tweens.isTweening(gameObject)) return;
      if (gameObject === this.fixThread && this.isSection2Failed) return;

      const dragDistance = Math.max(0, pointer.x - pointer.downX);

      if (gameObject === this.liftingThread) {
        const offset = Phaser.Math.Clamp(dragDistance, 0, this.config.maxDragRange);
        gameObject.scaleX = this.baseThreadScale + offset / this.threadStretchDenom;
        this.updateLiftingSkin(offset);
      } else if (gameObject === this.fixThread) {
        const slowDragDistance = dragDistance * this.config.fixDragSensitivity;
        const offset = Phaser.Math.Clamp(slowDragDistance, 0, this.config.maxDragRange);
        gameObject.scaleX = this.baseThreadScale + offset / this.threadStretchDenom;
        this.maxFixedDist = offset;
        this.updateFixedSkin(this.maxFixedDist);
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      // 이미 복구 애니메이션 중이라면 중복 방지
      if (this.tweens.isTweening(gameObject)) return;

      const dragDistance = Math.max(0, pointer.x - pointer.downX);

      if (gameObject === this.liftingThread) {
        if (dragDistance >= this.config.maxDragRange) {
          this.liftingThread.disableInteractive();
          this.currentLiftBumpyIntensity = this.config.postLiftBumpyIntensity;
          this.updateLiftingSkin(0);

          this.tweens.add({
            targets: gameObject,
            scaleX: this.baseThreadScale,
            duration: 400,
            ease: 'Back.easeOut',
          });
        } else {
          // 실패 시 원복 - 애니메이션 동안 상호작용 비활성화
          gameObject.disableInteractive();
          this.tweens.add({
            targets: gameObject,
            scaleX: this.baseThreadScale,
            duration: 400,
            ease: 'Back.easeOut',
            onUpdate: () => {
              const currentOffset =
                (gameObject.scaleX - this.baseThreadScale) * this.threadStretchDenom;
              this.updateLiftingSkin(Math.max(0, currentOffset));
            },
            onComplete: () => {
              gameObject.setInteractive(); // 복귀 후 다시 활성화
            },
          });
        }
      } else if (gameObject === this.fixThread && !this.isSection2Failed) {
        const slowDragDistance = dragDistance * this.config.fixDragSensitivity;
        if (slowDragDistance >= this.config.maxDragRange) {
          this.triggerSection2Failure(gameObject);
        } else {
          // 중간에 놓았을 때 원복 - 애니메이션 동안 상호작용 비활성화
          gameObject.disableInteractive();
          this.tweens.add({
            targets: gameObject,
            scaleX: this.baseThreadScale,
            duration: 800,
            ease: 'Cubic.easeOut',
            onUpdate: () => {
              const currentOffset =
                (gameObject.scaleX - this.baseThreadScale) * this.threadStretchDenom;
              this.maxFixedDist = Math.max(0, currentOffset);
              this.updateFixedSkin(this.maxFixedDist);
            },
            onComplete: () => {
              this.maxFixedDist = 0;
              gameObject.setInteractive(); // 복귀 후 다시 활성화
            },
          });
        }
      }
    });
  }

  triggerSection2Failure(gameObject) {
    this.isSection2Failed = true;
    gameObject.disableInteractive();

    const worldThreadX = this.fixContainer.x + gameObject.x;
    const currentWidth = gameObject.width * gameObject.scaleX;

    this.time.delayedCall(1000, () => {
      this.errorMark.setPosition(worldThreadX + currentWidth / 2 - 20, 880).setAlpha(1);
      this.time.delayedCall(3000, () => {
        this.errorMark.setVisible(false).setAlpha(0);
        gameObject.setVisible(false);
        gameObject.scaleX = this.baseThreadScale;
        this.tweens.add({
          targets: this,
          maxFixedDist: 0,
          duration: 2500,
          ease: 'Cubic.easeOut',
          onUpdate: () => this.updateFixedSkin(this.maxFixedDist),
          onComplete: () => this.makeSkinTiltable(),
        });
      });
    });
  }

  makeSkinTiltable() {
    if (this.game.canvas) this.game.canvas.style.cursor = 'pointer';
    this.fixSkin.setInteractive({ useHandCursor: true });
    this.clickAffordance.setAlpha(1);
    this.affordanceTween.play();

    this.fixSkin.once('pointerdown', () => {
      if (this.game.canvas) this.game.canvas.style.cursor = 'default';
      this.tweens.add({
        targets: this.clickAffordance,
        alpha: 0,
        scale: 1.5,
        duration: 300,
        onComplete: () => {
          this.affordanceTween.pause();
        },
      });
      this.tweens.add({
        targets: this,
        currentFixBumpyIntensity: this.config.tiltFixBumpyIntensity,
        duration: 1500,
        onUpdate: () => this.updateFixedSkin(0),
      });
      this.tweens.add({
        targets: this.fixContainer,
        angle: 25,
        duration: 1500,
        ease: 'Back.easeOut',
        onComplete: () => {
          this.time.delayedCall(1000, () => this.recoverySequence());
        },
      });
    });
  }

  recoverySequence() {
    this.fixThread.setOrigin(0.5, 0.5);
    this.fixThread.scaleX = this.baseThreadScale;
    this.fixThread.setPosition(200, 0);
    this.fixThread.setAlpha(0).setVisible(true);

    this.tweens.add({
      targets: this.fixThread,
      x: this.threadInsertionX - this.startX + (740 * this.baseThreadScale) / 2,
      y: -40,
      alpha: 1,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: this,
            currentFixBumpyIntensity: 0,
            duration: 2500,
            onUpdate: () => this.updateFixedSkin(0),
          });
          this.tweens.add({
            targets: this.fixContainer,
            angle: 0,
            duration: 2500,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
              this.isSection2Failed = true;
              this.fixThread.setOrigin(0, 0.5);
              this.fixThread.setPosition(this.threadInsertionX - this.startX, -40);
              this.fixThread.disableInteractive();
              this.currentFixBumpyIntensity = 0;
            },
          });
        });
      },
    });
  }

  updateLiftingSkin(currentDistance) {
    const { flattenFactor, maxDragRange } = this.config;
    const vertices = this.liftingSkin.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const o = this.originalVertices[i];
      const wave = Math.sin(o.u * Math.PI * this.config.initialBumpyFrequency);
      const rangeAttenuation = Math.max(
        0,
        (this.config.initialBumpyRange - o.v) / this.config.initialBumpyRange,
      );
      const currentFlattening = Math.max(0, 1 - (currentDistance / maxDragRange) * flattenFactor);
      v.y = o.y + wave * this.currentLiftBumpyIntensity * rangeAttenuation * currentFlattening;
    }
  }

  updateFixedSkin(distance) {
    const { bumpyIntensity, bumpyFrequency, bumpyDepthFix } = this.config;
    const vertices = this.fixSkin.vertices;
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const o = this.fixOriginalVertices[i];
      const baseWave = Math.sin(o.u * Math.PI * this.config.initialFixBumpyFrequency);
      const rangeAttenuation = Math.max(
        0,
        (this.config.initialFixBumpyRange - o.v) / this.config.initialFixBumpyRange,
      );
      const initialWrinkle = baseWave * this.currentFixBumpyIntensity * rangeAttenuation;
      const wave = Math.sin(o.u * Math.PI * bumpyFrequency);
      const dragBumpyY =
        (wave - 0.5) *
        distance *
        bumpyIntensity *
        Math.pow(1 - o.v, bumpyDepthFix) *
        Math.cos((o.u - 0.5) * Math.PI);
      v.y = o.y + initialWrinkle + dragBumpyY;
    }
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
