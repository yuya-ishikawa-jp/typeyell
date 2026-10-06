import React from 'react';
import { Sun, Moon } from 'lucide-react';

export default function Header({ isDarkMode, setIsDarkMode }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-area">
          <span className="logo-icon">⌨️</span>
          <div>
            <span className="brand-badge">オカヤマエール 就労移行支援</span>
            <h1 className="app-title">TypeYell（タイプエール）</h1>
            <p className="app-subtitle">あなたの「働きたい」にエールを。ステップ式 タイピング記憶・分析システム</p>
          </div>
        </div>

        <div className="header-controls">
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
