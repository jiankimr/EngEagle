/**
 * 간단한 표제어화(lemmatization) 규칙
 * 과도한 라이브러리 없이 기본적인 영어 단어 원형 추출
 */

// 불규칙 동사/명사 예외 목록
const IRREGULAR_FORMS: Record<string, string> = {
  // 동사
  'studies': 'study',
  'studied': 'study',
  'studying': 'study',
  'tries': 'try',
  'tried': 'try',
  'trying': 'try',
  'lies': 'lie',
  'lied': 'lie',
  'lying': 'lie',
  'dies': 'die',
  'died': 'die',
  'dying': 'die',
  'ties': 'tie',
  'tied': 'tie',
  'tying': 'tie',
  'goes': 'go',
  'went': 'go',
  'gone': 'go',
  'going': 'go',
  'does': 'do',
  'did': 'do',
  'done': 'do',
  'doing': 'do',
  'has': 'have',
  'had': 'have',
  'having': 'have',
  'is': 'be',
  'am': 'be',
  'are': 'be',
  'was': 'be',
  'were': 'be',
  'been': 'be',
  'being': 'be',
  'ran': 'run',
  'running': 'run',
  'runs': 'run',
  'took': 'take',
  'taken': 'take',
  'taking': 'take',
  'made': 'make',
  'making': 'make',
  'said': 'say',
  'saying': 'say',
  'got': 'get',
  'gotten': 'get',
  'getting': 'get',
  'came': 'come',
  'coming': 'come',
  'knew': 'know',
  'known': 'know',
  'knowing': 'know',
  'thought': 'think',
  'thinking': 'think',
  'saw': 'see',
  'seen': 'see',
  'seeing': 'see',
  'wrote': 'write',
  'written': 'write',
  'writing': 'write',
  'gave': 'give',
  'given': 'give',
  'giving': 'give',
  'found': 'find',
  'finding': 'find',
  'told': 'tell',
  'telling': 'tell',
  'felt': 'feel',
  'feeling': 'feel',
  'became': 'become',
  'becoming': 'become',
  'left': 'leave',
  'leaving': 'leave',
  'kept': 'keep',
  'keeping': 'keep',
  'let': 'let',
  'letting': 'let',
  'began': 'begin',
  'begun': 'begin',
  'beginning': 'begin',
  'seemed': 'seem',
  'seeming': 'seem',
  'helped': 'help',
  'helping': 'help',
  'showed': 'show',
  'shown': 'show',
  'showing': 'show',
  'heard': 'hear',
  'hearing': 'hear',
  'played': 'play',
  'playing': 'play',
  'moved': 'move',
  'moving': 'move',
  'lived': 'live',
  'living': 'live',
  'believed': 'believe',
  'believing': 'believe',
  'brought': 'bring',
  'bringing': 'bring',
  'happened': 'happen',
  'happening': 'happen',
  'held': 'hold',
  'holding': 'hold',
  'stood': 'stand',
  'standing': 'stand',
  'understood': 'understand',
  'understanding': 'understand',
  // 명사
  'men': 'man',
  'women': 'woman',
  'children': 'child',
  'feet': 'foot',
  'teeth': 'tooth',
  'mice': 'mouse',
  'geese': 'goose',
  'people': 'person',
  'phenomena': 'phenomenon',
  'criteria': 'criterion',
  'data': 'datum',
  'analyses': 'analysis',
  'theses': 'thesis',
  'hypotheses': 'hypothesis',
  'crises': 'crisis',
  'bases': 'basis',
};

// -ing 제거 시 자음 중복 패턴
const DOUBLE_CONSONANT_ING = /^(.+)(bb|dd|gg|ll|mm|nn|pp|rr|ss|tt|zz)ing$/;

// -ed 제거 시 자음 중복 패턴
const DOUBLE_CONSONANT_ED = /^(.+)(bb|dd|gg|ll|mm|nn|pp|rr|ss|tt|zz)ed$/;

/**
 * 영어 단어를 표제어로 변환
 * @param word 원본 단어
 * @returns 표제어
 */
