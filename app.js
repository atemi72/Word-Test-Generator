// バージョン管理
const APP_VERSION = "v1.1.0 (2026-06-06)";
const CHANGELOG_TITLE = "アプリの更新内容"
const CHANGELOG = {
    "v0.10.0 (2025-11-06)": [
    "記述式（空欄）を基本に、2列レイアウト対応",
    "別タブで印刷ページ生成"
  ],
    "v0.11.0 (2025-11-06)": [
    "タイトル中央／作成日の表示",
    "各設問にCSV行番号を併記",
    "解答を各設問の欄に直接表示できるように"
  ],
  "v0.12.0 (2025-11-07)": [
    "タイトル/作成日をヘッダー上部へ移動",
    "拡張子.csvを除いたタイトル表示に変更",
    "問題用紙と解答用紙を2ページで同時表示・印刷に対応",
    "バージョン表示をクリックで変更履歴を表示"
  ],
    "v0.13.0 (2025-11-07)": [
    "ライブラリ管理の安定化：タイムアウト・再リンク・削除機能の追加",
    "キャッシュ自動フォールバック対応（ファイル権限切れ時でも動作）",
    "フォルダ登録ボタンを廃止し、単一登録方式に統一",
    "ライブラリ検証/修復ボタンの追加（全語彙帳を一括チェック）"
  ],
    "v0.14.0 (2025-11-10)": [
    "問題印刷ページのデザイン一新",
    "ライブラリ機能廃止→毎回CSVを選択するセッション方式へ",
    "ランダム機能の不具合修正",
    "その他デザインの修正"
  ],
    "v0.15.0 (2025-11-11)":[
    "まとめて作成機能実装",
    "まとめて作成機能実装に伴うテスト作成ページのレイアウト変更"
  ],
    "v0.16.0 (2025-11-20)":[
    "?ボタン実装"
  ],
    "v0.17.0 (2025-12-23)":[
    "UI改善",
    "軽微なバグ修正"
  ],
    "v0.18.0 (2025-12-25)":[
    "既定フォルダ機能削除"
  ],
    "v0.19.0 (2026-02-04)":[
    "ショートカットキー実装"
  ],
    "v1.0.0 (2026-03-16)":[
    "正式リリース"
  ],
    "v1.1.0 (2026-06-06)":[
    "社会モード実装(調整中)"
  ]
};

// ユーティリティ 
const $ = (s)=>document.querySelector(s);
const $$ = (s)=>Array.from(document.querySelectorAll(s));

function clearErrors(){
  ['rangeError','numError','socialV2Error'].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = '';
  });
  ['idxFrom','idxTo','numQuestions'].forEach(id=>{
    const inp = document.getElementById(id);
    if(inp) inp.classList.remove('field-error');
  });
}

function setError(id, msg, inputIds){
  const el = document.getElementById(id);
  if(el) el.textContent = msg || '';
  (inputIds || []).forEach(fid=>{
    const inp = document.getElementById(fid);
    if(inp) inp.classList.add('field-error');
  });
}

function hashStringToInt(str){ 
  let h=1779033703^str.length; 
  for(let i=0;i<str.length;i++){
    h=Math.imul(h^str.charCodeAt(i),3432918353); 
    h=h<<13|h>>>19} 
  return (h>>>0) 
}

function mulberry32(a){
  return function(){
    let t=a+=0x6D2B79F5; 
    t=Math.imul(t^t>>>15,t|1); 
    t^=t+Math.imul(t^t>>>7,t|61); 
    return ((t^t>>>14)>>>0)/4294967296}
}

function rngWithSeed(seed){
  return mulberry32(hashStringToInt(seed+""));
}

// シャッフル機能
function shuffle(arr, rnd=Math.random){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(rnd()*(i+1)); 
    [arr[i],arr[j]]=[arr[j],arr[i]]} 
  return arr
}

// 配列から n 件サンプルを取る（ランダムならシャッフルして先頭から）
function pickSample(arr, n, random, rnd){
  const c = arr.slice(0);
  if (random) shuffle(c, rnd || Math.random);
  return c.slice(0, Math.min(n, c.length));
}

function chunkRanges(from, to, size){
  const out = [];
  for(let s = from; s <= to; s += size){
    const e = Math.min(s + size - 1, to);
    out.push([s, e]);
  }
  return out;
}

function escapeHtml(s){ 
  return (s||'').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m])); 
}

// 読み込みにタイムアウトを付ける
function withTimeout(promise, ms, label='操作'){
  return new Promise((resolve, reject)=>{
    const t = setTimeout(()=>reject(new Error(`${label}のタイムアウト(${ms}ms)`)), ms);
    promise.then(v=>{ clearTimeout(t); resolve(v); }, e=>{ clearTimeout(t); reject(e); });
  });
}

