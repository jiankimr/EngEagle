/**
 * 로컬 사전 로더 및 LRU 캐시
 * 조회 순서: 캐시 → 로컬 사전 → Free Dictionary (영영) → DeepL (번역)
 */

import { getLemmaCandidates } from './lemma';
import { loadDeepLConfig, translateWithDeepL, deepLResultToDictEntry } from './deepl';
import { lookupFreeDictionary, enrichWithKoreanTranslation } from './freedict';

/**
 * 사전 엔트리 타입
 */
export interface DictEntry {
  word: string;
  lemma: string;
  pos: string;
  meanings: string[];
  example: string;
  source_url: string;
}

/**
 * 조회 결과 타입
 */
export interface LookupResult {
  found: boolean;
  entry?: DictEntry;
  cached: boolean;
  lookupTime: number;
  source?: 'local' | 'freedict' | 'deepl' | 'cache';
}

// LRU 캐시 구현
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private readonly maxSize: number;

  constructor(maxSize: number = 500) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }
    // 접근된 항목을 맨 뒤로 이동 (최근 사용)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    // 이미 존재하면 삭제 후 다시 추가 (순서 갱신)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 용량 초과 시 가장 오래된 항목 제거
    else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

// 싱글톤 사전 인스턴스
let dictIndex: Map<string, DictEntry> | null = null;
let isLoading = false;
let loadPromise: Promise<void> | null = null;

// LRU 캐시 인스턴스 (500개 항목) - 로컬 + DeepL 결과 모두 캐시
const lookupCache = new LRUCache<string, DictEntry | null>(500);

// DeepL 실패 캐시 (5분 TTL) - 일시적 실패 시 재시도 가능하도록
const failedLookupCache = new Map<string, number>();
const FAILED_CACHE_TTL = 5 * 60 * 1000; // 5분

/**
 * 사전 로드 (최초 1회)
 */
