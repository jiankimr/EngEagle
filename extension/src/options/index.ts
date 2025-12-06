/**
 * EngEagle 옵션 페이지 스크립트
 * 단어장 관리: 조회, 검색, 추가, 삭제, Undo, 내보내기/가져오기
 * DeepL API 설정
 */

interface VocabularyEntry {
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

interface DeepLConfig {
  apiKey: string;
  useFreeApi: boolean;
}

// DOM 요소
const wordCountEl = document.getElementById('word-count') as HTMLElement;
const dictStatusEl = document.getElementById('dict-status') as HTMLElement;

// DeepL 설정 요소
const settingsToggle = document.getElementById('settings-toggle') as HTMLElement;
const settingsContent = document.getElementById('settings-content') as HTMLElement;
const deepLApiKeyInput = document.getElementById('deepl-api-key') as HTMLInputElement;
const btnToggleKey = document.getElementById('btn-toggle-key') as HTMLButtonElement;
const btnTestDeepL = document.getElementById('btn-test-deepl') as HTMLButtonElement;
const btnSaveDeepL = document.getElementById('btn-save-deepl') as HTMLButtonElement;
const deepLStatus = document.getElementById('deepl-status') as HTMLElement;
const deepLUsage = document.getElementById('deepl-usage') as HTMLElement;
const usageCount = document.getElementById('usage-count') as HTMLElement;
const usageLimit = document.getElementById('usage-limit') as HTMLElement;
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const searchClear = document.getElementById('search-clear') as HTMLButtonElement;
const vocabBody = document.getElementById('vocab-body') as HTMLTableSectionElement;
const emptyState = document.getElementById('empty-state') as HTMLElement;
const loadingState = document.getElementById('loading-state') as HTMLElement;
const undoToast = document.getElementById('undo-toast') as HTMLElement;
const undoMessage = undoToast.querySelector('.undo-message') as HTMLElement;
const btnUndo = document.getElementById('btn-undo') as HTMLButtonElement;
const addModal = document.getElementById('add-modal') as HTMLElement;
const addForm = document.getElementById('add-form') as HTMLFormElement;
const btnAdd = document.getElementById('btn-add') as HTMLButtonElement;
const btnCancel = document.getElementById('btn-cancel') as HTMLButtonElement;
const btnExport = document.getElementById('btn-export') as HTMLButtonElement;
const exportMenu = document.getElementById('export-menu') as HTMLElement;
const btnImport = document.getElementById('btn-import') as HTMLButtonElement;
const fileImport = document.getElementById('file-import') as HTMLInputElement;

// 상태
let allEntries: VocabularyEntry[] = [];
let filteredEntries: VocabularyEntry[] = [];
let deletedEntry: VocabularyEntry | null = null;
let undoTimeout: number | null = null;
let currentSort: { key: string; asc: boolean } = { key: 'created_at', asc: false };

// 품사 레이블
const posLabels: Record<string, string> = {
  'noun': '명사',
  'verb': '동사',
  'adj': '형용사',
  'adv': '부사',
  'prep': '전치사',
  'conj': '접속사',
  'pron': '대명사',
  'interj': '감탄사',
  'other': '기타',
  '': '품사 선택',
};

// 품사 옵션 (편집용)
const posOptions: { value: string; label: string }[] = [
  { value: '', label: '없음' },
  { value: 'noun', label: '명사' },
  { value: 'verb', label: '동사' },
  { value: 'adj', label: '형용사' },
  { value: 'adv', label: '부사' },
  { value: 'prep', label: '전치사' },
  { value: 'conj', label: '접속사' },
  { value: 'pron', label: '대명사' },
  { value: 'interj', label: '감탄사' },
  { value: 'other', label: '기타' },
];

/**
 * 초기화
 */
async function init(): Promise<void> {
  await loadStatus();
  await loadVocabulary();
  await loadDeepLConfig();
  setupEventListeners();
  setupDeepLEventListeners();
}

/**
 * 상태 로드
 */
async function loadStatus(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'STATUS' });
    if (response.success) {
      dictStatusEl.textContent = response.dictionaryLoaded ? '정상' : '오류';
      dictStatusEl.style.color = response.dictionaryLoaded ? '#3fb950' : '#f85149';
    }
  } catch (error) {
    console.error('Status load failed:', error);
    dictStatusEl.textContent = '오류';
    dictStatusEl.style.color = '#f85149';
  }
}

/**
 * 단어장 로드
 */
