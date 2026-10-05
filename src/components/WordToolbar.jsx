import React from 'react';

export default function WordToolbar({ editorRef }) {
  const execCmd = (cmd, arg = null) => {
    document.execCommand(cmd, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  return (
    <div className="word-toolbar" role="toolbar" aria-label="Word書式設定ツールバー">
      <div className="toolbar-group">
        <span className="toolbar-label">文字サイズ:</span>
        <select
          className="tool-select"
          defaultValue="3"
          onChange={(e) => execCmd('fontSize', e.target.value)}
          title="文字サイズ変更"
        >
          <option value="3">標準 (16px)</option>
          <option value="4">やや大 (18px)</option>
          <option value="5">大 (24px)</option>
          <option value="6">特大 (32px)</option>
        </select>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <button
          type="button"
          className="tool-btn"
          onClick={() => execCmd('bold')}
          title="太字 (B)"
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => execCmd('italic')}
          title="斜体 (I)"
        >
          <em>I</em>
        </button>
        <button
          type="button"
          className="tool-btn"
          onClick={() => execCmd('underline')}
          title="下線 (U)"
        >
          <u>U</u>
        </button>
      </div>

      <div className="toolbar-divider"></div>

      <div className="toolbar-group">
        <label className="tool-btn-color" title="文字色変更">
          <span className="color-icon">A</span>
          <input
            type="color"
            defaultValue="#1e293b"
            onChange={(e) => execCmd('foreColor', e.target.value)}
          />
        </label>
        <label className="tool-btn-color" title="背景色（蛍光ペン）">
          <span className="color-icon highlight">🖍️</span>
          <input
            type="color"
            defaultValue="#fef08a"
            onChange={(e) => execCmd('hiliteColor', e.target.value)}
          />
        </label>
        <button
          type="button"
          className="tool-btn"
          onClick={() => execCmd('removeFormat')}
          title="書式をクリア"
        >
          🧹 クリア
        </button>
      </div>
    </div>
  );
}
