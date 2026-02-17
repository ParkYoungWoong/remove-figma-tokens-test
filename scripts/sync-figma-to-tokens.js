/**
 * sync-figma-to-tokens.js
 * 
 * Figma Variables REST API에서 변수를 가져와서
 * W3C Design Token (DTCG) 형식의 JSON 파일로 변환합니다.
 * 
 * 환경변수:
 *   FIGMA_PAT      - Figma Personal Access Token
 *   FIGMA_FILE_KEY - Figma 파일 키
 */

const { transformFigmaToTokens } = require('./transform-tokens');
const fs = require('fs');
const path = require('path');

// =============================================================================
// 설정
// =============================================================================

const FIGMA_API_BASE = 'https://api.figma.com';
const TOKENS_DIR = path.resolve(__dirname, '..', 'tokens');

// =============================================================================
// Figma API 호출
// =============================================================================

/**
 * Figma Variables REST API에서 로컬 변수를 가져옵니다.
 * GET /v1/files/:file_key/variables/local
 */
async function fetchFigmaVariables(fileKey, token) {
  const url = `${FIGMA_API_BASE}/v1/files/${fileKey}/variables/local`;

  console.log(`📡 Figma API 호출: ${url}`);

  const response = await fetch(url, {
    headers: {
      'X-Figma-Token': token,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Figma API 오류 (${response.status}): ${response.statusText}\n${errorBody}`
    );
  }

  const data = await response.json();

  if (data.status !== 200 || data.error) {
    throw new Error(`Figma API 응답 오류: ${JSON.stringify(data)}`);
  }

  return data.meta;
}

// =============================================================================
// 파일 쓰기
// =============================================================================

/**
 * 토큰 데이터를 컬렉션별 JSON 파일로 저장합니다.
 */
function writeTokenFiles(tokensByCollection) {
  // tokens 디렉토리 확인
  if (!fs.existsSync(TOKENS_DIR)) {
    fs.mkdirSync(TOKENS_DIR, { recursive: true });
  }

  const writtenFiles = [];

  for (const [collectionName, tokens] of Object.entries(tokensByCollection)) {
    // 파일명: 컬렉션 이름을 kebab-case로 변환
    const fileName = collectionName
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, '-')
      .replace(/^-|-$/g, '');
    const filePath = path.join(TOKENS_DIR, `${fileName}.json`);

    const content = JSON.stringify(tokens, null, 2) + '\n';
    fs.writeFileSync(filePath, content, 'utf-8');

    writtenFiles.push(filePath);
    console.log(`  📄 ${filePath}`);
  }

  return writtenFiles;
}

// =============================================================================
// 동기화 메타데이터
// =============================================================================

/**
 * 동기화 메타 정보를 저장합니다.
 */
function writeSyncMetadata(fileKey, variableCount, collectionCount) {
  const metaPath = path.join(TOKENS_DIR, '_sync-meta.json');
  const meta = {
    $description: '이 파일은 자동 생성됩니다. 직접 수정하지 마세요.',
    source: 'figma',
    figmaFileKey: fileKey,
    lastSyncedAt: new Date().toISOString(),
    stats: {
      variables: variableCount,
      collections: collectionCount,
    },
  };

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');
  console.log(`  📄 ${metaPath}`);
}

// =============================================================================
// 메인
// =============================================================================

async function main() {
  const figmaPat = process.env.FIGMA_PAT;
  const fileKey = process.env.FIGMA_FILE_KEY;

  if (!figmaPat) {
    console.error('❌ FIGMA_PAT 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  if (!fileKey) {
    console.error('❌ FIGMA_FILE_KEY 환경변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  console.log('🎨 Figma Variables → Design Tokens 동기화 시작\n');

  // 1. Figma에서 변수 가져오기
  console.log('1️⃣  Figma에서 변수 가져오는 중...');
  const meta = await fetchFigmaVariables(fileKey, figmaPat);

  const variables = meta.variables || {};
  const collections = meta.variableCollections || {};

  const variableCount = Object.keys(variables).length;
  const collectionCount = Object.keys(collections).length;

  console.log(`   → 변수 ${variableCount}개, 컬렉션 ${collectionCount}개 발견\n`);

  if (variableCount === 0) {
    console.log('⚠️  변수가 없습니다. 종료합니다.');
    return;
  }

  // 2. W3C Design Token 형식으로 변환
  console.log('2️⃣  Design Token 형식으로 변환 중...');
  const tokensByCollection = transformFigmaToTokens(variables, collections);
  console.log('');

  // 3. 파일 쓰기
  console.log('3️⃣  토큰 파일 저장 중...');
  writeTokenFiles(tokensByCollection);
  writeSyncMetadata(fileKey, variableCount, collectionCount);
  console.log('');

  console.log('✅ 동기화 완료!');
}

main().catch((err) => {
  console.error('❌ 동기화 실패:', err.message);
  process.exit(1);
});
