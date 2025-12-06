# EngEagle 🦅

**영어 비원어민 지식 노동자를 위한 통합 영어 학습 도구**

웹페이지를 읽다가 모르는 영어 단어를 발견했나요? EngEagle은 단어 선택 후 Shift + 더블클릭 한 번으로 즉시 번역하고, 자동으로 단어장에 저장하여 나중에 복습할 수 있게 도와줍니다.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=googlechrome)](https://engeagle.netlify.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

🌐 **[웹사이트 바로가기](https://engeagle.netlify.app)** | 📥 **[다운로드 페이지](https://engeagle.netlify.app/download)**

---

## 📌 주요 기능

### 🔍 즉시 번역
- **Shift + 더블클릭**으로 모르는 영어 단어를 즉시 번역
- 팝업에서 단어 뜻, 품사, 예문을 한눈에 확인
- 페이지 전환 없이 학습 흐름 유지

### 📚 스마트 단어장
- 번역한 단어를 자동으로 단어장에 저장
- 조회 빈도 추적으로 자주 찾는 단어 파악
- 검색, 정렬, 필터링으로 효율적인 단어장 관리
- 품사 수동 편집 가능

### 🧠 단어 퀴즈
- 저장된 단어로 복습 퀴즈 진행
- 즐겨찾기 단어만 선택하여 퀴즈
- 랜덤 순서로 효과적인 학습

### 🌐 다중 사전 지원
1. **로컬 사전** - 기본 내장 영한 사전 (오프라인)
2. **Free Dictionary API** - 무료 영영 사전 (정의 + 예문)
3. **DeepL API** - 한국어 번역 (무료 API 키 필요)

### 💾 데이터 관리
- JSON/CSV 내보내기/가져오기
- IndexedDB 로컬 저장 (외부 전송 없음)
- 브라우저간 단어장 동기화 가능

---

## 🚀 빠른 시작

### 1️⃣ 다운로드

[**EngEagle 다운로드 페이지**](https://engeagle.netlify.app/download)에서 최신 버전 ZIP 파일을 다운로드합니다.

### 2️⃣ 설치

1. 다운로드한 ZIP 파일을 **안전한 위치**(예: 바탕화면)에 압축 해제
   ```
   예: 바탕화면 → 새 폴더 "EngEagle" 생성 → ZIP 압축 해제
   ```

2. Chrome 브라우저에서 `chrome://extensions/` 접속

3. 우측 상단의 **"개발자 모드"** 토글 활성화

4. **"압축해제된 확장 프로그램을 로드합니다"** 버튼 클릭

5. 압축 해제한 폴더 선택 (manifest.json이 있는 폴더)

6. EngEagle 아이콘이 Chrome 툴바에 나타나면 설치 완료! 🎉

⚠️ **중요**: 확장 프로그램 폴더를 삭제하면 작동하지 않습니다. 안전한 위치에 보관하세요.

### 3️⃣ DeepL API 설정 (선택, 무료)

로컬 사전에 없는 단어도 번역하려면:

1. [DeepL API](https://www.deepl.com/pro-api)에서 **무료 API 키** 발급 (월 500,000자 무료)
2. EngEagle 아이콘 우클릭 → **옵션** 선택
3. **"DeepL API 설정"** 섹션에서 API 키 입력
4. **"연결 테스트"** 후 **"저장"** 클릭

---

## 📖 사용 방법

### 기본 번역

1. 영문 웹페이지(Wikipedia, Medium, GitHub 등)에서 모르는 단어 발견
2. 단어를 선택하고 **Shift + 더블클릭**
3. 번역 팝업이 표시됩니다
4. 팝업의 **"📥 단어장에 저장"** 버튼 클릭

### 트리거 설정

옵션 페이지에서 원하는 번역 트리거를 선택할 수 있습니다:

- ✅ **Shift + 더블클릭** (기본, 권장)
- ✅ **Alt/Option + 더블클릭**
- ✅ **우클릭 메뉴** → "EngEagle로 번역"

💡 다른 확장 프로그램과 트리거가 충돌하지 않도록 주의하세요!

### 단어장 관리

옵션 페이지에서 다음 작업이 가능합니다:

- 🔍 **검색**: 단어/의미로 검색
- 🔃 **정렬**: 단어, 날짜, 빈도순 정렬
- ⭐ **즐겨찾기**: 중요한 단어 별표시
- ✏️ **품사 편집**: 클릭하여 품사 수정
- 🗑️ **삭제**: 불필요한 단어 삭제 (Undo 가능)
- 📤 **내보내기**: JSON/CSV 형식으로 백업
- 📥 **가져오기**: 다른 기기에서 가져오기

### 퀴즈로 복습

1. 옵션 페이지 → **"단어 퀴즈"** 섹션
2. 퀴즈 범위 선택 (전체 단어 / 즐겨찾기만)
3. **"퀴즈 시작"** 클릭
4. 영어 단어 → 정답 보기 → 즐겨찾기/삭제/다음 단어

---

## 🛡️ 데이터 및 개인정보

### 데이터 저장 위치

- **IndexedDB** (브라우저 로컬 저장소)
- 외부 서버로 전송되지 않음
- 로그인/회원가입 불필요

### ⚠️ 중요: 브라우저 데이터 삭제 시 주의

브라우저 캐시/데이터를 삭제하면 단어장도 함께 삭제됩니다!

**백업 권장:**
1. 옵션 페이지 → **"단어장"** 섹션
2. **"JSON 내보내기"** 또는 **"CSV 내보내기"**
3. 파일 저장 후, 브라우저 데이터 삭제
4. 다시 설치 후 **"가져오기"**로 복원

---

## 🔧 기술 스택

### Chrome 확장 프로그램
- **Manifest V3** (최신 Chrome 확장 표준)
- **TypeScript** (Vanilla)
- **Vite** (빌드 도구)
- **esbuild** (Content Script 번들링)

### 사전 & 번역
- **로컬 JSON 사전** (Wiktionary 기반)
- **[Free Dictionary API](https://dictionaryapi.dev/)** (무료, API 키 불필요)
- **[DeepL API](https://www.deepl.com/pro-api)** (무료 티어)

### 저장소
- **chrome.storage.local** (설정 저장)
- **IndexedDB** (단어장 저장)
- **LRU Cache** (조회 성능 최적화)

---

## 🛠️ 개발자를 위한 정보

### 프로젝트 설정

```bash
# 1. 저장소 클론
git clone https://github.com/jiankimr/EngEagle.git
cd EngEagle

# 2. 확장 프로그램 디렉터리로 이동
cd extension

# 3. 의존성 설치
npm install
```

### 개발 빌드

```bash
npm run build          # 개발 빌드
```

빌드 결과는 `extension/dist/` 폴더에 생성됩니다.

### 테스트

1. Chrome에서 `chrome://extensions/` 접속
2. 개발자 모드 활성화
3. "압축해제된 확장 프로그램을 로드합니다" 클릭
4. `extension/dist` 폴더 선택

### 배포 빌드

```bash
npm run dist           # ZIP + SHA256 체크섬 생성
```

생성되는 파일:
- `dist/EngEagle_v1.0.0_mv3.zip` - 배포용 ZIP
- `dist/sha256.txt` - 파일 무결성 검증용
- `dist/versions.json` - 버전 정보

---

## 📁 디렉터리 구조

```
extension/
├── manifest.json              # Chrome 확장 매니페스트
├── package.json               # npm 설정
├── vite.config.ts             # Vite 빌드 설정
├── tsconfig.json              # TypeScript 설정
│
├── src/
│   ├── background/
│   │   └── service.ts         # Service Worker (메시지 라우팅, 사전 조회)
│   ├── content/
│   │   ├── selection.ts       # Content Script (단어 감지, 팝업 렌더링)
│   │   └── popup.css          # 팝업 스타일
│   ├── options/
│   │   ├── index.html         # 옵션 페이지
│   │   ├── index.ts           # 옵션 페이지 로직
│   │   └── style.css          # 옵션 페이지 스타일
│   └── lib/
│       ├── dict.ts            # 사전 조회 (로컬 + Free Dict + DeepL)
│       ├── deepl.ts           # DeepL API 통합
│       ├── freedict.ts        # Free Dictionary API 통합
│       ├── storage.ts         # IndexedDB 래퍼
│       ├── lemma.ts           # 단어 정규화
│       └── hash.ts            # 해시 함수
│
├── assets/
│   └── dict_en_ko_min.json    # 로컬 사전 (49개 기본 단어)
│
├── icons/                     # 확장 프로그램 아이콘
│   ├── 16.png
│   ├── 32.png
│   ├── 48.png
│   ├── 128.png
│   └── 256.png
│
└── scripts/                   # 빌드 & 배포 스크립트
    ├── build-content.js       # Content script IIFE 빌드
    ├── pack.js                # 빌드 검증
    ├── zip.js                 # ZIP 아카이브 생성
    ├── checksum.js            # SHA256 체크섬 생성
    └── publish-to-netlify.js  # 다운로드 페이지 배포
```

---

## 🎯 작동 원리

### 번역 플로우

```
1. 사용자가 단어 선택 + Shift + 더블클릭
   ↓
2. Content Script (selection.ts)가 이벤트 감지
   ↓
3. Background Service Worker에 조회 요청
   ↓
4. 사전 조회 순서:
   - 캐시 확인 (LRU Cache)
   - 로컬 사전 조회
   - Free Dictionary API (영영 사전)
   - DeepL API (한국어 번역)
   ↓
5. Content Script에 결과 전송
   ↓
6. 팝업 표시 (단어, 품사, 의미, 예문)
   ↓
7. 사용자가 "저장" 버튼 클릭 시 IndexedDB에 저장
```

### 데이터 흐름

```
Content Script ←→ Background Service Worker ←→ APIs
                         ↕
                   chrome.storage.local
                   IndexedDB
```

---

## 🔑 API 키 발급 및 설정

### DeepL API (무료)

**DeepL API Free는 완전 무료입니다!** 월 500,000자까지 번역 가능.

1. [DeepL Pro API 가입 페이지](https://www.deepl.com/pro-api) 접속
2. **"Sign up for free"** 클릭
3. 계정 생성 (신용카드 불필요)
4. **API Key** 복사
5. EngEagle 옵션 페이지 → **"DeepL API 설정"** → API 키 입력 → 저장

### Free Dictionary API

Free Dictionary API는 **API 키 없이 무료**로 사용 가능합니다. 자동으로 활성화됩니다.

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 확장 프로그램이 동작하지 않아요

**A.** 다음을 시도해보세요:
- 웹페이지 새로고침 (F5)
- `chrome://extensions`에서 EngEagle 새로고침 버튼 클릭
- 확장 프로그램 비활성화 → 다시 활성화

### Q2. 특정 페이지에서 번역이 안 돼요

**A.** 다음 페이지에서는 Chrome 정책상 작동하지 않습니다:
- ❌ `chrome://` 페이지 (chrome://extensions 등)
- ❌ Chrome 웹스토어 페이지
- ❌ 새 탭 페이지
- ✅ 일반 웹사이트 (Wikipedia, Medium, GitHub 등)

### Q3. 브라우저 캐시를 지우면 단어장이 삭제되나요?

**A.** **네, 삭제됩니다!** 

단어장 데이터는 IndexedDB에 저장되므로, 브라우저 데이터 삭제 시 함께 사라집니다.

**백업 방법:**
1. 옵션 페이지 → **"JSON 내보내기"** 또는 **"CSV 내보내기"**
2. 파일 저장
3. 브라우저 데이터 삭제 후, **"가져오기"**로 복원

### Q4. 다른 PC로 단어장을 옮길 수 있나요?

**A.** 가능합니다!
1. PC A: 옵션 페이지 → **"JSON 내보내기"**
2. JSON 파일을 PC B로 전송 (이메일, USB 등)
3. PC B: 옵션 페이지 → **"가져오기"**

### Q5. DeepL API는 유료인가요?

**A.** **무료입니다!**
- DeepL API Free: 월 500,000자까지 무료
- 더 필요하면 Pro 플랜으로 업그레이드 가능

### Q6. 번역 품질이 좋지 않아요

**A.** EngEagle은 3단계 사전을 사용합니다:
1. **로컬 사전**: 기본 단어 (오프라인)
2. **Free Dictionary**: 영영 사전 정의 + 예문
3. **DeepL**: 한국어 번역

DeepL API를 설정하면 Free Dictionary의 영어 정의를 한국어로 번역하여 더 정확한 의미를 제공합니다.

---

## 🛠️ 문제 해결

### 확장 프로그램이 로드되지 않아요

```
Error: Could not load icon 'icons/32.png'
```

**해결 방법:**
- `extension/icons/32.png` 파일이 있는지 확인
- 빌드 후 `dist/icons/` 폴더에 모든 아이콘이 있는지 확인

### Content Script 에러

```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**해결 방법:**
- Content Script는 IIFE 형식으로 빌드됩니다
- `npm run build` 실행 시 `build-content.js` 스크립트가 자동으로 IIFE로 변환

### DeepL API 연결 실패

**원인:**
- 잘못된 API 키
- API 사용량 초과
- 네트워크 연결 문제

**해결 방법:**
1. 옵션 페이지 → DeepL API 설정
2. **"연결 테스트"** 버튼 클릭
3. 에러 메시지 확인

---

## 👨‍💻 개발자 가이드

### 로컬 개발 환경 설정

```bash
cd extension
npm install
npm run build
```

### 코드 수정 후 테스트

1. 코드 수정
2. `npm run build` 실행
3. Chrome에서 `chrome://extensions/` 접속
4. EngEagle 확장 프로그램 **새로고침 버튼** 클릭
5. 테스트할 웹페이지 **F5로 새로고침**

### 새 기능 추가 시

1. `src/` 폴더에서 코드 작성
2. TypeScript 타입 정의
3. 빌드 후 테스트
4. `README.md` 업데이트

### 배포 프로세스

```bash
# 1. 확장 프로그램 빌드
cd extension
npm run build

# 2. ZIP 및 체크섬 생성
npm run zip
npm run checksum

# 3. 다운로드 페이지에 복사
cd ..
copy extension\dist\EngEagle_v1.0.0_mv3.zip download\releases\
copy extension\dist\versions.json download\releases\
copy extension\dist\sha256.txt download\releases\

# 4. Git 커밋 & 푸시
git add -A
git commit -m "release: v1.0.0"
git push

# 5. Netlify에서 자동 배포됨
```

---

## 🔐 보안

### 파일 무결성 검증

다운로드한 ZIP 파일의 SHA256 체크섬을 확인하세요:

**Windows (PowerShell):**
```powershell
Get-FileHash EngEagle_v1.0.0_mv3.zip -Algorithm SHA256
```

**Mac/Linux:**
```bash
shasum -a 256 EngEagle_v1.0.0_mv3.zip
```

공식 SHA256 체크섬은 [다운로드 페이지](https://engeagle.netlify.app/download)에서 확인하세요.

### 권한 설명

EngEagle이 요청하는 Chrome 권한:

| 권한 | 사용 목적 |
|------|-----------|
| `storage` | 설정 및 단어장 저장 |
| `activeTab` | 현재 탭의 URL 가져오기 |
| `scripting` | Content Script 주입 |
| `contextMenus` | 우클릭 메뉴 추가 |
| `<all_urls>` | 모든 웹페이지에서 번역 가능 |
| `api-free.deepl.com` | DeepL API 호출 |

---

## 📝 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능합니다.

자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 🤝 기여하기

버그 제보, 기능 제안, PR 환영합니다!

1. 이슈 등록: [GitHub Issues](https://github.com/jiankimr/EngEagle/issues)
2. 피드백: [웹사이트 이메일 폼](https://engeagle.netlify.app)

---

## 📞 문의

- 🌐 웹사이트: [https://engeagle.netlify.app](https://engeagle.netlify.app)
- 📧 이메일: 웹사이트 하단 폼 이용
- 🐙 GitHub: [https://github.com/jiankimr/EngEagle](https://github.com/jiankimr/EngEagle)

---

**2025 SW/AI 비즈니스설계 프로젝트**

Made with ❤️ for non-native English speakers
