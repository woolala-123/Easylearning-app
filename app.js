/**
 * IELTS Cat Vocab App - v9.0 Library Fix
 * 修复：单词库显示、搜索功能、音频连打
 */

// =======================
// 1. 数据与音频引擎
// =======================
let vocabList = [];
let currentIndex = 0;

// 音频文件
const audioFiles = {
    click: new Audio('sounds/public_sounds_click.wav'),
    correct: new Audio('sounds/public_sounds_correct.wav'),
    error: new Audio('sounds/public_sounds_beep.wav')
};

Object.values(audioFiles).forEach(audio => {
    audio.volume = 0.5;
    audio.load();
});

function playSound(type) {
    const audio = audioFiles[type];
    if (audio) {
        audio.currentTime = 0;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(e => console.warn("Audio blocked:", e));
        }
    }
}

// 演示数据 (用于分类游戏，因为你的JSON暂时没有分类)
const DEMO_DATA = {
    profession: {
        baskets: [
            { id: 'medical', label: '医疗', icon: '🏥' },
            { id: 'legal', label: '法律', icon: '⚖️' },
            { id: 'kitchen', label: '烹饪', icon: '🍳' }
        ],
        words: [
            { word: 'Symptom', definition: '症状', category: 'medical', phonetic: '/ˈsɪmp.təm/', example: 'Common symptoms include fever.' },
            { word: 'Verdict', definition: '裁决', category: 'legal', phonetic: '/ˈvɜː.dɪkt/', example: 'The jury reached a verdict.' },
            { word: 'Recipe', definition: '食谱', category: 'kitchen', phonetic: '/ˈres.ɪ.pi/', example: 'A traditional recipe.' },
            { word: 'Surgeon', definition: '外科医生', category: 'medical', phonetic: '/ˈsɜː.dʒən/', example: 'The surgeon operated.' },
            { word: 'Penalty', definition: '惩罚', category: 'legal', phonetic: '/ˈpen.əl.ti/', example: 'Death penalty.' },
            { word: 'Ingredient', definition: '原料', category: 'kitchen', phonetic: '/ɪnˈɡriː.di.ənt/', example: 'Mix ingredients.' }
        ]
    }
};

// =======================
// 2. 初始化
// =======================
async function initApp() {
    try {
        // 尝试加载你的 words.json
        const res = await fetch('words.json');
        if(res.ok) {
            vocabList = await res.json();
            console.log(`Loaded ${vocabList.length} words from JSON.`);
            vocabList = shuffleArray(vocabList);
            loadWord(currentIndex, false);
        } else {
            console.error("Failed to load words.json");
        }
    } catch(e) { 
        console.error("Error loading data:", e);
        // 如果加载失败，使用演示数据兜底
        vocabList = DEMO_DATA.profession.words;
        loadWord(0, false);
    }
}

function switchView(view) {
    // 隐藏所有视图
    document.querySelectorAll('main > div, main > section').forEach(el => el.classList.add('hidden'));
    
    // 停止特定功能
    document.removeEventListener('keydown', handleQlTyping);
    stopGameTimer();

    // 显示目标视图
    const ids = { 
        'home': 'home-view', 
        'sort-menu': 'sort-menu-view', 
        'sorting': 'sorting-view', 
        'typing': 'typing-view', 
        'notebook': 'notebook-view', 
        'library': 'library-view' 
    };
    const target = document.getElementById(ids[view]);
    if(target) {
        target.classList.remove('hidden');
        if(view === 'home') target.style.display = 'flex';
    }

    // 视图特定初始化
    if(view === 'typing') {
        initQlTyping();
        document.addEventListener('keydown', handleQlTyping);
        const input = document.getElementById('ql-hidden-input');
        if(input) input.focus();
    } else if (view === 'notebook') {
        renderNotebook();
    } else if (view === 'library') {
        renderLibrary(); // <--- 关键修复：切换时渲染库
    }
}

