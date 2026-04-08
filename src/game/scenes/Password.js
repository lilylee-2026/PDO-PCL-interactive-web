import { Scene } from 'phaser';
import { navigateTo } from '../../utils/navigation.js';

export class Password extends Scene {
  constructor() {
    super('Password');
  }

  preload() {
    if (!this.cache.json.exists('config')) {
      this.load.json('config', 'assets/config/config.json');
    }
  }

  create() {
    const { width, height } = this.scale;
    const centerX = width / 2;

    this.cameras.main.setBackgroundColor('#fefdf1');

    const configData = this.cache.json.get('config');
    const passwordData = configData?.password;

    // --- [패스워드 입력창 영역] ---
    this.add
      .text(centerX, 440, '비밀번호를 입력하세요', {
        fontSize: '32px',
        color: '#545454',
        fontFamily: 'Pretendard',
      })
      .setOrigin(0.5);

    // 2. HTML Input 엘리먼트 (크기 및 폰트 확대)
    const inputElement = document.createElement('input');
    inputElement.type = 'password';
    inputElement.placeholder = 'Password';
    inputElement.style.width = '400px'; // 너비 확대
    inputElement.style.height = '70px'; // 높이 확대
    inputElement.style.fontSize = '32px'; // 폰트 크기 확대
    inputElement.style.textAlign = 'center';
    inputElement.style.border = '3px solid #30364f';
    inputElement.style.borderRadius = '12px';
    inputElement.style.outline = 'none';

    const passwordInput = this.add.dom(centerX, 540, inputElement);

    // --- [확인 버튼 영역 전체 수정] ---

    // 3. 버튼 배경 (Rectangle 사용으로 전체 영역 인터랙션 구현)
    const btnWidth = 400;
    const btnHeight = 80;
    const btnY = 660;

    const btnBg = this.add
      .rectangle(centerX, btnY, btnWidth, btnHeight, 0x30364f)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add
      .text(centerX, btnY, '확인', {
        fontSize: '32px',
        color: '#ffffff',
        fontFamily: 'Pretendard',
        fontWeight: 'bold',
      })
      .setOrigin(0.5);

    // 4. 에러 메시지
    const errorText = this.add
      .text(centerX, 750, '비밀번호가 일치하지 않습니다.', {
        fontSize: '24px',
        color: '#ff0000',
        fontFamily: 'Pretendard',
      })
      .setOrigin(0.5)
      .setVisible(false);

    // --- [로그인 로직] ---

    const handleLogin = () => {
      const inputPassword = inputElement.value;

      if (inputPassword === passwordData) {
        passwordInput.destroy();
        navigateTo(this, 'Home');
      } else {
        errorText.setVisible(true);
        inputElement.value = '';
        inputElement.focus();
        this.time.delayedCall(2000, () => {
          if (this.scene.isActive()) errorText.setVisible(false);
        });
      }
    };

    // 버튼 배경(영역 전체) 클릭 시 실행
    btnBg.on('pointerdown', handleLogin);

    // 버튼 호버 효과
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x4a5568));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x30364f));

    // 엔터키 입력 지원
    inputElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') handleLogin();
    });
  }
}
