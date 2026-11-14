function printFromPreviewBoth(){
  const frame = document.getElementById('previewFrame');
  if(!frame || !frame.contentWindow || !frame.contentDocument) return false;

  const hasHtml =
    frame.contentDocument.body &&
    frame.contentDocument.body.innerHTML.trim().length > 0;
  if(!hasHtml) return false;

  const b = frame.contentDocument.body;
  b.classList.remove('print-q-only', 'print-a-only');

  frame.contentWindow.focus();
  frame.contentWindow.print();
  return true;
}

function getPrintStyle(){
  return `
  :root{ --ink:#111827; }

  body{
    margin:0;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,"Noto Sans JP","Hiragino Kaku Gothic ProN","Yu Gothic UI",sans-serif;
    color:var(--ink);
    background:#f3f4f6;
  }

  .toolbar{
    position:sticky;
    top:0;
    z-index:50;
    display:flex;
    gap:8px;
    justify-content:center;
    padding:10px 12px;
    background:#f8fafc;
    border-bottom:1px solid #cbd5e1;
  }

  .toolbar button{
    border:1px solid #cbd5e1;
    background:#ffffff;
    color:#111827;
    padding:8px 12px;
    border-radius:10px;
    cursor:pointer;
    font-weight:700;
  }

  .paper{
    width:210mm;
    min-height:297mm;
    margin:12px auto;
    box-sizing:border-box;
    padding:10mm 14mm 16mm 14mm;
    background:#fff;
  }

  .header{
    display:flex;
    justify-content:center;
    align-items:center;
    margin:0 0 8mm 0;
  }

  .title{
    text-align:center;
    white-space:nowrap;
    font-weight:700;
    font-size:1.25rem;
  }

  .test{
    column-count:2;
    column-gap:12mm;
  }

  .q{
    break-inside:avoid;
    page-break-inside:avoid;
    margin:0 0 6px 0;
  }

  .qt{
    line-height:1.6;
    margin-bottom:2px;
    font-size:.88rem;
  }

  .fill{
    position:relative;
    min-height:18px;
  }

  .ansBlank{
    height:16px;
    border-bottom:1px solid #cbd5e1;
  }

  .ansKey{
    margin-top:2px;
    padding-bottom:2px;
    min-height:16px;
    border-bottom:1px solid #cbd5e1;
    color:#374151;
    font-size:.95rem;
    box-sizing:border-box;
  }

  .social-print{
    column-count:2;
    column-gap:12mm;
  }

  .social-question-row{
    break-inside:avoid;
    page-break-inside:avoid;
    margin:0 0 4.5mm 0;
  }

  .social-question-text{
    line-height:1.55;
    font-size:.88rem;
    overflow-wrap:anywhere;
    word-break:break-word;
  }

  .social-answer-line{
    margin-top:1.2mm;
    line-height:1.5;
    font-size:.86rem;
    overflow-wrap:anywhere;
    word-break:break-word;
  }

  .social-blank{
    display:inline-block;
    min-width:62mm;
    max-width:100%;
    border-bottom:1px solid #111827;
    height:1.25em;
    vertical-align:baseline;
  }

  .social-answer-key{
    display:inline-block;
    min-width:62mm;
    max-width:100%;
    padding:0 2mm 1px 0;
    border-bottom:1px solid #111827;
    box-sizing:border-box;
    vertical-align:baseline;
  }

  .social-question-paper .header{
    margin-bottom:12px;
    break-after:avoid;
    page-break-after:avoid;
  }

  .social-question-paper .social-print{
    margin-top:0;
    break-before:auto;
    page-break-before:auto;
    break-inside:auto;
    page-break-inside:auto;
  }

  .paper.q .ansKey{
    display:none;
  }

  .paper.a .ansKey{
    display:block;
  }

  @media (max-width:640px){
    .test{
      column-count:1;
      column-gap:0;
    }
  }

  @media print{
    body{
      margin:0;
      background:#fff;
    }

    .toolbar{
      display:none !important;
    }

    body.print-q-only .paper.a{
      display:none !important;
    }

    body.print-a-only .paper.q{
      display:none !important;
    }

    .paper{
      width:auto;
      min-height:auto;
      margin:0;
      padding:14mm 14mm 16mm 14mm;
      box-sizing:border-box;
      break-after:auto;
      page-break-after:auto;
    }

    .paper + .paper{
      page-break-before:always;
      break-before:page;
    }

    .test{
      column-count:2 !important;
      column-gap:12mm !important;
    }

    .test.social-print{
      column-count:2 !important;
      column-gap:12mm !important;
    }
  }`;
}

function renderQuestionBlock(items, qCol, aCol, isEn2Ja){
  return items.map((o, idx)=>{
    const qText = isEn2Ja ? (o[qCol] || '') : (o[aCol] || '');
    return `
      <div class="q">
        <div class="qt">
          <strong>Q${idx + 1}</strong> <span style="color:#6b7280">[${o.__row}]</span>
          ： ${escapeHtml(qText)}
        </div>
        <div class="fill">
          <div class="ansBlank"></div>
        </div>
      </div>`;
  }).join('');
}

function renderAnswerBlock(items, qCol, aCol, isEn2Ja){
  return items.map((o, idx)=>{
    const qText = isEn2Ja ? (o[qCol] || '') : (o[aCol] || '');
    const aText = isEn2Ja ? (o[aCol] || '') : (o[qCol] || '');
    return `
      <div class="q">
        <div class="qt">
          <strong>Q${idx + 1}</strong> <span style="color:#6b7280">[${o.__row}]</span>
          ： ${escapeHtml(qText)}
        </div>
        <div class="ansKey"><span>${escapeHtml(aText)}</span></div>
      </div>`;
  }).join('');
}

