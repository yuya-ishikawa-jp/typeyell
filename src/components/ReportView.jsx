import React, { useState } from 'react';
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
  Filler
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { Printer, RotateCcw, Save } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function ReportView({ resultData, onRestart }) {
  const [traineeNotes, setTraineeNotes] = useState('');
  const [staffNotes, setStaffNotes] = useState('');

  if (!resultData) return null;

  const {
    task,
    diff,
    elapsedSeconds,
    typedText,
    backspaceCount,
    backspaceLogs,
    insights,
    errStart,
    errMid,
    errEnd
  } = resultData;

  const now = new Date();
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const minutes = elapsedSeconds / 60;
  const cpm = minutes > 0 ? Math.round(typedText.length / minutes) : 0;
  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const secs = String(elapsedSeconds % 60).padStart(2, '0');
  const bsRate = typedText.length > 0 ? ((backspaceCount / typedText.length) * 100).toFixed(1) : 0;

  // 1. 位置別エラー分布データ
  const barData = {
    labels: ['序盤 (0〜33%)', '中盤 (34〜66%)', '終盤 (67〜100%)'],
    datasets: [
      {
        label: '誤り（ミス）発生数',
        data: [errStart, errMid, errEnd],
        backgroundColor: ['#ef4444', '#f59e0b', '#8b5cf6'],
        borderRadius: 6
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
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
    const bIdx = Math.min(Math.floor(log.timestamp / bucketSize), bucketCount - 1);
    bsData[bIdx]++;
  });

  const lineData = {
    labels: lineLabels,
    datasets: [
      {
        label: 'Backspace修正回数',
        data: bsData,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        fill: true,
        tension: 0.3,
        pointRadius: 4
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSave = () => {
    alert('レポート内容を確定・保存しました。（デモ動作）');
  };

  return (
    <div className="report-view-container" id="printable-report">
      {/* 印刷時専用ヘッダー */}
      <div className="print-only print-header">
        <h1>TypeYell 就労移行支援 タイピング訓練フィードバックシート</h1>
        <div className="print-meta">
          <span>実施日時: {dateStr}</span>
          <span>課題名: {task ? task.title : ''}</span>
        </div>
      </div>

      {/* アクションバー（上部） */}
      <div className="report-view-actions">
        <span className="report-view-date">実施日時: {dateStr}</span>
        <div className="report-view-btn-group">
          <button type="button" className="btn btn-outline btn-sm" onClick={handlePrint}>
            <Printer size={16} /> レポート印刷 / PDF化
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onRestart}>
            <RotateCcw size={16} /> 別の訓練を開始する（ステップ1へ）
          </button>
        </div>
      </div>

      {/* 総合スコア */}
      <div className="score-grid">
        <div className="score-card accent-blue">
          <span className="score-title">総合正確率</span>
          <span className="score-number">{diff.accuracy}%</span>
          <span className="score-sub">
            誤字: {diff.typoCount} / 脱字: {diff.missingCount} / 不要文字: {diff.extraCount}
          </span>
        </div>
        <div className="score-card accent-green">
          <span className="score-title">タイピング速度</span>
          <span className="score-number">{cpm}</span>
          <span className="score-sub">文字/分 (CPM)</span>
        </div>
        <div className="score-card accent-purple">
          <span className="score-title">所要時間</span>
          <span className="score-number">{mins}:{secs}</span>
          <span className="score-sub">総文字数: {typedText.length}文字</span>
        </div>
        <div className="score-card accent-orange">
          <span className="score-title">Backspace修正</span>
          <span className="score-number">{backspaceCount}回</span>
          <span className="score-sub">100文字あたり {bsRate}回</span>
        </div>
      </div>

      {/* 自動分析インサイト */}
      <div className="insight-box">
        <div className="insight-header">
          <span className="insight-icon">🔍</span>
          <h3>データ分析から得られた傾向とフィードバック</h3>
        </div>
        <ul className="insight-list">
          {insights.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      {/* グラフ */}
      <div className="charts-grid">
        <div className="chart-card">
          <h4>📍 文章の位置ごとの誤り率分布（序盤・中盤・終盤）</h4>
          <div className="chart-container">
            <Bar data={barData} options={barOptions} />
          </div>
          <p className="chart-desc">※誤りが「最初」「途中」「最後」のどこに多いか可視化します。</p>
        </div>
        <div className="chart-card">
          <h4>⏱️ 時間経過とBackspace（修正）回数の推移</h4>
          <div className="chart-container">
            <Line data={lineData} options={lineOptions} />
          </div>
          <p className="chart-desc">※入力中にどのようなタイミングで迷いや修正が発生したかを示します。</p>
        </div>
      </div>

      {/* 差分表示 */}
      <div className="diff-section">
        <h3>🔍 誤り箇所の比較チェック</h3>
        <div className="diff-legend">
          <span className="legend-item legend-correct">一致</span>
          <span className="legend-item legend-typo">誤字・違い</span>
          <span className="legend-item legend-missing">脱字（入力漏れ）</span>
          <span className="legend-item legend-extra">挿入（不要な入力）</span>
        </div>
        <div className="diff-box">
          {diff.alignment.map((item, idx) => {
            if (item.type === 'correct') {
              return <span key={idx} className="diff-char-correct">{item.char}</span>;
            } else if (item.type === 'typo') {
              return (
                <span key={idx} className="diff-char-typo" title={`誤字: 本来は「${item.charTarget}」`}>
                  {item.charTyped}
                </span>
              );
            } else if (item.type === 'missing') {
              return (
                <span key={idx} className="diff-char-missing" title={`脱字: 「${item.char}」`}>
                  {item.char === '\n' ? '↵(改行漏れ)' : item.char}
                </span>
              );
            } else if (item.type === 'extra') {
              return (
                <span key={idx} className="diff-char-extra" title="余分な文字">
                  {item.char}
                </span>
              );
            }
            return null;
          })}
        </div>
      </div>

      {/* 振り返りフォーム */}
      <div className="feedback-forms">
        <div className="form-group">
          <label htmlFor="trainee-notes">🙋 利用者本人の振り返り・感想メモ:</label>
          <textarea
            id="trainee-notes"
            className="form-control"
            rows="3"
            value={traineeNotes}
            onChange={(e) => setTraineeNotes(e.target.value)}
            placeholder="（例：序盤で慌ててしまい誤字が増えてしまった。次は落ち着いて確認しながら入力したい。）"
          ></textarea>
        </div>
        <div className="form-group">
          <label htmlFor="staff-notes">👨‍🏫 支援員からのメッセージ・アドバイス:</label>
          <textarea
            id="staff-notes"
            className="form-control"
            rows="3"
            value={staffNotes}
            onChange={(e) => setStaffNotes(e.target.value)}
            placeholder="（例：中盤以降はペースが安定していました！最初の数行を打ち始める前に一度文章全体を眺める練習をしてみましょう。）"
          ></textarea>
        </div>
      </div>

      {/* 下部アクションボタン */}
      <div className="report-view-footer">
        <button type="button" className="btn btn-primary btn-lg" onClick={handleSave}>
          <Save size={18} /> レポート内容を確定・保存
        </button>
        <button type="button" className="btn btn-secondary btn-lg" onClick={onRestart}>
          <RotateCcw size={18} /> 次の訓練を開始する（ステップ1へ）
        </button>
      </div>
    </div>
  );
}