// =======================
// 3. 核心功能：渲染单词库 (修复版)
// =======================
function renderLibrary() {
    const list = document.getElementById('full-vocab-list');
    const searchInput = document.getElementById('search-input');
    const filterText = searchInput ? searchInput.value.trim().toLowerCase() : '';
    
    list.innerHTML = ''; // 清空列表

    // 1. 筛选逻辑
    let filteredData = vocabList.filter(item => 
        (item.word && item.word.toLowerCase().includes(filterText)) || 
        (item.definition && item.definition.toLowerCase().includes(filterText))
    );

    // 2. 性能优化：只显示前 100 个结果，防止卡顿
    const displayLimit = 100;
    const displayData = filteredData.slice(0, displayLimit);

    if (displayData.length === 0) {
        list.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">未找到匹配的单词</div>';
        return;
    }

    // 3. 渲染卡片
    displayData.forEach(item => {
        const div = document.createElement('div');
        div.className = 'sort-card'; // 复用样式
        // 覆盖部分样式以适应列表展示
        div.style.cursor = 'pointer';
        div.style.display = 'flex';
        div.style.flexDirection = 'column';
        div.style.justifyContent = 'center';
        div.style.minHeight = '80px';
        
        div.innerHTML = `
            <div style="font-weight:bold; color:#00796b; font-size:1.1em;">${item.word}</div>
            <div style="font-size:0.85em; color:#666;">${item.phonetic || ''}</div>
            <div style="font-size:0.9em; color:#333; margin-top:4px;">${item.definition}</div>
        `;
        
        // 点击朗读
        div.onclick = () => speakWord(item.word);
        
        list.appendChild(div);
    });

    // 提示
    if (filteredData.length > displayLimit) {
        const tip = document.createElement('div');
        tip.style.gridColumn = '1 / -1';
        tip.style.textAlign = 'center';
        tip.style.color = '#999';
        tip.style.padding = '10px';
        tip.textContent = `... 还有 ${filteredData.length - displayLimit} 个结果，请精确搜索 ...`;
        list.appendChild(tip);
    }
}

// 绑定搜索框事件
const searchInputEl = document.getElementById('search-input');
if (searchInputEl) {
    searchInputEl.addEventListener('input', renderLibrary);
}


// =======================
// 4. 通用功能 (背词、发音)
// =======================
function loadWord(idx, speak=true) {
    if(!vocabList.length) return;
    if(idx >= vocabList.length) idx = 0;
    const d = vocabList[idx];
    
    const wordEl = document.querySelector('.word');
    if(wordEl) wordEl.textContent = d.word;
    
    const phoneEl = document.querySelector('.phonetic');
    if(phoneEl) phoneEl.textContent = d.phonetic || '';
    
    const defText = document.querySelector('.def-text');
    if(defText) defText.textContent = d.definition;
    
    const exEl = document.querySelector('.example');
    if(exEl) exEl.textContent = d.example || 'No example available.';
    
    const defBox = document.querySelector('.definition');
    if(defBox) defBox.classList.add('hidden');
    
    if(speak) speakWord(d.word);
}

function speakWord(txt) {
    if(!txt) return;
    if('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(txt);
        u.lang = 'en-US';
        window.speechSynthesis.speak(u);
    }
}

// =======================
// 5. 拼写练习 (Qwerty)
// =======================
let qlQueue = [], qlWordIdx = 0, qlCharIdx = 0, qlCorrect = 0, qlStart = 0;

function initQlTyping() {
    // 从词库随机取 20 个词，不够则取全部
    let source = vocabList.length ? vocabList : DEMO_DATA.profession.words;
    qlQueue = [...source].sort(() => 0.5 - Math.random()).slice(0, 20);
    
    qlWordIdx = 0; qlCharIdx = 0; qlCorrect = 0; qlStart = Date.now();
    renderQlWord();
}

function renderQlWord() {
    if(qlWordIdx >= qlQueue.length) { 
        alert("练习完成！"); 
        switchView('home'); 
        return; 
    }
    
    const wordData = qlQueue[qlWordIdx];
    const wordStr = wordData.word;
    const container = document.getElementById('ql-word-display');
    const transEl = document.getElementById('ql-translation');
    
    if(container) {
        container.innerHTML = '';
        for(let i=0; i<wordStr.length; i++) {
            const span = document.createElement('span');
            span.textContent = wordStr[i];
            if (i < qlCharIdx) span.className = 'char-correct';
            else if (i === qlCharIdx) span.className = 'char-pending char-cursor';
            else span.className = 'char-pending';
            container.appendChild(span);
        }
    }

    const progEl = document.getElementById('ql-progress');
    if(progEl) progEl.textContent = `${qlWordIdx+1}/${qlQueue.length}`;
    
    if(transEl) {
        transEl.textContent = wordData.definition;
        transEl.classList.add('visible');
    }
}

