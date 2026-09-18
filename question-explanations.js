/*
 * 金のフレーズ｜題目解析模組
 * 版本：1.0.0
 *
 * 使用方式：將本檔與 index.html 放在同一層。
 * 本模組不連網；所有解析只使用題目、答案與既有單字資料。
 */
(function (root) {
  'use strict';

  var VERSION = '1.0.0';

  function text(value) {
    return value == null ? '' : String(value).trim();
  }

  function escapeHtml(value) {
    return text(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function stripTags(value) {
    return text(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function clipped(value, max) {
    var valueText = text(value);
    return valueText.length > max ? valueText.slice(0, max - 1) + '…' : valueText;
  }

  function joinAnswer(word, meaning) {
    word = text(word);
    meaning = text(meaning);
    if (word && meaning) return word + '｜' + meaning;
    return word || meaning || '—';
  }

  function modeLabel(mode) {
    return {
      en2zh: '英翻中',
      zh2en: '中翻英',
      listen: '聽力辨識',
      spell: '拼字聽寫',
      cloze: '例句填空',
      imported: '單選題'
    }[mode] || '題目';
  }

  function choiceLabel(choice, mode) {
    if (!choice) return '';
    if (typeof choice === 'string') return choice;
    if (mode === 'zh2en') return text(choice.word);
    return text(choice.mean || choice.meaning || choice.zh || choice.word);
  }

  function explanationForMode(mode, entry, answer) {
    var word = text(entry.word);
    var meaning = text(entry.mean || entry.meaning || entry.zh);
    var pos = text(entry.pos);
    var grammar = pos ? '，詞性為「' + pos + '」' : '';

    if (mode === 'zh2en') {
      return '題幹給出的中文意思是「' + (meaning || '題目所示意思') + '」，對應的英文是「' + (word || answer) + '」' + grammar + '。';
    }
    if (mode === 'listen') {
      return '音檔中的目標字是「' + (word || answer) + '」，其中文意思為「' + (meaning || '題目所示意思') + '」' + grammar + '。';
    }
    if (mode === 'spell') {
      return '正確拼法是「' + (answer || word) + '」。請特別留意字母順序與完整字尾' + grammar + '。';
    }
    if (mode === 'cloze') {
      return '依例句語意與空格位置，應填入「' + (answer || word) + '」' + grammar + '；填入後句意與既有例句一致。';
    }
    return '「' + (word || answer) + '」在本題中的意思是「' + (meaning || answer) + '」' + grammar + '。';
  }

  function build(context) {
    context = context || {};
    var entry = context.entry || {};
    var question = context.question || {};
    var mode = text(context.mode || question.mode || 'en2zh');
    var word = text(entry.word || context.word);
    var meaning = text(entry.mean || entry.meaning || context.meaning);
    var answer = text(context.answer || (mode === 'zh2en' ? word : meaning));
    var userAnswer = text(context.userAnswer);
    var correct = context.correct !== false;
    var selected = context.selected || null;
    var selectedText = text(context.selectedText || choiceLabel(selected, mode));
    var note = text(entry.note || context.note);
    var example = text(entry.en || context.example);
    var translation = text(entry.ja || context.translation);
    var rule = explanationForMode(mode, entry, answer);
    var contrast = '';

    if (!correct && selectedText) {
      contrast = '你選的是「' + selectedText + '」，正確答案是「' + answer + '」。兩者需依本題要求的語意、詞性或拼法區分。';
    } else if (correct) {
      contrast = '你的答案與正確答案一致。';
    }

    return {
      version: VERSION,
      mode: mode,
      modeLabel: modeLabel(mode),
      correct: correct,
      title: '答案解析',
      answer: joinAnswer(word || answer, meaning),
      rule: rule,
      contrast: contrast,
      note: note,
      example: example,
      translation: translation,
      plain: [rule, contrast, note ? ('補充：' + note) : '', example ? ('例句：' + example) : '', translation ? ('翻譯：' + translation) : ''].filter(Boolean).join('\n')
    };
  }

  function render(context) {
    var x = build(context);
    var html = '<section class="kin-qx" aria-label="答案解析">' +
      '<div class="kin-qx-head"><span>' + escapeHtml(x.title) + '</span><small>' + escapeHtml(x.modeLabel) + '</small></div>' +
      '<div class="kin-qx-answer"><b>正解</b><span>' + escapeHtml(x.answer) + '</span></div>' +
      '<p>' + escapeHtml(x.rule) + '</p>';

    if (x.contrast) html += '<p class="kin-qx-contrast">' + escapeHtml(x.contrast) + '</p>';
    if (x.note) html += '<div class="kin-qx-note"><b>補充</b>' + escapeHtml(clipped(x.note, 180)) + '</div>';
    if (x.example) {
      html += '<div class="kin-qx-example"><b>例句</b><span lang="en">' + escapeHtml(x.example) + '</span>' +
        (x.translation ? '<small>' + escapeHtml(x.translation) + '</small>' : '') + '</div>';
    }
    return html + '</section>';
  }

  function buildImported(question, selectedIndex) {
    question = question || {};
    var options = Array.isArray(question.options) ? question.options : (Array.isArray(question.choices) ? question.choices : []);
    var answerIndex = parseInt(question.answer, 10);
    var answer = answerIndex >= 0 && answerIndex < options.length ? text(options[answerIndex]) : '';
    var selected = selectedIndex >= 0 && selectedIndex < options.length ? text(options[selectedIndex]) : '';
    var correct = selectedIndex === answerIndex;
    var tip = text(question.tip || question.explain || question.explanation);
    var translation = text(question.zh || question.translation);
    var prompt = text(question.q || question.question);
    var rule = tip || '正確選項是「' + answer + '」。請把選項放回題幹，確認句意與文法是否完整。';
    var contrast = correct ? '你的答案與正確答案一致。' : '你選的是「' + selected + '」，正確答案是「' + answer + '」。';

    return {
      version: VERSION,
      mode: 'imported',
      modeLabel: modeLabel('imported'),
      correct: correct,
      title: '答案解析',
      answer: answer || '—',
      rule: rule,
      contrast: contrast,
      note: '',
      example: prompt,
      translation: translation,
      plain: [rule, contrast, translation ? ('翻譯：' + translation) : ''].filter(Boolean).join('\n')
    };
  }

  function renderImported(question, selectedIndex) {
    var x = buildImported(question, selectedIndex);
    var html = '<section class="kin-qx" aria-label="答案解析">' +
      '<div class="kin-qx-head"><span>' + escapeHtml(x.title) + '</span><small>' + escapeHtml(x.modeLabel) + '</small></div>' +
      '<div class="kin-qx-answer"><b>正解</b><span>' + escapeHtml(x.answer) + '</span></div>' +
      '<p>' + escapeHtml(x.rule) + '</p>' +
      '<p class="kin-qx-contrast">' + escapeHtml(x.contrast) + '</p>';
    if (x.translation) html += '<div class="kin-qx-note"><b>題目翻譯</b>' + escapeHtml(x.translation) + '</div>';
    return html + '</section>';
  }

  function injectStyles() {
    if (!root.document || root.document.getElementById('kinQuestionExplanationStyle')) return;
    var style = root.document.createElement('style');
    style.id = 'kinQuestionExplanationStyle';
    style.textContent =
      '.kin-qx{margin:10px 0 2px;padding:0;border:1px solid #e4c7ad;border-radius:12px;background:#fffaf5;overflow:hidden;text-align:left;color:#2b241f}' +
      '.kin-qx-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 12px;background:#f4dcc4;border-bottom:1px solid #e4c7ad;font-weight:800;color:#6f3512}' +
      '.kin-qx-head small{font-size:10px;letter-spacing:.08em;color:#855333}' +
      '.kin-qx-answer{display:flex;align-items:flex-start;gap:9px;padding:11px 12px 4px}' +
      '.kin-qx-answer b,.kin-qx-note b,.kin-qx-example b{flex:0 0 auto;font-size:10px;line-height:1.8;letter-spacing:.08em;color:#9c501d}' +
      '.kin-qx-answer span{font-size:14px;font-weight:800;line-height:1.5;color:#231b16}' +
      '.kin-qx p{margin:0;padding:5px 12px;font-size:13px;line-height:1.7;color:#493e36}' +
      '.kin-qx-contrast{color:#6a4b34!important}' +
      '.kin-qx-note,.kin-qx-example{display:flex;gap:9px;margin:7px 12px 11px;padding:9px 10px;border-radius:8px;background:#fff;border:1px solid #ead9ca;font-size:12px;line-height:1.65;color:#51443a}' +
      '.kin-qx-example{display:grid;grid-template-columns:auto 1fr;margin-top:7px}' +
      '.kin-qx-example span{font-weight:650;color:#2f2925}' +
      '.kin-qx-example small{grid-column:2;font-size:12px;color:#74685f}' +
      'body.theme-dark .kin-qx{background:#171311;border-color:#5a3a26;color:#eee9e5}' +
      'body.theme-dark .kin-qx-head{background:#392518;border-color:#5a3a26;color:#ffad6e}' +
      'body.theme-dark .kin-qx-head small{color:#d89562}' +
      'body.theme-dark .kin-qx-answer span{color:#f2eeea}' +
      'body.theme-dark .kin-qx p{color:#d7cec7}' +
      'body.theme-dark .kin-qx-contrast{color:#e0b08a!important}' +
      'body.theme-dark .kin-qx-note,body.theme-dark .kin-qx-example{background:#101010;border-color:#3f3027;color:#ccc3bc}' +
      'body.theme-dark .kin-qx-example span{color:#eee9e5}' +
      'body.theme-dark .kin-qx-example small{color:#aaa19a}' +
      '.kin-qx-review{margin-top:8px;padding:8px 9px;border-radius:8px;background:#fdf6ef;color:#5b4638;font-size:12px;line-height:1.65;white-space:pre-line}' +
      'body.theme-dark .kin-qx-review{background:#1d1713;color:#d8cbc2}';
    (root.document.head || root.document.documentElement).appendChild(style);
  }

  var api = {
    version: VERSION,
    build: build,
    render: render,
    buildImported: buildImported,
    renderImported: renderImported,
    escapeHtml: escapeHtml,
    stripTags: stripTags
  };

  root.KIN_QUIZ_EXPLAIN = api;
  injectStyles();
  if (root.document && root.document.readyState === 'loading') {
    root.document.addEventListener('DOMContentLoaded', injectStyles, { once: true });
  }
})(window);
