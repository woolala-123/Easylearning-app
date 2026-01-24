/**
 * IELTS Cat Vocab App - v5.0 Workstation Mode
 * 功能：包含职业分类工作台 (Sorting Workstation) + 内置演示数据
 */

// =======================
// 1. 数据与状态
// =======================
let vocabList = [];
let currentIndex = 0;

// 【演示专用数据】 - 保证职业分类模式 100% 能运行！
const DEMO_DATA = {
    profession: {
        baskets: [
            { id: 'medical', label: '医疗/健康', icon: '🏥' },
            { id: 'legal', label: '法律/规则', icon: '⚖️' },
            { id: 'kitchen', label: '烹饪/厨房', icon: '🍳' }
        ],
        words: [
            // 医疗词
            { word: 'Symptom', definition: '症状', category: 'medical' },
            { word: 'Diagnose', definition: '诊断', category: 'medical' },
            { word: 'Epidemic', definition: '流行病', category: 'medical' },
            { word: 'Prescription', definition: '处方', category: 'medical' },
            { word: 'Vaccine', definition: '疫苗', category: 'medical' },
            { word: 'Surgery', definition: '手术', category: 'medical' },
            // 法律词
            { word: 'Verdict', definition: '裁决', category: 'legal' },
            { word: 'Legislation', definition: '立法', category: 'legal' },
            { word: 'Penalty', definition: '惩罚', category: 'legal' },
            { word: 'Accuse', definition: '指控', category: 'legal' },
            { word: 'Copyright', definition: '版权', category: 'legal' },
            // 厨房词
            { word: 'Cuisine', definition: '烹饪', category: 'kitchen' },
            { word: 'Ingredient', definition: '原料', category: 'kitchen' },
            { word: 'Recipe', definition: '食谱', category: 'kitchen' },
            { word: 'Nutrition', definition: '营养', category: 'kitchen' }
        ]
    },
    sentiment: {
        baskets: [
            { id: 'positive', label: '积极/褒义', icon: '😄' },
            { id: 'negative', label: '消极/贬义', icon: '☹️' },
            { id: 'neutral', label: '中性/客观', icon: '😐' }
        ],
        words: [
            { word: 'Outstanding', definition: '杰出的', category: 'positive' },
            { word: 'Detrimental', definition: '有害的', category: 'negative' },
            { word: 'Subsequent', definition: '随后的', category: 'neutral' },
            { word: 'Hazardous', definition: '危险的', category: 'negative' },
            { word: 'Meticulous', definition: '一丝不苟的', category: 'positive' }
        ]
    }
};

// 游戏状态
let currentSortingWords = [];
let selectedWordId = null; // 当前选中的单词索引

// 音效
const sfxClick = new Audio('sounds/type.mp3');
const sfxSuccess = new Audio('sounds/success.mp3');
const sfxError = new Audio('sounds/error.mp3');
sfxClick.volume = 0.5; sfxSuccess.volume = 0.6; sfxError.volume = 0.3;

// =======================
// 2. 获取元素
// =======================
// 视图
const cardContainer = document.querySelector('.card-container');
const sortMenuView = document.getElementById('sort-menu-view'); // 选关
const sortingView = document.getElementById('sorting-view'); // 工作台
const notebookView = document.getElementById('notebook-view');
const libraryView = document.getElementById('library-view');
const typingView = document.getElementById('typing-view');

// 导航
const navSort = document.getElementById('nav-sort');
const navNotebook = document.getElementById('nav-notebook');
const navLibrary = document.getElementById('nav-library');
const navTyping = document.getElementById('nav-typing');

// 基础卡片
const wordEl = document.querySelector('.word');
const defEl = document.querySelector('.definition');
const btnNext = document.getElementById('btn-next');
const btnAudio = document.getElementById('btn-audio');
const btnSave = document.getElementById('btn-save');
const btnBackFromMenu = document.getElementById('btn-back-from-menu');

// 分类工作台元素
const sortingGrid = document.getElementById('sorting-grid');
const sortingBaskets = document.getElementById('sorting-baskets');
const sortProgress = document.getElementById('sort-progress');

// =======================
// 3. 核心功能
// =======================

async function initApp() {
    try {
        // 尝试加载用户数据，用于背单词模式
        const response = await fetch('words.json');
        if (response.ok) {
            vocabList = await response.json();
            vocabList = shuffleArray(vocabList);
            loadWord(currentIndex, false);
        }
    } catch (e) { console.log("Init with default/empty data"); }
}

function switchView(viewName) {
    // 隐藏所有
    [cardContainer, sortMenuView, sortingView, notebookView, libraryView, typingView].forEach(el => {
        if(el) el.classList.add('hidden');
    });

    if (viewName === 'card') {
        cardContainer.classList.remove('hidden');
        cardContainer.style.display = 'flex';
    } else if (viewName === 'sort-menu') {
        sortMenuView.classList.remove('hidden');
    } else if (viewName === 'sorting') {
        sortingView.classList.remove('hidden');
    } else if (viewName === 'notebook') {
        notebookView.classList.remove('hidden');
        renderNotebook();
    } else if (viewName === 'library') {
        libraryView.classList.remove('hidden');
        renderLibrary();
    } else if (viewName === 'typing') {
        typingView.classList.remove('hidden');
    }
}

