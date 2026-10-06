import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import TaskInfoBar from './components/TaskInfoBar';
import WordToolbar from './components/WordToolbar';
import ReportModal from './components/ReportModal';
import SampleModal from './components/SampleModal';
import { fetchSampleTasks } from './utils/sampleLoader';
import { computeTextDiff, generateInsights } from './utils/diffEngine';

export default function App() {
  const [sampleTasks, setSampleTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);

  // バックグラウンド計測ステート
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [backspaceLogs, setBackspaceLogs] = useState([]);

  // 分析結果 ＆ モーダル
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // マウント時に public/text-samples/ から動的取得
  useEffect(() => {
    async function loadTasks() {
      const tasks = await fetchSampleTasks();
      setSampleTasks(tasks);
      if (tasks.length > 0) {
        setSelectedTask(tasks[0]);
      }
    }
    loadTasks();
  }, []);

  // ダークモード適用
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [isDarkMode]);

  // 課題切り替え時にリセット
  const handleSelectTask = (taskId) => {
    const task = sampleTasks.find((t) => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      resetTraining();
    }
  };

  // プレーンテキスト抽出
  const getPlainText = () => {
    if (!editorRef.current) return '';
    return editorRef.current.innerText || editorRef.current.textContent || '';
  };

  // バックグラウンドタイマー更新
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // 訓練スタート
  const startTraining = () => {
    setIsRunning(true);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    startTimeRef.current = Date.now();
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
      setTimeout(() => {
        editorRef.current.focus();
      }, 50);
    }
  };

  const resetTraining = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // キー入力ハンドラ
  const handleKeyDown = (e) => {
    if (!isRunning) {
      if (e.key !== 'Tab') e.preventDefault();
      return;
    }

    if (e.key === 'Backspace') {
      setBackspaceCount((prev) => prev + 1);
      setBackspaceLogs((prev) => [
        ...prev,
        { timestamp: elapsedSeconds, count: backspaceCount + 1 }
      ]);
    }
  };

  // 完了・分析
  const handleFinishAndCheck = () => {
    if (!isRunning || elapsedSeconds === 0) {
      alert('タイピングが開始されていません。「▶ 訓練スタート」を押して入力してください。');
      return;
    }

    setIsRunning(false);

    const typedText = getPlainText();
    const targetText = selectedTask ? selectedTask.content : '';

    const diff = computeTextDiff(targetText, typedText);
    const minutes = elapsedSeconds / 60;
    const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
    const bsRate = typedText.length > 0 ? ((backspaceCount / typedText.length) * 100).toFixed(1) : 0;

    const { insights, errStart, errMid, errEnd } = generateInsights(
      diff,
      targetText,
      typedText,
      cpm,
      bsRate,
      backspaceCount
    );

    setResultData({
      task: selectedTask,
      diff,
      elapsedSeconds,
      typedText,
      backspaceCount,
      backspaceLogs,
      insights,
      errStart,
      errMid,
      errEnd
    });

    setIsReportModalOpen(true);
  };

  return (
    <div className="app-root">
      {/* ヘッダー */}
      <Header
        sampleTasks={sampleTasks}
        selectedTask={selectedTask}
        onSelectTask={handleSelectTask}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="main-content">
        {/* 課題情報バー ＆ 見本確認ダイアログボタン */}
        {selectedTask && (
          <TaskInfoBar
            task={selectedTask}
            onOpenSampleModal={() => setIsSampleModalOpen(true)}
          />
        )}

        {/* Word風タイピングエディタ */}
        <section className="card editor-card">
          <div className="card-header editor-header">
            <h2>✍️ タイピング入力領域（Word操作対応）</h2>
            <span className="tip-text">
              💡 文字サイズや色の装飾を行っても正誤判定には影響しません
            </span>
          </div>

          {/* Wordリッチテキストツールバー */}
          <WordToolbar editorRef={editorRef} />

          {/* エディタ本体 */}
          <div className="editor-wrapper tall-editor-wrapper">
            <div
              ref={editorRef}
              className="editor-content tall-editor-content"
              contentEditable={isRunning}
              onKeyDown={handleKeyDown}
              placeholder="「▶ 訓練スタート」を押して記憶した文章を入力してください..."
              suppressContentEditableWarning={true}
            ></div>

            {!isRunning && (
              <div className="editor-overlay">
                <p>「▶ 訓練スタート」を押すと入力が開始できます</p>
              </div>
            )}
          </div>

          {/* アクションボタン */}
          <div className="action-bar">
            <button
              type="button"
              className="btn btn-primary btn-lg"
              onClick={startTraining}
              disabled={isRunning}
            >
              ▶ 訓練スタート
            </button>
            <button
              type="button"
              className="btn btn-success btn-lg"
              onClick={handleFinishAndCheck}
              disabled={!isRunning}
            >
              ✅ 完了＆チェック・結果を見る
            </button>
          </div>
        </section>
      </main>

      {/* 練習テキスト記憶ダイアログ */}
      <SampleModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        task={selectedTask}
      />

      {/* 分析・レポートモーダル */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resultData={resultData}
      />
    </div>
  );
}