// Robust CSV/TSV parser supporting quotes and newlines inside quoted fields
function parseDelimited(text){
   const firstLine = text.split(/\r?\n/)[0] || "";
  const delim = (firstLine.match(/\t/g)||[]).length > (firstLine.match(/,/g)||[]).length ? "\t" : ",";

  const rows = [];
  let i = 0, len = text.length;
  let field = "", row = [];
  let inQuotes = false, c;

  function endField(){ row.push(field); field = ""; }
  function endRow(){ rows.push(row); row = []; }

  while(i < len){
    c = text[i++];

    if(inQuotes){
      if(c === '"'){
        if(text[i] === '"'){ field += '"'; i++; }  
        else { inQuotes = false; }
      }else{
        field += c;
      }
    }else{
      if(c === '"'){ inQuotes = true; }
      else if(c === delim){ endField(); }
      else if(c === '\n'){ endField(); endRow(); }  // ← 改行は \n を見る
      else if(c === '\r'){ /* CR は無視（\r\n 両対応）*/ }
      else { field += c; }
    }
  }

  // 最終フィールド・最終行の flush
  if(field !== "" || row.length > 0){ endField(); endRow(); }
  // 末尾の空行を削除
  while(rows.length && rows[rows.length-1].every(v => v === "")) rows.pop();

  return { rows, delim };
}

function autoHeaders(rows) {
  if (!rows.length) {
    return { headers: [], data: [], firstDataLine: 1 };
  }

  const first = rows[0].map(s =>
    s.replace(/^\uFEFF/, '').trim()
  );

  const knownHeaders = new Set([
    'word', 'term', 'english', '英語', '単語',
    'meaning', 'translation', 'japanese',
    '日本語', '意味',
    'question', 'answer', '問題文', '解答'
  ]);

  const hasHeader =
    first.length >= 2 &&
    first.slice(0, 2).every(h =>
      knownHeaders.has(h.toLowerCase())
    );

  if (hasHeader) {
    return {
      headers: first,
      data: rows.slice(1),
      firstDataLine: 2
    };
  }

  return {
    headers: first.map((_, i) => `col${i + 1}`),
    data: rows,
    firstDataLine: 1
  };
}

function toObjects(headers, rows, firstDataLine = 1) {
  return rows.map((r, idx) => {
    const o = { __row: idx + firstDataLine };

    headers.forEach((h, i) => {
      o[h] = (r[i] || '').trim();
    });

    return o;
  });
}

function normalizeHeaderName(s){
  return (s || '').trim().toLowerCase().replace(/\s+/g, '');
}

function detectSocialDataFormat(rows, preferSocialV2 = false){
  if(!rows || !rows.length) return { version:'v1', hasHeader:false };
  const first = rows[0].map(s=>normalizeHeaderName(s));
  const required6 = ['章','節','項','番号','問題文','解答'];
  const required5 = ['章','節','番号','問題文','解答'];
  const socialStructureHeaders = ['章','節','項','番号'];
  if(required6.every(name=>first.includes(name))) return { version:'v2', hasHeader:true, columnCount:6 };
  if(required5.every(name=>first.includes(name))) return { version:'v2', hasHeader:true, columnCount:5 };
  if(socialStructureHeaders.some(name=>first.includes(name))) return { version:'v2', hasHeader:true, columnCount:first.includes('項') ? 6 : 5 };
  if(rows[0].length >= 6) return { version:'v2', hasHeader:false, columnCount:6 };
  if(rows[0].length === 5) return { version:'v2', hasHeader:false, columnCount:5 };
  if(preferSocialV2 && rows[0].length >= 3) return { version:'v2', hasHeader:false, columnCount:6 };
  return { version:'v1', hasHeader:false };
}

function cell(row, index){
  return index >= 0 ? (row[index] || '').trim() : '';
}

function parseSocialV2Rows(rows, detection){
  const hasHeader = !!detection?.hasHeader;
  const header = hasHeader ? rows[0].map(s=>normalizeHeaderName(s)) : [];
  const start = hasHeader ? 1 : 0;
  const columnCount = detection?.columnCount || 6;
  const hasItemColumn = columnCount >= 6;
  const idx = (name, fallback)=> hasHeader ? header.indexOf(name) : fallback;
  const col = {
    chapter: idx('章', 0),
    section: idx('節', 1),
    item: hasItemColumn ? idx('項', 2) : -1,
    localNumber: idx('番号', hasItemColumn ? 3 : 2),
    question: idx('問題文', hasItemColumn ? 4 : 3),
    answer: idx('解答', hasItemColumn ? 5 : 4)
  };

  let chapter = '';
  let section = '';
  let item = hasItemColumn ? '' : '未分類';
  const out = [];
  const warnings = [];

  for(let i = start; i < rows.length; i++){
    const row = rows[i];
    const rawChapter = cell(row, col.chapter);
    const rawSection = cell(row, col.section);
    const rawItem = hasItemColumn ? cell(row, col.item) : '';
    if(rawChapter) chapter = rawChapter;
    if(rawSection) section = rawSection;
    if(hasItemColumn && rawItem) item = rawItem;

    const localNumber = cell(row, col.localNumber);
    const question = cell(row, col.question);
    const answer = cell(row, col.answer);
    const displayRow = i + 1;

    if(!question && !answer){
      if(row.some(v=>(v || '').trim())) warnings.push(`${displayRow}行目: 問題文と解答が空欄のためスキップしました。`);
      continue;
    }
    const missing = [];
    if(!chapter) missing.push('章');
    if(!section) missing.push('節');
    if(!item) missing.push('項');
    if(!localNumber) missing.push('番号');
    if(!question) missing.push('問題文');
    if(!answer) missing.push('解答');
    if(missing.length) warnings.push(`${displayRow}行目: ${missing.join('・')}が空欄です。`);
    if(row.length > (hasItemColumn ? 6 : 5)) warnings.push(`${displayRow}行目: 余分な列は無視しました。`);

    out.push({
      __row: displayRow,
      globalIndex: out.length + 1,
      chapter,
      section,
      item,
      localNumber,
      question,
      answer
    });
  }

  out.warnings = warnings;
  return out;
}

