import React, { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import StepBar from "./components/StepBar";
import SampleModal from "./components/SampleModal";
import WordToolbar from "./components/WordToolbar";
import ReportModal from "./components/ReportModal";
import { fetchSampleTasks } from "./utils/sampleLoader";
import { computeTextDiff, generateInsights } from "./utils/diffEngine";
import {
  FileText,
  Eye,
  Play,
  CheckCircle,
  RotateCcw,
} from "lucide-react";

export default function App() {
  const [sampleTasks, setSampleTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // ステップ状態 (1, 2, 3)
  const [step, setStep] = useState(1);

  // モーダル表示状態（見本記憶モーダル ＆ レポートモーダル）
  const [isSampleViewModalOpen, setIsSampleViewModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // タイマー ＆ 入力ステート
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [backspaceCount, setBackspaceCount] = useState(0);
  const [backspaceLogs, setBackspaceLogs] = useState([]);

  // 分析結果データ
  const [resultData, setResultData] = useState(null);

  const editorRef = useRef(null);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);

  // マウント時に public/text-samples/ から動的取得
  useEffect(() => {
    async function loadTasks() {
      const tasks = await fetchSampleTasks();
      setSampleTasks(tasks);
    }
    loadTasks();
  }, []);

  // ダークモード適用
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [isDarkMode]);

  // バックグラウンドタイマー更新
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(
          Math.floor((Date.now() - startTimeRef.current) / 1000)
        );
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // 課題カードの選択ハンドラ（クリック即モーダル表示）
  const handleSelectTask = (task) => {
    setSelectedTask(task);
    resetTrainingState();
    setIsSampleViewModalOpen(true);
  };

  const resetTrainingState = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  // プレーンテキスト抽出
  const getPlainText = () => {
    if (!editorRef.current) return "";
    return editorRef.current.innerText || editorRef.current.textContent || "";
  };

  // 【ステップ２】タイピングスタート
  const startTraining = () => {
    setIsRunning(true);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    startTimeRef.current = Date.now();

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setTimeout(() => {
        editorRef.current.focus();
      }, 50);
    }
  };

  // キー入力ハンドラ
  const handleKeyDown = (e) => {
    if (!isRunning) {
      if (e.key !== "Tab") e.preventDefault();
      return;
    }

    if (e.key === "Backspace") {
      setBackspaceCount((prev) => prev + 1);
      setBackspaceLogs((prev) => [
        ...prev,
        { timestamp: elapsedSeconds, count: backspaceCount + 1 },
      ]);
    }
  };

  // 【ステップ３】完了＆結果表示
  const handleFinishAndCheck = () => {
    if (!isRunning || elapsedSeconds === 0) {
      alert(
        "タイピングが開始されていません。「スタート」を押して入力してください。"
      );
      return;
    }

    setIsRunning(false);

    const typedText = getPlainText();
    const targetText = selectedTask ? selectedTask.content : "";

    const diff = computeTextDiff(targetText, typedText);
    const minutes = elapsedSeconds / 60;
    const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
    const bsRate =
      typedText.length > 0
        ? ((backspaceCount / typedText.length) * 100).toFixed(1)
        : 0;

    const { insights, errStart, errMid, errEnd } = generateInsights(
      diff,
      targetText,
      typedText,
      cpm,
      bsRate,
      backspaceCount
    );

    const data = {
      task: selectedTask,
      diff,
      elapsedSeconds,
      typedText,
      backspaceCount,
      backspaceLogs,
      insights,
      errStart,
      errMid,
      errEnd,
    };

    setResultData(data);
    setStep(3);
    setIsReportModalOpen(true);
  };

  // ステップ1へ戻る（新しい訓練）
  const handleRestartAll = () => {
    resetTrainingState();
    setSelectedTask(null);
    setStep(1);
    setIsReportModalOpen(false);
  };

  return (
    <div className="app-root">
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main className="main-content">
        {/* 3ステップ進行バー */}
        <StepBar currentStep={step} onStepClick={setStep} />

        {/* =========================================================
            ステップ１：練習する文章を選択してください
           ========================================================= */}
        {step === 1 && (
          <section className="card step-card">
            <div className="step-header">
              <span className="step-badge">ステップ 1</span>
              <h2>練習する文章を選択してください。</h2>
            </div>

            <div className="step-body">
              {/* 課題カード一覧（active状態/選択中ボタンを削除したシンプル表示） */}
              <div className="text-task-grid">
                {sampleTasks.map((task) => {
                  const previewSnippet = task.content
                    ? task.content.substring(0, 75) + "..."
                    : "";

                  return (
                    <div
                      key={task.id}
                      className="task-select-card"
                      onClick={() => handleSelectTask(task)}
                    >
                      <div className="task-select-card-header">
                        <h3 className="task-select-title">
                          <FileText size={18} style={{ marginRight: 6 }} />
                          {task.title}
                        </h3>
                      </div>

                      <div className="task-select-card-meta">
                        <span>
                          文字数:{" "}
                          <strong>
                            {task.content ? task.content.length : 0}
                          </strong>
                          文字
                        </span>
                      </div>

                      <p className="task-select-snippet">{previewSnippet}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            ステップ２：訓練を開始するには「スタート」ボタンをクリックしてください
           ========================================================= */}
        {step === 2 && (
          <section className="card step-card">
            <div className="step-header">
              <div className="step-header-left">
                <span className="step-badge">ステップ 2</span>
                <h2>
                  訓練を開始するには「スタート」ボタンをクリックしてください。
                </h2>
              </div>
              {selectedTask && (
                <div className="step2-task-pill">
                  <span>
                    課題: <strong>{selectedTask.title}</strong> (
                    {selectedTask.content.length}字)
                  </span>
                  <button
                    type="button"
                    className="btn btn-text btn-sm"
                    onClick={() => setIsSampleViewModalOpen(true)}
                  >
                    <Eye size={15} /> 全文を再確認
                  </button>
                </div>
              )}
            </div>

            <div className="step-body">
              {/* スタートボタンエリア */}
              <div className="step2-start-bar">
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-start-large"
                  onClick={startTraining}
                  disabled={isRunning}
                >
                  <Play size={22} /> スタート
                </button>
              </div>

              {/* Word風タイピング入力フォーム */}
              <div className="editor-card-container">
                <div className="editor-header-mini">
                  <span>✍️ 入力フォーム</span>
                  <span className="tip-text">
                    装飾を行っても正誤判定には影響しません
                  </span>
                </div>

                <WordToolbar editorRef={editorRef} />

                <div className="editor-wrapper tall-editor-wrapper">
                  <div
                    ref={editorRef}
                    className="editor-content tall-editor-content"
                    contentEditable={isRunning}
                    onKeyDown={handleKeyDown}
                    placeholder="「スタート」ボタンを押すと、記憶した文章をここに入力できます..."
                    suppressContentEditableWarning={true}
                  ></div>

                  {!isRunning && (
                    <div className="editor-overlay">
                      <p>
                        上の「スタート」ボタンを押して訓練を開始してください
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ステップ３導線：完了ボタン */}
              <div className="step3-finish-bar">
                <div className="finish-instruction">
                  <span className="step-badge step-badge-green">
                    ステップ 3
                  </span>
                  <h3>
                    入力が完了したら「完了」ボタンをクリックしてください。
                  </h3>
                </div>
                <button
                  type="button"
                  className="btn btn-success btn-lg btn-finish-large"
                  onClick={handleFinishAndCheck}
                  disabled={!isRunning}
                >
                  <CheckCircle size={22} /> 完了（結果を見る）
                </button>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            ステップ３：結果レポート表示
           ========================================================= */}
        {step === 3 && resultData && (
          <section className="card step-card">
            <div className="step-header">
              <span className="step-badge step-badge-green">ステップ 3</span>
              <h2>タイピング訓練 成果・分析レポート</h2>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleRestartAll}
              >
                <RotateCcw size={16} /> 別の訓練を開始する（ステップ1へ）
              </button>
            </div>
            <div className="step-body">
              <p className="step3-notice">
                「結果を見る」モーダル、または下記の詳細分析結果をご確認ください。
              </p>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => setIsReportModalOpen(true)}
              >
                📊 レポート詳細画面を再表示する
              </button>
            </div>
          </section>
        )}
      </main>

      {/* 練習テキスト記憶ダイアログ（「ステップ2へ進む」ボタンで移行） */}
      <SampleModal
        isOpen={isSampleViewModalOpen}
        onClose={() => setIsSampleViewModalOpen(false)}
        onProceedToStep2={() => setStep(2)}
        task={selectedTask}
      />

      {/* ステップ３：分析・レポートモーダル */}
      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        resultData={resultData}
      />
    </div>
  );
}
