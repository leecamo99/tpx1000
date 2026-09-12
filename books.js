/* ===== 書籍目錄 =====
   新增書籍：在下方陣列加一筆，並把資料檔放進 books/ 即可。
   audioBase 為該書音檔資料夾，結尾要有斜線。
*/
window.BOOKS = [
  {
    id: 'kin1000',
    title: '金のフレーズ',
    subtitle: 'TOEIC L&R TEST 出る単特急',
    file: 'books/kin1000.js',
    audioBase: 'audio/kin1000/CLIPS/',
    count: 1817
  },
  {
    // 測試用假書，確認切換功能正常後可整筆刪除。
    id: 'test001',
    title: '測試書籍',
    subtitle: '確認選書切換用，可隨時刪除',
    file: 'books/test001.js',
    audioBase: 'audio/test001/CLIPS/',
    count: 5
  }
];
