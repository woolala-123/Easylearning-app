/**
 * IELTS Cat Vocab App - v3.2 Final Fix
 * 修复：解决 Unexpected end of input (代码截断) 问题
 * 功能：自动朗读、防卡死、搜索、手机打字
 */

// =======================
// 1. 初始化变量
// =======================
let vocabList = [];
let currentIndex = 0;

// 音效
const sfxClick = new Audio('sounds/type.mp3');
const sfxSuccess = new Audio('sounds/success.mp3');
const sfxError = new Audio('sounds/error.mp3');
sfxClick.volume = 0.5; sfxSuccess.volume = 0.6; sfxError.volume = 0.3;

// =======================
// 2. 获取元素
// =======================
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

const wordEl = document.querySelector('.word');
const phoneticEl = document.querySelector('.phonetic');
const defEl = document.querySelector('.definition');
const defTextEl = defEl ? defEl.querySelector('p') : null;
const exampleEl = defEl ? defEl.querySelector('.example') : null;

const btnReveal = document.getElementById('btn-reveal');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio');
const btnSave = document.getElementById('btn-save');
const btnBack = document.getElementById('btn-back');

const navNotebook = document.getElementById('nav-notebook');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

const notebookListEl = document.getElementById('notebook-list');
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const searchInput = document.getElementById('search-input');
const btnBackFromLib = document.getElementById('btn-back-from-lib');
const btnBackFromTyping = document.getElementById('btn-back-from-typing');

const targetWordDisplay = document.getElementById('target-word-display');
const typingTranslation = document.getElementById('typing-translation');
const typingWpm = document.getElementById('typing-wpm');
const typingProgress = document.getElementById('typing-progress');
const mobileInput = document.getElementById('mobile-input');

const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalWord = document.getElementById('modal-word');
const modalPhonetic = document.getElementById('modal-phonetic');
const modalDef = document.getElementById('modal-def');
const modalExample = document.getElementById('modal-example');
const btnModalAudio = document.getElementById('btn-modal-audio');

// =======================
// 3. 核心功能
// =======================