function handleQlTyping(e) {
    if (e.key.length > 1 && e.key !== 'Backspace') return;
    
    const currentWord = qlQueue[qlWordIdx].word;
    const targetChar = currentWord[qlCharIdx];

    if (e.key.toLowerCase() === targetChar.toLowerCase()) {
        playSound('click');
        qlCharIdx++;
        qlCorrect++;
        
        // WPM
        const min = (Date.now() - qlStart) / 60000;
        const wpm = Math.round((qlCorrect / 5) / (min || 0.01));
        const wpmEl = document.getElementById('ql-wpm');
        if(wpmEl) wpmEl.textContent = wpm;

        if (qlCharIdx >= currentWord.length) {
            playSound('correct');
            speakWord(currentWord);
            setTimeout(() => {
                qlWordIdx++;
                qlCharIdx = 0;
                renderQlWord();
            }, 200);
        } else {
            renderQlWord();
        }
    } else {
        playSound('error');
        const cursor = document.querySelector('.char-cursor');
        if(cursor) {
            cursor.classList.add('char-error');
            setTimeout(() => cursor.classList.remove('char-error'), 300);
        }
    }
}

// =======================
// 6. 分类游戏 (使用演示数据)
// =======================
let gameWords = [], selectedWordIdx = null, gameTimer = null, gameSeconds = 0;

window.startSortingGame = function(mode) {
    // 游戏目前只支持 demo 数据，因为你的 json 里还没 category
    const data = DEMO_DATA[mode] || DEMO_DATA.profession;
    gameWords = JSON.parse(JSON.stringify(data.words));
    gameWords = shuffleArray(gameWords);
    
    switchView('sorting');
    
    const basketContainer = document.getElementById('sorting-baskets');
    if(basketContainer) {
        basketContainer.innerHTML = '';
        data.baskets.forEach(b => {
            const div = document.createElement('div');
            div.className = 'basket';
            div.innerHTML = `<div class="basket-icon">${b.icon}</div><div class="basket-label">${b.label}</div>`;
            div.onclick = () => handleBasketClick(b.id, div);
            basketContainer.appendChild(div);
        });
    }

    renderSortingGrid();
    startGameTimer();
    
    // 重置侧边栏
    const resDiv = document.getElementById('sidebar-result');
    if(resDiv) resDiv.classList.add('hidden');
}

function renderSortingGrid() {
    const grid = document.getElementById('sorting-grid');
    if(!grid) return;
    grid.innerHTML = '';
    let remaining = 0;
    
    gameWords.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'sort-card';
        div.textContent = item.word;
        
        if (item.sorted) {
            div.classList.add('ghost');
        } else {
            remaining++;
            div.onclick = () => {
                playSound('click');
                speakWord(item.word);
                selectedWordIdx = index;
                renderSortingGrid();
            };
            if(selectedWordIdx === index) div.classList.add('selected');
        }
        grid.appendChild(div);
    });
    
    const progEl = document.getElementById('sort-progress');
    if(progEl) progEl.textContent = `剩余: ${remaining}`;
    
    if(remaining === 0) {
        stopGameTimer();
        const btn = document.getElementById('btn-finish-game');
        if(btn) {
            btn.disabled = false;
            btn.className = 'btn-active';
        }
    }
}

function handleBasketClick(basketId, el) {
    if(selectedWordIdx === null) return alert("请先选中一个单词");
    const w = gameWords[selectedWordIdx];
    
    if(w.category === basketId) {
        playSound('correct');
        w.sorted = true;
        selectedWordIdx = null;
        renderSortingGrid();
    } else {
        playSound('error');
        const card = document.getElementById('sorting-grid').children[selectedWordIdx];
        if(card) {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 400);
        }
    }
}

