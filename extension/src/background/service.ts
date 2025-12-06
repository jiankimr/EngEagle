/**
 * EngEagle Background Service Worker
 * 메시지 라우팅, 사전 조회, 저장 I/O 처리
 */

import { loadDictionary, lookupWord, isDictionaryLoaded, getDictionarySize, clearCache } from '../lib/dict';
import { saveWord, getAllWords, deleteWord, restoreWord, updateWord, searchWords, exportToJSON, exportToCSV, importFromJSON, getWordCount, type VocabularyEntry } from '../lib/storage';
import { isEnglishWord } from '../lib/lemma';
import { saveDeepLConfig, loadDeepLConfig, testDeepLConnection, isFreeApiKey, type DeepLConfig } from '../lib/deepl';

// 메시지 타입 정의
interface LookupMessage {
  type: 'LOOKUP';
  word: string;
  sourceUrl?: string;
  saveToVocabulary?: boolean;
}

interface SaveMessage {
  type: 'SAVE';
  entry: Omit<VocabularyEntry, 'id' | 'created_at' | 'freq'>;
}

interface GetAllMessage {
  type: 'GET_ALL';
}

interface DeleteMessage {
  type: 'DELETE';
  id: string;
}

interface RestoreMessage {
  type: 'RESTORE';
  entry: VocabularyEntry;
}

interface SearchMessage {
  type: 'SEARCH';
  prefix: string;
}

interface ExportMessage {
  type: 'EXPORT';
  format: 'json' | 'csv';
}

interface ImportMessage {
  type: 'IMPORT';
  data: string;
}

interface StatusMessage {
  type: 'STATUS';
}

interface UpdateMessage {
  type: 'UPDATE';
  id: string;
  updates: { pos?: string; meanings?: string[]; example?: string; favorite?: boolean };
}

// DeepL 관련 메시지 타입
interface DeepLSaveConfigMessage {
  type: 'DEEPL_SAVE_CONFIG';
  config: DeepLConfig;
}

interface DeepLLoadConfigMessage {
  type: 'DEEPL_LOAD_CONFIG';
}

interface DeepLTestMessage {
  type: 'DEEPL_TEST';
  config: DeepLConfig;
}

// 트리거 설정 타입
interface TriggerConfig {
  altDblclick: boolean;   // Alt(Windows) / Option(Mac)
  shiftDblclick: boolean;
  contextMenu: boolean;
}

interface TriggerSaveConfigMessage {
  type: 'TRIGGER_SAVE_CONFIG';
  config: TriggerConfig;
}

interface TriggerLoadConfigMessage {
  type: 'TRIGGER_LOAD_CONFIG';
}

type Message = 
  | LookupMessage 
  | SaveMessage 
  | GetAllMessage 
  | DeleteMessage 
  | RestoreMessage 
  | UpdateMessage
  | SearchMessage 
  | ExportMessage 
  | ImportMessage 
  | StatusMessage
  | DeepLSaveConfigMessage
  | DeepLLoadConfigMessage
  | DeepLTestMessage
  | TriggerSaveConfigMessage
  | TriggerLoadConfigMessage;

// 트리거 설정 저장 키
const TRIGGER_CONFIG_KEY = 'engeagle_trigger_config';

// 기본 트리거 설정
const DEFAULT_TRIGGER_CONFIG: TriggerConfig = {
  altDblclick: false,   // Alt/Option + 더블클릭
  shiftDblclick: true,  // Shift + 더블클릭 (기본)
  contextMenu: true,
};

// 확장 프로그램 설치/업데이트 시 사전 로드 및 컨텍스트 메뉴 설정
chrome.runtime.onInstalled.addListener(async () => {
  console.log('[EngEagle] Extension installed/updated');
  await loadDictionary();
  console.log(`[EngEagle] Dictionary ready: ${getDictionarySize()} entries`);
  
  // 컨텍스트 메뉴 생성
  await setupContextMenu();
});

/**
 * 컨텍스트 메뉴 설정
 */
async function setupContextMenu(): Promise<void> {
  // 기존 메뉴 제거
  await chrome.contextMenus.removeAll();
  
  // 트리거 설정 확인
  const config = await loadTriggerConfig();
  
  if (config.contextMenu) {
    chrome.contextMenus.create({
      id: 'engeagle-translate',
      title: 'EngEagle로 번역',
      contexts: ['selection'],
    });
    console.log('[EngEagle] Context menu created');
  }
}

