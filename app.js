/**
 * IELTS Cat Vocab App - v7.0 Qwerty & Active Search
 * - 拼写：Qwerty Learner 风格 (逐字检查，错误阻塞)
 * - 游戏：20+单词网格，侧边栏主动查词
 */

// =======================
// 1. 数据与音频
// =======================
let vocabList = [];
let currentIndex = 0;

const sfxClick = new Audio('public_sounds_click.wav');
const sfxCorrect = new Audio('public_sounds_correct.wav');
const sfxError = new Audio('public_sounds_beep.wav');
[sfxClick, sfxCorrect, sfxError].forEach(s => s.volume = 0.5);

// 扩充的演示数据 (确保 > 20 个词)
const DEMO_DATA = {
    profession: {
        baskets: [
            { id: 'medical', label: '医疗', icon: '🏥' },
            { id: 'legal', label: '法律', icon: '⚖️' },
            { id: 'kitchen', label: '烹饪', icon: '🍳' }
        ],
        words: [
            // Medical (8)
            { word: 'Symptom', definition: '症状', category: 'medical', phonetic: '/ˈsɪmp.təm/' },
            { word: 'Surgeon', definition: '外科医生', category: 'medical', phonetic: '/ˈsɜː.dʒən/' },
            { word: 'Diagnose', definition: '诊断', category: 'medical', phonetic: '/ˈdaɪ.əɡ.nəʊz/' },
            { word: 'Vaccine', definition: '疫苗', category: 'medical', phonetic: '/ˈvæk.siːn/' },
            { word: 'Epidemic', definition: '流行病', category: 'medical', phonetic: '/ˌep.ɪˈdem.ɪk/' },
            { word: 'Therapy', definition: '疗法', category: 'medical', phonetic: '/ˈθer.ə.pi/' },
            { word: 'Pharmacy', definition: '药房', category: 'medical', phonetic: '/ˈfɑː.mə.si/' },
            { word: 'Chronic', definition: '慢性的', category: 'medical', phonetic: '/ˈkrɒn.ɪk/' },
            // Legal (8)
            { word: 'Verdict', definition: '裁决', category: 'legal', phonetic: '/ˈvɜː.dɪkt/' },
            { word: 'Penalty', definition: '惩罚', category: 'legal', phonetic: '/ˈpen.əl.ti/' },
            { word: 'Accuse', definition: '指控', category: 'legal', phonetic: '/əˈkjuːz/' },
            { word: 'Attorney', definition: '律师', category: 'legal', phonetic: '/əˈtɜː.ni/' },
            { word: 'Justice', definition: '正义', category: 'legal', phonetic: '/ˈdʒʌs.tɪs/' },
            { word: 'Fraud', definition: '欺诈', category: 'legal', phonetic: '/frɔːd/' },
            { word: 'Witness', definition: '证人', category: 'legal', phonetic: '/ˈwɪt.nəs/' },
            { word: 'Sue', definition: '起诉', category: 'legal', phonetic: '/suː/' },
            // Kitchen (8)
            { word: 'Recipe', definition: '食谱', category: 'kitchen', phonetic: '/ˈres.ɪ.pi/' },
            { word: 'Ingredient', definition: '原料', category: 'kitchen', phonetic: '/ɪnˈɡriː.di.ənt/' },
            { word: 'Cuisine', definition: '烹饪', category: 'kitchen', phonetic: '/kwɪˈziːn/' },
            { word: 'Utensil', definition: '器皿', category: 'kitchen', phonetic: '/juːˈten.sɪl/' },
            { word: 'Roast', definition: '烤', category: 'kitchen', phonetic: '/rəʊst/' },
            { word: 'Feast', definition: '盛宴', category: 'kitchen', phonetic: '/fiːst/' },
            { word: 'Spice', definition: '香料', category: 'kitchen', phonetic: '/spaɪs/' },
            { word: 'Kettle', definition: '水壶', category: 'kitchen', phonetic: '/ˈket.əl/' }
        ]
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
    } catch(e) { console.log("Using default/demo data only"); }
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
        document.getElementById('ql-hidden-input').focus(); // 激活手机键盘
    } else if (view === 'notebook') renderNotebook();
    else if (view === 'library') renderLibrary();
}

