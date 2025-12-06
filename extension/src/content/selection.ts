/**
 * EngEagle Content Script
 * 더블클릭 감지 및 번역 팝업 렌더링
 */

import { isEnglishWord } from '../lib/lemma';

// 팝업 요소 ID
const POPUP_ID = 'engeagle-popup';
const TOAST_ID = 'engeagle-toast';

// 팝업 상태
let currentPopup: HTMLElement | null = null;
let currentToast: HTMLElement | null = null;
let hideTimeout: number | null = null;

// 스크롤/리사이즈 이벤트 핸들러
let scrollHandler: (() => void) | null = null;
let resizeHandler: (() => void) | null = null;

// 현재 선택 범위 저장
let currentRange: Range | null = null;

/**
 * 팝업 스타일 주입 (CSS 파일이 로드되지 않는 경우 대비)
 */
function injectStyles(): void {
  if (document.getElementById('engeagle-styles')) {
    return;
  }

  const style = document.createElement('style');
  style.id = 'engeagle-styles';
  style.textContent = `
    #${POPUP_ID} {
      position: absolute;
      z-index: 2147483647;
      max-width: 320px;
      min-width: 200px;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 1px solid #0f3460;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #e8e8e8;
      padding: 16px;
      animation: engeagle-fade-in 0.15s ease-out;
      pointer-events: auto;
    }

    @keyframes engeagle-fade-in {
      from {
        opacity: 0;
        transform: translateY(-8px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    #${POPUP_ID} .engeagle-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-bottom: 8px;
    }

    #${POPUP_ID} .engeagle-word {
      font-size: 18px;
      font-weight: 700;
      color: #00d9ff;
      letter-spacing: -0.02em;
    }

    #${POPUP_ID} .engeagle-pos {
      font-size: 12px;
      color: #ff6b9d;
      background: rgba(255, 107, 157, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 500;
    }

    #${POPUP_ID} .engeagle-meanings {
      color: #ffffff;
      font-size: 15px;
      font-weight: 500;
      margin-bottom: 10px;
    }

    #${POPUP_ID} .engeagle-example {
      font-size: 13px;
      color: #a0a0a0;
      font-style: italic;
      padding: 10px 12px;
      background: rgba(255, 255, 255, 0.03);
      border-left: 3px solid #0f3460;
      border-radius: 0 6px 6px 0;
      margin-top: 8px;
    }

    #${POPUP_ID} .engeagle-close {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 24px;
      height: 24px;
      border: none;
      background: transparent;
      color: #666;
      cursor: pointer;
      font-size: 18px;
      line-height: 1;
      border-radius: 4px;
      transition: all 0.15s ease;
    }

    #${POPUP_ID} .engeagle-close:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
    }

    #${POPUP_ID} .engeagle-error {
      color: #ff6b6b;
      text-align: center;
      padding: 8px;
    }

    #${POPUP_ID} .engeagle-loading {
      text-align: center;
      color: #888;
    }

    #${POPUP_ID} .engeagle-save-btn {
      display: block;
      width: 100%;
      margin-top: 12px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    #${POPUP_ID} .engeagle-save-btn:hover {
      background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
      transform: translateY(-1px);
    }

    #${POPUP_ID} .engeagle-save-btn:disabled {
      cursor: default;
      transform: none;
    }

    #${TOAST_ID} {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: linear-gradient(135deg, #00c851 0%, #00a040 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 4px 16px rgba(0, 200, 81, 0.3);
      animation: engeagle-toast-in 0.3s ease-out;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    @keyframes engeagle-toast-in {
      from {
        opacity: 0;
        transform: translateY(16px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    #${TOAST_ID}.engeagle-toast-out {
      animation: engeagle-toast-out 0.2s ease-in forwards;
    }

    @keyframes engeagle-toast-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(16px);
      }
    }

    #${TOAST_ID}::before {
      content: '✓';
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
}

/**
 * 팝업 숨기기
 */
function hidePopup(): void {
  if (currentPopup) {
    currentPopup.remove();
    currentPopup = null;
  }

  if (hideTimeout) {
    clearTimeout(hideTimeout);
    hideTimeout = null;
  }

  // 이벤트 리스너 제거
  if (scrollHandler) {
    window.removeEventListener('scroll', scrollHandler, true);
    scrollHandler = null;
  }

  if (resizeHandler) {
    window.removeEventListener('resize', resizeHandler);
    resizeHandler = null;
  }

  currentRange = null;
}

/**
 * 토스트 표시
 */
function showToast(message: string): void {
  // 기존 토스트 제거
  if (currentToast) {
    currentToast.remove();
  }

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  toast.textContent = message;
  document.body.appendChild(toast);
  currentToast = toast;

  // 2초 후 페이드 아웃
  setTimeout(() => {
    if (currentToast === toast) {
      toast.classList.add('engeagle-toast-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
        if (currentToast === toast) {
          currentToast = null;
        }
      }, 200);
    }
  }, 2000);
}

/**
 * 팝업 위치 계산
 */
function calculatePopupPosition(range: Range): { top: number; left: number } {
  const rect = range.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  let top = rect.bottom + scrollY + 8;
  let left = rect.left + scrollX;

  // 화면 오른쪽 경계 체크
  const popupWidth = 320;
  if (left + popupWidth > window.innerWidth + scrollX - 16) {
    left = window.innerWidth + scrollX - popupWidth - 16;
  }

  // 화면 왼쪽 경계 체크
  if (left < scrollX + 16) {
    left = scrollX + 16;
  }

  // 화면 아래쪽 경계 체크 - 위로 표시
  const estimatedHeight = 150;
  if (rect.bottom + estimatedHeight > window.innerHeight) {
    top = rect.top + scrollY - estimatedHeight - 8;
  }

  return { top, left };
}

/**
 * 팝업 위치 업데이트
 */
function updatePopupPosition(): void {
  if (!currentPopup || !currentRange) return;

  const { top, left } = calculatePopupPosition(currentRange);
  currentPopup.style.top = `${top}px`;
  currentPopup.style.left = `${left}px`;
}

/**
 * 팝업 표시
 */
function showPopup(range: Range, content: string): void {
  hidePopup();
  injectStyles();

  currentRange = range;

  const popup = document.createElement('div');
  popup.id = POPUP_ID;
  popup.innerHTML = content;

  const { top, left } = calculatePopupPosition(range);
  popup.style.top = `${top}px`;
  popup.style.left = `${left}px`;

  document.body.appendChild(popup);
  currentPopup = popup;

  // 닫기 버튼 이벤트
  const closeBtn = popup.querySelector('.engeagle-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      hidePopup();
    });
  }

  // 스크롤/리사이즈 시 위치 재계산
  scrollHandler = () => {
    requestAnimationFrame(updatePopupPosition);
  };
  resizeHandler = () => {
    requestAnimationFrame(updatePopupPosition);
  };

  window.addEventListener('scroll', scrollHandler, true);
  window.addEventListener('resize', resizeHandler);

  // 팝업 외부 클릭 시 닫기
  setTimeout(() => {
    document.addEventListener('click', handleOutsideClick);
  }, 100);
}

/**
 * 외부 클릭 핸들러
 */
function handleOutsideClick(e: MouseEvent): void {
  if (currentPopup && !currentPopup.contains(e.target as Node)) {
    hidePopup();
    document.removeEventListener('click', handleOutsideClick);
  }
}

/**
 * 로딩 팝업 표시
 */
function showLoadingPopup(range: Range): void {
  const content = `
    <div class="engeagle-loading">
      조회 중...
    </div>
  `;
  showPopup(range, content);
}

/**
 * 결과 팝업 표시
 */
function showResultPopup(range: Range, entry: {
  word: string;
  pos: string;
  meanings: string[];
  example: string;
}): void {
  const posLabels: Record<string, string> = {
    'noun': '명사',
    'verb': '동사',
    'adj': '형용사',
    'adv': '부사',
    'prep': '전치사',
    'conj': '접속사',
    'pron': '대명사',
    'interj': '감탄사',
    'unknown': '',
    '': '',
  };

  const posLabel = posLabels[entry.pos] ?? entry.pos;
  const meanings = entry.meanings.join(', ');

  const content = `
    <button class="engeagle-close" title="닫기">&times;</button>
    <div class="engeagle-header">
      <span class="engeagle-word">${escapeHtml(entry.word)}</span>
      ${posLabel ? `<span class="engeagle-pos">${escapeHtml(posLabel)}</span>` : ''}
    </div>
    <div class="engeagle-meanings">${escapeHtml(meanings)}</div>
    ${entry.example ? `<div class="engeagle-example">${escapeHtml(entry.example)}</div>` : ''}
    <button class="engeagle-save-btn" data-word="${escapeHtml(entry.word)}" data-entry='${JSON.stringify(entry).replace(/'/g, "&#39;")}'>📥 단어장에 저장</button>
  `;
  showPopup(range, content);

  // 저장 버튼 이벤트 등록
  setTimeout(() => {
    const saveBtn = document.querySelector('.engeagle-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const btn = e.target as HTMLButtonElement;
        const entryData = JSON.parse(btn.dataset.entry || '{}');
        
        try {
          await chrome.runtime.sendMessage({
            type: 'SAVE',
            entry: {
              word: entryData.word,
              lemma: entryData.lemma || entryData.word.toLowerCase(),
              pos: entryData.pos,
              meanings: entryData.meanings,
              example: entryData.example || '',
              source_url: window.location.href,
            },
          });
          btn.textContent = '✅ 저장됨';
          btn.disabled = true;
          btn.style.background = '#10b981';
          showToast('단어장에 저장됨');
        } catch (error) {
          console.error('[EngEagle] Save error:', error);
          btn.textContent = '❌ 저장 실패';
        }
      });
    }
  }, 50);
}

/**
 * 에러 팝업 표시
 */
function showErrorPopup(range: Range, message: string): void {
  const content = `
    <button class="engeagle-close" title="닫기">&times;</button>
    <div class="engeagle-error">${escapeHtml(message)}</div>
  `;
  showPopup(range, content);
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
 * 선택된 텍스트에서 단어 추출
 */
function getSelectedWord(): { word: string; range: Range } | null {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0);
  let text = selection.toString().trim();

  // 공백 포함 시 첫 단어만
  if (text.includes(' ')) {
    text = text.split(/\s+/)[0];
  }

  // 영어 단어 검증
  if (!isEnglishWord(text)) {
    return null;
  }

  return { word: text, range };
}

// 트리거 설정
interface TriggerConfig {
  altDblclick: boolean;   // Alt(Windows) / Option(Mac) + 더블클릭
  shiftDblclick: boolean; // Shift + 더블클릭
  contextMenu: boolean;
}

let triggerConfig: TriggerConfig = {
  altDblclick: false,   // Alt/Option + 더블클릭 = 번역
  shiftDblclick: true,  // Shift + 더블클릭 = 번역 (기본)
  contextMenu: true,
};


/**
 * 트리거 설정 로드
 */
async function loadTriggerConfig(): Promise<void> {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'TRIGGER_LOAD_CONFIG' });
    if (response.success && response.config) {
      triggerConfig = response.config;
      console.log('[EngEagle] Trigger config loaded:', triggerConfig);
    }
  } catch (error) {
    console.error('[EngEagle] Failed to load trigger config:', error);
  }
}

/**
 * 번역 실행 (저장은 팝업의 버튼으로)
 */
async function performTranslation(word: string, range: Range): Promise<void> {
  const startTime = performance.now();

  // 로딩 표시
  showLoadingPopup(range);

  try {
    // 백그라운드에 조회 요청 (저장하지 않음)
    const response = await chrome.runtime.sendMessage({
      type: 'LOOKUP',
      word: word,
      sourceUrl: window.location.href,
      saveToVocabulary: false,
    });

    const elapsed = performance.now() - startTime;
    console.log(`[EngEagle] Lookup completed in ${elapsed.toFixed(1)}ms`);

    if (response.success && response.entry) {
      showResultPopup(range, response.entry);
    } else {
      showErrorPopup(range, '사전에 없는 단어입니다');
    }
  } catch (error) {
    console.error('[EngEagle] Lookup error:', error);
    showErrorPopup(range, '조회 중 오류가 발생했습니다');
  }
}

/**
 * 더블클릭 핸들러
 */
async function handleDoubleClick(e: MouseEvent): Promise<void> {
  // 입력 필드 내부에서는 무시
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    return;
  }

  // 수정키 체크 (Alt/Option, Shift)
  let shouldTranslate = false;

  if (e.altKey && triggerConfig.altDblclick) {
    shouldTranslate = true;
  } else if (e.shiftKey && triggerConfig.shiftDblclick) {
    shouldTranslate = true;
  }

  if (!shouldTranslate) return;

  // 선택된 단어 확인
  const selected = getSelectedWord();
  if (!selected) {
    return;
  }

  await performTranslation(selected.word, selected.range);
}


/**
 * ESC 키 핸들러
 */
function handleKeyDown(e: KeyboardEvent): void {
  if (e.key === 'Escape' && currentPopup) {
    hidePopup();
    document.removeEventListener('click', handleOutsideClick);
  }
}

/**
 * 백그라운드 메시지 수신 (컨텍스트 메뉴, 설정 변경)
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SHOW_TRANSLATION') {
    // 컨텍스트 메뉴에서 번역 요청
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      if (message.result && message.result.found && message.result.entry) {
        showResultPopup(range, message.result.entry);
        showToast('Saved to Vocabulary');
      } else {
        showErrorPopup(range, '사전에 없는 단어입니다');
      }
    }
    sendResponse({ success: true });
  } else if (message.type === 'TRIGGER_CONFIG_CHANGED') {
    // 트리거 설정 변경
    triggerConfig = message.config;
    console.log('[EngEagle] Trigger config updated:', triggerConfig);
    sendResponse({ success: true });
  }
  return true;
});

// 이벤트 리스너 등록
document.addEventListener('dblclick', handleDoubleClick);
document.addEventListener('keydown', handleKeyDown);

// 초기화
loadTriggerConfig();
console.log('[EngEagle] Content script loaded');

