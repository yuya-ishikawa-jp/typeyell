import { useState, useEffect, useRef } from "react";
import Header from "./components/Header";
import StepBar from "./components/StepBar";
import SampleModal from "./components/SampleModal";
import WordToolbar from "./components/WordToolbar";
import ReportView from "./components/ReportView";
import { fetchSampleTasks } from "./utils/sampleLoader";
import { computeTextDiff } from "./utils/diffEngine";
import { FileText, CheckCircle } from "lucide-react";
import { Task, BackspaceLog, TypingHistoryItem, ResultData } from "./types";

export default function App() {
  const [sampleTasks, setSampleTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // ステップ状態 (1, 2, 3)
  const [step, setStep] = useState<number>(1);

  // カウントダウン状態 (null | 3 | 2 | 1 | 'スタート!')
  const [countdown, setCountdown] = useState<null | number | string>(null);

  // モーダル表示状態（見本記憶モーダル）
  const [isSampleViewModalOpen, setIsSampleViewModalOpen] = useState<boolean>(false);

  // タイマー ＆ 入力ステート
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [backspaceCount, setBackspaceCount] = useState<number>(0);
  const [backspaceLogs, setBackspaceLogs] = useState<BackspaceLog[]>([]);
  const [typingHistory, setTypingHistory] = useState<TypingHistoryItem[]>([]);

  // 分析結果データ
  const [resultData, setResultData] = useState<ResultData | null>(null);

  const editorRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number | null>(null);

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
        if (startTimeRef.current !== null) {
          setElapsedSeconds(
            Math.floor((Date.now() - startTimeRef.current) / 1000)
          );
        }
      }, 1000);
    } else {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning]);

  // 課題カードの選択ハンドラ
  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
    resetTrainingState();
    setIsSampleViewModalOpen(true);
  };

  const resetTrainingState = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    setTypingHistory([{ timeMs: 0, text: "" }]);
    setCountdown(null);
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
  };

  // プレーンテキスト抽出
  const getPlainText = (): string => {
    if (!editorRef.current) return "";
    return editorRef.current.innerText || editorRef.current.textContent || "";
  };

  // カウントダウン開始 ＆ タイピング自動スタート
  const triggerCountdownAndStart = () => {
    setStep(2);
    setIsRunning(false);
    setCountdown(3);

    setTimeout(() => {
      setCountdown(2);
      setTimeout(() => {
        setCountdown(1);
        setTimeout(() => {
          setCountdown("スタート！");
          setTimeout(() => {
            setCountdown(null);
            startTraining();
          }, 600);
        }, 1000);
      }, 1000);
    }, 1000);
  };

  // 実タイピングスタート
  const startTraining = () => {
    setIsRunning(true);
    setElapsedSeconds(0);
    setBackspaceCount(0);
    setBackspaceLogs([]);
    setTypingHistory([{ timeMs: 0, text: "" }]);
    startTimeRef.current = Date.now();

    if (editorRef.current) {
      editorRef.current.innerHTML = "";
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 50);
    }
  };

  // 入力ログ記録ハンドラ
  const handleInput = () => {
    if (!isRunning || !startTimeRef.current) return;
    const timeMs = Date.now() - startTimeRef.current;
    const text = getPlainText();
    setTypingHistory((prev) => [...prev, { timeMs, text }]);
  };

  // キー入力ハンドラ
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
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

  // 【ステップ３】完了＆結果直接表示
  const handleFinishAndCheck = () => {
    if (!isRunning || elapsedSeconds === 0 || !startTimeRef.current) return;

    setIsRunning(false);

    const typedText = getPlainText();
    const targetText = selectedTask ? selectedTask.content : "";
    const finalTimeMs = Date.now() - startTimeRef.current;
    const finalHistory: TypingHistoryItem[] = [
      ...typingHistory,
      { timeMs: finalTimeMs, text: typedText },
    ];

    const diff = computeTextDiff(targetText, typedText);

    const data: ResultData = {
      task: selectedTask,
      diff,
      elapsedSeconds,
      typedText,
      backspaceCount,
      backspaceLogs,
      typingHistory: finalHistory,
    };

    setResultData(data);
    setStep(3);
  };

  // ステップ1へ戻る（新しい練習）
  const handleRestartAll = () => {
    resetTrainingState();
    setSelectedTask(null);
    setStep(1);
    setResultData(null);
  };

  return (
    <div className="app-root">
      <Header isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main className="main-content">
        {/* 3ステップ進行バー */}
        <StepBar currentStep={step} />

        {/* =========================================================
            ステップ１：練習する課題を選択してください
           ========================================================= */}
        {step === 1 && (
          <section className="card step-card">
            <div className="step-header">
              <div className="step-header-left">
                <span className="step-badge">ステップ 1</span>
                <h2>練習する課題を選択してください。</h2>
              </div>
            </div>

            <div className="step-body">
              {/* 課題カード一覧 */}
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
            ステップ２：タイピング練習
           ========================================================= */}
        {step === 2 && (
          <section className="card step-card">
            <div className="step-header">
              <div className="step-header-left">
                <span className="step-badge">ステップ 2</span>
                <h2>タイピング練習</h2>
              </div>
              <div className="step-header-right">
                {selectedTask && (
                  <div className="step2-task-pill">
                    <span>
                      課題: <strong>{selectedTask.title}</strong> (
                      {selectedTask.content.length}字)
                    </span>
                  </div>
                )}
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleFinishAndCheck}
                  disabled={!isRunning}
                >
                  <CheckCircle size={18} /> 完了（結果を見る）
                </button>
              </div>
            </div>

            <div className="step-body">
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
                    onInput={handleInput}
                    {...({
                      placeholder: isRunning
                        ? "記憶した文章をここに入力してください..."
                        : "カウントダウン完了後、入力が開始できます...",
                    } as React.HTMLAttributes<HTMLDivElement>)}
                    suppressContentEditableWarning={true}
                  ></div>

                  {/* カウントダウンオーバーレイ（3, 2, 1, スタート!） */}
                  {countdown !== null && (
                    <div className="countdown-overlay">
                      <div className="countdown-content">
                        <span className="countdown-number">{countdown}</span>
                      </div>
                    </div>
                  )}

                  {!isRunning && countdown === null && (
                    <div className="editor-overlay">
                      <p>ステップ1で課題を選択するとタイピングが開始できます</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* =========================================================
            ステップ３：成果・分析レポート（画面に直接表示）
           ========================================================= */}
        {step === 3 && resultData && (
          <section className="card step-card">
            <div className="step-header">
              <div className="step-header-left">
                <span className="step-badge step-badge-green">ステップ 3</span>
                <h2>結果確認・分析</h2>
              </div>
            </div>
            <div className="step-body">
              {/* レポート画面を直接埋め込み */}
              <ReportView
                resultData={resultData}
                onRestart={handleRestartAll}
              />
            </div>
          </section>
        )}
      </main>

      {/* 練習テキスト記憶ダイアログ */}
      <SampleModal
        isOpen={isSampleViewModalOpen}
        onClose={() => setIsSampleViewModalOpen(false)}
        onProceedToStep2={triggerCountdownAndStart}
        task={selectedTask}
      />
    </div>
  );
}