// === A. 背单词逻辑 (简化版) ===
function loadWord(index, autoSpeak=true) {
    if(!vocabList.length) return;
    if(index >= vocabList.length) index = 0;
    const data = vocabList[index];
    wordEl.textContent = data.word;
    document.querySelector('.definition p').textContent = data.definition;
    defEl.classList.add('hidden');
    if(autoSpeak) speakWord(data.word);
}

function speakWord(text) {
    if(!text) return;
    if('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    }
}

// === B. 分类工作台逻辑 (核心功能) ===

// 1. 开始游戏：初始化数据
window.startSortingGame = function(mode) {
    const gameData = DEMO_DATA[mode]; // 读取内置演示数据
    if (!gameData) return alert("敬请期待！");

    currentSortingWords = JSON.parse(JSON.stringify(gameData.words)); // 深拷贝
    // 随机打乱单词
    currentSortingWords = shuffleArray(currentSortingWords);

    switchView('sorting');
    renderSortingWorkspace(gameData.baskets);
}

// 2. 渲染工作台
function renderSortingWorkspace(baskets) {
    // 渲染篮筐
    sortingBaskets.innerHTML = '';
    baskets.forEach(basket => {
        const div = document.createElement('div');
        div.className = 'basket';
        div.innerHTML = `<div class="basket-icon">${basket.icon}</div><div class="basket-label">${basket.label}</div>`;
        // 点击篮筐触发分类
        div.onclick = () => handleBasketClick(basket.id, div);
        sortingBaskets.appendChild(div);
    });

    // 渲染单词卡片 (Grid)
    renderWordGrid();
}

function renderWordGrid() {
    sortingGrid.innerHTML = '';
    let remaining = 0;

    currentSortingWords.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'sort-card';
        div.textContent = item.word;
        
        // 状态判断
        if (item.sorted) {
            div.classList.add('ghost'); // 已分类：变成幽灵
            div.textContent = "已分类"; // 或者留空
        } else {
            remaining++;
            div.onclick = () => handleWordSelect(index);
            if (selectedWordId === index) {
                div.classList.add('selected'); // 当前选中高亮
            }
        }
        sortingGrid.appendChild(div);
    });

    sortProgress.textContent = `剩余: ${remaining}`;
    
    // 胜利检测
    if (remaining === 0) {
        setTimeout(() => {
            playSound(sfxSuccess);
            alert("太棒了！全部整理完毕！🎉");
            switchView('sort-menu');
        }, 500);
    }
}

// 3. 点击单词
function handleWordSelect(index) {
    // 播放选中音效
    playSound(sfxClick);
    
    // 朗读单词
    speakWord(currentSortingWords[index].word);

    // 切换选中状态
    if (selectedWordId === index) {
        selectedWordId = null; // 取消选中
    } else {
        selectedWordId = index;
    }
    renderWordGrid(); // 重绘界面
}

// 4. 点击篮筐 (尝试放入)
function handleBasketClick(basketId, basketEl) {
    if (selectedWordId === null) {
        alert("请先点击上方的一个单词！");
        return;
    }

    const wordObj = currentSortingWords[selectedWordId];

    // 判断对错
    if (wordObj.category === basketId) {
        // ✅ 正确
        playSound(sfxSuccess);
        
        // 视觉反馈：篮筐膨胀
        basketEl.classList.add('active-drop');
        setTimeout(() => basketEl.classList.remove('active-drop'), 200);

        // 逻辑：标记为已分类 (Ghost)
        wordObj.sorted = true;
        selectedWordId = null; // 重置选中
        
        renderWordGrid();
    } else {
        // ❌ 错误
        playSound(sfxError);
        alert(`不对哦，"${wordObj.word}" 不属于这个篮筐。`);
    }
}

// 辅助：洗牌
function shuffleArray(arr) {
    return arr.sort(() => Math.random() - 0.5);
}
function playSound(audio) {
    try { audio.cloneNode().play().catch(()=>{}); } catch(e){}
}

// =======================
// 4. 事件绑定
// =======================
if(navSort) navSort.addEventListener('click', () => switchView('sort-menu'));
if(navNotebook) navNotebook.addEventListener('click', () => switchView('notebook'));
if(navLibrary) navLibrary.addEventListener('click', () => switchView('library'));
if(navTyping) navTyping.addEventListener('click', () => switchView('typing'));
if(btnBackFromMenu) btnBackFromMenu.addEventListener('click', () => switchView('card'));
if(btnNext) btnNext.addEventListener('click', () => { currentIndex++; loadWord(currentIndex); });
if(btnAudio) btnAudio.addEventListener('click', () => speakWord(null));

// 简单生词本和单词库渲染 (为了完整性保留)
function renderNotebook() {
    const list = document.getElementById('notebook-list');
    if(list) list.innerHTML = '<li>暂无数据</li>';
}
function renderLibrary() {
    const list = document.getElementById('full-vocab-list');
    if(list) list.innerHTML = '';
}

initApp();
