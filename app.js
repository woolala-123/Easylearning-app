// app.js - 完整修复版

// === 1. 数据准备 ===
const vocabList = [
    { word: "Ephemeral", phonetic: "/ɪˈfem.ər.əl/", definition: "adj. 短暂的", example: "Fashion is ephemeral." },
    { word: "Serendipity", phonetic: "/ˌser.ənˈdɪp.ə.ti/", definition: "n. 机缘巧合", example: "Finding the cat was serendipity." },
    { word: "Resilient", phonetic: "/rɪˈzɪl.jənt/", definition: "adj. 有弹性的", example: "Cats are resilient." },
    { word: "Meticulous", phonetic: "/məˈtɪk.jə.ləs/", definition: "adj. 一丝不苟的", example: "Meticulous cleaning." }
];

// === 2. 安全获取元素 (加了防报错检查) ===
// 只有当HTML里真的有这些东西时，JS才会去操作，防止报错
const wordEl = document.querySelector('.word');
const phoneticEl = document.querySelector('.phonetic');
const defEl = document.querySelector('.definition');
const defTextEl = defEl ? defEl.querySelector('p') : null;
const exampleEl = defEl ? defEl.querySelector('.example') : null;

const btnReveal = document.getElementById('btn-reveal');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio'); // 朗读按钮
const btnSave = document.getElementById('btn-save');   // 保存按钮

// 生词本相关
// 注意：如果导航栏结构不对，这里可能会抓不到，所以要小心
const notebookLink = document.querySelector('nav ul li:nth-child(3) a'); 
const cardContainer = document.querySelector('.card-container');
const notebookView = document.getElementById('notebook-view');
const notebookListEl = document.getElementById('notebook-list');
const btnBack = document.getElementById('btn-back');

let currentIndex = 0;

// === 3. 核心功能函数 ===

function loadWord(index) {
    if (!wordEl) return; // 安全检查
    const data = vocabList[index];
    wordEl.textContent = data.word;
    phoneticEl.textContent = data.phonetic;
    defTextEl.textContent = data.definition;
    exampleEl.textContent = data.example;
    defEl.classList.add('hidden'); 
}

function speakWord() {
    // 检查浏览器是否支持发音
    if ('speechSynthesis' in window) {
        const word = wordEl.textContent;
        const utterance = new SpeechSynthesisUtterance(word);
        utterance.lang = 'en-US'; // 美式发音
        window.speechSynthesis.speak(utterance);
    } else {
        alert("你的浏览器不支持发音功能喵~ 😿");
    }
}

function saveToNotebook() {
    const currentWord = vocabList[currentIndex];
    let myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    
    // 查重
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
    if (!cardContainer || !notebookView) return;
    cardContainer.style.display = 'none';
    notebookView.classList.remove('hidden');
    
    const myNotebook = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    notebookListEl.innerHTML = '';
    
    if (myNotebook.length === 0) {
        notebookListEl.innerHTML = '<li>还没有生词哦，快去添加吧！🐾</li>';
    } else {
        myNotebook.forEach(item => {
            const li = document.createElement('li');
            // 这里加个删除功能的小按钮（进阶）
            li.innerHTML = `<strong>${item.word}</strong> - ${item.definition}`;
            notebookListEl.appendChild(li);
        });
    }
}

function hideNotebook() {
    if (!cardContainer || !notebookView) return;
    cardContainer.style.display = 'flex';
    notebookView.classList.add('hidden');
}

// === 4. 事件绑定 (确保元素存在才绑定) ===

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

// === 5. 启动 ===
loadWord(currentIndex);

console.log("App.js 已成功加载喵！"); // 这句话会在控制台显示