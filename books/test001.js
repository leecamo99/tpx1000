/* ===== 測試書籍（test001）=====
   純粹用來驗證選書切換與紀錄分書是否正常。
   沒有音檔，播放會提示找不到，這是預期行為。
   確認功能無誤後，把這個檔案和 books.js 裡的 test001 一起刪除即可。
*/
window.registerBook({
  id: 'test001',
  data: [
    { id: 'T-001', level: '600', level_label: '測試', word: 'apple',    mean: '蘋果',   pos: '名', ex: 'I ate an apple.',        ex_zh: '我吃了一顆蘋果。' },
    { id: 'T-002', level: '600', level_label: '測試', word: 'banana',   mean: '香蕉',   pos: '名', ex: 'She likes bananas.',     ex_zh: '她喜歡香蕉。' },
    { id: 'T-003', level: '730', level_label: '測試', word: 'meeting',  mean: '會議',   pos: '名', ex: 'The meeting starts now.', ex_zh: '會議現在開始。' },
    { id: 'T-004', level: '730', level_label: '測試', word: 'invoice',  mean: '發票',   pos: '名', ex: 'Please send the invoice.', ex_zh: '請寄送發票。' },
    { id: 'T-005', level: '860', level_label: '測試', word: 'schedule', mean: '排程',   pos: '動', ex: 'We scheduled a call.',    ex_zh: '我們安排了通話。' }
  ],
  clipMap: {
    'T-001': { word: 'T-001_w.mp3', phrases: [] },
    'T-002': { word: 'T-002_w.mp3', phrases: [] },
    'T-003': { word: 'T-003_w.mp3', phrases: [] },
    'T-004': { word: 'T-004_w.mp3', phrases: [] },
    'T-005': { word: 'T-005_w.mp3', phrases: [] }
  },
  audioFix: function(M){
    // 這本書沒有音檔錯位問題，保留空函式作為範例。
  }
});
