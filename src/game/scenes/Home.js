import { Scene } from 'phaser';
import { updateExternalNav } from '../../utils/navigation'; // 공통 유틸 사용

export class Home extends Scene {
  constructor() {
    super('Home');
  }

  /**
   * 1. 프리로드 단계: URL 파라미터를 읽어 동적 로고 로드
   */
  preload() {
    // URL에서 ?brand=이름 파라미터를 가져옵니다.
    const urlParams = new URLSearchParams(window.location.search);
    const brandName = urlParams.get('brand');

    // 브랜드 이름이 있다면 해당 경로의 이미지를 'logo' 키로 로드, 없으면 기본 로고 로드
    if (brandName) {
      // 경로: assets/logo/파일명.png
      this.load.image('logo', `assets/logo/${brandName}.png`);
    } else {
      // 파라미터가 없을 때 보여줄 기본 로고 (기존 경로 유지)
      this.load.image('logo', 'assets/logo/default.png');
    }
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#FAFAE3');

    // 2. 로고 표시 - 스케일은 요청하신 대로 1.25 유지
    this.add.image(centerX, 260, 'logo').setOrigin(0.5).setScale(1.25);

    // 3. 네비게이션 카드 데이터
    // 로드한 JSON 데이터 가져오기
    const configData = this.cache.json.get('config');
    const screenData = configData?.home?.screenData || [];

    // 4. 카드 생성 루프 (간격 180)
    screenData.forEach((data, index) => {
      const cardY = 550 + index * 180;
      this.createNavigationCard(centerX, cardY, data);
    });
  }

  createNavigationCard(x, y, data) {
    const cardWidth = 660;
    const cardHeight = 150;

    const container = this.add.container(x, y);

    // 카드 배경 (Rounded Rect)
    const bg = this.add.graphics();
    bg.fillStyle(0xd1dde9, 1);
    bg.fillRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);
    bg.lineStyle(1.5, 0x30364f, 0);
    bg.strokeRoundedRect(-cardWidth / 2, -cardHeight / 2, cardWidth, cardHeight, 32);

    const textLeftMargin = -cardWidth / 2 + 50;

    // 텍스트 (Title)
    const titleText = this.add.text(textLeftMargin, -20, data.title, {
      fontSize: '34px',
      fontFamily: 'Pretendard, Arial',
      color: '#545454',
    });

    // 텍스트 (Description)
    const descText = this.add.text(textLeftMargin, 10, data.desc, {
      fontSize: '22px',
      fontFamily: 'Pretendard, Arial',
      color: '#6b7280',
    });

    // 화살표 아이콘 모양
    const arrow = this.add
      .text(cardWidth / 2 - 60, 0, '>', {
        fontSize: '40px',
        fontFamily: 'Pretendard, Arial',
        color: '#30364f',
      })
      .setOrigin(0.5);

    container.add([bg, titleText, descText, arrow]);

    // 인터랙션 설정
    const hitArea = new Phaser.Geom.Rectangle(
      -cardWidth / 2,
      -cardHeight / 2,
      cardWidth,
      cardHeight,
    );
    container.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

    // 클릭 시 이동
    container.on('pointerdown', () => {
      updateExternalNav(data.key);
      this.scene.start(data.key);
    });
  }
}
