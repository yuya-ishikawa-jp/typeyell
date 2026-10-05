import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Header({
  sampleTasks,
  selectedTask,
  onSelectTask,
  isDarkMode,
  setIsDarkMode
}) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-area">
          <span className="logo-icon">⌨️</span>
          <div>
            <h1 className="app-title">TypeYell（タイプエール）</h1>
            <p className="app-subtitle">就労移行支援向け タイピング訓練 ＆ 記憶・入力分析システム</p>
          </div>
        </div>

        <div className="header-controls">
          {/* 練習問題の選択（ヘッダーに配置） */}
          <div className="header-sample-select">
            <label htmlFor="header-task-select" className="header-select-label">
              課題:
            </label>
            <select
              id="header-task-select"
              className="form-control header-select-control"
              value={selectedTask.id}
              onChange={(e) => onSelectTask(e.target.value)}
            >
              {sampleTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}（{task.content.length}文字）
                </option>
              ))}
            </select>
          </div>

          {/* ダークモード/表示モード切替 */}
          <div className="theme-toggle">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsDarkMode(!isDarkMode)}
              title="ダークモード/ハイコントラスト切替"
            >
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              {isDarkMode ? ' ライト' : ' ダーク'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
