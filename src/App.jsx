import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import SampleSelector from './components/SampleSelector';
import WordToolbar from './components/WordToolbar';
import StatusBar from './components/StatusBar';
import ReportModal from './components/ReportModal';
import { SAMPLE_TASKS } from './data/sampleTasks';
import { computeTextDiff, generateInsights } from './utils/diffEngine';

export default function App() {
  const [selectedTask, setSelectedTask] = useState(SAMPLE_TASKS[0]);
  const [mode, setMode] = useState('screen'); // 'screen' | 'paper'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sampleVisible, setSampleVisible] = useState(true);

  // タイマー ＆ 入力ステート
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [backspaceLogs, setBackspaceLogs] = useState([]);
  const [typedCharCount, setTypedCharCount] = useState(0);

  // 分析結果 ＆ モーダル
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resultData, setResultData] = useState(null);

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

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
    const task = SAMPLE_TASKS.find((t) => t.id === taskId);
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

  // タイマー更新
  useEffect(() => {
    if (isRunning && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, isPaused]);

  // 訓練コントロール
  const startTraining = () => {
    if (isRunning && !isPaused) return;

    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
      setElapsedSeconds(0);
      setBackspaceCount(0);
      setBackspaceLogs([]);
      setTypedCharCount(0);
      startTimeRef.current = Date.now();
      if (editorRef.current) {
        editorRef.current.innerHTML = '';
      }
    } else if (isPaused) {
      setIsPaused(false);
      startTimeRef.current = Date.now() - elapsedSeconds * 1000;
    }

    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.focus();
      }
    }, 50);
  };

  const pauseTraining = () => {
    if (!isRunning || isPaused) return;
    setIsPaused(true);
  };

  const resetTraining = () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    setTypedCharCount(0);
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
  };

  // 入力＆キー入力ハンドラ
  const handleKeyDown = (e) => {
    if (!isRunning || isPaused) {
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

  const handleInput = () => {
    if (!isRunning || isPaused) return;
    const text = getPlainText();
    setTypedCharCount(text.length);
  };

  // 完了・分析
  const handleFinishAndCheck = () => {
    if (elapsedSeconds === 0) {
      alert('タイピングが開始されていません。');
      return;
    }

    pauseTraining();

    const typedText = getPlainText();
    const targetText = selectedTask.content;

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

    setIsModalOpen(true);
  };

  return (
    <div className="app-root">
      <Header
        mode={mode}
        setMode={setMode}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="main-content">
        {/* 課題選択 */}
        <SampleSelector
          sampleTasks={SAMPLE_TASKS}
          selectedTask={selectedTask}
          onSelectTask={handleSelectTask}
        />

        {/* 課題文表示 (画面見本モード時) */}
        {mode === 'screen' && (
          <section className="card sample-display-card">
            <div className="card-header">
              <h2>📄 練習見本テキスト</h2>
              <button
                className="btn-text"
                onClick={() => setSampleVisible(!sampleVisible)}
              >
                {sampleVisible ? '👁️ 非表示にする' : '👁️ 表示する'}
              </button>
            </div>
            <div className="card-body">
              {sampleVisible && (
                <div className="sample-text-box">
                  {selectedTask.content}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Word風タイピングエディタ */}
        <section className="card editor-card">
          <div className="card-header editor-header">
            <h2>✍️ 2. タイピング入力（Word操作練習対応）</h2>
            <span className="tip-text">
              💡 装飾（文字サイズ・色）を変えても文字の正誤判定には影響しません
            </span>
          </div>

          {/* Wordリッチテキストツールバー */}
          <WordToolbar editorRef={editorRef} />

          {/* エディタ本体 */}
          <div className="editor-wrapper">
            <div
              ref={editorRef}
              className="editor-content"
              contentEditable={isRunning && !isPaused}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              placeholder="「スタート」を押すとここに入力できます..."
              suppressContentEditableWarning={true}
            ></div>

            {(!isRunning || isPaused) && (
              <div className="editor-overlay">
                <p>
                  {!isRunning
                    ? '「▶ 訓練スタート」を押すと入力が開始できます'
                    : '⏸️ 一時停止中（「スタート」で再開）'}
                </p>
              </div>
            )}
          </div>

          {/* ステータスバー */}
          <StatusBar
            elapsedSeconds={elapsedSeconds}
            typedCharCount={typedCharCount}
            backspaceCount={backspaceCount}
          />

          {/* アクションボタン */}
          <div className="action-bar">
            <button
              className="btn btn-primary"
              onClick={startTraining}
              disabled={isRunning && !isPaused}
            >
              ▶ 訓練スタート
            </button>
            <button
              className="btn btn-secondary"
              onClick={pauseTraining}
              disabled={!isRunning || isPaused}
            >
              ⏸️ 一時停止
            </button>
            <button className="btn btn-outline" onClick={resetTraining}>
              🔄 リセット
            </button>
            <button
              className="btn btn-success"
              onClick={handleFinishAndCheck}
              disabled={!isRunning && elapsedSeconds === 0}
            >
              ✅ 完了＆チェック・結果を見る
            </button>
          </div>
        </section>
      </main>

      {/* 分析・レポートモーダル */}
      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        resultData={resultData}
      />
    </div>
  );
}
