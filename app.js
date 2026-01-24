/**
 * IELTS Cat Vocab App - v8.0 Audio & Example Fix
 */

// =======================
// 1. 数据与音频引擎
// =======================
let vocabList = [];
let currentIndex = 0;

// 音频文件 (确保文件名完全一致)
const audioFiles = {
    click: new Audio('public_sounds_click.wav'),
    correct: new Audio('public_sounds_correct.wav'),
    error: new Audio('public_sounds_beep.wav')
};

// 预加载并设置音量
Object.values(audioFiles).forEach(audio => {
    audio.volume = 0.5;
    audio.load(); // 强制预加载
});

// 核心播放函数 (解决连打无声问题)
function playSound(type) {
    const audio = audioFiles[type];
    if (audio) {
        audio.currentTime = 0; // 关键：重置时间轴，支持连打
        const playPromise = audio.play();
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                // 忽略浏览器自动播放限制报错
                console.warn("Audio play blocked:", error);
            });
        }
    }
}

// 演示数据 (带详细例句)
const DEMO_DATA = {
    profession: {
        baskets: [
            { id: 'medical', label: '医疗', icon: '🏥' },
            { id: 'legal', label: '法律', icon: '⚖️' },
            { id: 'kitchen', label: '烹饪', icon: '🍳' }
        ],
        words: [
            { word: 'Symptom', definition: '症状', category: 'medical', phonetic: '/ˈsɪmp.təm/', example: 'Common symptoms include fever and cough. (常见症状包括发烧和咳嗽)' },
            { word: 'Surgeon', definition: '外科医生', category: 'medical', phonetic: '/ˈsɜː.dʒən/', example: 'The surgeon performed the operation successfully. (外科医生成功进行了手术)' },
            { word: 'Verdict', definition: '裁决', category: 'legal', phonetic: '/ˈvɜː.dɪkt/', example: 'The jury finally reached a verdict. (陪审团最终做出了裁决)' },
            { word: 'Recipe', definition: '食谱', category: 'kitchen', phonetic: '/ˈres.ɪ.pi/', example: 'This is a traditional recipe for apple pie. (这是一份传统的苹果派食谱)' },
            { word: 'Ingredient', definition: '原料', category: 'kitchen', phonetic: '/ɪnˈɡriː.di.ənt/', example: 'Mix all the dry ingredients together. (把所有干配料混合在一起)' },
            { word: 'Accuse', definition: '指控', category: 'legal', phonetic: '/əˈkjuːz/', example: 'He was accused of theft. (他被指控盗窃)' },
            { word: 'Vaccine', definition: '疫苗', category: 'medical', phonetic: '/ˈvæk.siːn/', example: 'The vaccine is effective against the virus. (该疫苗对病毒有效)' },
            { word: 'Diagnose', definition: '诊断', category: 'medical', phonetic: '/ˈdaɪ.əɡ.nəʊz/', example: 'The doctor diagnosed him with flu. (医生诊断他患了流感)' },
            { word: 'Attorney', definition: '律师', category: 'legal', phonetic: '/əˈtɜː.ni/', example: 'She is a defense attorney. (她是一名辩护律师)' },
            { word: 'Cuisine', definition: '烹饪', category: 'kitchen', phonetic: '/kwɪˈziːn/', example: 'I love Italian cuisine. (我喜欢意大利菜)' },
            // ... (为节省篇幅，逻辑通用)
            { word: 'Penalty', definition: '惩罚', category: 'legal', phonetic: '/ˈpen.əl.ti/', example: 'The penalty for speeding is a fine. (超速的惩罚是罚款)' },
            { word: 'Chronic', definition: '慢性的', category: 'medical', phonetic: '/ˈkrɒn.ɪk/', example: 'She suffers from chronic pain. (她遭受慢性疼痛)' },
            { word: 'Roast', definition: '烤', category: 'kitchen', phonetic: '/rəʊst/', example: 'Roast the chicken for two hours. (把鸡烤两个小时)' },
            { word: 'Witness', definition: '证人', category: 'legal', phonetic: '/ˈwɪt.nəs/', example: 'The witness gave evidence in court. (证人在法庭上作证)' },
            { word: 'Therapy', definition: '疗法', category: 'medical', phonetic: '/ˈθer.ə.pi/', example: 'He is undergoing physical therapy. (他正在接受物理治疗)' },
            { word: 'Utensil', definition: '器皿', category: 'kitchen', phonetic: '/juːˈten.sɪl/', example: 'Use wooden utensils to avoid scratching the pan. (使用木制器具以免刮伤锅)' },
            { word: 'Fraud', definition: '欺诈', category: 'legal', phonetic: '/frɔːd/', example: 'He was convicted of credit card fraud. (他被判信用卡欺诈罪)' },
            { word: 'Pharmacy', definition: '药房', category: 'medical', phonetic: '/ˈfɑː.mə.si/', example: 'Pick up your medicine at the pharmacy. (去药房取药)' },
            { word: 'Spice', definition: '香料', category: 'kitchen', phonetic: '/spaɪs/', example: 'Cinnamon is a common spice. (肉桂是一种常见的香料)' },
            { word: 'Sue', definition: '起诉', category: 'legal', phonetic: '/suː/', example: 'He plans to sue the company. (他计划起诉这家公司)' }
        ]
    },
    sentiment: {
        baskets: [ { id: 'pos', label: 'Pos', icon: '😄' }, { id: 'neg', label: 'Neg', icon: '☹️' } ],
        words: [ {word:'Good', definition:'好', category:'pos', example:'Good job.'}, {word:'Bad', definition:'坏', category:'neg', example:'Bad luck.'} ]
    }
};