/**
 * 트리거 설정 로드
 */
async function loadTriggerConfig(): Promise<TriggerConfig> {
  try {
    const result = await chrome.storage.local.get(TRIGGER_CONFIG_KEY);
    return result[TRIGGER_CONFIG_KEY] || DEFAULT_TRIGGER_CONFIG;
  } catch {
    return DEFAULT_TRIGGER_CONFIG;
  }
}

/**
 * 트리거 설정 저장
 */
async function saveTriggerConfig(config: TriggerConfig): Promise<void> {
  await chrome.storage.local.set({ [TRIGGER_CONFIG_KEY]: config });
  // 컨텍스트 메뉴 업데이트
  await setupContextMenu();
}

// 컨텍스트 메뉴 클릭 핸들러
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'engeagle-translate' && info.selectionText && tab?.id) {
    const word = info.selectionText.trim().split(/\s+/)[0];
    
    if (isEnglishWord(word)) {
      const result = await lookupWord(word);
      
      // 탭에 결과 전송
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_TRANSLATION',
        word,
        result,
        sourceUrl: tab.url || '',
      });
    }
  }
});

// 서비스 워커 시작 시 사전 로드
(async () => {
  await loadDictionary();
  console.log('[EngEagle] Service worker started, dictionary loaded');
})();