async function loadVocabulary(): Promise<void> {
  loadingState.style.display = 'block';
  emptyState.style.display = 'none';
  vocabBody.innerHTML = '';

  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_ALL' });
    if (response.success) {
      allEntries = response.entries;
      wordCountEl.textContent = allEntries.length.toString();
      filterAndRender();
    }
  } catch (error) {
    console.error('Vocabulary load failed:', error);
  } finally {
    loadingState.style.display = 'none';
  }
}

/**
 * 필터링 및 렌더링
 */
function filterAndRender(): void {
  const query = searchInput.value.toLowerCase().trim();
  
  if (query) {
    filteredEntries = allEntries.filter(entry =>
      entry.word.toLowerCase().startsWith(query) ||
      entry.lemma.toLowerCase().startsWith(query) ||
      entry.meanings.some(m => m.includes(query))
    );
    searchClear.style.display = 'block';
  } else {
    filteredEntries = [...allEntries];
    searchClear.style.display = 'none';
  }

  // 정렬
  sortEntries();
  
  // 렌더링
  renderTable();
}

/**
 * 정렬
 */
function sortEntries(): void {
  const { key, asc } = currentSort;
  
  filteredEntries.sort((a, b) => {
    let valA: string | number;
    let valB: string | number;
    
    switch (key) {
      case 'word':
        valA = a.word.toLowerCase();
        valB = b.word.toLowerCase();
        break;
      case 'freq':
        valA = a.freq;
        valB = b.freq;
        break;
      case 'created_at':
      default:
        valA = a.created_at;
        valB = b.created_at;
    }
    
    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });
}

/**
 * 테이블 렌더링
 */
function renderTable(): void {
  vocabBody.innerHTML = '';

  if (filteredEntries.length === 0) {
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  for (const entry of filteredEntries) {
    const tr = document.createElement('tr');
    tr.dataset.id = entry.id;
    
    const posLabel = posLabels[entry.pos] || entry.pos || '품사 선택';
    const meanings = entry.meanings.join(', ');
    const date = formatDate(entry.created_at);
    const posClass = entry.pos ? 'word-pos' : 'word-pos word-pos-empty';

    tr.innerHTML = `
      <td class="col-word">
        <div class="word-cell">
          <span class="word-text">${escapeHtml(entry.word)}</span>
          <span class="${posClass}" data-pos="${escapeHtml(entry.pos)}" title="클릭하여 품사 편집">${escapeHtml(posLabel)}</span>
        </div>
      </td>
      <td class="col-meaning">
        <span class="meaning-cell">${escapeHtml(meanings)}</span>
      </td>
      <td class="col-example">
        <span class="example-cell">${escapeHtml(entry.example)}</span>
      </td>
      <td class="col-freq">
        <span class="freq-cell">${entry.freq}</span>
      </td>
      <td class="col-date">
        <span class="date-cell">${date}</span>
      </td>
      <td class="col-actions">
        <button class="btn btn-danger btn-delete" title="삭제">🗑</button>
      </td>
    `;

    vocabBody.appendChild(tr);
  }
}

/**
 * 날짜 포맷팅
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}.${month}.${day}`;
}

/**
 * HTML 이스케이프
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * 이벤트 리스너 설정
 */
function setupEventListeners(): void {
  // 검색
  searchInput.addEventListener('input', () => {
    filterAndRender();
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    filterAndRender();
  });

  // 정렬
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort')!;
      
      // 같은 키면 방향 토글
      if (currentSort.key === key) {
        currentSort.asc = !currentSort.asc;
      } else {
        currentSort.key = key;
        currentSort.asc = key === 'word'; // 단어는 오름차순 기본
      }

      // 정렬 표시 업데이트
      document.querySelectorAll('th[data-sort]').forEach(el => {
        el.classList.remove('sort-asc', 'sort-desc');
      });
      th.classList.add(currentSort.asc ? 'sort-asc' : 'sort-desc');

      filterAndRender();
    });
  });

  // 삭제
  vocabBody.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('btn-delete')) {
      const tr = target.closest('tr') as HTMLTableRowElement;
      const id = tr.dataset.id!;
      deleteEntry(id);
    }
    // 품사 편집
    else if (target.classList.contains('word-pos')) {
      const tr = target.closest('tr') as HTMLTableRowElement;
      const id = tr.dataset.id!;
      showPosEditor(target, id);
    }
  });

  // Undo
  btnUndo.addEventListener('click', undoDelete);

  // 단어 추가
  btnAdd.addEventListener('click', () => {
    addModal.style.display = 'flex';
    (document.getElementById('add-word') as HTMLInputElement).focus();
  });

  btnCancel.addEventListener('click', () => {
    addModal.style.display = 'none';
    addForm.reset();
  });

  addModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
    addModal.style.display = 'none';
    addForm.reset();
  });

  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addNewWord();
  });

  // 내보내기
  btnExport.addEventListener('click', (e) => {
    e.stopPropagation();
    exportMenu.classList.toggle('show');
  });

  document.addEventListener('click', () => {
    exportMenu.classList.remove('show');
  });

  exportMenu.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format as 'json' | 'csv';
      exportData(format);
    });
  });

  // 가져오기
  btnImport.addEventListener('click', () => {
    fileImport.click();
  });

  fileImport.addEventListener('change', async () => {
    const file = fileImport.files?.[0];
    if (file) {
      await importData(file);
      fileImport.value = '';
    }
  });

  // ESC 키로 모달 닫기
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addModal.style.display === 'flex') {
      addModal.style.display = 'none';
      addForm.reset();
    }
  });
}