// =======================
// 2. 初始化
// =======================
async function initApp() {
    try {
        const res = await fetch('words.json');
        if(res.ok) {
            vocabList = await res.json();
            vocabList = shuffleArray(vocabList);
            loadWord(currentIndex, false);
        }
    } catch(e) { console.log("Using default/demo data"); }
}

function switchView(view) {
    document.querySelectorAll('main > div, main > section').forEach(el => el.classList.add('hidden'));
    document.removeEventListener('keydown', handleQlTyping);
    stopGameTimer();

    const ids = { 'home': 'home-view', 'sort-menu': 'sort-menu-view', 'sorting': 'sorting-view', 'typing': 'typing-view', 'notebook': 'notebook-view', 'library': 'library-view' };
    const target = document.getElementById(ids[view]);
    if(target) {
        target.classList.remove('hidden');
        if(view === 'home') target.style.display = 'flex';
    }

    if(view === 'typing') {
        initQlTyping();
        document.addEventListener('keydown', handleQlTyping);
        document.getElementById('ql-hidden-input').focus();
    } else if (view === 'notebook') renderNotebook();
    else if (view === 'library') renderLibrary();
}

// 修复 1：确保例句显示
function loadWord(idx, speak=true) {
    if(!vocabList.length) return;
    if(idx >= vocabList.length) idx = 0;
    const d = vocabList[idx];
    
    document.querySelector('.word').textContent = d.word;
    document.querySelector('.phonetic').textContent = d.phonetic || '';
    document.querySelector('.def-text').textContent = d.definition;
    
    // 强制显示例句
    const exEl = document.querySelector('.example');
    exEl.textContent = d.example || 'No example available.';
    
    document.querySelector('.definition').classList.add('hidden');
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
// 3. ⌨️ Qwerty 拼写 (音效修复)
// =======================
let qlQueue = [], qlWordIdx = 0, qlCharIdx = 0, qlCorrect = 0, qlStart = 0;

function initQlTyping() {
    // 优先用外部数据，否则用演示数据
    const source = vocabList.length ? vocabList : DEMO_DATA.profession.words;
    qlQueue = [...source].slice(0, 20); // 取前20个
    qlWordIdx = 0; qlCharIdx = 0; qlCorrect = 0; qlStart = Date.now();
    renderQlWord();
}

function renderQlWord() {
    if(qlWordIdx >= qlQueue.length) { alert("拼写练习完成！"); switchView('home'); return; }
    
    const wordData = qlQueue[qlWordIdx];
    const wordStr = wordData.word;
    const container = document.getElementById('ql-word-display');
    const transEl = document.getElementById('ql-translation');
    
    container.innerHTML = '';
    for(let i=0; i<wordStr.length; i++) {
        const span = document.createElement('span');
        span.textContent = wordStr[i];
        if (i < qlCharIdx) span.className = 'char-correct';
        else if (i === qlCharIdx) span.className = 'char-pending char-cursor';
        else span.className = 'char-pending';
        container.appendChild(span);
    }

    document.getElementById('ql-progress').textContent = `${qlWordIdx+1}/${qlQueue.length}`;
    transEl.textContent = wordData.definition;
    transEl.classList.add('visible');
}

function handleQlTyping(e) {
    if (e.key.length > 1) return;
    
    const currentWord = qlQueue[qlWordIdx].word;
    const targetChar = currentWord[qlCharIdx];

    if (e.key.toLowerCase() === targetChar.toLowerCase()) {
        playSound('click'); // 修复：敲击音效
        qlCharIdx++;
        qlCorrect++;
        
        // WPM Calc
        const min = (Date.now() - qlStart) / 60000;
        const wpm = Math.round((qlCorrect / 5) / (min || 0.01));
        document.getElementById('ql-wpm').textContent = wpm;

        if (qlCharIdx >= currentWord.length) {
            playSound('correct'); // 修复：成功音效
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
        playSound('error'); // 修复：错误音效
        const cursor = document.querySelector('.char-cursor');
        if(cursor) {
            cursor.classList.add('char-error');
            setTimeout(() => cursor.classList.remove('char-error'), 300);
        }
    }
}

// =======================
// 4. 🗂️ 分类工作台 (音频修复)
// =======================
let gameWords = [], selectedWordIdx = null, gameTimer = null, gameSeconds = 0;

window.startSortingGame = function(mode) {
    const data = DEMO_DATA[mode] || DEMO_DATA.profession;
    gameWords = JSON.parse(JSON.stringify(data.words));
    gameWords = shuffleArray(gameWords);
    
    switchView('sorting');
    
    const basketContainer = document.getElementById('sorting-baskets');
    basketContainer.innerHTML = '';
    data.baskets.forEach(b => {
        const div = document.createElement('div');
        div.className = 'basket';
        div.innerHTML = `<div class="basket-icon">${b.icon}</div><div class="basket-label">${b.label}</div>`;
        div.onclick = () => handleBasketClick(b.id, div);
        basketContainer.appendChild(div);
    });

    renderSortingGrid();
    
    // Reset Sidebar
    document.getElementById('sidebar-result').classList.add('hidden');
    document.getElementById('game-search-input').value = '';
    document.getElementById('total-game-words').textContent = gameWords.length;
    startGameTimer();
}

function renderSortingGrid() {
    const grid = document.getElementById('sorting-grid');
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
                // 修复 2：选中时朗读
                playSound('click');
                speakWord(item.word); 
                
                selectedWordIdx = index;
                renderSortingGrid();
            };
            if(selectedWordIdx === index) div.classList.add('selected');
        }
        grid.appendChild(div);
    });
    
    document.getElementById('sort-progress').textContent = `剩余: ${remaining}`;
    
    if(remaining === 0) {
        stopGameTimer();
        const btn = document.getElementById('btn-finish-game');
        btn.disabled = false;
        btn.className = 'btn-active';
    }
}

