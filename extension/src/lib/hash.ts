/**
 * djb2 해시 알고리즘 구현
 * 단어 ID 생성에 사용
 */

/**
 * djb2 해시 함수
 * @param str 해시할 문자열
 * @returns 32비트 해시 값
 */
export function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & 0xFFFFFFFF; // 32비트로 제한
  }
  return hash >>> 0; // unsigned로 변환
}

/**
 * 단어 ID 생성
 * @param lemma 표제어
 * @param lang 언어 코드 (기본값: 'en')
 * @returns 고유 ID 문자열
 */
export function generateWordId(lemma: string, lang: string = 'en'): string {
  const input = `${lemma.toLowerCase()}|${lang}`;
  const hash = djb2Hash(input);
  return hash.toString(16).padStart(8, '0');
}

/**
 * 빠른 문자열 해시 (캐시 키 등에 사용)
 * @param str 해시할 문자열
 * @returns 짧은 해시 문자열
 */
export function quickHash(str: string): string {
  return djb2Hash(str).toString(36);
}