async function initApp() {
    try {
        const response = await fetch('words.json');
        if (!response.ok) throw new Error('Data Load Error');
        vocabList = await response.json();
        vocabList = shuffleArray(vocabList);
        console.log(`Loaded ${vocabList.length} words`);
        
        // 初始化时不自动朗读，防止被浏览器拦截
        loadWord(currentIndex, false); 
    } catch (error) {
        console.error(error);
        if(wordEl) wordEl.textContent = "Data Error 😿";
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function playSound(audioObj) {
    try {
        const clone = audioObj.cloneNode();
        clone.volume = audioObj.volume;
        clone.play().catch(() => {});
    } catch(e) {}
}

function switchView(viewName) {
    if(cardContainer) cardContainer.style.display = 'none';
    if(notebookView) notebookView.classList.add('hidden');
    if(libraryView) libraryView.classList.add('hidden');
    if(typingView) typingView.classList.add('hidden');
    document.removeEventListener('keydown', handleDesktopTyping);

    if (viewName === 'card') {
        if(cardContainer) cardContainer.style.display = 'flex';
    } else if (viewName === 'notebook') {
        if(notebookView) notebookView.classList.remove('hidden');
        renderNotebook();
    } else if (viewName === 'library') {
        if(libraryView) libraryView.classList.remove('hidden');
        if(searchInput) searchInput.value = '';
        renderLibrary();
    } else if (viewName === 'typing') {
        if(typingView) typingView.classList.remove('hidden');
        document.addEventListener('keydown', handleDesktopTyping);
        if(mobileInput) { mobileInput.value = ''; mobileInput.focus(); }
    }
}

function loadWord(index, autoSpeak = true) {
    if (!vocabList.length) return;
    if (index >= vocabList.length) index = 0;
    
    const data = vocabList[index];
    
    if(wordEl) wordEl.textContent = data.word;
    if(phoneticEl) phoneticEl.textContent = data.phonetic;
    if(defTextEl) defTextEl.textContent = data.definition;
    if(exampleEl) exampleEl.textContent = data.example;
    if(defEl) defEl.classList.add('hidden'); 

    if (autoSpeak) speakWord(data.word);
}

function speakWord(text) {
    const content = text || (wordEl ? wordEl.textContent : "") || "";
    if (!content) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // 强制打断，防止卡死

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'en-US'; 
    utterance.rate = 1.0;

    window.speechSynthesis.speak(utterance);
}

function saveToNotebook() {
    if (!vocabList.length) return;
    const currentWord = vocabList[currentIndex];
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    if (!myNotebook.some(item => item.word === currentWord.word)) {
        myNotebook.push(currentWord);
        localStorage.setItem('myCatNotebook', JSON.stringify(myNotebook));
        alert(`Saved: ${currentWord.word}`);
    } else { alert("Already saved!"); }
}

function renderNotebook() {
    if(!notebookListEl) return;
    const myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    notebookListEl.innerHTML = '';
    myNotebook.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${item.word}</strong> <br> <span style="font-size:0.9em;color:#666;">${item.definition}</span>`;
        notebookListEl.appendChild(li);
    });
}

function renderLibrary(filterText = "") {
    if(!fullVocabListEl) return;
    const filtered = vocabList.filter(item => 
        item.word.toLowerCase().includes(filterText.toLowerCase()) || 
        item.definition.includes(filterText)
    );
    if(libCountEl) libCountEl.textContent = `(${filtered.length})`;
    fullVocabListEl.innerHTML = '';
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'vocab-card-small';
        div.innerHTML = `<strong>${item.word}</strong><span>${item.definition}</span>`;
        div.addEventListener('click', () => openModal(item));
        fullVocabListEl.appendChild(div);
    });
}

function openModal(data) {
    if(!modalOverlay) return;
    if(modalWord) modalWord.textContent = data.word;
    if(modalPhonetic) modalPhonetic.textContent = data.phonetic;
    if(modalDef) modalDef.textContent = data.definition;
    if(modalExample) modalExample.textContent = data.example;
    if(btnModalAudio) btnModalAudio.onclick = () => speakWord(data.word);
    modalOverlay.classList.remove('hidden');
}

// 打字练习逻辑
let typingIndex = 0; let currentInput = ""; let startTime = 0; let charCount = 0;
function startTypingMode() { switchView('typing'); typingIndex=0; charCount=0; startTime=Date.now(); loadTypingWord(); }
function loadTypingWord() {
    if (!vocabList.length) return;
    if (typingIndex >= vocabList.length) { typingIndex = 0; alert("Round Done!"); }
    const targetWord = vocabList[typingIndex].word;
    currentInput = ""; if(mobileInput) mobileInput.value = "";
    if(typingProgress) typingProgress.textContent = `${typingIndex+1}/${vocabList.length}`;
    if(typingTranslation) typingTranslation.textContent = vocabList[typingIndex].definition;
    renderTypingWord(targetWord, "");
}
function renderTypingWord(word, input) {
    if(!targetWordDisplay) return;
    targetWordDisplay.innerHTML = '';
    word.split('').forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        if (index < input.length) span.className = 'char-correct';
        else if (index === input.length) span.className = 'char-current';
        targetWordDisplay.appendChild(span);
    });
}
function processTypingInput(key) {
    if (!vocabList.length) return;
    const targetWord = vocabList[typingIndex].word;
    if (key === 'Backspace') {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1); playSound(sfxClick); renderTypingWord(targetWord, currentInput);
        } return;
    }
    if (currentInput.length >= targetWord.length) return;
    if (key.toLowerCase() === targetWord[currentInput.length].toLowerCase()) {
        currentInput += targetWord[currentInput.length]; charCount++; playSound(sfxClick); renderTypingWord(targetWord, currentInput);
        const wpm = Math.round((charCount/5)/((Date.now()-startTime)/60000||1));
        if(typingWpm) typingWpm.textContent = wpm;
        if (currentInput === targetWord) {
            playSound(sfxSuccess); speakWord(targetWord);
            setTimeout(() => { typingIndex++; loadTypingWord(); }, 300);
        }
    } else { playSound(sfxError); }
}
function handleDesktopTyping(e) { if(e.key.length===1||e.key==='Backspace') if(!e.ctrlKey&&!e.metaKey) processTypingInput(e.key); }

// =======================
// 4. 事件绑定
// =======================

if(btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));

// 点击下一个：触发自动朗读
if(btnNext) btnNext.addEventListener('click', () => {
    currentIndex++;
    if(currentIndex >= vocabList.length) currentIndex=0;
    loadWord(currentIndex, true);
});

if(btnAudio) btnAudio.addEventListener('click', () => speakWord(null));
if(btnSave) btnSave.addEventListener('click', saveToNotebook);
if(navNotebook) navNotebook.addEventListener('click', () => switchView('notebook'));
if(navLibrary) navLibrary.addEventListener('click', () => switchView('library'));
if(navTyping) navTyping.addEventListener('click', () => startTypingMode());
if(btnBack) btnBack.addEventListener('click', () => switchView('card'));
if(btnBackFromLib) btnBackFromLib.addEventListener('click', () => switchView('card'));
if(btnBackFromTyping) btnBackFromTyping.addEventListener('click', () => switchView('card'));
if(searchInput) searchInput.addEventListener('input', (e) => renderLibrary(e.target.value.trim()));
if(mobileInput) mobileInput.addEventListener('input', (e) => {
    if (e.inputType === 'deleteContentBackward') processTypingInput('Backspace');
    else if (e.data) processTypingInput(e.data.slice(-1));
});
if(typingView) typingView.addEventListener('click', () => { if(mobileInput) mobileInput.focus(); });
if(btnCloseModal) btnCloseModal.addEventListener('click', () => modalOverlay.classList.add('hidden'));
if(modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

initApp(); // <--- 看到这行才算结束！
