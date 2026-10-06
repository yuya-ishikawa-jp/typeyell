import React from 'react';
import { CheckCircle } from 'lucide-react';

export default function SampleModal({ isOpen, onClose, task }) {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop sample-modal-backdrop">
      <div className="modal-dialog sample-modal-dialog">
        <div className="modal-header">
          <div>
            <h2>📄 練習テキスト（確認・記憶モーダル）</h2>
            <p className="modal-date">文章をしっかり確認・暗記してから「閉じてタイピング開始」を押してください</p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="sample-modal-meta">
            <span className="meta-item">課題名: <strong>{task.title}</strong></span>
            <span className="meta-item">文字数: <strong>{task.content.length}</strong>文字</span>
          </div>

          <div className="sample-modal-text-box">
            {task.content}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-primary btn-lg" onClick={onClose}>
            <CheckCircle size={18} /> 閉じてタイピングを開始・再開する
          </button>
        </div>
      </div>
    </div>
  );
}
