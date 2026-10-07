import React from "react";
import { CheckCircle2 } from "lucide-react";

export default function StepBar({ currentStep, onStepClick }) {
  const steps = [
    { number: 1, title: "ステップ１", desc: "課題の選択" },
    { number: 2, title: "ステップ２", desc: "タイピング練習" },
    { number: 3, title: "ステップ３", desc: "結果確認・分析" },
  ];

  return (
    <div className="step-bar-container">
      <div className="step-bar">
        {steps.map((step) => {
          const isCompleted = currentStep > step.number;
          const isActive = currentStep === step.number;

          return (
            <div
              key={step.number}
              className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
            >
              <div className="step-number-badge">
                {isCompleted ? <CheckCircle2 size={20} /> : step.number}
              </div>
              <div className="step-text">
                <span className="step-title">{step.title}</span>
                <span className="step-desc">{step.desc}</span>
              </div>
              {step.number < 3 && <div className="step-connector"></div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