function buildSocialV2Index(items){
  const chapters = [];
  const chapterMap = new Map();
  items.forEach(item=>{
    if(!chapterMap.has(item.chapter)){
      const entry = { name:item.chapter, sections:[], sectionMap:new Map(), count:0 };
      chapterMap.set(item.chapter, entry);
      chapters.push(entry);
    }
    const chapter = chapterMap.get(item.chapter);
    chapter.count++;
    if(!chapter.sectionMap.has(item.section)){
      const section = { chapter:item.chapter, name:item.section, items:[], itemMap:new Map(), count:0 };
      chapter.sectionMap.set(item.section, section);
      chapter.sections.push(section);
    }
    const section = chapter.sectionMap.get(item.section);
    section.count++;
    if(!section.itemMap.has(item.item)){
      const itemEntry = { chapter:item.chapter, section:item.section, name:item.item, count:0 };
      section.itemMap.set(item.item, itemEntry);
      section.items.push(itemEntry);
    }
    section.itemMap.get(item.item).count++;
  });
  return { chapters };
}

function toggleShortcutDialog(){
  const dlg = document.getElementById('shortcutDialog');
  if(!dlg) return;
  if (dlg.open) dlg.close();
  else dlg.showModal();
}

function getCurrentMode(){
  return document.getElementById('mode')?.value || 'en2ja';
}

function updateModeCopy(){
  const mode = getCurrentMode();
  const isSocial = mode === 'social';
  const isSocialV2 = isSocial && socialDataVersion === 'v2';

  const modeLabel = document.getElementById('modeLabel');
  if(modeLabel) modeLabel.textContent = isSocial ? '出題形式' : '和訳or英訳';

  const rangeLabel = document.getElementById('rangeLabel');
  if(rangeLabel) rangeLabel.textContent = isSocial ? '問題番号を指定' : '単語番号を指定';

  const rowCountLabel = document.getElementById('rowCountLabel');
  if(rowCountLabel) rowCountLabel.textContent = isSocial ? '総問題数' : '総単語数';

  const csvFormatHelp = document.getElementById('csvFormatHelp');
  if(csvFormatHelp){
    csvFormatHelp.innerHTML = isSocial
      ? (socialDataVersion === 'v2'
        ? '社会V2形式：<code>章, 節, 項, 番号, 問題文, 解答</code> の順にしてください。'
        : 'CSVの並びは<code>問題文, 解答</code> の順にしてください。')
      : 'CSVの並びは<code>英語, 日本語</code> の順にしてください。';
  }

  const csvExample = document.getElementById('csvExample');
  if(csvExample) csvExample.classList.toggle('hidden', !isSocial);

  const badge = document.getElementById('selectedBook');
  if(badge && currentBook){
    const unit = isSocial ? '問' : '語';
    badge.innerHTML = `選択中：<span class="name">${escapeHtml(currentBook.name)}</span> <span class="count">(${currentData.length}${unit})</span>`;
  }

  const standardRange = document.getElementById('standardRangeControls');
  if(standardRange) standardRange.classList.toggle('hidden', isSocialV2);

  const socialV2Range = document.getElementById('socialV2Range');
  if(socialV2Range) socialV2Range.classList.toggle('hidden', !isSocialV2);

  renderSocialV2RangeSelector();
}

function isSocialV2DetailEnabled(){
  const toggle = document.getElementById('socialV2DetailToggle');
  return toggle?.getAttribute('aria-expanded') === 'true';
}

function setSocialV2DetailEnabled(enabled){
  const toggle = document.getElementById('socialV2DetailToggle');
  const panel = document.getElementById('socialV2DetailPanel');
  if(toggle){
    toggle.setAttribute('aria-expanded', enabled ? 'true' : 'false');
    toggle.textContent = enabled ? '詳細範囲指定を非表示' : '詳細範囲指定を表示';
  }
  if(panel) panel.classList.toggle('hidden', !enabled);
}

