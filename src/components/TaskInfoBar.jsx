import React from 'react';
import { Eye, BookOpen } from 'lucide-react';

export default function TaskInfoBar({ task, onOpenSampleModal }) {
  if (!task) return null;

  return (
    <section className="card task-info-card">
      <div className="task-info-container">
        <div className="task-info-detail">
          <h2 className="task-info-title">
            <BookOpen size={18} style={{ marginRight: 6 }} />
            {task.title}
          </h2>
          <div className="task-info-meta">
            <span>文字数: <strong>{task.content.length}</strong>文字</span>
          </div>
        </div>

        <div className="task-info-action">
          <button
            type="button"
            className="btn btn-primary btn-memorize"
            onClick={onOpenSampleModal}
          >
            <Eye size={18} />
            練習テキストを確認・記憶する
          </button>
        </div>
      </div>
    </section>
  );
}
