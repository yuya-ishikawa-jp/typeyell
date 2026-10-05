import React from 'react';
import { Keyboard, Sun, Moon, Monitor, FileText } from 'lucide-react';

export default function Header({ mode, setMode, isDarkMode, setIsDarkMode }) {
  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo-area">
          <span className="logo-icon">⌨️</span>
          <div>
            <h1 class="app-title">TypeStep（タイプステップ）</h1>
            <p className="app-subtitle">就労移行支援向け タイピング訓練 ＆ 支援分析システム</p>
          </div>
        </div>
        <div className="header-controls">
          <div className="mode-toggle-group">
            <span className="control-label">訓練モード:</span>
            <button
              className={`btn-mode ${mode === 'screen' ? 'active' : ''}`}
              onClick={() => setMode('screen')}
              title="画面上で正解文を見ながら入力します"
            >
              <Monitor size={15} style={{ marginRight: 4 }} />
              画面見本モード
            </button>
            <button
              className={`btn-mode ${mode === 'paper' ? 'active' : ''}`}
              onClick={() => setMode('paper')}
              title="手元の紙を見ながら入力します（見本非表示）"
            >
              <FileText size={15} style={{ marginRight: 4 }} />
              紙課題モード
            </button>
          </div>
          <div className="theme-toggle">
            <button
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
