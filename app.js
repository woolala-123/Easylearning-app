// === 1. 变量准备 ===
let vocabList = []; 
let currentIndex = 0;

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

// 导航与列表元素
const notebookLink = document.querySelector('nav ul li:nth-child(3) a');
const notebookListEl = document.getElementById('notebook-list');
const btnBack = document.getElementById('btn-back');
const navLibrary = document.getElementById('nav-library');
const fullVocabListEl = document.getElementById('full-vocab-list');
const libCountEl = document.getElementById('lib-count');
const btnBackFromLib = document.getElementById('btn-back-from-lib');

// === 新增：Modal 相关元素 ===
const modalOverlay = document.getElementById('modal-overlay');
const btnCloseModal = document.getElementById('btn-close-modal');
const modalWord = document.getElementById('modal-word');
const modalPhonetic = document.getElementById('modal-phonetic');
const modalDef = document.getElementById('modal-def');
const modalExample = document.getElementById('modal-example');
const btnModalAudio = document.getElementById('btn-modal-audio');


// === 3. 核心功能：初始化与数据获取 ===
async function initApp() {
    try {
        console.log("开始加载单词数据...");
        const response = await fetch('words.json'); 
        if (!response.ok) throw new Error('网络响应异常');
        vocabList = await response.json();
        console.log(`成功加载了 ${vocabList.length} 个单词！`);
        loadWord(currentIndex);
    } catch (error) {
        console.error('加载失败:', error);
        if(wordEl) wordEl.textContent = "加载失败 😿";
        if(defTextEl) defTextEl.textContent = "请检查 words.json 是否存在";
    }
}


// === 4. 功能函数 ===

// A. 加载单词卡片
function loadWord(index) {
    if (vocabList.length === 0) return;
    const data = vocabList[index];
    wordEl.textContent = data.word;
    phoneticEl.textContent = data.phonetic;
    defTextEl.textContent = data.definition;
    exampleEl.textContent = data.example;
    defEl.classList.add('hidden'); 
}

// B. 发音
function speakWord() {
    if ('speechSynthesis' in window) {
        const word = wordEl.textContent;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US'; 
        window.speechSynthesis.speak(utterance);
    } else {
        alert("浏览器不支持发音 😿");
    }
}

// C. 保存生词
function saveToNotebook() {
    if (vocabList.length === 0) return;
    const currentWord = vocabList[currentIndex];
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    const exists = myNotebook.some(item => item.word === currentWord.word);
    
    if (!exists) {
        myNotebook.push(currentWord);
        localStorage.setItem('myCatNotebook', JSON.stringify(myNotebook));
        alert(`已加入生词本：${currentWord.word} 📕`);
    } else {
        alert("这个词已经在生词本里啦！🐱");
    }
}

// D. 显示生词本
function showNotebook() {
    cardContainer.style.display = 'none';
    if(libraryView) libraryView.classList.add('hidden');
    notebookView.classList.remove('hidden');
    
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

function hideNotebook() {
    notebookView.classList.add('hidden');
    cardContainer.style.display = 'flex';
}

// F. 显示完整单词库
function showLibrary() {
    cardContainer.style.display = 'none';
    notebookView.classList.add('hidden');
    libraryView.classList.remove('hidden');

    libCountEl.textContent = `(${vocabList.length} words)`;
    fullVocabListEl.innerHTML = '';

    vocabList.forEach(item => {
        const div = document.createElement('div');
        div.className = 'vocab-card-small';
        div.innerHTML = `
            <strong>${item.word}</strong>
            <span>${item.definition}</span>
        `;
        
        // === 绑定点击事件，打开弹窗 ===
        div.addEventListener('click', () => openModal(item));
        
        fullVocabListEl.appendChild(div);
    });
}

function hideLibrary() {
    libraryView.classList.add('hidden');
    cardContainer.style.display = 'flex';
}

// === G. Modal 控制函数 (新增) ===
function openModal(data) {
    modalWord.textContent = data.word;
    modalPhonetic.textContent = data.phonetic;
    modalDef.textContent = data.definition;
    modalExample.textContent = data.example;
    
    // 绑定弹窗内的发音按钮
    btnModalAudio.onclick = () => {
        const utterance = new SpeechSynthesisUtterance(data.word);
        utterance.lang = 'en-US';
        window.speechSynthesis.speak(utterance);
    };

    modalOverlay.classList.remove('hidden');
}

function closeModal() {
    modalOverlay.classList.add('hidden');
}


// === 5. 事件绑定 ===
if (btnReveal) btnReveal.addEventListener('click', () => defEl.classList.remove('hidden'));
if (btnNext) btnNext.addEventListener('click', () => {
    currentIndex++;
    if (currentIndex >= vocabList.length) currentIndex = 0;
    loadWord(currentIndex);
});
if (btnAudio) btnAudio.addEventListener('click', speakWord);
if (btnSave) btnSave.addEventListener('click', saveToNotebook);
if (notebookLink) {
    notebookLink.addEventListener('click', (e) => {
        e.preventDefault();
        showNotebook();
    });
}
if (btnBack) btnBack.addEventListener('click', hideNotebook);

// Library events
if (navLibrary) {
    navLibrary.addEventListener('click', (e) => {
        e.preventDefault();
        showLibrary();
    });
}
if (btnBackFromLib) {
    btnBackFromLib.addEventListener('click', hideLibrary);
}

// Modal events (新增)
if (btnCloseModal) btnCloseModal.addEventListener('click', closeModal);
if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

// === 6. 启动程序 ===
initApp();
