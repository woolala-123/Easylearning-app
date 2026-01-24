/**
 * IELTS Cat Vocab App - v3.0 Final Integration
 * 功能：卡片、生词本、搜索、洗牌、拼写练习(手机适配)、音效
 */

// =======================
// 1. 初始化变量与配置
// =======================
let vocabList = [];
let currentIndex = 0;

// 音效对象 (确保你的 sounds 文件夹里有这些文件)
// 如果没有文件，代码会自动忽略，不会报错
const sfxClick = new Audio('sounds/type.mp3');
const sfxSuccess = new Audio('sounds/success.mp3');
const sfxError = new Audio('sounds/error.mp3');
sfxClick.volume = 0.5; sfxSuccess.volume = 0.6; sfxError.volume = 0.3;

// =======================
// 2. 获取页面元素
// =======================
// 视图容器
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

// 导航链接
const navNotebook = document.getElementById('nav-notebook');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

// 卡片元素
const wordEl = document.querySelector('.word');
const phoneticEl = document.querySelector('.phonetic');
const defEl = document.querySelector('.definition');
const defTextEl = defEl ? defEl.querySelector('p') : null;
const exampleEl = defEl ? defEl.querySelector('.example') : null;

// 按钮
const btnReveal = document.getElementById('btn-reveal');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio');
const btnSave = document.getElementById('btn-save');
const btnBack = document.getElementById('btn-back');
const btnBackFromLib = document.getElementById('btn-back-from-lib');
const btnBackFromTyping = document.getElementById('btn-back-from-typing');

// 列表与搜索
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const searchInput = document.getElementById('search-input');
const notebookListEl = document.getElementById('notebook-list');

// 拼写练习元素
const targetWordDisplay = document.getElementById('target-word-display');
const typingTranslation = document.getElementById('typing-translation');
const typingWpm = document.getElementById('typing-wpm');
const typingProgress = document.getElementById('typing-progress');
const mobileInput = document.getElementById('mobile-input');

// 弹窗元素
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

// A. 启动应用
async function initApp() {
    try {
        const response = await fetch('words.json');
        if (!response.ok) throw new Error('Cannot load words.json');
        vocabList = await response.json();
        
        // 自动洗牌
        vocabList = shuffleArray(vocabList);
        
        console.log(`Loaded ${vocabList.length} words.`);
        loadWord(currentIndex);
    } catch (error) {
        console.error(error);
        if(wordEl) wordEl.textContent = "Data Error 😿";
    }
}

// B. 洗牌算法
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// C. 播放音效 (防报错版)
function playSound(audioObj) {
    try {
        const clone = audioObj.cloneNode();
        clone.volume = audioObj.volume;
        clone.play().catch(() => {});
    } catch(e) {}
}

// D. 视图切换
function switchView(viewName) {
    // 隐藏所有
    if(cardContainer) cardContainer.style.display = 'none';
    if(notebookView) notebookView.classList.add('hidden');
    if(libraryView) libraryView.classList.add('hidden');
    if(typingView) typingView.classList.add('hidden');
    
    // 移除键盘监听
    document.removeEventListener('keydown', handleDesktopTyping);

    // 显示目标
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

// E. 卡片模式逻辑
function loadWord(index) {
    if (!vocabList.length) return;
    if (index >= vocabList.length) index = 0;
    const data = vocabList[index];
    
    if(wordEl) wordEl.textContent = data.word;
    if(phoneticEl) phoneticEl.textContent = data.phonetic;
    if(defTextEl) defTextEl.textContent = data.definition;
    if(exampleEl) exampleEl.textContent = data.example;
    if(defEl) defEl.classList.add('hidden');
}

function speakWord(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text || (wordEl ? wordEl.textContent : ""));
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    }
}

function saveToNotebook() {
    if (!vocabList.length) return;
    const currentWord = vocabList[currentIndex];
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    
    if (!myNotebook.some(item => item.word === currentWord.word)) {
        myNotebook.push(currentWord);
        localStorage.setItem('myCatNotebook', JSON.stringify(myNotebook));
        alert(`已保存：${currentWord.word}`);
    } else {
        alert("已经在生词本里啦！");
    }
}

