import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  RotateCw,
  Gauge,
  ChevronDown,
} from "lucide-react";
import { TypingReplayPlayerProps, HabitDiagnosis } from "../types";

export default function TypingReplayPlayer({
  typingHistory = [],
  totalDurationSeconds = 0,
}: TypingReplayPlayerProps) {
  const totalDurationMs = Math.max(totalDurationSeconds * 1000, 1000);
  const [currentTimeMs, setCurrentTimeMs] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState<boolean>(false);

  const screenContentRef = useRef<HTMLDivElement | null>(null);
  const speedMenuRef = useRef<HTMLDivElement | null>(null);
  const speedOptions = [1, 2, 5, 10, 20, 30];

  // メニュー外クリック時に速度メニューを閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        speedMenuRef.current &&
        !speedMenuRef.current.contains(e.target as Node)
      ) {
        setIsSpeedMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 再生ループ (requestAnimationFrame)
  useEffect(() => {
    let animationFrameId: number;
    let lastRealTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaRealMs = now - lastRealTime;
      lastRealTime = now;

      setCurrentTimeMs((prevTime) => {
        const nextTime = prevTime + deltaRealMs * playbackSpeed;
        if (nextTime >= totalDurationMs) {
          setIsPlaying(false);
          return totalDurationMs;
        }
        return nextTime;
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      lastRealTime = Date.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, totalDurationMs]);

  // 現在のタイムスタンプ時点のテキストを取得
  const getCurrentText = (): string => {
    if (!typingHistory || typingHistory.length === 0) return "";

    let text = "";
    for (let i = 0; i < typingHistory.length; i++) {
      if (typingHistory[i].timeMs <= currentTimeMs) {
        text = typingHistory[i].text || "";
      } else {
        break;
      }
    }
    return text;
  };

  // 最終時点の全体統計（自動診断用）
  const getFinalCounts = () => {
    const counts = {
      text: 0,
      backspace: 0,
      arrow: 0,
      space: 0,
      enter: 0,
      total: 0,
    };
    if (!typingHistory) return counts;
    typingHistory.forEach((item) => {
      if (item.keyType && counts[item.keyType] !== undefined) {
        counts[item.keyType]++;
        counts.total++;
      }
    });
    return counts;
  };

  const displayedText = getCurrentText();
  const finalCounts = getFinalCounts();

  // 自動診断メッセージの生成
  const getHabitDiagnosis = (): HabitDiagnosis | null => {
    if (finalCounts.total === 0) return null;

    const arrowRatio = finalCounts.arrow / finalCounts.total;
    const bsRatio = finalCounts.backspace / finalCounts.total;
    const spaceRatio = finalCounts.space / finalCounts.total;

    if (finalCounts.arrow >= 5 || arrowRatio > 0.08) {
      return {
        type: "warning",
        title:
          "⚠️ カーソル移動（矢印キー: " + finalCounts.arrow + "回）が多めです",
        desc: "文章の途中へ戻って修正・挿入を行っている傾向が見られます。「入力し始める前に、一度全体をしっかり見比べる習慣」を意識してみましょう。",
      };
    }

    if (finalCounts.backspace >= 8 || bsRatio > 0.12) {
      return {
        type: "warning",
        title:
          "⚠️ 打鍵修正（Backspace: " +
          finalCounts.backspace +
          "回）が多く発生しています",
        desc: "直前の打ち間違いをその場で何度も修正しています。ホームポジションを意識し、速度よりも「正確な1音目」を大切に打ち進めましょう。",
      };
    }

    if (finalCounts.space >= 15 || spaceRatio > 0.25) {
      return {
        type: "info",
        title: "💡 変換操作（Space: " + finalCounts.space + "回）が多めです",
        desc: "漢字変換の候補選びに時間を取られている可能性があります。短すぎる語句ではなく、適切な文節単位で変換するとスムーズになります。",
      };
    }

    return {
      type: "success",
      title: "✨ 非常にスムーズなキー操作です",
      desc: "途中でのやり直し（矢印キー）や打鍵修正が少なく、迷いの少ない安定した入力リズムが保たれています！",
    };
  };

  const habitInsight = getHabitDiagnosis();

  // キャレット（カーソル）が常に枠の一番下（最新入力行）に位置するよう自動スクロール
  useEffect(() => {
    if (screenContentRef.current) {
      screenContentRef.current.scrollTop =
        screenContentRef.current.scrollHeight;
    }
  }, [displayedText, currentTimeMs]);

  // 再生 / 一時停止 切替
  const togglePlay = () => {
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
    }
    setIsPlaying(!isPlaying);
  };

  // 10秒戻る
  const handleSkipBack = () => {
    setCurrentTimeMs((prev) => Math.max(0, prev - 10000));
  };

  // 10秒進む
  const handleSkipForward = () => {
    setCurrentTimeMs((prev) => Math.min(totalDurationMs, prev + 10000));
  };

  // シークバー操作
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekValue = Number(e.target.value);
    setCurrentTimeMs(seekValue);
  };

  // 時間フォーマット mm:ss
  const formatTime = (ms: number): string => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, "0");
    const secs = String(totalSecs % 60).padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const progressPercent = Math.min(
    100,
    (currentTimeMs / totalDurationMs) * 100,
  );

  return (
    <div className="replay-player-card">
      <div className="replay-player-body">
        {/* 動画風 入力画面表示エリア */}
        <div className="replay-screen-container">
          <div className="replay-screen-topbar">
            <span>
              {isPlaying ? `▶ 再生中 (${playbackSpeed}倍速)` : "⏸️ 一時停止中"}
            </span>
            <span>{displayedText.length} 文字</span>
          </div>
          <div ref={screenContentRef} className="replay-screen-content">
            {displayedText.split("\n").map((lineText, lineIdx, arr) => {
              const isLastLine = lineIdx === arr.length - 1;
              return (
                <div key={lineIdx} className="replay-line-row">
                  <span className="replay-line-number">{lineIdx + 1}</span>
                  <div className="replay-line-text">
                    <span className="replay-text-content">{lineText}</span>
                    {isLastLine && <span className="replay-cursor">|</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* プログレスバー（入力プレビュー直下＆再生コントロール直上に隙間なく結合） */}
        <div className="replay-slider-container">
          <input
            type="range"
            className="replay-slider"
            min={0}
            max={totalDurationMs}
            value={currentTimeMs}
            onChange={handleSeek}
            style={{
              background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${progressPercent}%, #374151 ${progressPercent}%, #374151 100%)`,
            }}
          />
        </div>

        {/* コントロールバー */}
        <div className="replay-controls-container">
          {/* ボタン ＆ 音量風速度コントロール */}
          <div className="replay-buttons-row">
            {/* 再生コントロール群（10秒戻る - 再生/停止 - 10秒進む - 経過時間） */}
            <div className="replay-btn-left">
              <button
                type="button"
                className="btn btn-outline btn-sm replay-skip-btn"
                onClick={handleSkipBack}
                title="10秒戻る"
              >
                <RotateCcw size={15} /> 10秒
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm replay-main-btn"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? "一時停止" : "再生"}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm replay-skip-btn"
                onClick={handleSkipForward}
                title="10秒進む"
              >
                10秒 <RotateCw size={15} />
              </button>

              {/* 経過時間（10秒進むボタンの右側） */}
              <div className="replay-time-display">
                <span>{formatTime(currentTimeMs)}</span>
                <span> / </span>
                <span>{formatTime(totalDurationMs)}</span>
              </div>
            </div>

            {/* 音量風 速度コントロールメニュー */}
            <div className="replay-speed-menu-container" ref={speedMenuRef}>
              <button
                type="button"
                className={`btn btn-outline btn-sm speed-menu-btn ${isSpeedMenuOpen ? "active" : ""}`}
                onClick={() => setIsSpeedMenuOpen(!isSpeedMenuOpen)}
                title="再生速度の切り替え"
              >
                <Gauge size={16} />
                <span>
                  速度: <strong>{playbackSpeed}x</strong>
                </span>
                <ChevronDown
                  size={14}
                  className={`speed-chevron ${isSpeedMenuOpen ? "open" : ""}`}
                />
              </button>

              {isSpeedMenuOpen && (
                <div className="speed-dropdown-menu">
                  <div className="speed-dropdown-header">⚡ 再生速度</div>
                  <div className="speed-options-list">
                    {speedOptions.map((speed) => (
                      <button
                        key={speed}
                        type="button"
                        className={`speed-option-item ${playbackSpeed === speed ? "active" : ""}`}
                        onClick={() => {
                          setPlaybackSpeed(speed);
                          setIsSpeedMenuOpen(false);
                        }}
                      >
                        {speed}倍速
                        {playbackSpeed === speed && (
                          <span className="speed-check">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 自動入力癖診断インサイト */}
          {habitInsight && (
            <div
              className={`habit-diagnosis-box diagnosis-${habitInsight.type}`}
            >
              <div className="diagnosis-title">
                {habitInsight.type === "warning" ? (
                  <AlertCircle size={16} />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>{habitInsight.title}</span>
              </div>
              <p className="diagnosis-desc">{habitInsight.desc}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
