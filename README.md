# 프로젝트 가이드라인 (AI Context & Architecture)

## 📌 1. Project Overview (프로젝트 개요)

- **Description:** 의료/미용 목적의 실 리프팅 원리를 시각적으로 보여주는 모바일 최적화 인터랙티브 웹 페이지.
- **Core Interaction:** 사용자가 화면의 '실' 객체를 드래그 & 드롭하여 피부 조직, 탄성력, 얼굴 근육 변화(스프라이트 프레임)를 체험함.
- **AI Instruction:** 이 문서는 프로젝트의 컨텍스트를 AI에게 제공하기 위한 명세서입니다. 코드를 생성할 때 아래의 기술 스택, 디렉터리 구조, 씬(Scene)별 동작 명세 및 제약사항을 반드시 준수하세요.

## 🛠 2. Tech Stack (기술 스택)

- **Frontend:** HTML5, Vanilla JavaScript (ES6+), **Vite** (Build Tool), **Phaser 3** (2D WebGL/Canvas Engine)
- **Backend:** Node.js, **Vercel Serverless Functions** (`/api` 디렉터리)
- **Database:** MongoDB (Atlas 무과금 티어)
- **State Management:** 브라우저 `localStorage` (사용자 식별용 UUID 저장)

## 📁 3. Directory Structure (디렉터리 구조)

_주의: 실(Thread)과 피부(Skin) 객체는 공용 컴포넌트로 분리하지 않고, 각 Scene의 특성에 맞게 Scene 파일 내부에서 직접 구현합니다._

```text
lifting-interactive-web/
├── api/                           # [Backend] Vercel Serverless Functions
│   ├── count.js                   # 고유 접속 카운트 조회 및 증가 API
│   └── db.js                      # MongoDB 커넥션 풀 관리
├── public/                        # [Static Assets] Vite에서 빌드 없이 서빙됨
│   ├── assets/
│   │   ├── fonts/                 # 웹 폰트 파일
│   │   ├── images/                # UI, 실, 피부 단면 이미지
│   │   └── sprites/               # 얼굴 근육 변화 10단계 스프라이트 시트
├── src/                           # [Frontend] Phaser 3 소스 코드
│   ├── scenes/
│   │   ├── Boot.js                # 에셋 프리로딩 및 초기 설정
│   │   ├── Home.js                # [첫 화면] 1, 2, 3 화면 선택 메뉴
│   │   ├── Preloader.js           # [로딩 화면] 에셋 로딩 및 localStorage 기반 UUID 생성/조회 모듈, API 연동
│   │   ├── Scene1.js              # [1 화면] 리프팅 VS 고정용
│   │   ├── Scene2.js              # [2 화면] PDO VS PCL
│   │   └── Scene3.js              # [3 화면] 얼굴 근육 및 입 벌림
│   ├── utils/
│   │   └── navigation.js          # 네비게이션 바의 활성화 상태 업데이트
│   ├── style.css                  # 전체 화면 리셋 및 캔버스 중앙 정렬
│   └── main.js                    # Vite 진입점 및 Phaser Game Config 설정
├── package.json
├── vercel.json                    # API 라우팅 및 CORS 설정
└── vite.config.js                 # Vite 빌드 설정
```
