# EngEagle 🦅

영어 비원어민 지식 노동자를 위한 통합 영어 학습 도구

## 주요 기능

- **즉시 번역 & 단어장 저장**: 드래그/더블클릭으로 단어 뜻 확인 및 자동 저장
- **스마트 단어장**: 조회 빈도 추적, CSV/JSON 내보내기
- **DeepL API 지원**: 무료 API로 모든 영어 단어 번역
- **완전한 오프라인**: 로컬 사전으로 네트워크 없이도 동작

## 대상 사용자

- 논문을 읽는 연구자
- 개발 문서를 보는 개발자
- 영어로 커뮤니케이션하는 PM, 마케터
- 모든 영어 비원어민 지식 노동자

## 프로젝트 구조

```
EngEagle/
├── index.html              # 랜딩 페이지
├── css/                    # 랜딩 페이지 스타일
├── js/                     # 랜딩 페이지 스크립트
├── images/                 # 랜딩 페이지 이미지
│
├── download/               # 확장 프로그램 다운로드
│   ├── index.html          # 다운로드 페이지
│   ├── install_guide.html  # 설치 가이드
│   ├── versions.json       # 버전 정보
│   └── releases/           # 배포 파일
│
└── extension/              # Chrome 확장 프로그램 소스
    ├── manifest.json
    ├── package.json
    ├── src/                # TypeScript 소스
    ├── assets/             # 로컬 사전
    └── scripts/            # 빌드 스크립트
```

## 확장 프로그램 개발

### 설치

```bash
cd extension
npm install
```

### 빌드

```bash
npm run build    # 개발 빌드
npm run dist     # 배포 빌드 (ZIP + 체크섬)
```

### 배포

```bash
node scripts/publish-to-netlify.js  # download 폴더로 복사
```

## 설치 방법

1. [다운로드 페이지](https://engeagle.netlify.app/download)에서 ZIP 다운로드
2. 압축 해제
3. Chrome → `chrome://extensions` → 개발자 모드 ON
4. "압축해제된 확장 프로그램을 로드합니다" 클릭
5. 압축 해제한 폴더 선택

## 사용 방법

1. 영문 웹페이지에서 단어 **더블클릭**
2. 번역 팝업이 표시됩니다
3. 단어가 자동으로 단어장에 저장됩니다
4. 옵션 페이지에서 단어장 관리

### DeepL API 설정 (선택)

더 많은 단어 번역을 위해 DeepL 무료 API를 설정하세요:

1. [DeepL API](https://www.deepl.com/pro-api) 무료 가입
2. 옵션 페이지 → DeepL API 설정
3. API 키 입력 → 저장

## 라이선스

MIT License

---

**2025-2 SW/AI 비즈니스설계 과제**
