/**
 * Free Dictionary API 모듈
 * https://dictionaryapi.dev/
 * 무료, API 키 불필요
 */

import { DictEntry } from './dict';

// Free Dictionary API 응답 타입
interface FreeDictPhonetic {
  text?: string;
  audio?: string;
}

interface FreeDictDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface FreeDictMeaning {
  partOfSpeech: string;
  definitions: FreeDictDefinition[];
}

interface FreeDictEntry {
  word: string;
  phonetic?: string;
  phonetics?: FreeDictPhonetic[];
  meanings: FreeDictMeaning[];
}

// 품사 영어 → 한국어 매핑
const posMap: Record<string, string> = {
  'noun': 'n',
  'verb': 'v',
  'adjective': 'adj',
  'adverb': 'adv',
  'pronoun': 'pron',
  'preposition': 'prep',
  'conjunction': 'conj',
  'interjection': 'interj',
  'determiner': 'det',
  'exclamation': 'excl',
};

/**
 * Free Dictionary API로 단어 조회
 */
export async function lookupFreeDictionary(word: string): Promise<DictEntry | null> {
  const normalizedWord = word.toLowerCase().trim();
  
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(normalizedWord)}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`[EngEagle] Free Dictionary: Word not found - ${normalizedWord}`);
        return null;
      }
      throw new Error(`Free Dictionary API error: ${response.status}`);
    }

    const data: FreeDictEntry[] = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }

    return freeDictToEntry(data[0]);
  } catch (error) {
    console.error('[EngEagle] Free Dictionary API error:', error);
    return null;
  }
}

/**
 * Free Dictionary 응답을 DictEntry로 변환
 */
function freeDictToEntry(data: FreeDictEntry): DictEntry {
  const meanings: string[] = [];
  let pos = '';
  let example = '';

  // 모든 의미 수집 (최대 5개)
  for (const meaning of data.meanings) {
    // 첫 번째 품사 저장
    if (!pos && meaning.partOfSpeech) {
      pos = posMap[meaning.partOfSpeech.toLowerCase()] || meaning.partOfSpeech;
    }

    for (const def of meaning.definitions) {
      if (meanings.length >= 5) break;
      
      // 영어 정의 추가
      meanings.push(def.definition);
      
      // 첫 번째 예문 저장
      if (!example && def.example) {
        example = def.example;
      }
    }
    
    if (meanings.length >= 5) break;
  }

  return {
    word: data.word,
    lemma: data.word,
    pos: pos,
    meanings: meanings,
    example: example,
    source_url: `https://dictionaryapi.dev/`,
  };
}

/**
 * Free Dictionary 결과에 한국어 번역 추가 (DeepL 사용)
 */
export async function enrichWithKoreanTranslation(
  entry: DictEntry,
  translateFn: (text: string) => Promise<string | null>
): Promise<DictEntry> {
  try {
    // 첫 번째 의미만 번역 (API 사용량 절약)
    if (entry.meanings.length > 0) {
      const koreanMeaning = await translateFn(entry.meanings[0]);
      if (koreanMeaning) {
        // 영어 정의 + 한국어 번역
        entry.meanings = [
          `${koreanMeaning}`,
          ...entry.meanings.slice(0, 2).map(m => `📖 ${m}`),
        ];
      }
    }
  } catch (error) {
    console.error('[EngEagle] Translation enrichment error:', error);
  }
  
  return entry;
}

