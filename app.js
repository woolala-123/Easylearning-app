/**
 * IELTS Cat Vocab App - v2.2 Stable
 * 包含：洗牌算法、搜索功能、手机打字适配、本地音效、防崩溃保护
 */

// =========================================
// 1. 全局变量与配置
// =========================================
let vocabList = []; 
let currentIndex = 0;

// 音效对象 (请确保你的 sounds 文件夹里有这些文件)
// 如果没有文件，代码会自动忽略错误，不会崩
const sfxClick = new Audio('sounds/type.mp3');
const sfxSuccess = new Audio('sounds/success.mp3');
const sfxError = new Audio('sounds/error.mp3');

// 预设音量
sfxClick.volume = 0.5; 
sfxSuccess.volume = 0.6; 
sfxError.volume = 0.3;


// =========================================
// 2. 获取页面元素 (Safe Selectors)
// =========================================

// --- 卡片视图元素 ---
const wordEl = document.querySelector('.word');
const phoneticEl = document.querySelector('.phonetic');
const defEl = document.querySelector('.definition');
const defTextEl = defEl ? defEl.querySelector('p') : null;
const exampleEl = defEl ? defEl.querySelector('.example') : null;

// --- 按钮 ---
const btnReveal = document.getElementById('btn-reveal');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio');
const btnSave = document.getElementById('btn-save');
const btnBack = document.getElementById('btn-back');

// --- 视图容器 ---
const cardContainer = document.querySelector('.card-container'); // 注意：这是一个类名
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

// --- 导航栏 (兼容多种写法) ---
// 尝试获取“生词本”链接，支持 ID 或位置选择
const navNotebook = document.getElementById('nav-notebook') || document.querySelector('nav ul li:nth-child(3) a');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

// --- 列表与搜索 (Library & Notebook) ---
const notebookListEl = document.getElementById('notebook-list');
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const btnBackFromLib = document.getElementById('btn-back-from-lib');
const searchInput = document.getElementById('search-input');

// --- 打字练习 (Typing) ---
const targetWordDisplay = document.getElementById('target-word-display');
const typingTranslation = document.getElementById('typing-translation');
const typingWpm = document.getElementById('typing-wpm');
const typingProgress = document.getElementById('typing-progress');
const btnBackFromTyping = document.getElementById('btn-back-from-typing');
const mobileInput = document.getElementById('mobile-input'); // 手机键盘触发器

// --- 弹窗 (Modal) ---
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalWord = document.getElementById('modal-word');
const modalPhonetic = document.getElementById('modal-phonetic');
const modalDef = document.getElementById('modal-def');
const modalExample = document.getElementById('modal-example');
const btnModalAudio = document.getElementById('btn-modal-audio');


// =========================================
// 3. 程序初始化 (Init)
// =========================================
async function initApp() {
    try {
        console.log("正在从 words.json 加载数据...");
        const response = await fetch('words.json'); 
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        vocabList = await response.json();
        
        // 自动洗牌：打乱单词顺序
        vocabList = shuffleArray(vocabList);
        
        console.log(`成功加载并打乱了 ${vocabList.length} 个单词`);
        
        // 加载第一个词
        loadWord(currentIndex);
        
    } catch (error) {
        console.error("初始化失败:", error);
        if(wordEl) wordEl.textContent = "数据加载失败 (Data Error)";
        if(defTextEl) defTextEl.textContent = "请检查 words.json 文件是否存在且格式正确。";
    }
}

// 辅助函数：数组洗牌 (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 辅助函数：安全播放音效
function playSound(audioObj) {
    try {
        const clone = audioObj.cloneNode();
        clone.volume = audioObj.volume;
        clone.play().catch(e => {
            // 浏览器可能会阻止没有交互的自动播放，忽略这个报错
        });
    } catch(e) {
        console.warn("无法播放音效，可能是文件路径错误", e);
    }
}


// =========================================
// 4. 视图切换逻辑 (View Switcher)
// =========================================
function switchView(viewName) {
    // 1. 隐藏所有视图
    if(cardContainer) cardContainer.style.display = 'none';
    if(notebookView) notebookView.classList.add('hidden');
    if(libraryView) libraryView.classList.add('hidden');
    if(typingView) typingView.classList.add('hidden');
    
    // 2. 移除键盘监听 (防止在非打字模式下触发)
    document.removeEventListener('keydown', handleDesktopTyping);

    // 3. 显示目标视图
    if (viewName === 'card' && cardContainer) {
        cardContainer.style.display = 'flex';
        
    } else if (viewName === 'notebook' && notebookView) {
        notebookView.classList.remove('hidden');
        
    } else if (viewName === 'library' && libraryView) {
        libraryView.classList.remove('hidden');
        if(searchInput) searchInput.value = ''; // 清空搜索
        showLibrary(); // 重新渲染列表
        
    } else if (viewName === 'typing' && typingView) {
        typingView.classList.remove('hidden');
        document.addEventListener('keydown', handleDesktopTyping); // 开启PC键盘监听
        if(mobileInput) { 
            mobileInput.value = ''; 
            mobileInput.focus(); // 聚焦手机输入框
        }
    }
}


// =========================================
// 5. 核心功能：卡片模式
// =========================================
function loadWord(index) {
    if (!vocabList.length) return;
    // 确保 index 不越界
    if (index >= vocabList.length) index = 0;
    
    const data = vocabList[index];
    
    if(wordEl) wordEl.textContent = data.word;
    if(phoneticEl) phoneticEl.textContent = data.phonetic;
    if(defTextEl) defTextEl.textContent = data.definition;
    if(exampleEl) exampleEl.textContent = data.example;
    
    // 默认隐藏释义
    if(defEl) defEl.classList.add('hidden'); 
}

