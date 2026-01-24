/**
 * IELTS Cat Vocab App - v6.0 Ultimate
 * 功能：首页、背词、拼写(红字)、分类游戏(侧边栏/计时/星星/抖动)、音频修复
 */

// =======================
// 1. 初始化变量与音频
// =======================
let vocabList = [];
let currentIndex = 0;

// 音频文件 (wav格式)
const sfxClick = new Audio('public_sounds_click.wav');
const sfxCorrect = new Audio('public_sounds_correct.wav');
const sfxError = new Audio('public_sounds_beep.wav');
// 预加载音量
[sfxClick, sfxCorrect, sfxError].forEach(s => s.volume = 0.5);

// 演示数据 (保证分类功能可用)
const DEMO_DATA = {
    profession: {
        baskets: [
            { id: 'medical', label: '医疗', icon: '🏥' },
            { id: 'legal', label: '法律', icon: '⚖️' },
            { id: 'kitchen', label: '烹饪', icon: '🍳' }
        ],
        words: [
            { word: 'Symptom', definition: '症状', category: 'medical', example: 'Flu symptoms include fever.', phonetic: '/ˈsɪmp.təm/' },
            { word: 'Verdict', definition: '裁决', category: 'legal', example: 'The jury reached a verdict.', phonetic: '/ˈvɜː.dɪkt/' },
            { word: 'Recipe', definition: '食谱', category: 'kitchen', example: 'A recipe for cake.', phonetic: '/ˈres.ɪ.pi/' },
            { word: 'Surgeon', definition: '外科医生', category: 'medical', example: 'The surgeon operated.', phonetic: '/ˈsɜː.dʒən/' },
            { word: 'Penalty', definition: '惩罚', category: 'legal', example: 'Death penalty.', phonetic: '/ˈpen.əl.ti/' },
            { word: 'Ingredient', definition: '原料', category: 'kitchen', example: 'Mix ingredients.', phonetic: '/ɪnˈɡriː.di.ənt/' }
        ]
    },
    sentiment: {
        baskets: [
            { id: 'positive', label: '积极', icon: '😄' },
            { id: 'negative', label: '消极', icon: '☹️' }
        ],
        words: [
            { word: 'Joyful', definition: '快乐的', category: 'positive', example: 'A joyful day.', phonetic: '/ˈdʒɔɪ.fəl/' },
            { word: 'Tragic', definition: '悲惨的', category: 'negative', example: 'A tragic accident.', phonetic: '/ˈtrædʒ.ɪk/' }
        ]
    }
};

// =======================
// 2. 核心功能启动
// =======================
async function initApp() {
    try {
        const response = await fetch('words.json');
        if (response.ok) {
            vocabList = await response.json();
            vocabList = shuffleArray(vocabList);
            loadWord(currentIndex, false);
        }
    } catch (e) { 
        console.log("No external words.json, using default state."); 
    }
}

// 视图切换
function switchView(viewName) {
    // 隐藏所有 section
    document.querySelectorAll('main > div, main > section').forEach(el => el.classList.add('hidden'));
    document.removeEventListener('keydown', handleDesktopTyping);
    stopGameTimer(); // 切换视图时停止计时

    const viewMap = {
        'home': 'home-view',
        'sort-menu': 'sort-menu-view',
        'sorting': 'sorting-view',
        'typing': 'typing-view',
        'notebook': 'notebook-view',
        'library': 'library-view'
    };

    const targetId = viewMap[viewName];
    if(targetId) {
        document.getElementById(targetId).classList.remove('hidden');
        if(targetId === 'home-view') document.getElementById('home-view').style.display = 'flex';
    }

    // 特定初始化
    if(viewName === 'typing') {
        document.addEventListener('keydown', handleDesktopTyping);
        startTypingMode();
    } else if (viewName === 'notebook') {
        renderNotebook();
    } else if (viewName === 'library') {
        renderLibrary();
    }
}

