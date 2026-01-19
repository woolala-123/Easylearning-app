// app.js - 进阶版 (支持外部数据加载)

// === 1. 变量准备 ===
let vocabList = []; // 现在它是空的，等会儿去取数据
let currentIndex = 0;

// === 2. 获取页面元素 ===
const wordEl = document.querySelector('.word');
const phoneticEl = document.querySelector('.phonetic');
const defEl = document.querySelector('.definition');
const defTextEl = defEl ? defEl.querySelector('p') : null;
const exampleEl = defEl ? defEl.querySelector('.example') : null;

const btnReveal = document.getElementById('btn-reveal');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio');
const btnSave = document.getElementById('btn-save');

// 生词本相关
const notebookLink = document.querySelector('nav ul li:nth-child(3) a');
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const notebookListEl = document.getElementById('notebook-list');
const btnBack = document.getElementById('btn-back');


// === 3. 核心功能：初始化与数据获取 ===
// 这是一个异步函数 (Async)，因为它要去服务器拿数据，需要等待
async function initApp() {
    try {
        console.log("开始加载单词数据...");
        // fetch 就像是派出一只猫去抓取 'words.json' 文件
        const response = await fetch('words.json'); 
        
        // 检查是不是成功拿到了
        if (!response.ok) throw new Error('网络响应异常');

        // 把拿到的文本转换成 JS 能懂的数组
        vocabList = await response.json();
        
        console.log(`成功加载了 ${vocabList.length} 个单词！`);
        
        // 数据到了，开始显示第一个词
        loadWord(currentIndex);

    } catch (error) {
        console.error('加载失败:', error);
        wordEl.textContent = "加载失败 😿";
        defTextEl.textContent = "请检查 words.json 文件是否存在";
        // 如果你在本地直接打开 html，可能会触发这个错误，这是正常的安全限制
        // 请上传到 GitHub Pages 查看效果
    }
}


// === 4. 常规功能函数 ===

function loadWord(index) {
    // 保护措施：如果数据还没回来，就什么都不做
    if (vocabList.length === 0) return;

    const data = vocabList[index];
    wordEl.textContent = data.word;
    phoneticEl.textContent = data.phonetic;
    defTextEl.textContent = data.definition;
    exampleEl.textContent = data.example;
    defEl.classList.add('hidden'); 
}

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

function showNotebook() {
    cardContainer.style.display = 'none';
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
    cardContainer.style.display = 'flex';
    notebookView.classList.add('hidden');
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
if (notebookLink) notebookLink.addEventListener('click', (e) => { e.preventDefault(); showNotebook(); });
if (btnBack) btnBack.addEventListener('click', hideNotebook);

// === 6. 启动程序 ===
// 这里不再直接调用 loadWord，而是调用 initApp 去取数据
initApp();
