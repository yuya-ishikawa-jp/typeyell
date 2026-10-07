import React from "react";
import { Printer, Play } from "lucide-react";

export default function SampleModal({
  isOpen,
  onClose,
  onProceedToStep2,
  task,
}) {
  if (!isOpen || !task) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop sample-modal-backdrop">
      <div className="modal-dialog sample-modal-dialog">
        <div className="modal-header">
          <div>
            <h2>📄 課題の確認</h2>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="sample-modal-meta">
            <span className="meta-item">
              課題名: <strong>{task.title}</strong>
            </span>
            <span className="meta-item">
              文字数: <strong>{task.content ? task.content.length : 0}</strong>
              文字
            </span>
          </div>

          <div className="sample-modal-text-box">{task.content}</div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-outline"
            onClick={handlePrint}
          >
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
            <Play size={18} />
            タイピングを開始する
          </button>
        </div>
      </div>
    </div>
  );
}
