/**
 * test-transform.js
 * 
 * transform-tokens.js의 변환 로직을 테스트합니다.
 * 실행: npm run test:transform
 */

const { transformFigmaToTokens, convertColor } = require('./transform-tokens');

// =============================================================================
// 테스트 데이터: Figma API 응답 형식을 모사
// =============================================================================

const mockVariables = {
  'VariableID:1:1': {
    id: 'VariableID:1:1',
    name: 'color/primary/500',
    resolvedType: 'COLOR',
    variableCollectionId: 'VariableCollectionID:1:0',
    valuesByMode: {
      'ModeID:1:0': { r: 0.2, g: 0.4, b: 0.95, a: 1 },
    },
    remote: false,
    description: '주요 브랜드 컬러',
    codeSyntax: { WEB: '--color-primary-500' },
  },
  'VariableID:1:2': {
    id: 'VariableID:1:2',
    name: 'color/primary/100',
    resolvedType: 'COLOR',
    variableCollectionId: 'VariableCollectionID:1:0',
    valuesByMode: {
      'ModeID:1:0': { r: 0.9, g: 0.92, b: 0.99, a: 1 },
    },
    remote: false,
    description: '',
  },
  'VariableID:2:1': {
    id: 'VariableID:2:1',
    name: 'spacing/sm',
    resolvedType: 'FLOAT',
    variableCollectionId: 'VariableCollectionID:2:0',
    valuesByMode: {
      'ModeID:2:0': 8,
    },
    remote: false,
    description: '',
  },
  'VariableID:2:2': {
    id: 'VariableID:2:2',
    name: 'spacing/md',
    resolvedType: 'FLOAT',
    variableCollectionId: 'VariableCollectionID:2:0',
    valuesByMode: {
      'ModeID:2:0': 16,
    },
    remote: false,
    description: '',
  },
  'VariableID:2:3': {
    id: 'VariableID:2:3',
    name: 'spacing/lg',
    resolvedType: 'FLOAT',
    variableCollectionId: 'VariableCollectionID:2:0',
    valuesByMode: {
      'ModeID:2:0': 24,
    },
    remote: false,
    description: '',
  },
  'VariableID:3:1': {
    id: 'VariableID:3:1',
    name: 'surface/background',
    resolvedType: 'COLOR',
    variableCollectionId: 'VariableCollectionID:3:0',
    valuesByMode: {
      'ModeID:3:light': { r: 1, g: 1, b: 1, a: 1 },
      'ModeID:3:dark': { r: 0.07, g: 0.07, b: 0.09, a: 1 },
    },
    remote: false,
    description: '배경색',
  },
  'VariableID:3:2': {
    id: 'VariableID:3:2',
    name: 'text/primary',
    resolvedType: 'COLOR',
    variableCollectionId: 'VariableCollectionID:3:0',
    valuesByMode: {
      'ModeID:3:light': { r: 0.07, g: 0.07, b: 0.09, a: 1 },
      'ModeID:3:dark': { r: 0.95, g: 0.95, b: 0.97, a: 1 },
    },
    remote: false,
    description: '기본 텍스트 색상',
  },
  // alias 테스트
  'VariableID:3:3': {
    id: 'VariableID:3:3',
    name: 'button/primary/background',
    resolvedType: 'COLOR',
    variableCollectionId: 'VariableCollectionID:3:0',
    valuesByMode: {
      'ModeID:3:light': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' },
      'ModeID:3:dark': { type: 'VARIABLE_ALIAS', id: 'VariableID:1:1' },
    },
    remote: false,
    description: '버튼 배경 - primary 컬러 참조',
  },
};

const mockCollections = {
  'VariableCollectionID:1:0': {
    id: 'VariableCollectionID:1:0',
    name: 'Primitives',
    modes: [{ modeId: 'ModeID:1:0', name: 'Default' }],
    defaultModeId: 'ModeID:1:0',
    variableIds: ['VariableID:1:1', 'VariableID:1:2'],
    remote: false,
  },
  'VariableCollectionID:2:0': {
    id: 'VariableCollectionID:2:0',
    name: 'Spacing',
    modes: [{ modeId: 'ModeID:2:0', name: 'Default' }],
    defaultModeId: 'ModeID:2:0',
    variableIds: ['VariableID:2:1', 'VariableID:2:2', 'VariableID:2:3'],
    remote: false,
  },
  'VariableCollectionID:3:0': {
    id: 'VariableCollectionID:3:0',
    name: 'Semantic Colors',
    modes: [
      { modeId: 'ModeID:3:light', name: 'Light' },
      { modeId: 'ModeID:3:dark', name: 'Dark' },
    ],
    defaultModeId: 'ModeID:3:light',
    variableIds: ['VariableID:3:1', 'VariableID:3:2', 'VariableID:3:3'],
    remote: false,
  },
};

// =============================================================================
// 테스트 실행
// =============================================================================

console.log('🧪 변환 테스트 시작\n');

// 색상 변환 테스트
console.log('--- convertColor ---');
console.log('  빨강:', convertColor({ r: 1, g: 0, b: 0, a: 1 }));
console.log('  반투명:', convertColor({ r: 0, g: 0, b: 0, a: 0.5 }));
console.log('');

// 전체 변환 테스트
console.log('--- transformFigmaToTokens ---\n');
const result = transformFigmaToTokens(mockVariables, mockCollections);

for (const [name, tokens] of Object.entries(result)) {
  console.log(`\n📦 ${name}:`);
  console.log(JSON.stringify(tokens, null, 2));
}

console.log('\n✅ 테스트 완료!');
