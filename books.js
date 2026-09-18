/* ===== 書籍目錄 =====
   新增書籍：在下方陣列加一筆，並把資料檔放在指定位置。
   audioBase / imageBase 結尾需保留斜線。
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
    id: 'shiko600',
    title: 'TOEIC L&Rテスト 至高の模試600問',
    subtitle: 'TEST 1～3・各 200 題',
    file: 'shiko600.js',
    global: 'SHIKO600',
    adapter: 'shiko600',
    audioBase: 'audio/shiko600/',
    imageBase: 'images/shiko600/',
    unit: '題',
    count: 600
  }
];