function loadWord(idx, speak=true) {
    if(!vocabList.length) return;
    if(idx >= vocabList.length) idx = 0;
    const d = vocabList[idx];
    document.querySelector('.word').textContent = d.word;
    document.querySelector('.phonetic').textContent = d.phonetic || '';
    document.querySelector('.definition p').textContent = d.definition;
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
// 3. ⌨️ Qwerty Learner 风格逻辑 (核心重写)
// =======================
let qlQueue = [];
let qlWordIdx = 0;
let qlCharIdx = 0;
let qlCorrectCount = 0;
let qlStartTime = 0;

function initQlTyping() {
    // 准备一组词 (20个)
    qlQueue = vocabList.length ? [...vocabList].slice(0, 20) : [...DEMO_DATA.profession.words].slice(0, 20);
    qlWordIdx = 0;
    qlCharIdx = 0;
    qlCorrectCount = 0;
    qlStartTime = Date.now();
    renderQlWord();
}

function renderQlWord() {
    if(qlWordIdx >= qlQueue.length) { alert("练习完成！"); switchView('home'); return; }
    
    const wordData = qlQueue[qlWordIdx];
    const wordStr = wordData.word;
    const container = document.getElementById('ql-word-display');
    const transEl = document.getElementById('ql-translation');
    
    container.innerHTML = '';
    
    // 渲染每一个字母
    for(let i=0; i<wordStr.length; i++) {
        const span = document.createElement('span');
        span.textContent = wordStr[i];
        
        if (i < qlCharIdx) {
            span.className = 'char-correct'; // 已经打对的
        } else if (i === qlCharIdx) {
            span.className = 'char-pending char-cursor'; // 当前光标
        } else {
            span.className = 'char-pending'; // 还没打到的
        }
        container.appendChild(span);
    }

    // 更新统计
    document.getElementById('ql-progress').textContent = `${qlWordIdx+1}/${qlQueue.length}`;
    
    // 显示释义 (可选：打完才显示，或者一直显示，这里设定一直显示但淡化)
    transEl.textContent = wordData.definition;
    transEl.classList.add('visible');
}

function handleQlTyping(e) {
    // 忽略非字符键 (Shift, Ctrl, etc.)
    if (e.key.length > 1) return;
    
    const currentWord = qlQueue[qlWordIdx].word;
    const targetChar = currentWord[qlCharIdx];

    // 1. 匹配正确
    if (e.key.toLowerCase() === targetChar.toLowerCase()) {
        playSound(sfxClick);
        qlCharIdx++;
        qlCorrectCount++;
        
        // 计算 WPM
        const minutes = (Date.now() - qlStartTime) / 60000;
        const wpm = Math.round((qlCorrectCount / 5) / (minutes || 0.01));
        document.getElementById('ql-wpm').textContent = wpm;

        // 单词完成？
        if (qlCharIdx >= currentWord.length) {
            playSound(sfxCorrect);
            speakWord(currentWord);
            // 延迟一点切下一个
            setTimeout(() => {
                qlWordIdx++;
                qlCharIdx = 0;
                renderQlWord();
            }, 200);
        } else {
            renderQlWord();
        }
    } 
    // 2. 匹配错误 (阻塞模式)
    else {
        playSound(sfxError);
        // 视觉反馈：让当前光标变红一下
        const cursorSpan = document.querySelector('.char-cursor');
        if(cursorSpan) {
            cursorSpan.classList.add('char-error');
            setTimeout(() => cursorSpan.classList.remove('char-error'), 300);
        }
    }
}

// =======================
// 4. 🗂️ 分类工作台 (Active Search)
// =======================
let gameWords = [];
let selectedWordIdx = null;
let gameTimer = null;
let gameSeconds = 0;

window.startSortingGame = function(mode) {
    const data = DEMO_DATA[mode] || DEMO_DATA.profession;
    gameWords = JSON.parse(JSON.stringify(data.words));
    gameWords = shuffleArray(gameWords);
    
    switchView('sorting');
    
    // 渲染篮筐
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
    
    // 初始化侧边栏和计时
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
                // 选中逻辑
                playSound(sfxClick);
                selectedWordIdx = index;
                renderSortingGrid();
                // 注意：这里不再自动展示释义，需要用户去右边查
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
        playSound(sfxCorrect);
        w.sorted = true;
        selectedWordIdx = null;
        renderSortingGrid();
    } else {
        playSound(sfxError);
        const card = document.getElementById('sorting-grid').children[selectedWordIdx];
        card.classList.add('shake');
        setTimeout(() => card.classList.remove('shake'), 400);
    }
}

// 主动查词逻辑
document.getElementById('btn-game-search').onclick = () => {
    const term = document.getElementById('game-search-input').value.trim().toLowerCase();
    if(!term) return;
    
    // 在游戏词库里找
    const found = gameWords.find(w => w.word.toLowerCase() === term);
    
    if(found) {
        document.getElementById('sidebar-result').classList.remove('hidden');
        document.getElementById('res-word').textContent = found.word;
        document.getElementById('res-phonetic').textContent = found.phonetic;
        document.getElementById('res-def').textContent = found.definition;
        document.getElementById('res-example').textContent = found.example || "No example.";
        document.getElementById('btn-res-audio').onclick = () => speakWord(found.word);
    } else {
        alert("词库中未找到该词，请检查拼写。");
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
// 5. 其他辅助
// =======================
function playSound(audio) { try{ audio.currentTime=0; audio.play().catch(()=>{}); }catch(e){} }
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }
function renderNotebook() {
    const list = document.getElementById('notebook-list');
    const d = JSON.parse(localStorage.getItem('myCatNotebook'))||[];
    list.innerHTML = d.map(i => `<li>${i.word} - ${i.definition}</li>`).join('') || '<li>空</li>';
}
function renderLibrary() { /* 略 */ }

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

// 手机键盘支持
document.getElementById('typing-view').onclick = () => document.getElementById('ql-hidden-input').focus();

initApp();