/**
 * 단어 삭제
 */
async function deleteEntry(id: string): Promise<void> {
  const entry = allEntries.find(e => e.id === id);
  if (!entry) return;

  try {
    const response = await chrome.runtime.sendMessage({ type: 'DELETE', id });
    if (response.success) {
      // 목록에서 제거
      allEntries = allEntries.filter(e => e.id !== id);
      wordCountEl.textContent = allEntries.length.toString();
      filterAndRender();

      // Undo 설정
      showUndoToast(entry);
    }
  } catch (error) {
    console.error('Delete failed:', error);
  }
}

/**
 * Undo 토스트 표시
 */
function showUndoToast(entry: VocabularyEntry): void {
  // 이전 Undo 취소
  if (undoTimeout) {
    clearTimeout(undoTimeout);
  }

  deletedEntry = entry;
  undoMessage.textContent = `"${entry.word}" 삭제됨`;
  undoToast.style.display = 'flex';

  // 5초 후 자동 숨김
  undoTimeout = window.setTimeout(() => {
    hideUndoToast();
  }, 5000);
}

/**
 * Undo 토스트 숨김
 */
function hideUndoToast(): void {
  undoToast.style.display = 'none';
  deletedEntry = null;
  if (undoTimeout) {
    clearTimeout(undoTimeout);
    undoTimeout = null;
  }
}

/**
 * 삭제 취소
 */
async function undoDelete(): Promise<void> {
  if (!deletedEntry) return;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'RESTORE',
      entry: deletedEntry
    });

    if (response.success) {
      allEntries.push(deletedEntry);
      wordCountEl.textContent = allEntries.length.toString();
      filterAndRender();
      hideUndoToast();
    }
  } catch (error) {
    console.error('Undo failed:', error);
  }
}

/**
 * 새 단어 추가
 */
async function addNewWord(): Promise<void> {
  const word = (document.getElementById('add-word') as HTMLInputElement).value.trim();
  const pos = (document.getElementById('add-pos') as HTMLSelectElement).value;
  const meaningsStr = (document.getElementById('add-meanings') as HTMLInputElement).value.trim();
  const example = (document.getElementById('add-example') as HTMLInputElement).value.trim();

  if (!word || !meaningsStr) return;

  const meanings = meaningsStr.split(',').map(m => m.trim()).filter(m => m);

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'SAVE',
      entry: {
        word,
        lemma: word.toLowerCase(),
        pos,
        meanings,
        example,
        source_url: ''
      }
    });

    if (response.success) {
      addModal.style.display = 'none';
      addForm.reset();
      await loadVocabulary();
    }
  } catch (error) {
    console.error('Add failed:', error);
  }
}

/**
 * 데이터 내보내기
 */
async function exportData(format: 'json' | 'csv'): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'EXPORT',
      format
    });

    if (response.success) {
      const blob = new Blob([response.data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `engeagle_vocabulary.${format}`;
      a.click();
      
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Export failed:', error);
  }
}

/**
 * 데이터 가져오기
 */
async function importData(file: File): Promise<void> {
  try {
    const text = await file.text();
    const response = await chrome.runtime.sendMessage({
      type: 'IMPORT',
      data: text
    });

    if (response.success) {
      alert(`${response.imported}개의 단어를 가져왔습니다.`);
      await loadVocabulary();
    }
  } catch (error) {
    console.error('Import failed:', error);
    alert('가져오기 실패: 올바른 JSON 파일인지 확인하세요.');
  }
}

/**
 * DeepL 설정 로드
 */
async function loadDeepLConfig(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'DEEPL_LOAD_CONFIG' });
    if (response.success && response.config) {
      deepLApiKeyInput.value = response.config.apiKey || '';
    }
  } catch (error) {
    console.error('DeepL config load failed:', error);
  }
}

/**
 * DeepL 이벤트 리스너 설정
 */