function speakWord(text) {
    if ('speechSynthesis' in window) {
        // 如果传了 text 就读 text，否则读当前卡片上的词
        const content = text || (wordEl ? wordEl.textContent : "");
        const utterance = new SpeechSynthesisUtterance(content);
        utterance.lang = 'en-US'; // 美式发音
        window.speechSynthesis.speak(utterance);
    }
}

function saveToNotebook() {
    if (!vocabList.length) return;
    const currentWord = vocabList[currentIndex];
    
    // 读取 localStorage
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    
    // 查重
    if (!myNotebook.some(item => item.word === currentWord.word)) {
        myNotebook.push(currentWord);
        localStorage.setItem('myCatNotebook', JSON.stringify(myNotebook));
        alert(`已加入生词本：${currentWord.word} 📕`);
    } else {
        alert("这个词已经在生词本里啦！🐱");
    }
}


// =========================================
// 6. 核心功能：单词库与搜索
// =========================================
function showLibrary(filterText = "") {
    if(!fullVocabListEl) return;

    // 过滤列表
    const filteredList = vocabList.filter(item => 
        item.word.toLowerCase().includes(filterText.toLowerCase()) || 
        item.definition.includes(filterText)
    );

    // 更新计数
    if(libCountEl) libCountEl.textContent = `(${filteredList.length} / ${vocabList.length})`;
    fullVocabListEl.innerHTML = '';

    if (filteredList.length === 0) {
        fullVocabListEl.innerHTML = '<p style="color:#999; grid-column:1/-1; text-align:center;">没有找到匹配的单词 😿</p>';
    } else {
        filteredList.forEach(item => {
            const div = document.createElement('div');
            div.className = 'vocab-card-small';
            div.innerHTML = `<strong>${item.word}</strong><span>${item.definition}</span>`;
            // 点击弹出详情
            div.addEventListener('click', () => openModal(item));
            fullVocabListEl.appendChild(div);
        });
    }
}

// 弹窗逻辑
function openModal(data) {
    if(!modalOverlay) return;
    
    if(modalWord) modalWord.textContent = data.word;
    if(modalPhonetic) modalPhonetic.textContent = data.phonetic;
    if(modalDef) modalDef.textContent = data.definition;
    if(modalExample) modalExample.textContent = data.example;
    
    if(btnModalAudio) {
        btnModalAudio.onclick = () => speakWord(data.word);
    }
    
    modalOverlay.classList.remove('hidden');
}


// =========================================
// 7. 核心功能：打字练习 (QWERTY Mode)
// =========================================
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
    if (!vocabList.length) return;
    
    if (typingIndex >= vocabList.length) {
        typingIndex = 0;
        alert("本轮练习完成！太棒了！🎉");
    }

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
    
    const chars = word.split('');
    chars.forEach((char, index) => {
        const span = document.createElement('span');
        span.textContent = char;
        
        if (index < input.length) {
            span.className = 'char-correct'; // 已输入正确
        } else if (index === input.length) {
            span.className = 'char-current'; // 当前光标
        }
        
        targetWordDisplay.appendChild(span);
    });
}

function processTypingInput(key) {
    if (!vocabList.length) return;
    const targetWord = vocabList[typingIndex].word;

    // === 处理退格 ===
    if (key === 'Backspace') {
        if (currentInput.length > 0) {
            currentInput = currentInput.slice(0, -1);
            playSound(sfxClick);
            renderTypingWord(targetWord, currentInput);
        }
        return;
    }

    // 防止溢出
    if (currentInput.length >= targetWord.length) return;
    
    const charToMatch = targetWord[currentInput.length];
    
    // === 核心比对 (不区分大小写) ===
    if (key.toLowerCase() === charToMatch.toLowerCase()) {
        // 输入正确
        currentInput += targetWord[currentInput.length]; // 保持原词的大小写
        charCount++;
        playSound(sfxClick);
        renderTypingWord(targetWord, currentInput);
        
        // 计算打字速度 WPM
        const minutes = (Date.now() - startTime) / 60000;
        const wpm = Math.round((charCount / 5) / (minutes || 1));
        if(typingWpm) typingWpm.textContent = `${wpm} WPM`;

        // 单词完成
        if (currentInput === targetWord) {
            playSound(sfxSuccess);
            speakWord(targetWord);
            
            // 延迟 300ms 跳转下一个
            setTimeout(() => {
                typingIndex++;
                loadTypingWord();
            }, 300);
        }
    } else {
        // 输入错误
        playSound(sfxError);
        // 可选：在这里加个视觉抖动效果
    }
}

// PC 键盘监听
function handleDesktopTyping(e) {
    // 允许单字符输入和退格键
    if (e.key.length === 1 || e.key === 'Backspace') {
        // 忽略 Ctrl, Alt 组合键
        if (!e.ctrlKey && !e.altKey && !e.metaKey) {
            processTypingInput(e.key);
        }
    }
}


// =========================================
// 8. 事件监听绑定 (Safety Check)
// =========================================

// --- 卡片相关 ---
if(btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));
if(btnNext) btnNext.addEventListener('click', () => {
    currentIndex++;
    if(currentIndex >= vocabList.length) currentIndex=0;
    loadWord(currentIndex);
});
if(btnAudio) btnAudio.addEventListener('click', () => speakWord(null));
if(btnSave) btnSave.addEventListener('click', saveToNotebook);

// --- 导航相关 ---
if(navNotebook) navNotebook.addEventListener('click', (e) =>
