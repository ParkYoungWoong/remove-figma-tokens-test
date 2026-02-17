/**
 * transform-tokens.js
 *
 * Figma Variables API 응답을 W3C Design Token Community Group (DTCG) 형식으로 변환합니다.
 * 
 * 지원하는 Figma 변수 타입:
 *   - COLOR  → $type: "color"
 *   - FLOAT  → $type: "number" / "dimension"
 *   - STRING → $type: "string" (fontFamily 등)
 *   - BOOLEAN → $type: "boolean"
 *
 * 참고: https://tr.designtokens.org/format/
 */

// =============================================================================
// Figma 타입 → DTCG 타입 매핑
// =============================================================================

const TYPE_MAP = {
  COLOR: 'color',
  FLOAT: 'number',
  STRING: 'string',
  BOOLEAN: 'boolean',
};

// =============================================================================
// 값 변환 함수들
// =============================================================================

/**
 * Figma 색상(0~1 RGBA)을 CSS hex 또는 rgba 문자열로 변환합니다.
 */
function convertColor(figmaColor) {
  if (!figmaColor || typeof figmaColor !== 'object') return figmaColor;

  const r = Math.round((figmaColor.r || 0) * 255);
  const g = Math.round((figmaColor.g || 0) * 255);
  const b = Math.round((figmaColor.b || 0) * 255);
  const a = figmaColor.a !== undefined ? figmaColor.a : 1;

  if (a < 1) {
    return `rgba(${r}, ${g}, ${b}, ${parseFloat(a.toFixed(3))})`;
  }

  const hex = [r, g, b]
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('');

  return `#${hex}`;
}

/**
 * Figma 값을 DTCG 토큰 값으로 변환합니다.
 */
function convertValue(value, resolvedType, allVariables) {
  // Variable Alias (다른 변수 참조)
  if (value && typeof value === 'object' && value.type === 'VARIABLE_ALIAS') {
    const referencedVar = allVariables[value.id];
    if (referencedVar) {
      // 참조 경로를 DTCG alias 형식으로: {group.token}
      const refPath = referencedVar.name.replace(/\//g, '.');
      return `{${refPath}}`;
    }
    return value;
  }

  // 타입별 값 변환
  switch (resolvedType) {
    case 'COLOR':
      return convertColor(value);
    case 'FLOAT':
      return typeof value === 'number' ? value : parseFloat(value);
    case 'STRING':
      return String(value);
    case 'BOOLEAN':
      return Boolean(value);
    default:
      return value;
  }
}

// =============================================================================
// 중첩 객체 빌더
// =============================================================================

/**
 * "color/green/100" 같은 Figma 변수 경로를 중첩 객체로 변환합니다.
 * 
 * 예: "color/green/100" → { color: { green: { "100": { $value, $type } } } }
 */
function setNestedValue(obj, pathStr, tokenData) {
  const parts = pathStr.split('/');
  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object' || current[part].$value !== undefined) {
      current[part] = {};
    }
    current = current[part];
  }

  const leafKey = parts[parts.length - 1];
  current[leafKey] = tokenData;
}

// =============================================================================
// 메인 변환 함수
// =============================================================================

/**
 * Figma 변수와 컬렉션을 DTCG 형식의 토큰으로 변환합니다.
 * 
 * @param {Object} variables - Figma API meta.variables
 * @param {Object} collections - Figma API meta.variableCollections
 * @returns {Object} 컬렉션 이름을 키로 하는 DTCG 토큰 객체
 */
function transformFigmaToTokens(variables, collections) {
  const result = {};

  // 컬렉션별로 변수 그룹핑
  for (const [collectionId, collection] of Object.entries(collections)) {
    // remote 컬렉션(외부 라이브러리)은 건너뛰기
    if (collection.remote) {
      console.log(`   ⏭️  원격 컬렉션 건너뜀: ${collection.name}`);
      continue;
    }

    const collectionName = collection.name;
    const modes = collection.modes || [];
    const defaultModeId = collection.defaultModeId;
    const variableIds = collection.variableIds || [];

    console.log(`   📦 컬렉션: "${collectionName}" (변수 ${variableIds.length}개, 모드 ${modes.length}개)`);

    // 모드가 1개면 단일 파일, 여러 개면 모드별 섹션
    const isSingleMode = modes.length === 1;

    if (isSingleMode) {
      // ── 단일 모드: 플랫 구조 ──
      const tokens = {
        $description: `Figma 컬렉션: ${collectionName}`,
      };

      for (const varId of variableIds) {
        const variable = variables[varId];
        if (!variable || variable.remote) continue;

        const modeId = defaultModeId || modes[0]?.modeId;
        const rawValue = variable.valuesByMode?.[modeId];
        if (rawValue === undefined) continue;

        const tokenData = {
          $type: TYPE_MAP[variable.resolvedType] || variable.resolvedType,
          $value: convertValue(rawValue, variable.resolvedType, variables),
        };

        // 설명이 있으면 추가
        if (variable.description) {
          tokenData.$description = variable.description;
        }

        // codeSyntax가 있으면 $extensions에 추가
        if (variable.codeSyntax && Object.keys(variable.codeSyntax).length > 0) {
          tokenData.$extensions = {
            'com.figma': { codeSyntax: variable.codeSyntax },
          };
        }

        setNestedValue(tokens, variable.name, tokenData);
      }

      result[collectionName] = tokens;

    } else {
      // ── 멀티 모드: 모드별 섹션 ──
      const tokens = {
        $description: `Figma 컬렉션: ${collectionName}`,
      };

      for (const mode of modes) {
        const modeKey = mode.name
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]+/g, '-')
          .replace(/^-|-$/g, '');

        tokens[mode.name] = {};

        for (const varId of variableIds) {
          const variable = variables[varId];
          if (!variable || variable.remote) continue;

          const rawValue = variable.valuesByMode?.[mode.modeId];
          if (rawValue === undefined) continue;

          const tokenData = {
            $type: TYPE_MAP[variable.resolvedType] || variable.resolvedType,
            $value: convertValue(rawValue, variable.resolvedType, variables),
          };

          if (variable.description) {
            tokenData.$description = variable.description;
          }

          if (variable.codeSyntax && Object.keys(variable.codeSyntax).length > 0) {
            tokenData.$extensions = {
              'com.figma': { codeSyntax: variable.codeSyntax },
            };
          }

          setNestedValue(tokens[mode.name], variable.name, tokenData);
        }
      }

      result[collectionName] = tokens;
    }
  }

  return result;
}

module.exports = { transformFigmaToTokens, convertColor, convertValue };
