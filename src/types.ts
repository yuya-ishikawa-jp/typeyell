import React from "react";

export interface Task {
  id: string | number;
  title: string;
  content: string;
}

export type AlignmentType = "correct" | "typo" | "missing" | "extra";

export interface AlignmentItem {
  type: AlignmentType;
  char?: string;
  charTarget?: string;
  charTyped?: string;
  targetIdx: number;
}

export interface DiffResult {
  alignment: AlignmentItem[];
  correctCount: number;
  typoCount: number;
  missingCount: number;
  accuracy: number;
}

export interface BackspaceLog {
  timestamp: number;
  count: number;
}

export interface TypingHistoryItem {
  timeMs: number;
  text: string;
  keyType?: "text" | "backspace" | "arrow" | "space" | "enter";
}

export interface ResultData {
  task: Task | null;
  diff: DiffResult;
  elapsedSeconds: number;
  typedText: string;
  backspaceCount: number;
  backspaceLogs: BackspaceLog[];
  typingHistory: TypingHistoryItem[];
}

export interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean | ((prev: boolean) => boolean)) => void;
}

export interface StepBarProps {
  currentStep: number;
}

export interface WordToolbarProps {
  editorRef: React.RefObject<HTMLDivElement | null>;
}

export interface SampleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedToStep2?: () => void;
  task: Task | null;
}

export interface TypingReplayPlayerProps {
  typingHistory?: TypingHistoryItem[];
  totalDurationSeconds?: number;
}

export interface ReportViewProps {
  resultData: ResultData;
  onRestart: () => void;
}

export interface HabitDiagnosis {
  type: "warning" | "info" | "success";
  title: string;
  desc: string;
}
