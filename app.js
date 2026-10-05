/**
 * 就労移行支援向け タイピング訓練＆分析支援システム (app.js)
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // 1. 練習課題サンプルデータ
  // ==========================================
  const SAMPLE_TASKS = [
    {
      id: 'task-1',
      title: '【社内メール】日程調整のお願い',
      category: 'ビジネスメール',
      difficulty: '標準',
      estimatedTime: '3',
      content: `件名：来週のプロジェクト会議の日程調整について

営業部の皆様

お疲れ様です。総務部の山田です。
来週のプロジェクト進捗会議の日程について調整させていただけますでしょうか。

候補日時：
1. 10月12日（月） 14:00〜15:00
2. 10月13日（火） 10:00〜11:00

ご都合の悪い時間帯がございましたら、明日17時までにご連絡ください。
よろしくお願いいたします。`
    },
    {
      id: 'task-2',
      title: '【業務報告】日次作業報告書',
      category: '日報・報告書',
      difficulty: '標準',
      estimatedTime: '4',
      content: `本日業務報告

日付：2026年10月5日
担当者：鈴木 一郎

1. 本日の業務内容
・顧客データ入力作業（200件完了）
・提出書類の印刷およびファイル整理
・館内清掃および備品チェック

2. 所感・申し送り事項
データ入力作業は目標件数を達成することができました。
明日は午前中に書類チェックを行い、午後から新規案件のデータ登録を進めます。`
    },
    {
      id: 'task-3',
      title: '【データ転写】商品在庫一覧リスト',
      category: 'データ入力',
      difficulty: 'やや難',
      estimatedTime: '5',
      content: `商品コード,商品名,単価,在庫数,保管エリア
A-101,ノートPCスタンド,3500,25,倉庫A-2
A-102,ワイヤレスマウス,1800,50,倉庫A-3
B-201,エルゴノミクスマウスパッド,1200,80,倉庫B-1
B-202,USB Type-Cハブ,4200,15,倉庫B-4
C-301,モニターアーム,8900,10,倉庫C-1`
    },
    {
      id: 'task-4',
      title: '【基礎入力】短文タイピング（入門）',
      category: '基礎練習',
      difficulty: '初級',
      estimatedTime: '2',
      content: `いつも大変お世話になっております。
本日の会議資料を添付ファイルにてお送りいたします。
ご確認のほど、よろしくお願い申し上げます。
何かご不明な点がございましたら、お気軽にお問い合わせください。`
    }
  ];

  // ==========================================
  // 2. アプリケーション状態 (State)
  // ==========================================
  let state = {
    selectedTask: SAMPLE_TASKS[0],
    mode: 'screen', // 'screen' or 'paper'
    isDarkMode: false,
    isRunning: false,
    isPaused: false,
    startTime: null,
    elapsedSeconds: 0,
    timerInterval: null,
    backspaceLogs: [], // { timestamp: second, count: N }
    backspaceCount: 0,
    typedText: '',
    chartErrorDist: null,
    chartBackspaceTimeline: null
  };

  // ==========================================
  // 3. DOM要素の取得
  // ==========================================
  const sampleSelect = document.getElementById('sample-select');
  const sampleBadge = document.getElementById('sample-badge');
  const sampleCharCount = document.getElementById('sample-char-count');
  const sampleEstimatedTime = document.getElementById('sample-estimated-time');
  const sampleTextContent = document.getElementById('sample-text-content');
  const sampleDisplaySection = document.getElementById('sample-display-section');
  const btnToggleSampleVis = document.getElementById('btn-toggle-sample-vis');

  const btnModeScreen = document.getElementById('btn-mode-screen');
  const btnModePaper = document.getElementById('btn-mode-paper');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');

  const editor = document.getElementById('editor');
  const editorOverlay = document.getElementById('editor-overlay');

  const statTime = document.getElementById('stat-time');
  const statChars = document.getElementById('stat-chars');
  const statCpm = document.getElementById('stat-cpm');
  const statBackspace = document.getElementById('stat-backspace');

  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnCheck = document.getElementById('btn-check');

  // Wordツールバー要素
  const toolFontSize = document.getElementById('tool-font-size');
  const toolBold = document.getElementById('tool-bold');
  const toolItalic = document.getElementById('tool-italic');
  const toolUnderline = document.getElementById('tool-underline');
  const toolColor = document.getElementById('tool-color');
  const toolBgColor = document.getElementById('tool-bg-color');
  const toolClear = document.getElementById('tool-clear');

  // モーダル・結果要素
  const resultModal = document.getElementById('result-modal');
  const btnCloseModal = document.getElementById('btn-close-modal');
  const btnModalCloseBottom = document.getElementById('btn-modal-close-bottom');
  const btnPrint = document.getElementById('btn-print');
  const btnSaveFeedback = document.getElementById('btn-save-feedback');

  const resAccuracy = document.getElementById('res-accuracy');
  const resAccuracyDetail = document.getElementById('res-accuracy-detail');
  const resCpm = document.getElementById('res-cpm');
  const resTime = document.getElementById('res-time');
  const resCharTotal = document.getElementById('res-char-total');
  const resBackspace = document.getElementById('res-backspace');
  const resBackspaceRate = document.getElementById('res-backspace-rate');
  const insightList = document.getElementById('insight-list');
  const diffContainer = document.getElementById('diff-container');
  const resultDate = document.getElementById('result-date');

  // ==========================================
  // 4. 初期化処理
  // ==========================================
  function init() {
    renderSampleOptions();
    loadSampleTask(SAMPLE_TASKS[0].id);
    setupEventListeners();
  }

  // サンプル課題の選択肢描画
  function renderSampleOptions() {
    sampleSelect.innerHTML = SAMPLE_TASKS.map(task => 
      `<option value="${task.id}">${task.title}（約${task.content.length}文字）</option>`
    ).join('');
  }

  // 課題のロード
  function loadSampleTask(taskId) {
    const task = SAMPLE_TASKS.find(t => t.id === taskId);
    if (!task) return;
    
    state.selectedTask = task;
    sampleBadge.textContent = `難易度: ${task.difficulty}`;
    sampleCharCount.textContent = task.content.length;
    sampleEstimatedTime.textContent = task.estimatedTime;
    sampleTextContent.textContent = task.content;

    resetTraining();
  }

  // イベントリスナー設定
  function setupEventListeners() {
    // 課題変更
    sampleSelect.addEventListener('change', (e) => {
      loadSampleTask(e.target.value);
    });

    // 画面モード切替
    btnModeScreen.addEventListener('click', () => setMode('screen'));
    btnModePaper.addEventListener('click', () => setMode('paper'));

    // ダークモード切替
    btnThemeToggle.addEventListener('click', () => {
      state.isDarkMode = !state.isDarkMode;
      document.body.classList.toggle('dark-mode', state.isDarkMode);
    });

    // 見本表示切り替え
    btnToggleSampleVis.addEventListener('click', () => {
      const isHidden = sampleTextContent.style.display === 'none';
      sampleTextContent.style.display = isHidden ? 'block' : 'none';
      btnToggleSampleVis.textContent = isHidden ? '👁️ 非表示にする' : '👁️ 表示する';
    });

    // タイマー・コントロールボタン
    btnStart.addEventListener('click', startTraining);
    btnPause.addEventListener('click', pauseTraining);
    btnReset.addEventListener('click', resetTraining);
    btnCheck.addEventListener('click', finishAndAnalyze);

    // エディタの入力イベント・Backspaceログ収集
    editor.addEventListener('keydown', handleEditorKeyDown);
    editor.addEventListener('input', handleEditorInput);

    // Word風リッチテキストツールバー機能
    setupToolbarEvents();

    // モーダル操作
    btnCloseModal.addEventListener('click', closeModal);
    btnModalCloseBottom.addEventListener('click', closeModal);
    btnPrint.addEventListener('click', () => {
      preparePrintData();
      window.print();
    });
    btnSaveFeedback.addEventListener('click', () => {
      alert('フィードバックレポートを保存しました。（デモ動作）');
      closeModal();
    });
  }

  // ==========================================
  // 5. 訓練セッション・タイマー制御
  // ==========================================
  function setMode(mode) {
    state.mode = mode;
    if (mode === 'screen') {
      btnModeScreen.classList.add('active');
      btnModePaper.classList.remove('active');
      sampleDisplaySection.style.display = 'block';
    } else {
      btnModePaper.classList.add('active');
      btnModeScreen.classList.remove('active');
      sampleDisplaySection.style.display = 'none';
    }
  }

  function startTraining() {
    if (state.isRunning && !state.isPaused) return;

    if (!state.isRunning) {
      // 新規スタート
      state.isRunning = true;
      state.isPaused = false;
      state.startTime = Date.now() - (state.elapsedSeconds * 1000);
      state.backspaceLogs = [];
      state.backspaceCount = 0;
      editor.innerHTML = '';
    } else if (state.isPaused) {
      // 一時停止解除
      state.isPaused = false;
      state.startTime = Date.now() - (state.elapsedSeconds * 1000);
    }

    editorOverlay.classList.add('hidden');
    editor.focus();

    btnStart.disabled = true;
    btnPause.disabled = false;
    btnCheck.disabled = false;

    // タイマースタート
    clearInterval(state.timerInterval);
    state.timerInterval = setInterval(updateTimer, 1000);
  }

  function pauseTraining() {
    if (!state.isRunning || state.isPaused) return;

    state.isPaused = true;
    clearInterval(state.timerInterval);

    editorOverlay.classList.remove('hidden');
    editorOverlay.querySelector('p').textContent = '⏸️ 一時停止中（「スタート」で再開）';

    btnStart.disabled = false;
    btnPause.disabled = true;
  }

  function resetTraining() {
    state.isRunning = false;
    state.isPaused = false;
    state.elapsedSeconds = 0;
    state.backspaceCount = 0;
    state.backspaceLogs = [];
    clearInterval(state.timerInterval);

    editor.innerHTML = '';
    editorOverlay.classList.remove('hidden');
    editorOverlay.querySelector('p').textContent = '「▶ 訓練スタート」を押すと入力が開始できます';

    btnStart.disabled = false;
    btnPause.disabled = true;
    btnCheck.disabled = true;

    updateStatusUI();
  }

  function updateTimer() {
    if (!state.isRunning || state.isPaused) return;
    state.elapsedSeconds = Math.floor((Date.now() - state.startTime) / 1000);
    updateStatusUI();
  }

  function updateStatusUI() {
    const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(state.elapsedSeconds % 60).padStart(2, '0');
    statTime.textContent = `${mins}:${secs}`;

    const text = getPlainText(editor);
    const charLen = text.length;
    statChars.textContent = charLen;

    // CPM計算
    const minutes = state.elapsedSeconds / 60;
    const cpm = minutes > 0 ? Math.round(charLen / minutes) : 0;
    statCpm.innerHTML = `${cpm} <small>文字/分</small>`;

    statBackspace.innerHTML = `${state.backspaceCount} <small>回</small>`;
  }

  // ==========================================
  // 6. 入力監視 & Backspaceキー収集
  // ==========================================
  function handleEditorKeyDown(e) {
    if (!state.isRunning || state.isPaused) {
      if (e.key !== 'Tab') e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      state.backspaceCount++;
      state.backspaceLogs.push({
        timestamp: state.elapsedSeconds,
        count: state.backspaceCount
      });
      updateStatusUI();
    }
  }

  function handleEditorInput() {
    if (!state.isRunning || state.isPaused) return;
    updateStatusUI();
  }

  // ==========================================
  // 7. Word風リッチテキストツールバーの機能実装
  // ==========================================
  function setupToolbarEvents() {
    toolFontSize.addEventListener('change', (e) => {
      document.execCommand('fontSize', false, e.target.value);
      editor.focus();
    });

    toolBold.addEventListener('click', () => {
      document.execCommand('bold', false, null);
      editor.focus();
    });

    toolItalic.addEventListener('click', () => {
      document.execCommand('italic', false, null);
      editor.focus();
    });

    toolUnderline.addEventListener('click', () => {
      document.execCommand('underline', false, null);
      editor.focus();
    });

    toolColor.addEventListener('input', (e) => {
      document.execCommand('foreColor', false, e.target.value);
      editor.focus();
    });

    toolBgColor.addEventListener('input', (e) => {
      document.execCommand('hiliteColor', false, e.target.value);
      editor.focus();
    });

    toolClear.addEventListener('click', () => {
      document.execCommand('removeFormat', false, null);
      editor.focus();
    });
  }

  // HTMLから純粋なテキストを抽出（改行維持）
  function getPlainText(element) {
    return element.innerText || element.textContent || '';
  }

  // ==========================================
  // 8. 差分解析（Diff）＆ スコア・傾向分析エンジン
  // ==========================================
  function finishAndAnalyze() {
    if (state.elapsedSeconds === 0) {
      alert('タイピングが開始されていません。');
      return;
    }

    pauseTraining();

    const targetText = state.selectedTask.content;
    const typedText = getPlainText(editor);

    // 差分計算
    const diffResult = computeTextDiff(targetText, typedText);
    
    // スコア＆アナリティクス算出
    renderResults(diffResult, targetText, typedText);
    openModal();
  }

  /**
   * 文字単位の差分解析 (Levenshtein / Dynamic Programming)
   */
  function computeTextDiff(target, typed) {
    const m = target.length;
    const n = typed.length;

    // DPテーブル作成
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (target[i - 1] === typed[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],    // 脱字 (Missing)
            dp[i][j - 1],    // 余分 (Extra)
            dp[i - 1][j - 1] // 誤字 (Typo)
          );
        }
      }
    }

    // バックトラックで操作列を取得
    let i = m, j = n;
    const alignment = [];

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && target[i - 1] === typed[j - 1]) {
        alignment.unshift({ type: 'correct', char: target[i - 1], targetIdx: i - 1 });
        i--; j--;
      } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
        alignment.unshift({ type: 'typo', charTarget: target[i - 1], charTyped: typed[j - 1], targetIdx: i - 1 });
        i--; j--;
      } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
        alignment.unshift({ type: 'missing', char: target[i - 1], targetIdx: i - 1 });
        i--;
      } else if (j > 0 && dp[i][j] === dp[i][j - 1] + 1) {
        alignment.unshift({ type: 'extra', char: typed[j - 1], targetIdx: i });
        j--;
      } else {
        if (i > 0) {
          alignment.unshift({ type: 'missing', char: target[i - 1], targetIdx: i - 1 });
          i--;
        } else {
          alignment.unshift({ type: 'extra', char: typed[j - 1], targetIdx: i });
          j--;
        }
      }
    }

    let correctCount = 0, typoCount = 0, missingCount = 0, extraCount = 0;
    alignment.forEach(item => {
      if (item.type === 'correct') correctCount++;
      if (item.type === 'typo') typoCount++;
      if (item.type === 'missing') missingCount++;
      if (item.type === 'extra') extraCount++;
    });

    const accuracy = target.length > 0 ? Math.max(0, Math.round((correctCount / target.length) * 100)) : 0;

    return {
      alignment,
      correctCount,
      typoCount,
      missingCount,
      extraCount,
      accuracy
    };
  }

  // ==========================================
  // 9. 結果モーダル・レポート描画
  // ==========================================
  function renderResults(diff, targetText, typedText) {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    resultDate.textContent = `実施日時: ${dateStr}`;

    // スコア
    resAccuracy.textContent = `${diff.accuracy}%`;
    resAccuracyDetail.textContent = `誤字: ${diff.typoCount} / 脱字: ${diff.missingCount} / 不要文字: ${diff.extraCount}`;

    const minutes = state.elapsedSeconds / 60;
    const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
    resCpm.textContent = cpm;

    const mins = String(Math.floor(state.elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(state.elapsedSeconds % 60).padStart(2, '0');
    resTime.textContent = `${mins}:${secs}`;
    resCharTotal.textContent = `総入力数: ${typedText.length}文字 (正解原稿: ${targetText.length}字)`;

    resBackspace.textContent = `${state.backspaceCount}回`;
    const bsRate = typedText.length > 0 ? ((state.backspaceCount / typedText.length) * 100).toFixed(1) : 0;
    resBackspaceRate.textContent = `100文字あたり ${bsRate}回修正`;

    // 差分表示テキストの生成
    renderDiffDOM(diff.alignment);

    // インサイト（分析所見）生成
    renderInsights(diff, targetText, typedText, cpm, bsRate);

    // グラフを描画
    renderCharts(diff.alignment, targetText.length);
  }

  function renderDiffDOM(alignment) {
    diffContainer.innerHTML = '';
    alignment.forEach(item => {
      const span = document.createElement('span');
      if (item.type === 'correct') {
        span.className = 'diff-char-correct';
        span.textContent = item.char;
      } else if (item.type === 'typo') {
        span.className = 'diff-char-typo';
        span.textContent = item.charTyped;
        span.title = `誤字: 本来は「${item.charTarget}」`;
      } else if (item.type === 'missing') {
        span.className = 'diff-char-missing';
        span.textContent = item.char === '\n' ? '↵(改行漏れ)' : item.char;
        span.title = `脱字（入力漏れ）: 「${item.char}」`;
      } else if (item.type === 'extra') {
        span.className = 'diff-char-extra';
        span.textContent = item.char;
        span.title = `余分な文字`;
      }
      diffContainer.appendChild(span);
    });
  }

  function renderInsights(diff, targetText, typedText, cpm, bsRate) {
    insightList.innerHTML = '';
    const insights = [];

    // 1. 正確性に関する所見
    if (diff.accuracy >= 95) {
      insights.push(`極めて高い正確率（${diff.accuracy}%）です。誤字脱字が少なく実務で即戦力となるタイピング精度です。`);
    } else if (diff.accuracy >= 85) {
      insights.push(`実用レベルの正確率（${diff.accuracy}%）です。誤り箇所を見直すことでさらに精度向上が期待できます。`);
    } else {
      insights.push(`正確率は${diff.accuracy}%でした。まずはスピードよりも正確にキーを打つことを意識してみましょう。`);
    }

    // 2. ミス発生位置の傾向
    const targetLen = targetText.length;
    let errStart = 0, errMid = 0, errEnd = 0;
    diff.alignment.forEach(item => {
      if (item.type !== 'correct') {
        const idx = item.targetIdx || 0;
        const ratio = idx / targetLen;
        if (ratio < 0.33) errStart++;
        else if (ratio < 0.66) errMid++;
        else errEnd++;
      }
    });

    const totalErrors = errStart + errMid + errEnd;
    if (totalErrors > 0) {
      if (errStart / totalErrors >= 0.5) {
        insights.push(`【序盤に誤りが集中】誤りの半数以上（${errStart}箇所）が書き出し部分で発生しています。打ち始める前に落ち着いて見本を確認する習慣が効果的です。`);
      } else if (errEnd / totalErrors >= 0.5) {
        insights.push(`【終盤に誤りが集中】作業の後半（${errEnd}箇所）でミスが増えています。長文入力時の集中力の維持や、こまめな画面確認がポイントです。`);
      } else {
        insights.push(`文章全体を通してバランスよく入力できています。特定のパートでの大きな崩れは見られません。`);
      }
    }

    // 3. Backspace修正傾向
    if (state.backspaceCount > 0) {
      if (bsRate > 15) {
        insights.push(`【打鍵修正の頻度が高め】100文字あたり${bsRate}回のBackspaceが押されています。入力時の迷いや打ち直しが多いため、ホームポジションを再確認すると速度向上に繋がります。`);
      } else {
        insights.push(`【適度な自己修正能力】Backspaceによる修正（${state.backspaceCount}回）を行いながら着実に正確な文章を入力できています。`);
      }
    }

    // 4. タイピング速度
    if (cpm >= 120) {
      insights.push(`入力速度は【${cpm}文字/分】と良好です（一般事務目安の100文字/分をクリアしています）。`);
    } else {
      insights.push(`現在の入力速度は【${cpm}文字/分】です。正確性を保ったまま焦らず練習を継続しましょう。`);
    }

    insights.forEach(text => {
      const li = document.createElement('li');
      li.textContent = text;
      insightList.appendChild(li);
    });
  }

  // ==========================================
  // 10. Chart.js グラフ描画
  // ==========================================
  function renderCharts(alignment, targetLen) {
    // グラフ1: 位置別エラー分布
    let startErr = 0, midErr = 0, endErr = 0;
    alignment.forEach(item => {
      if (item.type !== 'correct') {
        const idx = item.targetIdx || 0;
        const ratio = targetLen > 0 ? idx / targetLen : 0;
        if (ratio < 0.33) startErr++;
        else if (ratio < 0.66) midErr++;
        else endErr++;
      }
    });

    const ctxError = document.getElementById('chart-error-distribution').getContext('2d');
    if (state.chartErrorDist) state.chartErrorDist.destroy();

    state.chartErrorDist = new Chart(ctxError, {
      type: 'bar',
      data: {
        labels: ['序盤 (0〜33%)', '中盤 (34〜66%)', '終盤 (67〜100%)'],
        datasets: [{
          label: '誤り（ミス）発生数',
          data: [startErr, midErr, endErr],
          backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6'],
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });

    // グラフ2: Backspaceタイムライン
    // 時間を10秒単位のバケットに集計
    const bucketSize = 10;
    const maxSec = Math.max(state.elapsedSeconds, 10);
    const bucketCount = Math.ceil(maxSec / bucketSize);
    const labels = [];
    const bsData = Array(bucketCount).fill(0);

    for (let b = 0; b < bucketCount; b++) {
      labels.push(`${b * bucketSize}秒〜`);
    }

    state.backspaceLogs.forEach(log => {
      const bIdx = Math.min(Math.floor(log.timestamp / bucketSize), bucketCount - 1);
      bsData[bIdx]++;
    });

    const ctxBs = document.getElementById('chart-backspace-timeline').getContext('2d');
    if (state.chartBackspaceTimeline) state.chartBackspaceTimeline.destroy();

    state.chartBackspaceTimeline = new Chart(ctxBs, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Backspace修正回数',
          data: bsData,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  // ==========================================
  // 11. モーダル表示＆印刷用データ準備
  // ==========================================
  function openModal() {
    resultModal.classList.remove('hidden');
  }

  function closeModal() {
    resultModal.classList.add('hidden');
  }

  function preparePrintData() {
    const now = new Date();
    document.getElementById('print-date').textContent = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
    document.getElementById('print-task-name').textContent = state.selectedTask.title;
  }

  // アプリの起動
  init();
});
