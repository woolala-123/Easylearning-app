// === 1. 变量与配置 ===
let vocabList = []; 
let currentIndex = 0;

// 音效 (请确保 sounds 文件夹和 mp3 文件已上传)
const sfxClick = new Audio('sounds/type.mp3');
const sfxSuccess = new Audio('sounds/success.mp3');
const sfxError = new Audio('sounds/error.mp3');
sfxClick.volume = 0.5; sfxSuccess.volume = 0.6; sfxError.volume = 0.3;

// === 2. 获取元素 ===
// 基础视图元素
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

// 容器
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

// 导航
const notebookLink = document.querySelector('nav ul li:nth-child(3) a'); // 或用 ID
const notebookListEl = document.getElementById('notebook-list');
const btnBack = document.getElementById('btn-back');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

// Library (搜索相关)
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const btnBackFromLib = document.getElementById('btn-back-from-lib');
const searchInput = document.getElementById('search-input'); // 新增

// Modal
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalWord = document.getElementById('modal-word');
const modalPhonetic = document.getElementById('modal-phonetic');
const modalDef = document.getElementById('modal-def');
const modalExample = document.getElementById('modal-example');
const btnModalAudio = document.getElementById('btn-modal-audio');

// Typing (手机适配相关)
const targetWordDisplay = document.getElementById('target-word-display');
const typingTranslation = document.getElementById('typing-translation');
const typingWpm = document.getElementById('typing-wpm');
const typingProgress = document.getElementById('typing-progress');
const btnBackFromTyping = document.getElementById('btn-back-from-typing');
const mobileInput = document.getElementById('mobile-input'); // 新增：手机键盘触发器


// === 3. 初始化与洗牌 ===
async function initApp() {
    try {
        const response = await fetch('words.json'); 
        if (!response.ok) throw new Error('Network Error');
        vocabList = await response.json();
        
        // 自动洗牌 (Shuffle) - 让每次背单词顺序都不一样
        vocabList = shuffleArray(vocabList);
        
        console.log(`Loaded and shuffled ${vocabList.length} words`);
        loadWord(currentIndex);
    } catch (error) {
        console.error(error);
        if(wordEl) wordEl.textContent = "Loading Error 😿";
    }
}

// 辅助函数：Fisher-Yates 洗牌
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 辅助函数：播放音效 (防吞音)
function playSound(audioObj) {
    const clone = audioObj.cloneNode();
    clone.volume = audioObj.volume;
    clone.play().catch(e => {}); // 忽略自动播放限制错误
}

// === 4. 视图控制 ===
function switchView(viewName) {
    // 隐藏所有
    cardContainer.style.display = 'none';
    notebookView.classList.add('hidden');
    libraryView.classList.add('hidden');
    typingView.classList.add('hidden');
    
    // 移除全局键盘监听 (防止冲突)
    document.removeEventListener('keydown', handleDesktopTyping);

    // 显示目标
    if (viewName === 'card') {
        cardContainer.style.display = 'flex';
    } else if (viewName === 'notebook') {
        notebookView.classList.remove('hidden');
    } else if (viewName === 'library') {
        libraryView.classList.remove('hidden');
        if(searchInput) searchInput.value = ''; // 清空搜索框
        showLibrary(); // 重置列表
    } else if (viewName === 'typing') {
        typingView.classList.remove('hidden');
        // PC端监听
        document.addEventListener('keydown', handleDesktopTyping);
        // 手机端：自动聚焦隐藏输入框
        if(mobileInput) {
            mobileInput.value = '';
            mobileInput.focus();
        }
    }
}

// === 5. 卡片模式逻辑 ===
function loadWord(index) {
    if (vocabList.length === 0) return;
    const data = vocabList[index];
    wordEl.textContent = data.word;
    phoneticEl.textContent = data.phonetic;
    defTextEl.textContent = data.definition;
    exampleEl.textContent = data.example;
    defEl.classList.add('hidden'); 
}

function speakWord(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text || wordEl.textContent);
        utterance.lang = 'en-US'; 
        window.speechSynthesis.speak(utterance);
    }
}

function saveToNotebook() {
    if (vocabList.length === 0) return;
    const currentWord = vocabList[currentIndex];
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    if (!myNotebook.some(item => item.word === currentWord.word)) {
        myNotebook.push(currentWord);
        localStorage.setItem('myCatNotebook', JSON.stringify(myNotebook));
        alert(`Saved: ${currentWord.word} 📕`);
    } else {
        alert("Already saved! 🐱");
    }
}

// === 6. 单词库与搜索逻辑 ===
function showLibrary(filterText = "") {
    // 过滤
    const filteredList = vocabList.filter(item => 
        item.word.toLowerCase().includes(filterText.toLowerCase()) || 
        item.definition.includes(filterText)
    );

    libCountEl.textContent = `(${filteredList.length} / ${vocabList.length})`;
    fullVocabListEl.innerHTML = '';

    if (filteredList.length === 0) {
        fullVocabListEl.innerHTML = '<p style="color:#999; grid-column:1/-1; text-align:center;">No match found 😿</p>';
    } else {
        filteredList.forEach(item => {
            const div = document.createElement('div');
            div.className = 'vocab-card-small';
            div.innerHTML = `<strong>${item.word}</strong><span>${item.definition}</span>`;
            div.addEventListener('click', () => openModal(item));
            fullVocabListEl.appendChild(div);
        });
    }
}

