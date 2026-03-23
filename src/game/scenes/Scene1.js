import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Scene1 extends Scene {
  constructor() {
    super('Scene1');

    this.config = {
      // --- [리프팅 실 (Lifting) 설정] ---
      liftStrength: 0.02, // 실을 당길 때 피부 조직이 딸려오는 물리적 저항 강도
      bulgeStrength: 0, // 완료 시 평평함을 유지하기 위해 들림/부풀어오름 효과를 0으로 설정
      maxDragRange: 30, // 실을 우측으로 당길 수 있는 최대 거리 한계치
      cardW: 660, // 시뮬레이션 내용이 담기는 흰색 배경 카드의 너비
      cardH: 450, // 시뮬레이션 내용이 담기는 흰색 배경 카드의 높이

      // --- [리프팅 피부 초기 주름 설정] ---
      initialBumpyIntensity: 0.05, // 시술 전 상단 피부의 기본 주름 깊이 세기
      initialBumpyFrequency: 4, // 상단 피부에 발생하는 주름의 가로 반복 횟수
      initialBumpyRange: 0.2, // 주름이 이미지 상단으로부터 영향을 미치는 세로 범위 지수
      flattenFactor: 1.0, // 실을 당길 때 주름이 완벽하게(100%) 펴지도록 설정

      // --- [리프팅 실 놓았을 때(시술 후) 주름 설정] ---
      postLiftBumpyIntensity: 0, // 되돌릴 때 일자 유지를 위해 남게 될 주름의 세기를 0으로 설정
      postLiftBumpyFrequency: 4, // 실을 놓은 후 남게 될 주름의 빈도
      postLiftBumpyRange: 0.2, // 실을 놓은 후 남게 될 주름의 세로 범위

      // --- [고정용 실 (Fixing) 설정] ---
      bumpyIntensity: 0.005, // 고정용 실 드래그 시 발생하는 추가 주름(왜곡)의 세기
      bumpyFrequency: 4, // 고정용 실 특유의 촘촘하고 자잘한 가시 주름 빈도
      bumpyDepthFix: 10, // 고정용 주름이 세로 방향으로 감쇄되는 정도

      // --- [고정용 피부 초기 주름 설정] ---
      initialFixBumpyIntensity: 0.025, // 고정용 피부 시술 전 기본 주름 깊이 세기
      initialFixBumpyFrequency: 6, // 고정용 피부 기본 주름 반복 횟수
      initialFixBumpyRange: 0.2, // 고정용 피부 초기 주름 세로 범위

      // --- [고정용 피부 기울어졌을 때 주름 설정] ---
      tiltFixBumpyIntensity: 0, // 클릭하여 기울어졌을 때 남을 주름 세기
      tiltFixBumpyFrequency: 4, // 클릭하여 기울어졌을 때 남을 주름 빈도
      tiltFixBumpyRange: 0.2, // 클릭하여 기울어졌을 때 남을 주름 범위

      // --- [클릭 어포던스 설정] ---
      affordanceColor: '#ffffff', // 시술 실패 후 클릭 유도를 위한 플러스(+) 아이콘 색상
      affordanceFontSize: '60px', // 클릭 유도 플러스(+) 아이콘의 글자 크기
    };

    this.baseThreadScale = 0.6;
    this.threadStretchDenom = 300;
    this.maxLiftingDist = 0;
    this.maxFixedDist = 0;
    this.isSection2Failed = false;

    // 실시간 상태 관리 변수
    this.currentLiftBumpyIntensity = this.config.initialBumpyIntensity;
    this.currentLiftBumpyFrequency = this.config.initialBumpyFrequency;
    this.currentLiftBumpyRange = this.config.initialBumpyRange;
    this.currentFixBumpyIntensity = this.config.initialFixBumpyIntensity;
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
    const screenData = configData?.scene1 || [];

    // --- 리프팅 섹션 (상단) ---
    this.drawCardBg(centerX, 415, screenData.liftingSection.title, screenData.liftingSection.desc);
    this.liftingSkin = this.add.plane(centerX, 460, 'skin_texture', null, 32, 64).setScale(1.2);
    this.liftingSkin.ignoreDirtyCache = true;
    this.originalVertices = this.liftingSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));

    // 초기 상태 설정
    this.currentLiftBumpyIntensity = this.config.initialBumpyIntensity;
    this.updateLiftingSkin(0);

    this.liftingThread = this.add
      .image(this.threadInsertionX, 420, 'thread_lifting')
      .setScale(this.baseThreadScale)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true, draggable: true });

    // --- 고정용 섹션 (하단) ---
    this.drawCardBg(centerX, 885, screenData.fixingSection.title, screenData.fixingSection.desc);
    this.fixSkin = this.add.plane(centerX, 920, 'skin_texture', null, 32, 32).setScale(1.2);
    this.fixSkin.ignoreDirtyCache = true;
    this.fixOriginalVertices = this.fixSkin.vertices.map((v) => ({
      x: v.x,
      y: v.y,
      u: v.u,
      v: v.v,
    }));
    this.currentFixBumpyIntensity = this.config.initialFixBumpyIntensity;
    this.updateFixedSkin(0);

    this.fixThread = this.add
      .image(this.threadInsertionX, 880, 'thread_fix')
      .setScale(this.baseThreadScale)
      .setOrigin(0, 0.5)
      .setInteractive({ useHandCursor: true, draggable: true });

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
    this.affordanceTween = this.tweens.add({
      targets: this.clickAffordance,
      alpha: 0.2,
      duration: 500,
      yoyo: true,
      repeat: -1,
      paused: true,
    });

    this.isSection2Failed = false;
    this.setupDragEvents();
  }

  setupDragEvents() {
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      if (gameObject === this.fixThread && this.isSection2Failed) return;
      const dragDistance = Math.max(0, pointer.x - pointer.downX);

      if (gameObject === this.liftingThread) {
        const offset = Phaser.Math.Clamp(
          dragDistance + (this.maxLiftingDist || 0),
          0,
          this.config.maxDragRange,
        );
        gameObject.x = this.threadInsertionX;
        gameObject.scaleX = this.baseThreadScale + offset / this.threadStretchDenom;

        // 드래그 중 업데이트
        this.updateLiftingSkin(offset);
      } else if (gameObject === this.fixThread) {
        const offset = Phaser.Math.Clamp(dragDistance, 0, this.config.maxDragRange);
        gameObject.x = this.threadInsertionX;
        gameObject.scaleX = this.baseThreadScale + offset / this.threadStretchDenom;
        this.maxFixedDist = offset;
        this.updateFixedSkin(offset);
        if (offset >= this.config.maxDragRange && !this.isSection2Failed) {
          this.triggerSection2Failure(gameObject);
        }
      }
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (gameObject === this.liftingThread) {
        this.liftingThread.disableInteractive();
        // 리프팅 실을 놓았을 때: 실은 제자리로 (Cubic으로 쫀득하게) 원복
        this.tweens.add({
          targets: gameObject,
          scaleX: this.baseThreadScale,
          duration: 300,
          ease: 'Cubic.easeOut', // 원복은 쫀득한 느낌 부여
        });

        // 피부 조직 애니메이션(트윈) 제거
        // 놓는 순간 즉시 PostLift(매끈한) 수치로 상태를 변경하고, 조직을 업데이트하여 일자로 고정
        this.currentLiftBumpyIntensity = this.config.postLiftBumpyIntensity;
        this.currentLiftBumpyFrequency = this.config.postLiftBumpyFrequency;
        this.currentLiftBumpyRange = this.config.postLiftBumpyRange;
        this.updateLiftingSkin(0); // 피부는 애니메이션 없이 즉시 일자로 업데이트

        // 나머지 상태 초기화 (트윈 없이 즉시)
        this.tweens.add({
          targets: this,
          duration: 300,
          onComplete: () => {
            this.maxLiftingDist = 0;
          },
        });
      } else if (gameObject === this.fixThread && !this.isSection2Failed) {
        this.tweens.add({
          targets: gameObject,
          scaleX: this.baseThreadScale,
          duration: 2500,
          ease: 'Linear',
          onUpdate: () => {
            const currentScaleDelta = gameObject.scaleX - this.baseThreadScale;
            this.maxFixedDist = currentScaleDelta * this.threadStretchDenom;
            this.updateFixedSkin(this.maxFixedDist);
          },
        });
      }
    });
  }

  triggerSection2Failure(gameObject) {
    this.isSection2Failed = true;
    gameObject.disableInteractive();
    const currentWidth = gameObject.width * gameObject.scaleX;
    this.errorMark.setPosition(gameObject.x + currentWidth / 2, gameObject.y).setAlpha(1);
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
        ease: 'Cubic.easeOut',
        onComplete: () => {
          this.affordanceTween.pause();
          this.clickAffordance.setScale(1);
        },
      });
      this.tweens.add({
        targets: this,
        currentFixBumpyIntensity: this.config.tiltFixBumpyIntensity,
        currentFixBumpyFrequency: this.config.tiltFixBumpyFrequency,
        currentFixBumpyRange: this.config.tiltFixBumpyRange,
        duration: 1500,
        ease: 'Cubic.easeOut',
        onUpdate: () => this.updateFixedSkin(0),
      });
      this.tweens.add({
        targets: this.fixSkin,
        angle: 25,
        duration: 1500,
        ease: 'Back.easeOut',
        onComplete: () => {
          // [딜레이 1] 기울기 완료 후 1초 대기
          this.time.delayedCall(1000, () => this.recoverySequence());
        },
      });
    });
  }

  recoverySequence() {
    const targetY = 880;
    this.fixThread.setOrigin(0.5, 0.5);
    this.fixThread.scaleX = this.baseThreadScale;
    this.fixThread.setAngle(25);
    const startOuterX = this.startX + 50;
    const startOuterY = targetY + 20;
    this.fixThread.setPosition(startOuterX, startOuterY);
    this.fixThread.setAlpha(0).setVisible(true);
    this.tweens.add({
      targets: this.fixThread,
      x: this.threadInsertionX + (780 * this.baseThreadScale) / 2,
      y: targetY,
      alpha: 1,
      duration: 1500,
      ease: 'Power2.easeOut',
      onComplete: () => {
        // [딜레이 2] 1초 대기
        this.time.delayedCall(1000, () => {
          this.tweens.add({
            targets: [this.fixSkin, this.fixThread],
            angle: 0,
            duration: 2500,
            ease: 'Cubic.easeInOut',
            onComplete: () => {
              this.isSection2Failed = false;
              this.currentFixBumpyIntensity = this.config.initialFixBumpyIntensity;
            },
          });
        });
      },
    });
  }

  updateLiftingSkin(currentDistance) {
    const { bulgeStrength, flattenFactor } = this.config;
    const vertices = this.liftingSkin.vertices;

    // 현재 상태 변수 사용
    const intensity = this.currentLiftBumpyIntensity;
    const frequency = this.currentLiftBumpyFrequency;
    const range = this.currentLiftBumpyRange;

    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const o = this.originalVertices[i];
      const wave = Math.sin(o.u * Math.PI * frequency);
      const rangeAttenuation = Math.max(0, (range - o.v) / range);

      // 당기는 거리(currentDistance)가 maxDragRange에 도달할수록 펴짐 효과(currentFlattening)가 0에 수렴
      const currentFlattening = Math.max(
        0,
        1 - (currentDistance / this.config.maxDragRange) * flattenFactor,
      );

      const wrinkleY = wave * intensity * rangeAttenuation * currentFlattening;

      const focalPointU = 0.7;
      const focalPointV = 0.0;
      const diffU = o.u - focalPointU;
      const diffV = o.v - focalPointV;
      const localizedBulgeWeight = Math.exp(-(diffU * diffU * 2 + diffV * diffV * 5));

      // bulgeStrength가 0이므로 tensionY는 항상 0이 되어, 오른쪽 조직이 들리는 현상이 사라짐
      const tensionY = currentDistance * bulgeStrength * localizedBulgeWeight;

      // 최종적으로 주름(wrinkleY)이 0이 되고 tensionY도 0이 되어 완벽한 일자(o.y) 상태로 복귀함
      v.y = o.y + wrinkleY + tensionY;
    }
  }

  updateFixedSkin(distance) {
    const {
      bumpyIntensity,
      bumpyFrequency,
      bumpyDepthFix,
      initialFixBumpyFrequency,
      initialFixBumpyRange,
    } = this.config;
    const vertices = this.fixSkin.vertices;
    const currentIntensity = this.currentFixBumpyIntensity;
    for (let i = 0; i < vertices.length; i++) {
      const v = vertices[i];
      const o = this.fixOriginalVertices[i];
      const baseWave = Math.sin(o.u * Math.PI * initialFixBumpyFrequency);
      const rangeAttenuation = Math.max(0, (initialFixBumpyRange - o.v) / initialFixBumpyRange);
      const initialWrinkle = baseWave * currentIntensity * rangeAttenuation;
      const wave = Math.sin(o.u * Math.PI * bumpyFrequency);
      const verticalDecay = Math.pow(1 - o.v, bumpyDepthFix);
      const horizontalFocus = Math.cos((o.u - 0.5) * Math.PI);
      const dragBumpyY = (wave - 0.5) * distance * bumpyIntensity * verticalDecay * horizontalFocus;
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