function displaySocialV2Name(name, fallback){
  return name || fallback;
}

function getSelectedSocialV2Chapters(){
  const inputs = Array.from(document.querySelectorAll('#socialV2ChapterList input'));
  if(inputs.length) return inputs.filter(inp=>inp.checked).map(inp=>inp.value);
  return [];
}

function renderSocialV2RangeSelector(){
  const panel = document.getElementById('socialV2Range');
  if(!panel || getCurrentMode() !== 'social' || socialDataVersion !== 'v2') return;

  const chapterList = document.getElementById('socialV2ChapterList');
  const chapterSignature = socialV2Index.chapters.map(ch=>`${ch.name}:${ch.count}`).join('|||');
  if(chapterList && chapterList.dataset.signature !== chapterSignature){
    chapterList.innerHTML = socialV2Index.chapters.map(ch=>
      `<label class="social-v2-section-item social-v2-chapter-item">
        <input type="checkbox" value="${escapeHtml(ch.name)}" checked>
        <span>${escapeHtml(displaySocialV2Name(ch.name, '（章未入力）'))}（${ch.count}問）</span>
      </label>`
    ).join('');
    chapterList.dataset.signature = chapterSignature;
  }

  if(!isSocialV2DetailEnabled()){
    updateSocialV2SelectedCount();
    return;
  }

  const selectedChapters = new Set(getSelectedSocialV2Chapters());
  const sectionWrap = document.getElementById('socialV2SectionList');
  if(sectionWrap){
    const oldChecked = new Set(Array.from(sectionWrap.querySelectorAll('input:checked')).map(inp=>inp.value));
    const sections = [];
    socialV2Index.chapters.forEach(ch=>{
      if(!selectedChapters.has(ch.name)) return;
      ch.sections.forEach(sec=>sections.push(sec));
    });
    const hasOldSectionSelection = sections.some(sec=>oldChecked.has(`${sec.chapter}|||${sec.name}`));
    sectionWrap.innerHTML = sections.map(sec=>{
      const key = `${sec.chapter}|||${sec.name}`;
      const checked = !hasOldSectionSelection || oldChecked.has(key) ? ' checked' : '';
      return `<label class="social-v2-section-item">
        <input type="checkbox" value="${escapeHtml(key)}"${checked}>
        <span>${escapeHtml(displaySocialV2Name(sec.name, '（節未入力）'))}（${sec.count}問）</span>
      </label>`;
    }).join('') || '<span class="muted">章を選択してください。</span>';
  }
  renderSocialV2ItemSelector();
  updateSocialV2SelectedCount();
}

function getSelectedSocialV2SectionKeys(){
  return Array.from(document.querySelectorAll('#socialV2SectionList input:checked')).map(inp=>inp.value);
}

function renderSocialV2ItemSelector(){
  const itemWrap = document.getElementById('socialV2ItemList');
  if(!itemWrap || socialDataVersion !== 'v2') return;

  const selectedSectionKeys = new Set(getSelectedSocialV2SectionKeys());
  const selectedChapters = new Set(getSelectedSocialV2Chapters());
  const sectionInputs = Array.from(document.querySelectorAll('#socialV2SectionList input'));
  if(selectedChapters.size === 0 || (sectionInputs.length && selectedSectionKeys.size === 0)){
    itemWrap.innerHTML = '<span class="muted">節を選択してください。</span>';
    return;
  }

  const oldChecked = new Set(Array.from(itemWrap.querySelectorAll('input:checked')).map(inp=>inp.value));
  const items = [];
  socialV2Index.chapters.forEach(ch=>{
    if(!selectedChapters.has(ch.name)) return;
    ch.sections.forEach(sec=>{
      const sectionKey = `${sec.chapter}|||${sec.name}`;
      if(sectionInputs.length && !selectedSectionKeys.has(sectionKey)) return;
      sec.items.forEach(item=>items.push(item));
    });
  });
  const hasOldItemSelection = items.some(item=>oldChecked.has(`${item.chapter}|||${item.section}|||${item.name}`));

  itemWrap.innerHTML = items.map(item=>{
    const key = `${item.chapter}|||${item.section}|||${item.name}`;
    const checked = !hasOldItemSelection || oldChecked.has(key) ? ' checked' : '';
    return `<label class="social-v2-section-item">
      <input type="checkbox" value="${escapeHtml(key)}"${checked}>
      <span>${escapeHtml(displaySocialV2Name(item.name, '（項未入力）'))}（${item.count}問）</span>
    </label>`;
  }).join('') || '<span class="muted">節を選択してください。</span>';
}

function getSelectedSocialV2ItemKeys(){
  return Array.from(document.querySelectorAll('#socialV2ItemList input:checked')).map(inp=>inp.value);
}

