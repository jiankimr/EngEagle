/**
 * Chrome Storage 및 IndexedDB 래퍼
 * 단어장 저장 및 관리
 */

import { generateWordId } from './hash';

/**
 * 단어장 엔트리 타입
 */
export interface VocabularyEntry {
  id: string;
  word: string;
  lemma: string;
  pos: string;
  meanings: string[];
  example: string;
  source_url: string;
  created_at: number;
  freq: number;
}

/**
 * 저장 결과 타입
 */
export interface SaveResult {
  success: boolean;
  isNew: boolean;
  entry: VocabularyEntry;
}

// IndexedDB 설정
const DB_NAME = 'engeagle_db';
const DB_VERSION = 1;
const STORE_NAME = 'vocabulary';

// 재시도 큐
const retryQueue: VocabularyEntry[] = [];
let isProcessingRetry = false;

/**
 * IndexedDB 초기화
 */
function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lemma', 'lemma', { unique: false });
        store.createIndex('created_at', 'created_at', { unique: false });
        store.createIndex('freq', 'freq', { unique: false });
      }
    };
  });
}

/**
 * 단어 저장 (중복 시 freq 증가, source_url 합집합)
 */
export async function saveWord(entry: Omit<VocabularyEntry, 'id' | 'created_at' | 'freq'>): Promise<SaveResult> {
  try {
    const id = generateWordId(entry.lemma);
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const getRequest = store.get(id);
      
      getRequest.onsuccess = () => {
        const existing = getRequest.result as VocabularyEntry | undefined;
        
        let newEntry: VocabularyEntry;
        let isNew = true;
        
        if (existing) {
          // 기존 항목 업데이트: freq 증가
          isNew = false;
          newEntry = {
            ...existing,
            freq: existing.freq + 1,
            // source_url은 첫 번째 것 유지
          };
        } else {
          // 새 항목 생성
          newEntry = {
            id,
            word: entry.word,
            lemma: entry.lemma,
            pos: entry.pos,
            meanings: entry.meanings,
            example: entry.example,
            source_url: entry.source_url,
            created_at: Math.floor(Date.now() / 1000),
            freq: 1,
          };
        }
        
        const putRequest = store.put(newEntry);
        
        putRequest.onsuccess = () => {
          resolve({ success: true, isNew, entry: newEntry });
        };
        
        putRequest.onerror = () => {
          // 재시도 큐에 추가
          addToRetryQueue(newEntry);
          reject(putRequest.error);
        };
      };
      
      getRequest.onerror = () => {
        reject(getRequest.error);
      };
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] Save failed:', error);
    throw error;
  }
}

/**
 * 단어 ID로 조회
 */
export async function getWordById(id: string): Promise<VocabularyEntry | null> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] Get failed:', error);
    return null;
  }
}

/**
 * 모든 단어 조회
 */
export async function getAllWords(): Promise<VocabularyEntry[]> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] GetAll failed:', error);
    return [];
  }
}

/**
 * 단어 삭제
 */
export async function deleteWord(id: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] Delete failed:', error);
    return false;
  }
}

/**
 * 단어 복원 (Undo)
 */
export async function restoreWord(entry: VocabularyEntry): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] Restore failed:', error);
    return false;
  }
}

/**
 * 접두어 검색
 */
export async function searchWords(prefix: string): Promise<VocabularyEntry[]> {
  try {
    const allWords = await getAllWords();
    const lowerPrefix = prefix.toLowerCase();
    
    return allWords.filter(entry => 
      entry.word.toLowerCase().startsWith(lowerPrefix) ||
      entry.lemma.toLowerCase().startsWith(lowerPrefix)
    );
  } catch (error) {
    console.error('[EngEagle] Search failed:', error);
    return [];
  }
}

/**
 * JSON으로 내보내기
 */
export async function exportToJSON(): Promise<string> {
  const words = await getAllWords();
  return JSON.stringify(words, null, 2);
}

/**
 * CSV로 내보내기
 */
export async function exportToCSV(): Promise<string> {
  const words = await getAllWords();
  
  const headers = ['word', 'lemma', 'pos', 'meanings', 'example', 'freq', 'created_at'];
  const rows = words.map(entry => [
    entry.word,
    entry.lemma,
    entry.pos,
    entry.meanings.join('; '),
    entry.example,
    entry.freq.toString(),
    new Date(entry.created_at * 1000).toISOString(),
  ].map(cell => `"${cell.replace(/"/g, '""')}"`).join(','));
  
  return [headers.join(','), ...rows].join('\n');
}

/**
 * JSON에서 가져오기
 */
export async function importFromJSON(jsonString: string): Promise<number> {
  try {
    const entries = JSON.parse(jsonString) as VocabularyEntry[];
    let imported = 0;
    
    for (const entry of entries) {
      if (entry.id && entry.word && entry.lemma) {
        await restoreWord(entry);
        imported++;
      }
    }
    
    return imported;
  } catch (error) {
    console.error('[EngEagle] Import failed:', error);
    return 0;
  }
}

/**
 * 전체 삭제
 */
export async function clearAllWords(): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
      
      transaction.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error('[EngEagle] Clear failed:', error);
    return false;
  }
}

// 재시도 큐 관리
function addToRetryQueue(entry: VocabularyEntry): void {
  retryQueue.push(entry);
  processRetryQueue();
}

async function processRetryQueue(): Promise<void> {
  if (isProcessingRetry || retryQueue.length === 0) return;
  
  isProcessingRetry = true;
  
  while (retryQueue.length > 0) {
    const entry = retryQueue.shift()!;
    try {
      await restoreWord(entry);
    } catch {
      // 최대 3회까지 재시도
      if (!entry.hasOwnProperty('_retryCount')) {
        (entry as any)._retryCount = 1;
      } else if ((entry as any)._retryCount < 3) {
        (entry as any)._retryCount++;
        retryQueue.push(entry);
      }
    }
    // 재시도 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  isProcessingRetry = false;
}

/**
 * 단어 수 조회
 */
export async function getWordCount(): Promise<number> {
  const words = await getAllWords();
  return words.length;
}

