// === 1. 变量准备 ===
let vocabList = []; 
let currentIndex = 0;

// === 音效准备 (Sound Effects) ===
// 使用在线音效资源，你也可以换成自己本地的 mp3
// 机械键盘敲击声
const sfxClick = new Audio('sounds/public_sounds_click.wav');
// 单词完成的提示音 (清脆的叮一声)
const sfxSuccess = new Audio('https://public_sounds_correct.wav'); 
// 错误音效 (低沉的嘟声)
const sfxError = new Audio('public_sounds_beep.wav'); 

// 预加载，防止第一次打字延迟
sfxClick.volume = 0.5; // 音量调小一点，不刺耳
sfxSuccess.volume = 0.6;
sfxError.volume = 0.3;

// === 2. 获取页面元素 ===
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

// 视图容器
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

// 导航
const notebookLink = document.querySelector('nav ul li:nth-child(3) a');
const notebookListEl = document.getElementById('notebook-list');
const btnBack = document.getElementById('btn-back');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

// Library 元素
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const btnBackFromLib = document.getElementById('btn-back-from-lib');

// Modal 元素
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalWord = document.getElementById('modal-word');
const modalPhonetic = document.getElementById('modal-phonetic');
const modalDef = document.getElementById('modal-def');
const modalExample = document.getElementById('modal-example');
const btnModalAudio = document.getElementById('btn-modal-audio');

// Typing 元素
const targetWordDisplay = document.getElementById('target-word-display');
const typingTranslation = document.getElementById('typing-translation');
const typingWpm = document.getElementById('typing-wpm');
const typingProgress = document.getElementById('typing-progress');
const btnBackFromTyping = document.getElementById('btn-back-from-typing');


// === 3. 初始化 ===
async function initApp() {
    try {
        console.log("加载数据...");
        const response = await fetch('words.json'); 
        if (!response.ok) throw new Error('网络异常');
        vocabList = await response.json();
        console.log(`Loaded ${vocabList.length} words`);
        loadWord(currentIndex);
    } catch (error) {
        console.error(error);
        if(wordEl) wordEl.textContent = "Data Load Error 😿";
    }
}


// === 4. 核心功能：音效播放器 ===
// 关键函数：解决快速打字吞音问题
function playSound(audioObj) {
    // 克隆一个音频节点，这样可以重叠播放（并发播放）
    const clone = audioObj.cloneNode();
    clone.volume = audioObj.volume;
    clone.play().catch(e => console.log("交互前无法自动播放音效"));
}


// === 5. 功能函数：卡片模式 ===
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
        alert(`已加入生词本：${currentWord.word} 📕`);
    } else {
        alert("已存在 🐱");
    }
}

// 视图切换
function switchView(viewName) {
    cardContainer.style.display = 'none'; 
    if(cardContainer.classList.contains('hidden')) cardContainer.classList.remove('hidden'); 
    cardContainer.style.display = 'none'; 
    
    notebookView.classList.add('hidden');
    libraryView.classList.add('hidden');
    typingView.classList.add('hidden');
    
    document.removeEventListener('keydown', handleTypingInput);

    if (viewName === 'card') {
        cardContainer.style.display = 'flex';
    } else if (viewName === 'notebook') {
        notebookView.classList.remove('hidden');
    } else if (viewName === 'library') {
        libraryView.classList.remove('hidden');
    } else if (viewName === 'typing') {
        typingView.classList.remove('hidden');
        document.addEventListener('keydown', handleTypingInput);
    }
}

// === 6. 功能函数：打字练习 (Typing Mode) ===
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
        alert("一轮练习完成！🎉"); // 可以在这里加个大大的庆祝音效
    }

    const targetWord = vocabList[typingIndex].word;
    currentInput = ""; 
    
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
        } else {
            span.className = ''; 
        }
        
        targetWordDisplay.appendChild(span);
    });
}

function handleTypingInput(e) {
    if (vocabList.length === 0) return;
    const targetWord = vocabList[typingIndex].word;

    // 1. 处理退格键 (Backspace)
    if (e.key === 'Backspace') {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            // 播放一个轻轻的退格音（可选，这里用 click 代替）
            playSound(sfxClick); 
            renderTypingWord(targetWord, currentInput);
        }
        return;
    }

    // 2. 忽略非字符键
    if (e.key.length !== 1) return;

    // 3. 核心校验
    const nextCharIndex = currentInput.length;
    if (nextCharIndex >= targetWord.length) return; 

    const charToMatch = targetWord[nextCharIndex];
    
    // 不区分大小写
    if (e.key.toLowerCase() === charToMatch.toLowerCase()) {
        // === A. 输入正确 ===
        currentInput += charToMatch; 
        charCount++;
        
        // 🎵 播放打字音！
        playSound(sfxClick);
        
        renderTypingWord(targetWord, currentInput);
        
        // 计算 WPM
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const wpm = Math.round((charCount / 5) / (elapsedMinutes || 1)); 
        typingWpm.textContent = `${wpm} WPM`;

        // 检查是否完成
        if (currentInput === targetWord) {
            // 🎵 播放完成音！
            playSound(sfxSuccess);
            
            // 读出单词
            speakWord(targetWord);
            
            setTimeout(() => {
                typingIndex++;
                loadTypingWord();
            }, 300);
        }
    } else {
        // === B. 输入错误 ===
        // 🎵 播放错误音！
        playSound(sfxError);
        
        // 可以在这里给界面加一个抖动效果 (shake)
        const activeChar = document.querySelector('.char-current');
        if(activeChar) {
            activeChar.style.color = 'red';
            setTimeout(() => activeChar.style.color = '', 200);
        }
    }
}


// === 7. 事件绑定 ===
if (btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));
if (btnNext) btnNext.addEventListener('click', () => {
    currentIndex++;
    if(currentIndex >= vocabList.length) currentIndex=0;
    loadWord(currentIndex);
});
if (btnAudio) btnAudio.addEventListener('click', () => speakWord(null));
if (btnSave) btnSave.addEventListener('click', saveToNotebook);

if (notebookLink) notebookLink.addEventListener('click', (e) => { e.preventDefault(); showNotebook(); });
if (navLibrary) navLibrary.addEventListener('click', (e) => { e.preventDefault(); showLibrary(); });
if (navTyping) navTyping.addEventListener('click', (e) => { e.preventDefault(); startTypingMode(); });

if (btnBack) btnBack.addEventListener('click', () => switchView('card'));
if (btnBackFromLib) btnBackFromLib.addEventListener('click', () => switchView('card'));
if (btnBackFromTyping) btnBackFromTyping.addEventListener('click', () => switchView('card'));

if (btnCloseModal) btnCloseModal.addEventListener('click', () => modalOverlay.classList.add('hidden'));
if (modalOverlay) modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) modalOverlay.classList.add('hidden'); });

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

function showLibrary() {
    switchView('library');
    libCountEl.textContent = `(${vocabList.length} words)`;
    fullVocabListEl.innerHTML = '';
    vocabList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'vocab-card-small';
        div.innerHTML = `<strong>${item.word}</strong><span>${item.definition}</span>`;
        div.addEventListener('click', () => openModal(item));
        fullVocabListEl.appendChild(div);
    });
}

function openModal(data) {
    modalWord.textContent = data.word;
    modalPhonetic.textContent = data.phonetic;
    modalDef.textContent = data.definition;
    modalExample.textContent = data.example;
    btnModalAudio.onclick = () => speakWord(data.word);
    modalOverlay.classList.remove('hidden');
}

initApp();

