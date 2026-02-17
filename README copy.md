# 🎨 Figma Variables → Design Tokens 동기화

Figma Variables REST API에서 디자인 변수를 가져와 [W3C Design Tokens](https://tr.designtokens.org/format/) 형식의 JSON으로 변환하고, **자동으로 Git 브랜치와 Pull Request를 생성**합니다.

## 동작 방식

```
개발자가 GitHub Actions에서 "Run workflow" 클릭
        ↓
Figma Variables REST API로 최신 변수 가져오기
        ↓
W3C Design Token (DTCG) JSON으로 변환
        ↓
변경사항이 있으면 → 새 브랜치 + 커밋 + PR 자동 생성
변경사항이 없으면 → "변경 없음" 로그만 남기고 종료
```

## 출력 예시

**단일 모드 컬렉션** (`Primitives`):
```json
{
  "$description": "Figma 컬렉션: Primitives",
  "color": {
    "primary": {
      "500": {
        "$type": "color",
        "$value": "#3366f2",
        "$description": "주요 브랜드 컬러"
      }
    }
  }
}
```

**멀티 모드 컬렉션** (`Semantic Colors` - Light/Dark):
```json
{
  "$description": "Figma 컬렉션: Semantic Colors",
  "Light": {
    "surface": {
      "background": { "$type": "color", "$value": "#ffffff" }
    },
    "button": {
      "primary": {
        "background": { "$type": "color", "$value": "{color.primary.500}" }
      }
    }
  },
  "Dark": {
    "surface": {
      "background": { "$type": "color", "$value": "#121217" }
    }
  }
}
```

> 변수 Alias는 `{color.primary.500}` 같은 DTCG 참조 형식으로 자동 변환됩니다.

---

## 셋업 가이드

### 1단계: Figma Personal Access Token 생성

1. [Figma](https://www.figma.com) > Settings > **Personal Access Tokens**
2. **Create a new personal access token** 클릭
3. 스코프에서 **`file_variables:read`** 선택
4. 토큰 값을 복사해 두기

### 2단계: GitHub Repository 설정

1. 이 프로젝트를 레포지토리에 복사합니다
2. **Settings > Secrets and variables > Actions** 에서:
   - `FIGMA_PAT` 시크릿 추가 (1단계에서 복사한 토큰)

### 3단계: Figma 파일 키 확인

Figma 파일 URL에서 추출합니다:

```
https://www.figma.com/design/XXXXXXXXXX/파일이름
                              ^^^^^^^^^^
                              이 부분이 파일 키
```

### 4단계: 워크플로우 실행

1. GitHub > **Actions** 탭
2. **Sync Figma Variables to Tokens** 워크플로우 선택
3. **Run workflow** 클릭
4. Figma 파일 키 입력
5. 실행!

변경사항이 있으면 자동으로 PR이 생성됩니다.

---

## 프로젝트 구조

```
├── .github/
│   └── workflows/
│       └── sync-figma-to-tokens.yml   # GitHub Actions 워크플로우
├── scripts/
│   ├── sync-figma-to-tokens.js        # 메인 동기화 스크립트
│   ├── transform-tokens.js            # Figma → DTCG 변환 로직
│   └── test-transform.js              # 변환 로직 테스트
├── tokens/                            # 생성된 토큰 파일 (자동 생성)
│   ├── primitives.json
│   ├── spacing.json
│   ├── semantic-colors.json
│   └── _sync-meta.json
├── .env.example
├── package.json
└── README.md
```

## 로컬에서 실행

```bash
# 의존성 설치
npm install

# .env 파일 생성
cp .env.example .env
# .env 파일 열어서 FIGMA_PAT과 FIGMA_FILE_KEY 입력

# 동기화 실행
npm run sync

# 변환 로직 테스트
npm run test:transform
```

## 지원하는 Figma 변수 타입

| Figma 타입 | DTCG `$type` | 예시 값 |
|-----------|-------------|---------|
| COLOR | `color` | `#3366f2`, `rgba(0,0,0,0.5)` |
| FLOAT | `number` | `16`, `1.5` |
| STRING | `string` | `"Inter"`, `"bold"` |
| BOOLEAN | `boolean` | `true`, `false` |

## 주의사항

- **Enterprise 플랜 필요**: Figma Variables REST API는 Enterprise 조직의 full member만 사용할 수 있습니다.
- **Remote 변수**: 외부 라이브러리에서 참조하는 remote 변수는 건너뜁니다.
- **중복 이름**: 컬렉션 간 변수 이름이 중복되면 Alias 참조가 잘못될 수 있습니다. 변수 이름은 고유하게 유지하세요.