// F. 生词本渲染
function renderNotebook() {
    if(!notebookListEl) return;
    const myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    notebookListEl.innerHTML = '';
    
    if (myNotebook.length === 0) {
        notebookListEl.innerHTML = '<li>暂无生词，快去添加吧！</li>';
    } else {
        myNotebook.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.word}</strong> <br> <span style="font-size:0.9em;color:#666;">${item.definition}</span>`;
            notebookListEl.appendChild(li);
        });
    }
}

// G. 单词库与搜索
function renderLibrary(filterText = "") {
    if(!fullVocabListEl) return;
    const filtered = vocabList.filter(item => 
        item.word.toLowerCase().includes(filterText.toLowerCase()) || 
        item.definition.includes(filterText)
    );
    
    if(libCountEl) libCountEl.textContent = `(${filtered.length})`;
    fullVocabListEl.innerHTML = '';
    
    if (filtered.length === 0) {
        fullVocabListEl.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#999;">无匹配结果</p>';
    } else {
        filtered.forEach(item => {
            const div = document.createElement('div');
            div.className = 'vocab-card-small';
            div.innerHTML = `<strong>${item.word}</strong><span>${item.definition}</span>`;
            div.addEventListener('click', () => openModal(item));
            fullVocabListEl.appendChild(div);
        });
    }
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

// H. 拼写练习逻辑
let typingIndex = 0;
let currentInput = "";
let startTime = 0;
let charCount = 0;

function startTypingMode() {
    switchView('typing');
    typingIndex = 0; charCount = 0; startTime = Date.now();
    loadTypingWord();
}

function loadTypingWord() {
    if (!vocabList.length) return;
    if (typingIndex >= vocabList.length) { typingIndex = 0; alert("本轮练习结束！🎉"); }
    
    const targetWord = vocabList[typingIndex].word;
    currentInput = "";
    if(mobileInput) mobileInput.value = "";
    
    if(typingProgress) typingProgress.textContent = `${typingIndex + 1}/${vocabList.length}`;
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
            currentInput = currentInput.slice(0, -1);
            playSound(sfxClick);
            renderTypingWord(targetWord, currentInput);
        }
        return;
    }

    if (currentInput.length >= targetWord.length) return;
    
    // 比对字符 (忽略大小写)
    if (key.toLowerCase() === targetWord[currentInput.length].toLowerCase()) {
        currentInput += targetWord[currentInput.length];
        charCount++;
        playSound(sfxClick);
        renderTypingWord(targetWord, currentInput);
        
        // WPM 计算
        const min = (Date.now() - startTime) / 60000;
        const wpm = Math.round((charCount / 5) / (min || 1));
        if(typingWpm) typingWpm.textContent = wpm;

        // 完成单词
        if (currentInput === targetWord) {
            playSound(sfxSuccess);
            speakWord(targetWord);
            setTimeout(() => { typingIndex++; loadTypingWord(); }, 300);
        }
    } else {
        playSound(sfxError);
    }
}

function handleDesktopTyping(e) {
    if (e.key.length === 1 || e.key === 'Backspace') {
        if (!e.ctrlKey && !e.metaKey) processTypingInput(e.key);
    }
}

// =======================
// 4. 事件监听绑定
// =======================

// 卡片
if(btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));
if(btnNext) btnNext.addEventListener('click', () => {
    currentIndex++; if(currentIndex>=vocabList.length) currentIndex=0; loadWord(currentIndex);
});
if(btnAudio) btnAudio.addEventListener('click', () => speakWord(null));
if(btnSave) btnSave.addEventListener('click', saveToNotebook);

// 导航
if(navNotebook) navNotebook.addEventListener('click', () => switchView('notebook'));
if(navLibrary) navLibrary.addEventListener('click', () => switchView('library'));
if(navTyping) navTyping.addEventListener('click', () => startTypingMode());

// 返回按钮
if(btnBack) btnBack.addEventListener('click', () => switchView('card'));
if(btnBackFromLib) btnBackFromLib.addEventListener('click', () => switchView('card'));
if(btnBackFromTyping) btnBackFromTyping.addEventListener('click', () => switchView('card'));

// 搜索框
if(searchInput) searchInput.addEventListener('input', (e) => renderLibrary(e.target.value.trim()));

// 手机输入适配
if(mobileInput) {
    mobileInput.addEventListener('input', (e) => {
        if (e.inputType === 'deleteContentBackward') processTypingInput('Backspace');
        else if (e.data) processTypingInput(e.data.slice(-1));
    });
}
if(typingView) typingView.addEventListener('click', () => { if(mobileInput) mobileInput.focus(); });

// 弹窗关闭
if(btnCloseModal) btnCloseModal.addEventListener('click', () => modalOverlay.classList.add('hidden'));
if(modalOverlay) modalOverlay.addEventListener('click', (e) => { 
    if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); 
});

// 启动
initApp();
