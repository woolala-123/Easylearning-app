/**
 * IELTS Cat Vocab App - v3.1 Auto-Speak Fix
 * 修复点：移除 setTimeout 以符合浏览器自动播放策略；在 loadWord 中集成自动朗读。
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
const btnNext = document.getElementById('btn-next'); // 关键按钮
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
        
        // 注意：初始化加载时，通常不自动朗读，因为浏览器会拦截
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

// === 核心修改：loadWord 增加 autoSpeak 参数 ===
function loadWord(index, autoSpeak = true) {
    if (!vocabList.length) return;
    if (index >= vocabList.length) index = 0;
    
    const data = vocabList[index];
    
    if(wordEl) wordEl.textContent = data.word;
    if(phoneticEl) phoneticEl.textContent = data.phonetic;
    if(defTextEl) defTextEl.textContent = data.definition;
    if(exampleEl) exampleEl.textContent = data.example;
    if(defEl) defEl.classList.add('hidden'); 

    // 自动朗读逻辑
    if (autoSpeak) {
        speakWord(data.word);
    }
}

// === 核心修改：speakWord 去掉延迟，直接播放 ===
function speakWord(text) {
    const content = text || (wordEl ? wordEl.textContent : "") || "";
    if (!content) return;

    if (!('speechSynthesis' in window)) return;

    // 1. 强制停止之前的
    window.speechSynthesis.cancel();

    // 2. 创建新发音
    const utterance = new SpeechSynthesisUtterance(content);
    utterance.lang = 'en-US'; 
    utterance.rate = 1.0;

    // 3. 直接播放 (去掉了 setTimeout，确保和点击事件同步)
    window.speechSynthesis.speak(utterance);
}

// ... (以下部分保持不变：saveToNotebook, renderNotebook, Library, Typing 等) ...
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

// 打字练习部分
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
