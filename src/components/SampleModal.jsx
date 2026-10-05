import React from "react";
import { Eye, CheckCircle } from "lucide-react";

export default function SampleModal({ isOpen, onClose, task }) {
  if (!isOpen || !task) return null;

  return (
    <div className="modal-backdrop sample-modal-backdrop">
      <div className="modal-dialog sample-modal-dialog">
        <div className="modal-header">
          <div>
            <h2>📄 練習テキストを確認する</h2>
            <p className="modal-date">
              文章をしっかり確認・暗記してから「タイピングを再開始する」を押してください
            </p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="sample-modal-text-box">{task.content}</div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={onClose}
          >
            <CheckCircle size={18} /> タイピングを再開始する
          </button>
        </div>
      </div>
    </div>
  );
}