// 메시지 리스너
chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  handleMessage(message)
    .then(sendResponse)
    .catch((error) => {
      console.error('[EngEagle] Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    });
  
  // 비동기 응답을 위해 true 반환
  return true;
});

/**
 * 메시지 핸들러
 */
async function handleMessage(message: Message): Promise<unknown> {
  switch (message.type) {
    case 'LOOKUP':
      return handleLookup(message);
    
    case 'SAVE':
      return handleSave(message);
    
    case 'GET_ALL':
      return handleGetAll();
    
    case 'DELETE':
      return handleDelete(message);
    
    case 'RESTORE':
      return handleRestore(message);
    
    case 'UPDATE':
      return handleUpdate(message);
    
    case 'SEARCH':
      return handleSearch(message);
    
    case 'EXPORT':
      return handleExport(message);
    
    case 'IMPORT':
      return handleImport(message);
    
    case 'STATUS':
      return handleStatus();
    
    // DeepL 관련
    case 'DEEPL_SAVE_CONFIG':
      return handleDeepLSaveConfig(message);
    
    case 'DEEPL_LOAD_CONFIG':
      return handleDeepLLoadConfig();
    
    case 'DEEPL_TEST':
      return handleDeepLTest(message);
    
    // 트리거 설정
    case 'TRIGGER_SAVE_CONFIG':
      return handleTriggerSaveConfig(message);
    
    case 'TRIGGER_LOAD_CONFIG':
      return handleTriggerLoadConfig();
    
    default:
      return { success: false, error: 'Unknown message type' };
  }
}

/**
 * 단어 조회 처리
 */
async function handleLookup(message: LookupMessage): Promise<unknown> {
  const { word, sourceUrl = '', saveToVocabulary = false } = message;
  
  // 영어 단어 검증
  if (!isEnglishWord(word)) {
    return {
      success: false,
      error: 'Not a valid English word',
    };
  }
  
  // 사전 조회 (로컬 + DeepL fallback)
  const result = await lookupWord(word);
  
  if (!result.found || !result.entry) {
    return {
      success: false,
      error: 'Word not found',
      lookupTime: result.lookupTime,
    };
  }
  
  // saveToVocabulary가 true일 때만 저장
  if (saveToVocabulary) {
    saveWordAsync(result.entry, sourceUrl);
  }
  
  return {
    success: true,
    entry: result.entry,
    cached: result.cached,
    lookupTime: result.lookupTime,
    source: result.source, // 'local', 'deepl', 'cache'
  };
}

/**
 * 비동기 단어 저장 (응답 차단 없음)
 */
function saveWordAsync(entry: { word: string; lemma: string; pos: string; meanings: string[]; example: string; source_url: string }, sourceUrl: string): void {
  saveWord({
    word: entry.word,
    lemma: entry.lemma,
    pos: entry.pos,
    meanings: entry.meanings,
    example: entry.example,
    source_url: sourceUrl || entry.source_url,
  }).then((result) => {
    // 저장 완료 로그
    console.log(`[EngEagle] Word saved: ${entry.word} (new: ${result.isNew}, freq: ${result.entry.freq})`);
  }).catch((error) => {
    console.error('[EngEagle] Save failed:', error);
  });
}

/**
 * 수동 저장 처리
 */
async function handleSave(message: SaveMessage): Promise<unknown> {
  try {
    const result = await saveWord(message.entry);
    return {
      success: true,
      isNew: result.isNew,
      entry: result.entry,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 전체 단어 조회
 */
async function handleGetAll(): Promise<unknown> {
  try {
    const entries = await getAllWords();
    return {
      success: true,
      entries,
      count: entries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      entries: [],
    };
  }
}

/**
 * 단어 삭제
 */
async function handleDelete(message: DeleteMessage): Promise<unknown> {
  try {
    const success = await deleteWord(message.id);
    return { success };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 단어 복원
 */
async function handleRestore(message: RestoreMessage): Promise<unknown> {
  try {
    const success = await restoreWord(message.entry);
    return { success };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 단어 업데이트 (품사 등)
 */
async function handleUpdate(message: UpdateMessage): Promise<unknown> {
  try {
    const entry = await updateWord(message.id, message.updates);
    if (entry) {
      return { success: true, entry };
    }
    return { success: false, error: 'Word not found' };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 단어 검색
 */
async function handleSearch(message: SearchMessage): Promise<unknown> {
  try {
    const entries = await searchWords(message.prefix);
    return {
      success: true,
      entries,
      count: entries.length,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
      entries: [],
    };
  }
}

/**
 * 내보내기
 */
async function handleExport(message: ExportMessage): Promise<unknown> {
  try {
    const data = message.format === 'csv' 
      ? await exportToCSV()
      : await exportToJSON();
    
    return {
      success: true,
      data,
      format: message.format,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 가져오기
 */
async function handleImport(message: ImportMessage): Promise<unknown> {
  try {
    const count = await importFromJSON(message.data);
    return {
      success: true,
      imported: count,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 상태 확인
 */
async function handleStatus(): Promise<unknown> {
  try {
    const wordCount = await getWordCount();
    const deepLConfig = await loadDeepLConfig();
    
    return {
      success: true,
      dictionaryLoaded: isDictionaryLoaded(),
      dictionarySize: getDictionarySize(),
      vocabularyCount: wordCount,
      deepLConfigured: !!(deepLConfig && deepLConfig.apiKey),
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * DeepL 설정 저장
 */
async function handleDeepLSaveConfig(message: DeepLSaveConfigMessage): Promise<unknown> {
  try {
    // Free API 키 자동 감지
    const config: DeepLConfig = {
      ...message.config,
      useFreeApi: isFreeApiKey(message.config.apiKey),
    };
    
    await saveDeepLConfig(config);
    
    // API 키 변경 시 실패 캐시 초기화 (새로운 API 키로 재시도 가능하도록)
    clearCache();
    console.log('[EngEagle] DeepL config saved, cache cleared');
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * DeepL 설정 로드
 */
async function handleDeepLLoadConfig(): Promise<unknown> {
  try {
    const config = await loadDeepLConfig();
    return {
      success: true,
      config,
    };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * DeepL 연결 테스트
 */
async function handleDeepLTest(message: DeepLTestMessage): Promise<unknown> {
  try {
    // Free API 키 자동 감지
    const config: DeepLConfig = {
      ...message.config,
      useFreeApi: isFreeApiKey(message.config.apiKey),
    };
    
    const result = await testDeepLConnection(config);
    return {
      success: result.success,
      message: result.message,
      usage: result.usage,
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

/**
 * 트리거 설정 저장 핸들러
 */
async function handleTriggerSaveConfig(message: TriggerSaveConfigMessage): Promise<unknown> {
  try {
    await saveTriggerConfig(message.config);
    
    // 모든 탭에 설정 변경 알림
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'TRIGGER_CONFIG_CHANGED',
            config: message.config,
          });
        } catch {
          // 탭이 응답하지 않는 경우 무시
        }
      }
    }
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * 트리거 설정 로드 핸들러
 */
async function handleTriggerLoadConfig(): Promise<unknown> {
  try {
    const config = await loadTriggerConfig();
    return { success: true, config };
  } catch (error) {
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