function setupDeepLEventListeners(): void {
  // 설정 토글
  settingsToggle.addEventListener('click', () => {
    const isOpen = settingsContent.style.display !== 'none';
    settingsContent.style.display = isOpen ? 'none' : 'block';
    settingsToggle.classList.toggle('open', !isOpen);
  });

  // API 키 표시/숨기기
  btnToggleKey.addEventListener('click', () => {
    const isPassword = deepLApiKeyInput.type === 'password';
    deepLApiKeyInput.type = isPassword ? 'text' : 'password';
    btnToggleKey.textContent = isPassword ? '🙈' : '👁';
  });

  // 연결 테스트
  btnTestDeepL.addEventListener('click', testDeepLConnection);

  // 저장
  btnSaveDeepL.addEventListener('click', saveDeepLConfig);
}

/**
 * DeepL 연결 테스트
 */
async function testDeepLConnection(): Promise<void> {
  const apiKey = deepLApiKeyInput.value.trim();
  
  if (!apiKey) {
    showDeepLStatus('API 키를 입력해주세요.', 'error');
    return;
  }

  showDeepLStatus('연결 테스트 중...', 'loading');
  btnTestDeepL.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DEEPL_TEST',
      config: { apiKey, useFreeApi: apiKey.endsWith(':fx') }
    });

    if (response.success) {
      showDeepLStatus('✅ ' + response.message, 'success');
      
      // 사용량 표시
      if (response.usage) {
        deepLUsage.style.display = 'flex';
        usageCount.textContent = response.usage.character_count.toLocaleString();
        usageLimit.textContent = response.usage.character_limit.toLocaleString();
      }
    } else {
      showDeepLStatus('❌ ' + response.message, 'error');
      deepLUsage.style.display = 'none';
    }
  } catch (error) {
    showDeepLStatus('❌ 테스트 실패', 'error');
    console.error('DeepL test failed:', error);
  } finally {
    btnTestDeepL.disabled = false;
  }
}

/**
 * DeepL 설정 저장
 */
async function saveDeepLConfig(): Promise<void> {
  const apiKey = deepLApiKeyInput.value.trim();

  btnSaveDeepL.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: 'DEEPL_SAVE_CONFIG',
      config: { apiKey, useFreeApi: apiKey.endsWith(':fx') }
    });

    if (response.success) {
      showDeepLStatus('✅ 설정이 저장되었습니다.', 'success');
    } else {
      showDeepLStatus('❌ 저장 실패', 'error');
    }
  } catch (error) {
    showDeepLStatus('❌ 저장 실패', 'error');
    console.error('DeepL save failed:', error);
  } finally {
    btnSaveDeepL.disabled = false;
  }
}

/**
 * DeepL 상태 표시
 */
function showDeepLStatus(message: string, type: 'success' | 'error' | 'loading'): void {
  deepLStatus.textContent = message;
  deepLStatus.className = 'deepl-status ' + type;
  deepLStatus.style.display = 'block';
}

/**
 * 품사 편집 드롭다운 표시
 */
function showPosEditor(target: HTMLElement, id: string): void {
  // 기존 편집기 제거
  const existingEditor = document.querySelector('.pos-editor');
  if (existingEditor) {
    existingEditor.remove();
  }

  const currentPos = target.dataset.pos || '';
  
  // 드롭다운 생성
  const select = document.createElement('select');
  select.className = 'pos-editor';
  
  for (const option of posOptions) {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    if (option.value === currentPos) {
      opt.selected = true;
    }
    select.appendChild(opt);
  }

  // 위치 설정
  const rect = target.getBoundingClientRect();
  select.style.position = 'fixed';
  select.style.top = `${rect.top}px`;
  select.style.left = `${rect.left}px`;
  select.style.zIndex = '1000';

  // 변경 이벤트
  select.addEventListener('change', async () => {
    const newPos = select.value;
    await updatePos(id, newPos);
    select.remove();
  });

  // 포커스 잃으면 닫기
  select.addEventListener('blur', () => {
    setTimeout(() => select.remove(), 100);
  });

  // ESC로 닫기
  select.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      select.remove();
    }
  });

  document.body.appendChild(select);
  select.focus();
}

/**
 * 품사 업데이트
 */
async function updatePos(id: string, newPos: string): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'UPDATE',
      id,
      updates: { pos: newPos }
    });

    if (response.success) {
      // allEntries 업데이트
      const entry = allEntries.find(e => e.id === id);
      if (entry) {
        entry.pos = newPos;
      }
      filterAndRender();
    }
  } catch (error) {
    console.error('Update failed:', error);
  }
}

// 초기화 실행
init();