function handleBasketClick(basketId, el) {
    if(selectedWordIdx === null) return alert("请先选中一个单词");
    const w = gameWords[selectedWordIdx];
    
    if(w.category === basketId) {
        playSound('correct'); // 分类正确音效
        w.sorted = true;
        selectedWordIdx = null;
        renderSortingGrid();
    } else {
        playSound('error'); // 分类错误音效
        const card = document.getElementById('sorting-grid').children[selectedWordIdx];
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
    }
}

// 修复 3：侧边栏查词显示例句
document.getElementById('btn-game-search').onclick = () => {
    const term = document.getElementById('game-search-input').value.trim().toLowerCase();
    if(!term) return;
    
    const found = gameWords.find(w => w.word.toLowerCase() === term);
    
    if(found) {
        document.getElementById('sidebar-result').classList.remove('hidden');
        document.getElementById('res-word').textContent = found.word;
        document.getElementById('res-phonetic').textContent = found.phonetic;
        document.getElementById('res-def').textContent = found.definition;
        
        // 显示例句
        document.getElementById('res-example').textContent = found.example || "No example.";
        
        document.getElementById('btn-res-audio').onclick = () => speakWord(found.word);
    } else {
        alert("词库中未找到，请检查拼写。");
    }
};

function startGameTimer() {
    stopGameTimer();
    gameSeconds = 0;
    document.getElementById('btn-finish-game').disabled = true;
    document.getElementById('btn-finish-game').className = 'btn-disabled';
    
    gameTimer = setInterval(() => {
        gameSeconds++;
        const m = Math.floor(gameSeconds/60).toString().padStart(2,'0');
        const s = (gameSeconds%60).toString().padStart(2,'0');
        document.getElementById('game-timer').textContent = `${m}:${s}`;
        
        let starStr = "⭐⭐⭐";
        if(gameSeconds > 40) starStr = "⭐⭐";
        if(gameSeconds > 80) starStr = "⭐";
        document.getElementById('star-display').textContent = starStr;
    }, 1000);
}
function stopGameTimer() { if(gameTimer) clearInterval(gameTimer); }
window.checkGameFinish = function() {
    const stars = document.getElementById('star-display').textContent;
    alert(`恭喜！\n评级: ${stars}\n耗时: ${document.getElementById('game-timer').textContent}`);
    switchView('sort-menu');
}

// =======================
// 5. 辅助与事件
// =======================
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }
function renderNotebook() {
    const list = document.getElementById('notebook-list');
    const d = JSON.parse(localStorage.getItem('myCatNotebook'))||[];
    list.innerHTML = d.map(i => `<li>${i.word} - ${i.definition}</li>`).join('') || '<li>空</li>';
}
function renderLibrary() { /* ... */ }

// 事件绑定
document.getElementById('nav-home').onclick = () => switchView('home');
document.getElementById('nav-sort').onclick = () => switchView('sort-menu');
document.getElementById('nav-typing').onclick = () => switchView('typing');
document.getElementById('nav-notebook').onclick = () => switchView('notebook');
document.getElementById('nav-library').onclick = () => switchView('library');
document.getElementById('btn-next').onclick = () => { currentIndex++; loadWord(currentIndex); };
document.getElementById('btn-audio').onclick = () => speakWord(document.querySelector('.word').textContent);
document.getElementById('btn-save').onclick = () => {
    let nb = JSON.parse(localStorage.getItem('myCatNotebook'))||[];
    nb.push(vocabList[currentIndex]);
    localStorage.setItem('myCatNotebook', JSON.stringify(nb));
};
document.getElementById('btn-reveal').onclick = () => document.querySelector('.definition').classList.remove('hidden');

document.getElementById('typing-view').onclick = () => document.getElementById('ql-hidden-input').focus();

initApp();