export function toLemma(word: string): string {
  // 소문자로 변환하고 공백 제거
  const normalized = word.toLowerCase().trim();
  
  // 빈 문자열이면 그대로 반환
  if (!normalized) {
    return normalized;
  }
  
  // 예외 목록에 있으면 바로 반환
  if (IRREGULAR_FORMS[normalized]) {
    return IRREGULAR_FORMS[normalized];
  }
  
  // 3글자 이하면 규칙 적용 불가
  if (normalized.length <= 3) {
    return normalized;
  }
  
  // -ing 처리
  if (normalized.endsWith('ing')) {
    // 자음 중복 패턴 (running -> run)
    const doubleMatch = normalized.match(DOUBLE_CONSONANT_ING);
    if (doubleMatch) {
      return doubleMatch[1] + doubleMatch[2][0];
    }
    
    // -ying -> -y (studying -> study)
    if (normalized.endsWith('ying')) {
      return normalized.slice(0, -4) + 'y';
    }
    
    // -ing 제거 후 e 복원 시도 (making -> make)
    const withoutIng = normalized.slice(0, -3);
    if (withoutIng.length >= 2) {
      // -eing이면 그냥 e 복원
      return withoutIng + 'e';
    }
    
    return withoutIng;
  }
  
  // -ed 처리
  if (normalized.endsWith('ed')) {
    // 자음 중복 패턴 (stopped -> stop)
    const doubleMatch = normalized.match(DOUBLE_CONSONANT_ED);
    if (doubleMatch) {
      return doubleMatch[1] + doubleMatch[2][0];
    }
    
    // -ied -> -y (studied -> study)
    if (normalized.endsWith('ied')) {
      return normalized.slice(0, -3) + 'y';
    }
    
    // -ed 제거
    const withoutEd = normalized.slice(0, -2);
    
    // 자음 + ed면 그냥 제거 (helped -> help)
    if (!normalized.endsWith('eed')) {
      return withoutEd;
    }
    
    return withoutEd;
  }
  
  // -es 처리 (3인칭 단수/복수)
  if (normalized.endsWith('es')) {
    // -ies -> -y (studies -> study)
    if (normalized.endsWith('ies')) {
      return normalized.slice(0, -3) + 'y';
    }
    
    // -shes, -ches, -xes, -sses, -zzes -> 제거 es
    if (/(?:sh|ch|x|ss|zz)es$/.test(normalized)) {
      return normalized.slice(0, -2);
    }
    
    // -oes -> -o (goes -> go)
    if (normalized.endsWith('oes')) {
      return normalized.slice(0, -2);
    }
    
    return normalized.slice(0, -2);
  }
  
  // -s 처리 (3인칭 단수/복수)
  if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    return normalized.slice(0, -1);
  }
  
  // -er, -est 처리 (비교급, 최상급)
  if (normalized.endsWith('er') && normalized.length > 4) {
    // -ier -> -y
    if (normalized.endsWith('ier')) {
      return normalized.slice(0, -3) + 'y';
    }
    // 자음 중복 (bigger -> big)
    const withoutEr = normalized.slice(0, -2);
    if (/(.)\1$/.test(withoutEr)) {
      return withoutEr.slice(0, -1);
    }
    return withoutEr;
  }
  
  if (normalized.endsWith('est') && normalized.length > 5) {
    // -iest -> -y
    if (normalized.endsWith('iest')) {
      return normalized.slice(0, -4) + 'y';
    }
    // 자음 중복 (biggest -> big)
    const withoutEst = normalized.slice(0, -3);
    if (/(.)\1$/.test(withoutEst)) {
      return withoutEst.slice(0, -1);
    }
    return withoutEst;
  }
  
  // -ly 처리 (부사)
  if (normalized.endsWith('ly') && normalized.length > 4) {
    // -ily -> -y (happily -> happy)
    if (normalized.endsWith('ily')) {
      return normalized.slice(0, -3) + 'y';
    }
    // -ally -> -al (basically -> basic) - 일부만
    if (normalized.endsWith('ally') && normalized.length > 6) {
      return normalized.slice(0, -2);
    }
    return normalized.slice(0, -2);
  }
  
  return normalized;
}

/**
 * 여러 후보 lemma 생성 (사전 조회 시 fallback용)
 * @param word 원본 단어
 * @returns lemma 후보 배열
 */
export function getLemmaCandidates(word: string): string[] {
  const normalized = word.toLowerCase().trim();
  const primary = toLemma(normalized);
  
  const candidates = new Set<string>();
  candidates.add(normalized); // 원본
  candidates.add(primary);    // 기본 lemma
  
  // 예외 목록 확인
  if (IRREGULAR_FORMS[normalized]) {
    candidates.add(IRREGULAR_FORMS[normalized]);
  }
  
  return Array.from(candidates);
}

/**
 * 영어 단어인지 검사
 * @param text 검사할 텍스트
 * @returns 영어 단어 여부
 */
export function isEnglishWord(text: string): boolean {
  // 최소 2글자 이상
  if (text.length < 2) {
    return false;
  }
  
  // 영문자만 포함 (하이픈, 아포스트로피 허용)
  return /^[a-zA-Z]+(?:[-'][a-zA-Z]+)*$/.test(text);
}

