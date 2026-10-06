import React from 'react';
import { Printer, ArrowRight } from 'lucide-react';

export default function SampleModal({ isOpen, onClose, onProceedToStep2, task }) {
  if (!isOpen || !task) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop sample-modal-backdrop">
      <div className="modal-dialog sample-modal-dialog">
        <div className="modal-header">
          <div>
            <h2>📄 練習テキスト（確認・記憶）</h2>
            <p className="modal-date">文章をしっかり確認・暗記してから「ステップ２へ進む」を押してください</p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" id="printable-sample-sheet">
          {/* 印刷用タイトル（印刷時のみ表示） */}
          <div className="print-only print-header">
            <h1>TypeYell タイピング練習課題シート</h1>
            <div className="print-meta">
              <span>課題名: {task.title}</span>
              <span>文字数: {task.content ? task.content.length : 0}文字</span>
            </div>
          </div>

          <div className="sample-modal-meta">
            <span className="meta-item">課題名: <strong>{task.title}</strong></span>
            <span className="meta-item">文字数: <strong>{task.content ? task.content.length : 0}</strong>文字</span>
          </div>

          <div className="sample-modal-text-box">
            {task.content}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={handlePrint}>
            <Printer size={18} /> 印刷する
          </button>
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={() => {
              onClose();
              if (onProceedToStep2) onProceedToStep2();
            }}
          >
            ステップ２（タイピング練習）へ進む <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