// =======================
// 3. 背单词逻辑
// =======================
function loadWord(index, autoSpeak=true) {
    if(!vocabList.length) return;
    if(index >= vocabList.length) index = 0;
    const data = vocabList[index];
    
    document.querySelector('.word').textContent = data.word;
    document.querySelector('.phonetic').textContent = data.phonetic || '';
    document.querySelector('.definition p').textContent = data.definition;
    document.querySelector('.example').textContent = data.example || '';
    document.querySelector('.definition').classList.add('hidden');
    
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

// =======================
// 4. 拼写练习 (红字功能)
// =======================
let typingIndex = 0; let currentInput = "";

function startTypingMode() {
    typingIndex = 0;
    loadTypingWord();
}

function loadTypingWord() {
    if(!vocabList.length) return;
    if(typingIndex >= vocabList.length) { typingIndex = 0; alert("练习结束！"); return; }
    
    currentInput = "";
    const target = vocabList[typingIndex];
    document.getElementById('mobile-input').value = "";
    document.getElementById('mobile-input').focus();
    document.getElementById('typing-progress').textContent = `${typingIndex+1}/${vocabList.length}`;
    document.getElementById('typing-translation').textContent = target.definition;
    renderTypingWord(target.word, "");
}

function renderTypingWord(word, input) {
    const display = document.getElementById('target-word-display');
    display.innerHTML = '';
    
    // 遍历正确单词的每一个字母
    for (let i = 0; i < word.length; i++) {
        const span = document.createElement('span');
        const correctChar = word[i];
        const inputChar = input[i];

        if (inputChar === undefined) {
            // 还没输入到的位置
            span.textContent = correctChar;
            if (i === input.length) span.className = 'char-current'; // 光标
        } else {
            // 已经输入了
            if (inputChar.toLowerCase() === correctChar.toLowerCase()) {
                // 输入正确
                span.textContent = correctChar;
                span.className = 'char-correct';
            } else {
                // 输入错误 -> 显示用户输入的那个错字，并标红
                span.textContent = inputChar; 
                span.className = 'char-error';
            }
        }
        display.appendChild(span);
    }
}

function processTypingInput(key) {
    if(!vocabList.length) return;
    const targetWord = vocabList[typingIndex].word;

    if (key === 'Backspace') {
        currentInput = currentInput.slice(0, -1);
        playSound(sfxClick);
    } else if (currentInput.length < targetWord.length) {
        currentInput += key;
        
        // 实时音效反馈
        const currentIndex = currentInput.length - 1;
        if (key.toLowerCase() === targetWord[currentIndex].toLowerCase()) {
            playSound(sfxClick);
        } else {
            playSound(sfxError); // 输错了，播放错误音
        }
    }

    renderTypingWord(targetWord, currentInput);

    // 检查是否完成且完全正确
    if (currentInput.length === targetWord.length) {
        if (currentInput.toLowerCase() === targetWord.toLowerCase()) {
            playSound(sfxCorrect);
            setTimeout(() => {
                typingIndex++;
                loadTypingWord();
            }, 500);
        }
    }
}

function handleDesktopTyping(e) {
    if(e.key.length === 1 && !e.ctrlKey && !e.metaKey) processTypingInput(e.key);
    if(e.key === 'Backspace') processTypingInput('Backspace');
}

// =======================
// 5. 分类游戏 (核心更新)
// =======================
let gameWords = [];
let selectedWordIdx = null;
let gameTimerInterval = null;
let gameSeconds = 0;
let gameTotalWords = 0;

// 开始游戏
window.startSortingGame = function(mode) {
    const data = DEMO_DATA[mode];
    gameWords = JSON.parse(JSON.stringify(data.words));
    gameWords = shuffleArray(gameWords);
    gameTotalWords = gameWords.length;
    
    // 初始化界面
    switchView('sorting');
    renderSortingBaskets(data.baskets);
    renderSortingGrid();
    updateGameProgress();
    
    // 重置并启动计时器
    gameSeconds = 0;
    document.getElementById('game-timer').textContent = "00:00";
    document.getElementById('star-display').textContent = "⭐⭐⭐";
    document.getElementById('btn-finish-game').className = "btn-disabled";
    document.getElementById('btn-finish-game').disabled = true;
    
    startGameTimer();
}

function startGameTimer() {
    stopGameTimer();
    gameTimerInterval = setInterval(() => {
        gameSeconds++;
        const mins = Math.floor(gameSeconds / 60).toString().padStart(2, '0');
        const secs = (gameSeconds % 60).toString().padStart(2, '0');
        document.getElementById('game-timer').textContent = `${mins}:${secs}`;
        
        // 动态更新星星 (假设每10秒扣一颗星逻辑，仅为演示)
        // 实际逻辑：0-20s 三星, 20-40s 二星, >40s 一星
        let stars = "⭐";
        if (gameSeconds < 20) stars = "⭐⭐⭐";
        else if (gameSeconds < 40) stars = "⭐⭐";
        document.getElementById('star-display').textContent = stars;
        
    }, 1000);
}

function stopGameTimer() {
    if(gameTimerInterval) clearInterval(gameTimerInterval);
}

function renderSortingBaskets(baskets) {
    const container = document.getElementById('sorting-baskets');
    container.innerHTML = '';
    baskets.forEach(b => {
        const div = document.createElement('div');
        div.className = 'basket';
        div.innerHTML = `<div class="basket-icon">${b.icon}</div><div class="basket-label">${b.label}</div>`;
        div.onclick = () => handleBasketClick(b.id, div);
        container.appendChild(div);
    });
}

function renderSortingGrid() {
    const grid = document.getElementById('sorting-grid');
    grid.innerHTML = '';
    gameWords.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'sort-card';
        div.textContent = item.word;
        
        if(item.sorted) {
            div.classList.add('ghost');
        } else {
            div.onclick = () => handleWordSelect(index);
            if(selectedWordIdx === index) div.classList.add('selected');
        }
        grid.appendChild(div);
    });
}

