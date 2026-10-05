import React from 'react';

export default function SampleSelector({ sampleTasks, selectedTask, onSelectTask }) {
  return (
    <section className="card sample-select-card">
      <div className="card-header">
        <h2>📋 1. 練習課題の選択</h2>
        <span className="badge">難易度: {selectedTask.difficulty}</span>
      </div>
      <div className="card-body sample-controls">
        <div className="form-group flex-grow">
          <label htmlFor="sample-select">課題パターンを選択してください:</label>
          <select
            id="sample-select"
            className="form-control"
            value={selectedTask.id}
            onChange={(e) => onSelectTask(e.target.value)}
          >
            {sampleTasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title}（約{task.content.length}文字）
              </option>
            ))}
          </select>
        </div>
        <div className="sample-meta">
          <span className="meta-item">文字数: <strong>{selectedTask.content.length}</strong>文字</span>
          <span className="meta-item">想定時間: <strong>{selectedTask.estimatedTime}</strong>分</span>
        </div>
      </div>
    </section>
  );
}