function renderSocialQuestionBlock(items, qCol){
  return items.map((o, idx)=>`
      <div class="social-question-row">
        <div class="social-question-text"><strong>${idx + 1}.</strong> ${escapeHtml(o[qCol] || '')}</div>
        <div class="social-answer-line">解答：<span class="social-blank"></span></div>
      </div>`).join('');
}

function renderSocialAnswerBlock(items, qCol, aCol){
  return items.map((o, idx)=>`
      <div class="social-question-row">
        <div class="social-question-text"><strong>${idx + 1}.</strong> ${escapeHtml(o[qCol] || '')}</div>
        <div class="social-answer-line">解答：<span class="social-answer-key">${escapeHtml(o[aCol] || '')}</span></div>
      </div>`).join('');
}

function buildPrintHtml(items, mapping, opts){
  const qCol = mapping.q;
  const aCol = mapping.a;
  const isSocial = opts.mode === 'social';
  const isEn2Ja = opts.mode === 'en2ja';

  const titleBase = (opts.title || 'Vocabulary Test');
  const titleText =
    escapeHtml(titleBase) +
    (opts.rangeLabel ? '（' + escapeHtml(opts.rangeLabel) + '）' : '');

  const questionHtml = isSocial
    ? renderSocialQuestionBlock(items, qCol)
    : renderQuestionBlock(items, qCol, aCol, isEn2Ja);
  const answerHtml = isSocial
    ? renderSocialAnswerBlock(items, qCol, aCol)
    : renderAnswerBlock(items, qCol, aCol, isEn2Ja);
  const testClass = isSocial ? 'test social-print' : 'test';
  const questionPaperClass = isSocial ? 'paper q social-question-paper' : 'paper q';

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
${getPrintStyle()}
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="document.body.classList.remove('print-a-only','print-q-only'); window.print();">問題＋解答を印刷</button>
    <button onclick="document.body.classList.add('print-q-only'); document.body.classList.remove('print-a-only'); window.print();">問題のみ印刷</button>
    <button onclick="document.body.classList.add('print-a-only'); document.body.classList.remove('print-q-only'); window.print();">解答のみ印刷</button>
  </div>

  <section class="${questionPaperClass}">
    <div class="header">
      <div class="title">${titleText}</div>
    </div>
    <div class="${testClass}">${questionHtml}</div>
  </section>

  <section class="paper a">
    <div class="header">
      <div class="title">${titleText}（解答）</div>
    </div>
    <div class="${testClass}">${answerHtml}</div>
  </section>
</body>
</html>`;
}

function buildPrintHtmlBulk(batches, mapping, opts){
  const qCol = mapping.q;
  const aCol = mapping.a;
  const isSocial = opts.mode === 'social';
  const isEn2Ja = opts.mode === 'en2ja';
  const titleBase = opts.title || 'Vocabulary Test';
  const testClass = isSocial ? 'test social-print' : 'test';
  const questionPaperClass = isSocial ? 'paper q social-question-paper' : 'paper q';

  const papers = batches.map((batch)=>{
    const titleText =
      escapeHtml(titleBase) +
      (batch.rangeLabel ? '（' + escapeHtml(batch.rangeLabel) + '）' : '');

    const questionHtml = isSocial
      ? renderSocialQuestionBlock(batch.items, qCol)
      : renderQuestionBlock(batch.items, qCol, aCol, isEn2Ja);
    const answerHtml = isSocial
      ? renderSocialAnswerBlock(batch.items, qCol, aCol)
      : renderAnswerBlock(batch.items, qCol, aCol, isEn2Ja);

    return `
    <section class="${questionPaperClass}">
      <div class="header">
        <div class="title">${titleText}</div>
      </div>
      <div class="${testClass}">${questionHtml}</div>
    </section>

    <section class="paper a">
      <div class="header">
        <div class="title">${titleText}（解答）</div>
      </div>
      <div class="${testClass}">${answerHtml}</div>
    </section>`;
  }).join('');

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<style>
${getPrintStyle()}
</style>
</head>
<body>
  <div class="toolbar">
    <button onclick="document.body.classList.remove('print-a-only','print-q-only'); window.print();">問題＋解答を印刷</button>
    <button onclick="document.body.classList.add('print-q-only'); document.body.classList.remove('print-a-only'); window.print();">問題のみ印刷</button>
    <button onclick="document.body.classList.add('print-a-only'); document.body.classList.remove('print-q-only'); window.print();">解答のみ印刷</button>
  </div>
  ${papers}
</body>
</html>`;
}

function openPrintWindow(html){
  const w = window.open('', '_blank');
  if(!w){
    alert('ポップアップがブロックされました。ポップアップを許可してください。');
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}

function generateAndOpenPrint(){
  const cfg = prepareTestConfig();
  if(!cfg) return;

  const { mapping, from, to, subset, mode, n, random, baseName, bulk, chunkSize } = cfg;
  const rnd = Math.random;

  let html;
  if (!bulk){
    const picked = pickSample(subset, n, random, rnd);
    const rangeLabel = `${from}〜${to}`;
    html = buildPrintHtml(picked, mapping, { mode, title: baseName, rangeLabel });
  } else {
    const ranges = chunkRanges(from, to, chunkSize);
    const batches = ranges.map(([s,e])=>{
      const local = currentData.slice(s - 1, e);
      return {
        rangeLabel: `${s}〜${e}`,
        items: pickSample(local, n, random, rnd)
      };
    });
    html = buildPrintHtmlBulk(batches, mapping, { mode, title: baseName });
  }

  openPrintWindow(html);
}