function openModal(data) {
    modalWord.textContent = data.word;
    modalPhonetic.textContent = data.phonetic;
    modalDef.textContent = data.definition;
    modalExample.textContent = data.example;
    btnModalAudio.onclick = () => speakWord(data.word);
    modalOverlay.classList.remove('hidden');
}


// === 7. 打字练习逻辑 (QWERTY) ===
let typingIndex = 0;
let currentInput = "";
let startTime = 0;
let charCount = 0;

function startTypingMode() {
    switchView('typing');
    typingIndex = 0;
    charCount = 0;
    startTime = Date.now();
    loadTypingWord();
}

function loadTypingWord() {
    if (vocabList.length === 0) return;
    if (typingIndex >= vocabList.length) {
        typingIndex = 0;
        alert("Round Complete! 🎉");
    }
    const targetWord = vocabList[typingIndex].word;
    currentInput = "";
    if(mobileInput) mobileInput.value = ""; // 清空手机输入框
    
    typingProgress.textContent = `${typingIndex + 1}/${vocabList.length}`;
    typingTranslation.textContent = vocabList[typingIndex].definition;
    renderTypingWord(targetWord, "");
}

function renderTypingWord(word, input) {
    targetWordDisplay.innerHTML = '';
    const chars = word.split('');
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        if (index < input.length) {
            span.className = 'char-correct';
        } else if (index === input.length) {
            span.className = 'char-current';
        }
        targetWordDisplay.appendChild(span);
    });
}

// 通用输入处理 (逻辑核心)
function processTypingInput(key) {
    if (vocabList.length === 0) return;
    const targetWord = vocabList[typingIndex].word;

    // 退格
    if (key === 'Backspace') {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            playSound(sfxClick);
            renderTypingWord(targetWord, currentInput);
        }
        return;
    }

    // 校验长度
    if (currentInput.length >= targetWord.length) return;
    
    const charToMatch = targetWord[currentInput.length];
    
    // 忽略大小写比对
    if (key.toLowerCase() === charToMatch.toLowerCase()) {
        currentInput += charToMatch; // 使用正确的大小写补全
        charCount++;
        playSound(sfxClick);
        renderTypingWord(targetWord, currentInput);
        
        // 计算 WPM
        const minutes = (Date.now() - startTime) / 60000;
        const wpm = Math.round((charCount / 5) / (minutes || 1));
        typingWpm.textContent = `${wpm} WPM`;

        // 单词完成
        if (currentInput === targetWord) {
            playSound(sfxSuccess);
            speakWord(targetWord);
            setTimeout(() => {
                typingIndex++;
                loadTypingWord();
            }, 300);
        }
    } else {
        playSound(sfxError);
        // 错误反馈
        const activeChar = document.querySelector('.char-current');
        if(activeChar) {
            activeChar.style.color = 'red';
            setTimeout(() => activeChar.style.color = '', 200);
        }
    }
}

// PC端监听
function handleDesktopTyping(e) {
    // 忽略非单字符键 (Shift, Ctrl等)，但允许 Backspace
    if (e.key.length === 1 || e.key === 'Backspace') {
        processTypingInput(e.key);
    }
}

// 手机端监听 (隐藏输入框)
if (mobileInput) {
    mobileInput.addEventListener('input', (e) => {
        // e.data 是用户输入的字符（如果是退格，data是null）
        if (e.inputType === 'deleteContentBackward') {
            processTypingInput('Backspace');
        } else if (e.data) {
            // 获取最后一个输入的字符
            const char = e.data.slice(-1);
            processTypingInput(char);
        }
        // 保持输入框为空，防止字符堆积
        // 注意：有些安卓输入法如果清空太快会有问题，这里是一个简化方案
        // mobileInput.value = " "; // 这是一个 hack，视情况调整
    });
}

// 点击打字区域聚焦手机键盘
if(typingView) {
    typingView.addEventListener('click', () => {
        if(mobileInput) mobileInput.focus();
    });
}


// === 8. 全局事件绑定 ===
if (btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));
if (btnNext) btnNext.addEventListener('click', () => {
    currentIndex++;
    if(currentIndex >= vocabList.length) currentIndex=0;
    loadWord(currentIndex);
});
if (btnAudio) btnAudio.addEventListener('click', () => speakWord(null));
if (btnSave) btnSave.addEventListener('click', saveToNotebook);

if (notebookLink) notebookLink.addEventListener('click', (e) => { e.preventDefault(); showNotebook(); }); // 生词本
if (btnBack) btnBack.addEventListener('click', () => switchView('card'));

// 单词库与搜索
if (navLibrary) navLibrary.addEventListener('click', (e) => { e.preventDefault(); showLibrary(); });
if (btnBackFromLib) btnBackFromLib.addEventListener('click', () => switchView('card'));
if (searchInput) searchInput.addEventListener('input', (e) => showLibrary(e.target.value.trim()));

// 打字练习
if (navTyping) navTyping.addEventListener('click', (e) => { e.preventDefault(); startTypingMode(); });
if (btnBackFromTyping) btnBackFromTyping.addEventListener('click', () => switchView('card'));

// Modal
if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalOverlay.classList.add('hidden'));
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

// 生词本逻辑
function showNotebook() {
    switchView('notebook');
    const myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    notebookListEl.innerHTML = '';
    if (myNotebook.length === 0) {
        notebookListEl.innerHTML = '<li>还没有生词哦，快去添加吧！🐾</li>';
    } else {
        myNotebook.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.word}</strong> <br> <span style="font-size:0.9em;color:#666;">${item.definition}</span>`;
            notebookListEl.appendChild(li);
        });
    }
}

initApp();