export async function loadDictionary(): Promise<void> {
  if (dictIndex !== null) {
    return;
  }

  if (isLoading && loadPromise) {
    return loadPromise;
  }

  isLoading = true;

  loadPromise = (async () => {
    try {
      // Chrome Extension에서는 chrome.runtime.getURL 사용
      const url = chrome.runtime.getURL('assets/dict_en_ko_min.json');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to load dictionary: ${response.status}`);
      }

      const data = await response.json() as Record<string, DictEntry>;
      
      // 메모리 인덱스 생성
      dictIndex = new Map();
      
      for (const [key, entry] of Object.entries(data)) {
        // lemma 키로 인덱싱
        dictIndex.set(key.toLowerCase(), entry);
        
        // word도 추가 인덱싱 (다른 경우)
        if (entry.word.toLowerCase() !== key.toLowerCase()) {
          if (!dictIndex.has(entry.word.toLowerCase())) {
            dictIndex.set(entry.word.toLowerCase(), entry);
          }
        }
      }

      console.log(`[EngEagle] Dictionary loaded: ${dictIndex.size} entries`);
    } catch (error) {
      console.error('[EngEagle] Failed to load dictionary:', error);
      dictIndex = new Map(); // 빈 맵으로 초기화
    } finally {
      isLoading = false;
    }
  })();

  return loadPromise;
}

/**
 * 로컬 사전에서만 조회 (DeepL 없이)
 */
export async function lookupWordLocal(word: string): Promise<LookupResult> {
  const startTime = performance.now();
  const normalizedWord = word.toLowerCase().trim();

  // 사전 로드 확인
  if (dictIndex === null) {
    await loadDictionary();
  }

  if (!dictIndex) {
    const lookupTime = performance.now() - startTime;
    return { found: false, cached: false, lookupTime, source: 'local' };
  }

  // lemma 후보들로 조회
  const candidates = getLemmaCandidates(normalizedWord);
  
  for (const candidate of candidates) {
    const entry = dictIndex.get(candidate);
    if (entry) {
      const lookupTime = performance.now() - startTime;
      return {
        found: true,
        entry,
        cached: false,
        lookupTime,
        source: 'local',
      };
    }
  }

  const lookupTime = performance.now() - startTime;
  return { found: false, cached: false, lookupTime, source: 'local' };
}

/**
 * 단어 조회 (LRU 캐시 + DeepL fallback)
 */
export async function lookupWord(word: string): Promise<LookupResult> {
  const startTime = performance.now();
  const normalizedWord = word.toLowerCase().trim();

  // 1. 캐시 확인
  if (lookupCache.has(normalizedWord)) {
    const cached = lookupCache.get(normalizedWord);
    const lookupTime = performance.now() - startTime;
    
    if (cached) {
      return {
        found: true,
        entry: cached,
        cached: true,
        lookupTime,
        source: 'cache',
      };
    } else {
      // null 캐시 = 로컬/DeepL 모두 없음
      return {
        found: false,
        cached: true,
        lookupTime,
        source: 'cache',
      };
    }
  }

  // 2. 로컬 사전 조회
  const localResult = await lookupWordLocal(normalizedWord);
  
  if (localResult.found && localResult.entry) {
    // 캐시에 저장
    lookupCache.set(normalizedWord, localResult.entry);
    
    const lookupTime = performance.now() - startTime;
    return {
      found: true,
      entry: localResult.entry,
      cached: false,
      lookupTime,
      source: 'local',
    };
  }

  // 3. Free Dictionary API (영영 사전 + 한국어 번역)
  const lastFailed = failedLookupCache.get(normalizedWord);
  const shouldTryOnline = !lastFailed || (Date.now() - lastFailed > FAILED_CACHE_TTL);
  
  if (shouldTryOnline) {
    // Free Dictionary 먼저 시도
    const freeDictResult = await lookupWithFreeDictionary(word);
    
    if (freeDictResult) {
      failedLookupCache.delete(normalizedWord);
      lookupCache.set(normalizedWord, freeDictResult);
      
      const lookupTime = performance.now() - startTime;
      return {
        found: true,
        entry: freeDictResult,
        cached: false,
        lookupTime,
        source: 'freedict',
      };
    }

    // 4. DeepL API fallback (Free Dictionary에서 못 찾은 경우)
    const deepLResult = await lookupWithDeepL(word);
    
    if (deepLResult) {
      failedLookupCache.delete(normalizedWord);
      lookupCache.set(normalizedWord, deepLResult);
      
      const lookupTime = performance.now() - startTime;
      return {
        found: true,
        entry: deepLResult,
        cached: false,
        lookupTime,
        source: 'deepl',
      };
    }
    
    // 모두 실패 시 5분간 재시도 방지
    failedLookupCache.set(normalizedWord, Date.now());
  }
  
  const lookupTime = performance.now() - startTime;
  return {
    found: false,
    cached: false,
    lookupTime,
  };
}

/**
 * Free Dictionary API로 조회 (영영 사전 + DeepL 한국어 번역)
 */
async function lookupWithFreeDictionary(word: string): Promise<DictEntry | null> {
  try {
    console.log(`[EngEagle] Looking up "${word}" with Free Dictionary...`);
    const entry = await lookupFreeDictionary(word);
    
    if (!entry) {
      return null;
    }

    console.log(`[EngEagle] Free Dictionary found: ${entry.meanings[0]?.substring(0, 50)}...`);
    
    // DeepL로 첫 번째 의미를 한국어로 번역
    const config = await loadDeepLConfig();
    if (config?.apiKey && entry.meanings.length > 0) {
      const enriched = await enrichWithKoreanTranslation(entry, async (text) => {
        const translation = await translateWithDeepL(text, config);
        return translation?.meanings[0] || null;
      });
      return enriched;
    }
    
    return entry;
  } catch (error) {
    console.error('[EngEagle] Free Dictionary lookup failed:', error);
    return null;
  }
}

/**
 * DeepL API로 번역 조회
 */
async function lookupWithDeepL(word: string): Promise<DictEntry | null> {
  try {
    const config = await loadDeepLConfig();
    
    if (!config || !config.apiKey) {
      console.log('[EngEagle] DeepL not configured, skipping');
      return null;
    }

    console.log(`[EngEagle] Looking up "${word}" with DeepL...`);
    const translation = await translateWithDeepL(word, config);
    
    if (translation) {
      console.log(`[EngEagle] DeepL translation: ${translation.meanings.join(', ')}`);
      return deepLResultToDictEntry(word, translation);
    }
    
    return null;
  } catch (error) {
    console.error('[EngEagle] DeepL lookup failed:', error);
    return null;
  }
}

/**
 * 캐시 초기화 (API 키 변경 시 호출)
 */
export function clearCache(): void {
  lookupCache.clear();
  failedLookupCache.clear();
}

/**
 * 사전 상태 확인
 */
export function isDictionaryLoaded(): boolean {
  return dictIndex !== null && dictIndex.size > 0;
}

/**
 * 사전 크기 확인
 */
export function getDictionarySize(): number {
  return dictIndex?.size ?? 0;
}

/**
 * 캐시 크기 확인
 */
export function getCacheSize(): number {
  return lookupCache.size;
}