function getSocialV2CandidateQuestions(){
  if(socialDataVersion !== 'v2') return [];
  const chapters = new Set(getSelectedSocialV2Chapters());
  if(chapters.size === 0) return [];

  if(!isSocialV2DetailEnabled()){
    return currentData.filter(item=>chapters.has(item.chapter));
  }

  const sectionKeys = new Set(getSelectedSocialV2SectionKeys());
  const sectionInputs = Array.from(document.querySelectorAll('#socialV2SectionList input'));
  if(sectionInputs.length && sectionKeys.size === 0) return [];
  const itemKeys = new Set(getSelectedSocialV2ItemKeys());
  const itemInputs = Array.from(document.querySelectorAll('#socialV2ItemList input'));
  if(itemInputs.length && itemKeys.size === 0) return [];

  return currentData.filter(item=>{
    if(!chapters.has(item.chapter)) return false;
    const key = `${item.chapter}|||${item.section}`;
    if(sectionKeys.size && !sectionKeys.has(key)) return false;
    const itemKey = `${item.chapter}|||${item.section}|||${item.item}`;
    if(itemKeys.size && !itemKeys.has(itemKey)) return false;
    return true;
  });
}

function updateSocialV2SelectedCount(){
  const el = document.getElementById('socialV2SelectedCount');
  if(!el || socialDataVersion !== 'v2') return;
  el.textContent = `選択中: ${getSocialV2CandidateQuestions().length}問`;
  renderSocialV2Warnings();
}

function renderSocialV2Warnings(){
  const el = document.getElementById('socialV2Error');
  if(!el || socialDataVersion !== 'v2') return;
  if(!socialV2Warnings.length){
    el.textContent = '';
    return;
  }
  const shown = socialV2Warnings.slice(0, 5).join('\n');
  const more = socialV2Warnings.length > 5 ? `\nほか ${socialV2Warnings.length - 5} 件` : '';
  el.textContent = `読み込みました。ただし未入力の行があります。\n${shown}${more}`;
}

function formatSocialV2QuestionNumber(question, index, mode='test'){
  if(mode === 'book'){
    return `${question.chapter} / ${question.section} / ${question.item} / ${question.localNumber}`;
  }
  if(mode === 'both'){
    return `Q${index + 1} [${question.chapter} / ${question.section} / ${question.item} / ${question.localNumber}]`;
  }
  return `${index + 1}.`;
}


// 設定保持（localStorage）
const prefs={ get(k,d){try{const v=localStorage.getItem('qm_'+k); return v? JSON.parse(v): d}catch{return d}}, set(k,v){localStorage.setItem('qm_'+k, JSON.stringify(v))} };

// グローバル状態
let currentBook=null; // {id,name,handle,headers?,mapping?}
let currentData=[];  // array of objects
let currentHeaders=[];
let socialDataVersion='v1';
let socialV2Index={ chapters:[] };
let socialV2Warnings=[];

// 初期化
(function init(){
  const verEl = document.getElementById('appVersion');
  if (verEl) {
    verEl.textContent = APP_VERSION;
    verEl.style.cursor = 'pointer';
    verEl.title = '変更履歴を表示';

    verEl.addEventListener('click', ()=>{
      // バージョンを日付降順で並べる
      const entries = Object.entries(CHANGELOG);
      const parseDate = (ver)=>{
        const m = ver.match(/\((\d{4}-\d{2}-\d{2})\)/);
        return m ? new Date(m[1]) : new Date(0);
      };
      entries.sort((a,b)=> parseDate(b[0]) - parseDate(a[0]));

      // details/summary を使った折りたたみ式の HTML を作る
      const html = entries.map(([ver, notes], idx) => {
        const header = `
            <summary class="chg-summary">
            ${escapeHtml(ver)}
            </summary>`;

        const body = (notes && notes.length)
            ? `
            <div class="chg-body">
                <ul>
                ${notes.map(s => `<li>${escapeHtml(s)}</li>`).join('')}
                </ul>
            </div>`
            : `
            <div class="chg-body chg-empty">
                （このバージョンの履歴は未登録）
            </div>`;

        const openAttr = idx === 0 ? ' open' : '';
        return `<details${openAttr} class="chg-detail">${header}${body}</details>`;
      }).join('');

      // ダイアログに入れる／フォールバック
      const dlg = document.getElementById('changelogDialog');
      const chgTitle = document.getElementById('chgTitle');
      const chgBody  = document.getElementById('chgBody');

      if (dlg && chgTitle && chgBody && typeof dlg.showModal === 'function') {
        chgTitle.textContent = CHANGELOG_TITLE || '変更履歴';
        chgBody.innerHTML = html;
        dlg.showModal();
      } else {
        // フォールバック：テキストの簡易版（折りたたみ不可）
        const text = entries.map(([ver, notes])=>{
          const lines = (notes && notes.length) ? notes.map(s=>'・'+s).join('\n') : '（未登録）';
          return `${ver}\n${lines}`;
        }).join('\n\n');
        alert((CHANGELOG_TITLE || '変更履歴') + '\n\n' + text);
      }
    });
  }
  const shortcutBtn = document.getElementById('btnShortcuts');
  if(shortcutBtn){
    shortcutBtn.addEventListener('click', toggleShortcutDialog);
  }
  // 初期状態：範囲UIを隠す
  ['#rangeWrap', '#optionWrap'].forEach(sel=>{
    const el = document.querySelector(sel);
    if (el) el.style.display = 'none';
  });
  updateModeCopy();
})();