// 侧边栏详情展示
function renderSidebar(wordObj) {
    const content = document.getElementById('sidebar-content');
    content.innerHTML = `
        <span class="sidebar-word">${wordObj.word}</span>
        <span class="sidebar-phonetic">${wordObj.phonetic || ''}</span>
        <p><strong>释义：</strong>${wordObj.definition}</p>
        <p><strong>例句：</strong>${wordObj.example || '暂无例句'}</p>
    `;
}

function handleWordSelect(index) {
    playSound(sfxClick);
    selectedWordIdx = index;
    renderSortingGrid(); // 刷新高亮
    renderSidebar(gameWords[index]); // 刷新侧边栏
    speakWord(gameWords[index].word); // 朗读
}

function handleBasketClick(basketId, basketEl) {
    if(selectedWordIdx === null) return alert("请先点击上方的一个单词！");
    
    const wordObj = gameWords[selectedWordIdx];
    
    if(wordObj.category === basketId) {
        // ✅ 正确
        playSound(sfxCorrect); // 正确音效
        wordObj.sorted = true;
        selectedWordIdx = null;
        renderSortingGrid();
        updateGameProgress();
    } else {
        // ❌ 错误
        playSound(sfxError); // 错误音效
        const cardEl = document.getElementById('sorting-grid').children[selectedWordIdx];
        cardEl.classList.add('shake'); // 原地抖动
        setTimeout(() => cardEl.classList.remove('shake'), 500);
    }
}

function updateGameProgress() {
    const remaining = gameWords.filter(w => !w.sorted).length;
    document.getElementById('sort-progress').textContent = `剩余: ${remaining}`;
    
    // 检查是否全部完成
    if(remaining === 0) {
        stopGameTimer();
        const btn = document.getElementById('btn-finish-game');
        btn.className = "btn-active"; // 按钮变色
        btn.disabled = false;
        btn.textContent = "🎉 完成！点击领奖";
        playSound(sfxCorrect);
    }
}

window.checkGameFinish = function() {
    const stars = document.getElementById('star-display').textContent;
    const time = document.getElementById('game-timer').textContent;
    alert(`恭喜完成！\n\n最终评级：${stars}\n耗时：${time}\n\n太棒了，继续加油！`);
    switchView('sort-menu');
}

// =======================
// 6. 辅助功能
// =======================
function playSound(audio) {
    try { audio.currentTime = 0; audio.play().catch(()=>{}); } catch(e){}
}
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }

// 生词本与库 (简化逻辑)
function renderNotebook() {
    const list = document.getElementById('notebook-list');
    const data = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    list.innerHTML = data.length ? '' : '<li>空空如也</li>';
    data.forEach(w => {
        const li = document.createElement('li');
        li.textContent = `${w.word} - ${w.definition}`;
        list.appendChild(li);
    });
}
function renderLibrary() { /* ...同上，略... */ }

// =======================
// 7. 事件监听
// =======================
document.getElementById('nav-home').onclick = () => switchView('home');
document.getElementById('nav-sort').onclick = () => switchView('sort-menu');
document.getElementById('nav-typing').onclick = () => switchView('typing');
document.getElementById('nav-notebook').onclick = () => switchView('notebook');
document.getElementById('nav-library').onclick = () => switchView('library');

document.getElementById('btn-next').onclick = () => { currentIndex++; loadWord(currentIndex); };
document.getElementById('btn-audio').onclick = () => speakWord(document.querySelector('.word').textContent);
document.getElementById('btn-save').onclick = () => {
    const w = vocabList[currentIndex];
    let nb = JSON.parse(localStorage.getItem('myCatNotebook')) || [];
    nb.push(w);
    localStorage.setItem('myCatNotebook', JSON.stringify(nb));
    alert("已保存");
};
document.getElementById('btn-reveal').onclick = () => document.querySelector('.definition').classList.remove('hidden');

// 手机打字监听
document.getElementById('mobile-input').addEventListener('input', (e) => {
    if(e.inputType === 'deleteContentBackward') processTypingInput('Backspace');
    else if(e.data) processTypingInput(e.data.slice(-1));
});
document.getElementById('typing-view').onclick = () => document.getElementById('mobile-input').focus();

initApp();
