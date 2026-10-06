import React from 'react';
import { BookOpen, FileText, Check } from 'lucide-react';

export default function TextSelectModal({
  isOpen,
  onClose,
  sampleTasks,
  selectedTask,
  onSelectTask
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop select-modal-backdrop">
      <div className="modal-dialog select-modal-dialog">
        <div className="modal-header">
          <div>
            <h2>📄 練習する文章の選択</h2>
            <p className="modal-date">訓練で使用する文章を以下から1つ選んでクリックしてください</p>
          </div>
          <button type="button" className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body select-modal-body">
          <div className="text-task-grid">
            {sampleTasks.map((task) => {
              const isSelected = selectedTask && selectedTask.id === task.id;
              const previewSnippet = task.content ? task.content.substring(0, 70) + '...' : '';

              return (
                <div
                  key={task.id}
                  className={`task-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    onSelectTask(task);
                    onClose();
                  }}
                >
                  <div className="task-select-card-header">
                    <h3 className="task-select-title">
                      <FileText size={18} style={{ marginRight: 6 }} />
                      {task.title}
                    </h3>
                    {isSelected && <span className="selected-badge"><Check size={14} /> 選択中</span>}
                  </div>

                  <div className="task-select-card-meta">
                    <span>文字数: <strong>{task.content ? task.content.length : 0}</strong>文字</span>
                  </div>

                  <p className="task-select-snippet">{previewSnippet}</p>

                  <button type="button" className="btn btn-outline btn-sm btn-select-this">
                    {isSelected ? '選択中' : 'この文章を選択する'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