function pickViaInput() {
  return new Promise(resolve => {
    const inp = document.createElement('input');

    inp.type = 'file';
    inp.accept = '.csv,.tsv,.txt';

    inp.addEventListener('change', () => {
      resolve(inp.files?.[0] ?? null);
    }, { once: true });

    inp.addEventListener('cancel', () => {
      resolve(null);
    }, { once: true });

    inp.click();
  });
}

$('#btnOpenFile').addEventListener('click', async ()=>{
  try{
    let file, displayName = 'session';
    const opts = {
      multiple: false,
      types: [{ description:'CSV/TSV', accept:{'text/csv':['.csv','.tsv','.txt']} }],
      excludeAcceptAllOption: false
    };
    if (window.showOpenFilePicker) {
      let fh;
      try{
        [fh] = await showOpenFilePicker(opts);
      }catch(e){
        if (e.name === 'AbortError') {
          return;
        }
        throw e;
      }
      file = await fh.getFile();
      displayName = fh.name || file.name || 'session';
    } else {
      // 非対応ブラウザ: <input type="file">
      file = await pickViaInput();
      if (!file) return;
      displayName = file.name || 'session';
    }

    const text = await file.text();
    const {rows} = parseDelimited(text);
    const socialDetection = detectSocialDataFormat(rows, getCurrentMode() === 'social');
    if(socialDetection.version === 'v2'){
      socialDataVersion = 'v2';
      currentHeaders = ['chapter','section','item','localNumber','question','answer'];
      currentData = parseSocialV2Rows(rows, socialDetection);
      socialV2Warnings = currentData.warnings || [];
      socialV2Index = buildSocialV2Index(currentData);
      setSocialV2DetailEnabled(false);
    }else{
      socialDataVersion = 'v1';
      socialV2Index = { chapters:[] };
      socialV2Warnings = [];
      const ah = autoHeaders(rows);
      currentHeaders = ah.headers;
      currentData = toObjects(ah.headers, ah.data, ah.firstDataLine);
    }

    const baseName = displayName.replace(/\.[^.]+$/, '');
    currentBook = { id:'session', name: baseName, mapping: null, handle: null };

    // UI更新
    $('#rowCount').textContent = currentData.length;
    $('#idxFrom').value = 1; $('#idxTo').value = currentData.length;
    ['#rangeWrap', '#optionWrap'].forEach(sel=>{
      const el = document.querySelector(sel);
      if (el) el.style.display = 'block';
    });
    const badge = document.getElementById('selectedBook');
    if (badge){
      const unit = getCurrentMode() === 'social' ? '問' : '語';
      badge.innerHTML = `選択中：<span class="name">${escapeHtml(baseName)}</span> <span class="count">(${currentData.length}${unit})</span>`;
    }

    updateModeCopy();
    updateLivePreview('afterFileOpen');
    }catch(e){
      alert('ファイル読み込みに失敗しました：' + (e?.message || e));
    }
});

window.addEventListener('keydown', (e) => {
  // IME変換中は無視
  if (e.isComposing) return;

  const target = e.target;
  const tag = target?.tagName;
  const isEditable =
    target?.isContentEditable ||
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT';

  // Esc：ショートカット一覧を閉じる
  if (e.key === 'Escape') {
    const dlg = document.getElementById('shortcutDialog');
    if (dlg?.open) {
      dlg.close();
    }
    return;
  }

  // ?：ショートカット一覧を開く
  // 日本語/英語配列の両方に対応するために'?' と Shift + '/' の両方を許容
  if (
    !e.ctrlKey &&
    !e.altKey &&
    !e.metaKey &&
    !isEditable &&
    (e.key === '?' || (e.key === '/' && e.shiftKey))
  ) {
    e.preventDefault();
    const dlg = document.getElementById('shortcutDialog');
    if (dlg && !dlg.open) {
      dlg.showModal();
    }
    return;
  }

  // Ctrl+O：CSV選択
  if (e.ctrlKey && !e.shiftKey && !e.altKey && (e.key === 'o' || e.key === 'O')) {
    e.preventDefault();
    document.getElementById('btnOpenFile')?.click();
    return;
  }

  // Ctrl+Enter：生成して別タブへ
  if (e.ctrlKey && !e.shiftKey && !e.altKey && e.key === 'Enter') {
    e.preventDefault();

    // 1) まずはプレビューから即印刷
    if (printFromPreviewBoth()) return;

    // 2) プレビューが無い/空なら別タブ生成
    generateAndOpenPrint();
    return;
  }
});

