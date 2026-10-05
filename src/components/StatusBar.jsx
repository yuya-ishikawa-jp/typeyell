import React from 'react';

export default function StatusBar({ elapsedSeconds, typedCharCount, backspaceCount }) {
  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
  const secs = String(elapsedSeconds % 60).padStart(2, '0');

  const minutes = elapsedSeconds / 60;
  const cpm = minutes > 0 ? Math.round(typedCharCount / minutes) : 0;

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className="status-icon">⏱️</span>
        <span className="status-label">経過時間:</span>
        <span className="status-value">{mins}:{secs}</span>
      </div>
      <div className="status-item">
        <span className="status-icon">📝</span>
        <span className="status-label">入力文字数:</span>
        <span className="status-value">{typedCharCount}</span>
      </div>
      <div className="status-item">
        <span className="status-icon">⚡</span>
        <span className="status-label">入力速度 (CPM):</span>
        <span className="status-value">{cpm} <small>文字/分</small></span>
      </div>
      <div className="status-item highlight-stat">
        <span className="status-icon">⌫</span>
        <span className="status-label">Backspace (修正):</span>
        <span className="status-value">{backspaceCount} <small>回</small></span>
      </div>
    </div>
  );
}
