import React, { useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import { RotateCcw, Save } from "lucide-react";
import TypingReplayPlayer from "./TypingReplayPlayer";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
);

export default function ReportView({ resultData, onRestart }) {
  const [traineeNotes, setTraineeNotes] = useState("");
  const [staffNotes, setStaffNotes] = useState("");

  const targetPaneRef = useRef(null);
  const typedPaneRef = useRef(null);
  const isSyncingScroll = useRef(false);

  if (!resultData) return null;

  const {
    task,
    diff,
    elapsedSeconds,
    typedText,
    backspaceCount,
    backspaceLogs,
    typingHistory = [],
    insights,
    errStart,
    errMid,
    errEnd,
  } = resultData;

  const handleScroll = (source) => {
    if (isSyncingScroll.current) return;
    isSyncingScroll.current = true;

    if (source === "target" && targetPaneRef.current && typedPaneRef.current) {
      typedPaneRef.current.scrollTop = targetPaneRef.current.scrollTop;
    } else if (
      source === "typed" &&
      targetPaneRef.current &&
      typedPaneRef.current
    ) {
      targetPaneRef.current.scrollTop = typedPaneRef.current.scrollTop;
    }

    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  const getAlignmentLines = (alignment) => {
    const lines = [[]];
    alignment.forEach((item) => {
      lines[lines.length - 1].push(item);
      const isBreak =
        (item.type === "correct" && item.char === "\n") ||
        (item.type === "typo" &&
          (item.charTarget === "\n" || item.charTyped === "\n")) ||
        (item.type === "missing" && item.char === "\n") ||
        (item.type === "extra" && item.char === "\n");
      if (isBreak) {
        lines.push([]);
      }
    });
    return lines;
  };

  const renderTargetAlignmentLines = () => {
    const lines = getAlignmentLines(diff.alignment);
    return lines.map((lineItems, lineIdx) => (
      <div key={lineIdx} className="diff-line-row">
        <span className="diff-line-number">{lineIdx + 1}</span>
        <div className="diff-line-content">
          {lineItems.map((item, idx) => {
            if (item.type === "correct") {
              if (item.char === "\n")
                return (
                  <span key={idx} className="diff-char-break">
                    ↵
                  </span>
                );
              return (
                <span key={idx} className="diff-char-correct">
                  {item.char}
                </span>
              );
            }

            if (item.type === "typo") {
              const displayChar =
                item.charTarget === "\n" ? "↵" : item.charTarget;
              const typedHint =
                item.charTyped === "\n" ? "改行" : item.charTyped;
              return (
                <span
                  key={idx}
                  className={`diff-char-typo ${item.charTarget === "\n" ? "diff-char-break" : ""}`}
                  title={`入力誤り: あなたの入力は「${typedHint}」`}
                >
                  {displayChar}
                </span>
              );
            }

            if (item.type === "missing") {
              const displayChar = item.char === "\n" ? "↵" : item.char;
              return (
                <span
                  key={idx}
                  className={`diff-char-missing ${item.char === "\n" ? "diff-char-break" : ""}`}
                  title={`脱字: 「${item.char}」`}
                >
                  {displayChar}
                </span>
              );
            }

            if (item.type === "extra") {
              return (
                <span
                  key={idx}
                  className={`diff-spacer diff-spacer-extra ${item.char === "\n" ? "diff-spacer-break" : ""}`}
                  title="入力側に不要な文字"
                >
                  &nbsp;
                </span>
              );
            }

            return null;
          })}
        </div>
      </div>
    ));
  };

  const renderTypedAlignmentLines = () => {
    const lines = getAlignmentLines(diff.alignment);
    return lines.map((lineItems, lineIdx) => (
      <div key={lineIdx} className="diff-line-row">
        <span className="diff-line-number">{lineIdx + 1}</span>
        <div className="diff-line-content">
          {lineItems.map((item, idx) => {
            if (item.type === "correct") {
              if (item.char === "\n")
                return (
                  <span key={idx} className="diff-char-break">
                    ↵
                  </span>
                );
              return (
                <span key={idx} className="diff-char-correct">
                  {item.char}
                </span>
              );
            }

            if (item.type === "typo") {
              const displayChar =
                item.charTyped === "\n" ? "↵" : item.charTyped;
              const targetHint =
                item.charTarget === "\n" ? "改行" : item.charTarget;
              return (
                <span
                  key={idx}
                  className={`diff-char-typo ${item.charTyped === "\n" ? "diff-char-break" : ""}`}
                  title={`打鍵ミス: 本来は「${targetHint}」`}
                >
                  {displayChar}
                </span>
              );
            }

            if (item.type === "missing") {
              return (
                <span
                  key={idx}
                  className={`diff-spacer diff-spacer-missing ${item.char === "\n" ? "diff-spacer-break" : ""}`}
                  title={`脱字: 本来は「${item.char}」`}
                >
                  &nbsp;
                </span>
              );
            }

            if (item.type === "extra") {
              const displayChar = item.char === "\n" ? "↵" : item.char;
              return (
                <span
                  key={idx}
                  className={`diff-char-extra ${item.char === "\n" ? "diff-char-break" : ""}`}
                  title="不要な文字"
                >
                  {displayChar}
                </span>
              );
            }

            return null;
          })}
        </div>
      </div>
    ));
  };

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const minutes = elapsedSeconds / 60;
  const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds % 60).padStart(2, "0");
  const bsRate =
    typedText.length > 0
      ? ((backspaceCount / typedText.length) * 100).toFixed(1)
      : 0;

  // お手本の行番号別エラー集計 (X軸: 1行目, 2行目...)
  const alignmentLines = getAlignmentLines(diff.alignment);
  const lineBarLabels = alignmentLines.map((_, idx) => `${idx + 1}行目`);
  const lineErrorCounts = alignmentLines.map((lineItems) => {
    let errCount = 0;
    lineItems.forEach((item) => {
      if (item.type !== "correct") {
        errCount++;
      }
    });
    return errCount;
  });

  const barData = {
    labels: lineBarLabels,
    datasets: [
      {
        label: "誤り発生数",
        data: lineErrorCounts,
        backgroundColor: "#ea580c",
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  // 2. Backspace推移データ (10秒刻み)
  const bucketSize = 10;
  const maxSec = Math.max(elapsedSeconds, 10);
  const bucketCount = Math.ceil(maxSec / bucketSize);
  const lineLabels = [];
  const bsData = Array(bucketCount).fill(0);

  for (let b = 0; b < bucketCount; b++) {
    lineLabels.push(`${b * bucketSize}秒〜`);
  }

  backspaceLogs.forEach((log) => {
    const bIdx = Math.min(
      Math.floor(log.timestamp / bucketSize),
      bucketCount - 1,
    );
    bsData[bIdx]++;
  });

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: "Backspace修正回数",
        data: bsData,
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 4,
      },
    ],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
  };

  return (
    <div className="report-view-container" id="printable-report">
      {/* アクションバー（上部） */}
      <div className="report-view-actions">
        <span className="report-view-date">実施日時: {dateStr}</span>
      </div>

      {/* サマリーセクション（一番上） */}
      <div className="report-summary-section">
        <div className="summary-section-header">
          <h3>📊 サマリー</h3>
        </div>

        {/* 総合スコア */}
        <div className="score-grid">
          <div className="score-card accent-blue">
            <span className="score-title">総合正確率</span>
            <span className="score-number">{diff.accuracy}%</span>
            <span className="score-sub">
              誤字: {diff.typoCount} / 脱字: {diff.missingCount}
            </span>
          </div>
          <div className="score-card accent-green">
            <span className="score-title">タイピング速度</span>
            <span className="score-number">{cpm}</span>
            <span className="score-sub">文字/分 (CPM)</span>
          </div>
          <div className="score-card accent-purple">
            <span className="score-title">所要時間</span>
            <span className="score-number">
              {mins}:{secs}
            </span>
            <span className="score-sub">総文字数: {typedText.length}文字</span>
          </div>
          <div className="score-card accent-orange">
            <span className="score-title">Backspace修正</span>
            <span className="score-number">{backspaceCount}回</span>
            <span className="score-sub">100文字あたり {bsRate}回</span>
          </div>
        </div>

        {/* グラフ */}
        <div className="charts-grid">
          <div className="chart-card">
            <h4>📍 お手本の行ごとの誤り発生数（行別エラー分布）</h4>
            <div className="chart-container">
              <Bar data={barData} options={barOptions} />
            </div>
            <p className="chart-desc">
              ※どの行（何行目）で誤り（誤字・脱字）が多く発生したかを可視化します。
            </p>
          </div>
          <div className="chart-card">
            <h4>⏱️ 時間経過とBackspace（修正）回数の推移</h4>
            <div className="chart-container">
              <Line data={lineData} options={lineOptions} />
            </div>
            <p className="chart-desc">
              ※入力中にどのようなタイミングで迷いや修正が発生したかを示します。
            </p>
          </div>
        </div>
      </div>

      {/* 左右分割 差分表示 */}
      <div className="diff-section">
        <div className="diff-section-header">
          <h3>🔍 誤り箇所の比較チェック</h3>
          <div className="diff-legend">
            <span className="legend-item legend-correct">一致</span>
            <span className="legend-item legend-typo">誤字</span>
            <span className="legend-item legend-missing">脱字</span>
          </div>
        </div>

        <div className="diff-side-by-side-container">
          {/* 左側：見本文章 */}
          <div className="diff-pane diff-pane-target">
            <div className="diff-pane-header">
              <span className="pane-title">📄 正しい文章</span>
            </div>
            <div
              ref={targetPaneRef}
              className="diff-pane-content"
              onScroll={() => handleScroll("target")}
            >
              {renderTargetAlignmentLines()}
            </div>
          </div>

          {/* 右側：あなたの入力文章 */}
          <div className="diff-pane diff-pane-typed">
            <div className="diff-pane-header">
              <span className="pane-title">✍️ 入力された文章</span>
            </div>
            <div
              ref={typedPaneRef}
              className="diff-pane-content"
              onScroll={() => handleScroll("typed")}
            >
              {renderTypedAlignmentLines()}
            </div>
          </div>
        </div>
      </div>

      {/* 動画風入力リプレイプレイヤー (囲み枠なし) */}
      <TypingReplayPlayer
        typingHistory={typingHistory}
        totalDurationSeconds={elapsedSeconds}
      />

      <div className="report-view-footer">
        <button
          type="button"
          className="btn btn-secondary btn-lg"
          onClick={onRestart}
        >
          <RotateCcw size={18} /> 次の訓練を開始する（ステップ1へ）
        </button>
      </div>
    </div>
  );
}