// エラー関連の処理
function prepareTestConfig(opts = {}){
  clearErrors();
  const noFocus = !!opts.noFocus; // エラーが起きてもそこにカーソルが飛ばないようにする

  // 1) CSV が選ばれていない
  if(!currentBook){
    setError('rangeError','先にCSVファイルを選択してください。',['idxFrom','idxTo']);
    return null;
  }

  // 2) 列の自動判定
  const mode = getCurrentMode();
  const isSocial = mode === 'social';
  const isSocialV2 = isSocial && socialDataVersion === 'v2';
  const mapping = autoMapping(mode);
  if(!mapping.q || !mapping.a){
    setError(
      'rangeError',
      isSocial
        ? '問題列と解答列を自動認識できませんでした。\nCSVの1列目を「問題文」、2列目を「解答」にしてください。'
        : '問題列と解答列を自動認識できませんでした。\nCSVの1列目を「問題」、2列目を「解答」にするか、ヘッダー名を見直してください。'
    );
    return null;
  }

  if(isSocialV2){
    const subset = getSocialV2CandidateQuestions();
    if(subset.length === 0){
      setError('socialV2Error','選択範囲に問題がありません。');
      return null;
    }

    const numInput = document.getElementById('numQuestions');
    const rawN = (numInput.value || '').trim();
    if(!rawN){
      setError('numError','出題数を入力してください。',['numQuestions']);
      if(!noFocus) numInput.focus();
      return null;
    }

    const n = parseInt(rawN, 10);
    if(isNaN(n) || n <= 0){
      setError('numError','出題数は1以上の整数で入力してください。',['numQuestions']);
      if(!noFocus) numInput.focus();
      return null;
    }

    if(n > subset.length){
      setError('numError',`出題数は選択範囲の問題数（最大 ${subset.length} 問）以下にしてください。`,['numQuestions']);
      if(!noFocus) numInput.focus();
      return null;
    }

    const random = !!document.getElementById('chkRandom') && document.getElementById('chkRandom').checked;
    const baseName = (currentBook?.name || 'Vocabulary Test').replace(/\.[^.]+$/, '');
    return {
      mapping,
      from: 1,
      to: subset.length,
      subset,
      mode,
      n,
      random,
      baseName,
      bulk: false,
      chunkSize: 0,
      socialDataVersion
    };
  }

  // 3) 範囲チェック
  const fromInput = document.getElementById('idxFrom');
  const toInput   = document.getElementById('idxTo');
  const rawFrom = parseInt((fromInput.value || '1'), 10);
  const rawTo   = parseInt((toInput.value   || String(currentData.length)), 10);

  let from = Math.max(1, isNaN(rawFrom) ? 1 : rawFrom);
  let to   = Math.min(currentData.length, isNaN(rawTo) ? currentData.length : rawTo);

  if(from > to){
    setError('rangeError','開始番号は終了番号以下にしてください。',['idxFrom','idxTo']);
    if(!noFocus) fromInput.focus();
    return null;
  }

  const subset = currentData.slice(from-1, to);
  if(subset.length === 0){
    setError('rangeError', isSocial ? '指定範囲に問題がありません。' : '指定範囲に単語がありません。',['idxFrom','idxTo']);
    if(!noFocus) fromInput.focus();
    return null;
  }

  // 4) 出題数チェック
  const numInput = document.getElementById('numQuestions');
  const rawN = (numInput.value || '').trim();

  if(!rawN){
    setError('numError','出題数を入力してください。',['numQuestions']);
    if(!noFocus) numInput.focus();
    return null;
  }

  const n = parseInt(rawN, 10);
  if(isNaN(n) || n <= 0){
    setError('numError','出題数は1以上の整数で入力してください。',['numQuestions']);
    if(!noFocus) numInput.focus();
    return null;
  }

  if(n > subset.length){
    setError(
      'numError',
      `出題数は指定範囲の${isSocial ? '問題数' : '単語数'}（最大 ${subset.length} 問）以下にしてください。`,
      ['numQuestions']
    );
    if(!noFocus) numInput.focus();
    return null;
  }

  // 5) オプション類
  const random = !!document.getElementById('chkRandom') && document.getElementById('chkRandom').checked;
  const baseName = (currentBook?.name || 'Vocabulary Test').replace(/\.[^.]+$/, '');
  const bulk = document.getElementById('bulkMode') && document.getElementById('bulkMode').checked;
  const chunkSize = Math.max(1, parseInt((document.getElementById('bulkChunk').value || '100'), 10));

  return { mapping, from, to, subset, mode, n, random, baseName, bulk, chunkSize };
}

