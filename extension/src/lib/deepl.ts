/**
 * DeepL API 모듈
 * 로컬 사전에 없는 단어를 DeepL로 번역
 */

export interface DeepLTranslation {
  word: string;
  meanings: string[];
  detectedSourceLang: string;
}

export interface DeepLConfig {
  apiKey: string;
  useFreeApi: boolean; // free API는 다른 엔드포인트
}

// API 엔드포인트
const DEEPL_API_FREE = 'https://api-free.deepl.com/v2/translate';
const DEEPL_API_PRO = 'https://api.deepl.com/v2/translate';

// 설정 저장 키
const CONFIG_KEY = 'engeagle_deepl_config';

/**
 * DeepL 설정 저장
 */
export async function saveDeepLConfig(config: DeepLConfig): Promise<void> {
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
}

/**
 * DeepL 설정 로드
 */
export async function loadDeepLConfig(): Promise<DeepLConfig | null> {
  const result = await chrome.storage.local.get(CONFIG_KEY);
  return result[CONFIG_KEY] || null;
}

/**
 * API 키 유효성 검사
 */
export function isValidApiKey(apiKey: string): boolean {
  // DeepL API 키 형식: 영숫자 + 콜론 + 문자 (예: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx)
  return apiKey.length > 10 && /^[a-zA-Z0-9\-:]+$/.test(apiKey);
}

/**
 * Free API 키인지 확인 (키가 :fx로 끝남)
 */
export function isFreeApiKey(apiKey: string): boolean {
  return apiKey.endsWith(':fx');
}

/**
 * DeepL API로 단어 번역
 */
export async function translateWithDeepL(
  word: string,
  config: DeepLConfig
): Promise<DeepLTranslation | null> {
  if (!config.apiKey || !isValidApiKey(config.apiKey)) {
    console.warn('[EngEagle] Invalid DeepL API key');
    return null;
  }

  const endpoint = config.useFreeApi ? DEEPL_API_FREE : DEEPL_API_PRO;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: [word],
        target_lang: 'KO',
        source_lang: 'EN',
      }),
    });

    if (!response.ok) {
      if (response.status === 403) {
        console.error('[EngEagle] DeepL API key invalid or quota exceeded');
      } else if (response.status === 456) {
        console.error('[EngEagle] DeepL quota exceeded');
      } else {
        console.error(`[EngEagle] DeepL API error: ${response.status}`);
      }
      return null;
    }

    const data = await response.json();
    
    if (data.translations && data.translations.length > 0) {
      const translation = data.translations[0];
      return {
        word: word,
        meanings: [translation.text],
        detectedSourceLang: translation.detected_source_language || 'EN',
      };
    }

    return null;
  } catch (error) {
    console.error('[EngEagle] DeepL API request failed:', error);
    return null;
  }
}

/**
 * DeepL 연결 테스트
 */
export async function testDeepLConnection(config: DeepLConfig): Promise<{
  success: boolean;
  message: string;
  usage?: { character_count: number; character_limit: number };
}> {
  if (!config.apiKey || !isValidApiKey(config.apiKey)) {
    return { success: false, message: 'API 키 형식이 올바르지 않습니다.' };
  }

  const endpoint = config.useFreeApi 
    ? 'https://api-free.deepl.com/v2/usage'
    : 'https://api.deepl.com/v2/usage';

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `DeepL-Auth-Key ${config.apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        return { success: false, message: 'API 키가 유효하지 않습니다.' };
      }
      return { success: false, message: `API 오류: ${response.status}` };
    }

    const data = await response.json();
    return {
      success: true,
      message: '연결 성공!',
      usage: {
        character_count: data.character_count,
        character_limit: data.character_limit,
      },
    };
  } catch (error) {
    return { success: false, message: '네트워크 오류가 발생했습니다.' };
  }
}

/**
 * DeepL 번역 결과를 사전 형식으로 변환
 */
export function deepLResultToDictEntry(
  word: string,
  translation: DeepLTranslation
): {
  word: string;
  lemma: string;
  pos: string;
  meanings: string[];
  example: string;
  source_url: string;
} {
  return {
    word: word,
    lemma: word.toLowerCase(),
    pos: 'unknown', // DeepL은 품사 정보를 제공하지 않음
    meanings: translation.meanings,
    example: '',
    source_url: 'deepl',
  };
}