function startGameTimer() {
    stopGameTimer();
    gameSeconds = 0;
    const btn = document.getElementById('btn-finish-game');
    if(btn) {
        btn.disabled = true;
        btn.className = 'btn-disabled';
    }
    
    gameTimer = setInterval(() => {
        gameSeconds++;
        const m = Math.floor(gameSeconds/60).toString().padStart(2,'0');
        const s = (gameSeconds%60).toString().padStart(2,'0');
        const timerEl = document.getElementById('game-timer');
        if(timerEl) timerEl.textContent = `${m}:${s}`;
    }, 1000);
}

function stopGameTimer() { if(gameTimer) clearInterval(gameTimer); }

window.checkGameFinish = function() {
    const timerEl = document.getElementById('game-timer');
    alert(`恭喜！耗时: ${timerEl ? timerEl.textContent : ''}`);
    switchView('sort-menu');
}

// 侧边栏查词
const btnSearch = document.getElementById('btn-game-search');
if(btnSearch) {
    btnSearch.onclick = () => {
        const input = document.getElementById('game-search-input');
        const term = input ? input.value.trim().toLowerCase() : '';
        if(!term) return;
        
        // 在游戏词库里找
        const found = gameWords.find(w => w.word.toLowerCase() === term);
        
        if(found) {
            const resDiv = document.getElementById('sidebar-result');
            if(resDiv) resDiv.classList.remove('hidden');
            
            document.getElementById('res-word').textContent = found.word;
            document.getElementById('res-phonetic').textContent = found.phonetic || '';
            document.getElementById('res-def').textContent = found.definition;
            document.getElementById('res-example').textContent = found.example || 'No example.';
            
            const btnAudio = document.getElementById('btn-res-audio');
            if(btnAudio) btnAudio.onclick = () => speakWord(found.word);
        } else {
            alert("词库中未找到，请检查拼写。");
        }
    };
}

// =======================
// 7. 辅助与事件绑定
// =======================
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }

function renderNotebook() {
    const list = document.getElementById('notebook-list');
    if(!list) return;
    const d = JSON.parse(localStorage.getItem('myCatNotebook'))||[];
    if(d.length === 0) {
        list.innerHTML = '<li style="text-align:center; color:#999;">生词本是空的</li>';
    } else {
        list.innerHTML = d.map(i => `<li><strong>${i.word}</strong> <br> <span style="font-size:0.9em; color:#666;">${i.definition}</span></li>`).join('');
    }
}

// 绑定导航事件
const navMap = {
    'nav-home': 'home',
    'nav-sort': 'sort-menu',
    'nav-typing': 'typing',
    'nav-notebook': 'notebook',
    'nav-library': 'library'
};

Object.keys(navMap).forEach(id => {
    const el = document.getElementById(id);
    if(el) el.onclick = () => switchView(navMap[id]);
});

// 绑定按钮事件
const btnNext = document.getElementById('btn-next');
if(btnNext) btnNext.onclick = () => { currentIndex++; loadWord(currentIndex); };

const btnAudio = document.getElementById('btn-audio');
if(btnAudio) btnAudio.onclick = () => {
    const wordEl = document.querySelector('.word');
    if(wordEl) speakWord(wordEl.textContent);
};

const btnSave = document.getElementById('btn-save');
if(btnSave) btnSave.onclick = () => {
    if(!vocabList.length) return;
    const w = vocabList[currentIndex];
    let nb = JSON.parse(localStorage.getItem('myCatNotebook'))||[];
    // 简单去重
    if(!nb.some(i => i.word === w.word)) {
        nb.push(w);
        localStorage.setItem('myCatNotebook', JSON.stringify(nb));
        alert(`已加入生词本: ${w.word}`);
    } else {
        alert("已经在生词本里啦！");
    }
};

const btnReveal = document.getElementById('btn-reveal');
if(btnReveal) btnReveal.onclick = () => {
    const def = document.querySelector('.definition');
    if(def) def.classList.remove('hidden');
};

const btnTypingExit = document.getElementById('btn-back-from-typing');
if(btnTypingExit) btnTypingExit.onclick = () => switchView('home');

const typingView = document.getElementById('typing-view');
if(typingView) typingView.onclick = () => {
    const input = document.getElementById('ql-hidden-input');
    if(input) input.focus();
};

// 启动！
initApp();