// ライブプレビュー用
function updateLivePreview(reason){
  const frame  = document.getElementById('previewFrame');
  const status = document.getElementById('previewStatus');
  if (!frame || !status) return;

  // まだCSVが選ばれていない場合
  if (!currentBook){
    status.textContent = 'CSVファイルを選ぶとここにプレビューが表示されます。';
    frame.srcdoc = '';
    return;
  }

  const numInput = document.getElementById('numQuestions');
  const numRaw   = (numInput && numInput.value || '').trim();

  // 出題数が空のときはエラーを出さず、ガイドだけ
  if (!numRaw){
    status.textContent = '範囲と出題数を入力するとプレビューが表示されます。';
    frame.srcdoc = '';
    return;
  }

  // ここから先はいつものバリデーションを流用
  const cfg = prepareTestConfig({ noFocus: true }); // プレビュー更新でバリデーションが走っても入力中のフォーカスは奪わんくなる
  if (!cfg){
    status.textContent = '入力内容を確認してください（赤字の項目があります）。';
    frame.srcdoc = '';
    return;
  }

  status.textContent = '現在の設定での印刷イメージです。';

  const { mapping, from, to, subset, mode, n, random, baseName, bulk, chunkSize } = cfg;
  const rnd = Math.random;

  let html;
  if (!bulk){
    // 通常1枚分
    const picked = pickSample(subset, n, random, rnd);
    const rangeLabel = `${from}〜${to}`;
    html = buildPrintHtml(picked, mapping, { mode, title: baseName, rangeLabel });
  } else {
    // まとめて作成モード
    const ranges = chunkRanges(from, to, chunkSize);
    const batches = ranges.map(([s,e])=>{
      const local = currentData.slice(s-1, e);
      return {
        rangeLabel: `${s}〜${e}`,
        items: pickSample(local, n, random, rnd)
      };
    });
    html = buildPrintHtmlBulk(batches, mapping, { mode, title: baseName });
  }

  // iframe に印刷HTMLを流し込む
  frame.srcdoc = html;
}

// 入力変更時に自動でプレビュー更新
['#idxFrom','#idxTo','#numQuestions','#mode','#chkRandom','#bulkMode','#bulkChunk'].forEach(sel=>{
  const el = document.querySelector(sel);
  if (!el) return;
  const ev = (sel === '#mode' || sel === '#chkRandom' || sel === '#bulkMode') ? 'change' : 'input';
  el.addEventListener(ev, ()=>{
    if(sel === '#mode') updateModeCopy();
    updateLivePreview('input');
  });
});

const socialV2ChapterList = document.getElementById('socialV2ChapterList');
if(socialV2ChapterList){
  socialV2ChapterList.addEventListener('change', ()=>{
    renderSocialV2RangeSelector();
    updateLivePreview('socialV2');
  });
}

const socialV2SelectAllChapters = document.getElementById('socialV2SelectAllChapters');
if(socialV2SelectAllChapters){
  socialV2SelectAllChapters.addEventListener('click', ()=>{
    document.querySelectorAll('#socialV2ChapterList input').forEach(inp=>{ inp.checked = true; });
    renderSocialV2RangeSelector();
    updateLivePreview('socialV2');
  });
}

const socialV2ClearChapters = document.getElementById('socialV2ClearChapters');
if(socialV2ClearChapters){
  socialV2ClearChapters.addEventListener('click', ()=>{
    document.querySelectorAll('#socialV2ChapterList input').forEach(inp=>{ inp.checked = false; });
    renderSocialV2RangeSelector();
    updateLivePreview('socialV2');
  });
}

const socialV2DetailToggle = document.getElementById('socialV2DetailToggle');
if(socialV2DetailToggle){
  socialV2DetailToggle.addEventListener('click', ()=>{
    setSocialV2DetailEnabled(!isSocialV2DetailEnabled());
    renderSocialV2RangeSelector();
    updateLivePreview('socialV2');
  });
}

const socialV2SectionList = document.getElementById('socialV2SectionList');
if(socialV2SectionList){
  socialV2SectionList.addEventListener('change', ()=>{
    renderSocialV2ItemSelector();
    updateSocialV2SelectedCount();
    updateLivePreview('socialV2');
  });
}

const socialV2ItemList = document.getElementById('socialV2ItemList');
if(socialV2ItemList){
  socialV2ItemList.addEventListener('change', ()=>{
    updateSocialV2SelectedCount();
    updateLivePreview('socialV2');
  });
}

function autoMapping(mode = getCurrentMode()){
  const headers=currentHeaders; const lower=headers.map(h=>h.toLowerCase());
  if(mode === 'social' && socialDataVersion === 'v2'){
    return { q:'question', a:'answer' };
  }
  if(mode === 'social'){
    return { q: headers[0], a: headers[1] };
  }
  const q = headers[ lower.findIndex(h=>['word','単語','term'].includes(h)) ] || headers[0];
  const a = headers[ lower.findIndex(h=>['meaning','意味','translation'].includes(h)) ] || headers[1] || headers[0];
  return {q,a};
}
