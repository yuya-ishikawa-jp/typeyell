import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, FastForward, Film } from 'lucide-react';

export default function TypingReplayPlayer({ typingHistory = [], totalDurationSeconds = 0 }) {
  const totalDurationMs = Math.max(totalDurationSeconds * 1000, 1000);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(10); // デフォルト10倍速

  const screenContentRef = useRef(null);
  const speedOptions = [1, 2, 5, 10, 20, 30];

  // 再生ループ (requestAnimationFrame)
  useEffect(() => {
    let animationFrameId;
    let lastRealTime = Date.now();

    const tick = () => {
      const now = Date.now();
      const deltaRealMs = now - lastRealTime;
      lastRealTime = now;

      setCurrentTimeMs((prevTime) => {
        const nextTime = prevTime + deltaRealMs * playbackSpeed;
        if (nextTime >= totalDurationMs) {
          setIsPlaying(false);
          return totalDurationMs;
        }
        return nextTime;
      });

      if (isPlaying) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    if (isPlaying) {
      lastRealTime = Date.now();
      animationFrameId = requestAnimationFrame(tick);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [isPlaying, playbackSpeed, totalDurationMs]);

  // 現在のタイムスタンプ時点のテキストを取得
  const getCurrentText = () => {
    if (!typingHistory || typingHistory.length === 0) return '';

    let text = '';
    for (let i = 0; i < typingHistory.length; i++) {
      if (typingHistory[i].timeMs <= currentTimeMs) {
        text = typingHistory[i].text;
      } else {
        break;
      }
    }
    return text;
  };

  const displayedText = getCurrentText();

  // キャレット（カーソル）が常に枠の一番下（最新入力行）に位置するよう自動スクロール
  useEffect(() => {
    if (screenContentRef.current) {
      screenContentRef.current.scrollTop = screenContentRef.current.scrollHeight;
    }
  }, [displayedText, currentTimeMs]);

  // 再生 / 一時停止 切替
  const togglePlay = () => {
    if (currentTimeMs >= totalDurationMs) {
      setCurrentTimeMs(0);
    }
    setIsPlaying(!isPlaying);
  };

  // 最初から再生
  const handleRestart = () => {
    setCurrentTimeMs(0);
    setIsPlaying(true);
  };

  // シークバー操作
  const handleSeek = (e) => {
    const seekValue = Number(e.target.value);
    setCurrentTimeMs(seekValue);
  };

  // 時間フォーマット mm:ss
  const formatTime = (ms) => {
    const totalSecs = Math.floor(ms / 1000);
    const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const progressPercent = Math.min(100, (currentTimeMs / totalDurationMs) * 100);

  return (
    <div className="replay-player-card">
      <div className="replay-player-header">
        <div className="replay-header-left">
          <Film size={18} className="replay-icon" />
          <h3>🎬 入力プロセスの再生（リプレイ動画プレイヤー）</h3>
        </div>
        <div className="replay-header-right">
          <span className={`replay-status-badge ${isPlaying ? 'status-playing' : 'status-paused'}`}>
            {isPlaying ? `▶ 再生中 (${playbackSpeed}倍速)` : '⏸️ 一時停止中'}
          </span>
        </div>
      </div>

      <div className="replay-player-body">
        {/* 動画風 入力画面表示エリア */}
        <div className="replay-screen-container">
          <div className="replay-screen-topbar">
            <span>入力リアルタイムプレビュー</span>
            <span>{displayedText.length} 文字</span>
          </div>
          <div ref={screenContentRef} className="replay-screen-content">
            <span className="replay-text-content">{displayedText}</span>
            <span className="replay-cursor">|</span>
          </div>
        </div>

        {/* タイムライン ＆ コントロールバー */}
        <div className="replay-controls-container">
          {/* プログレスバー（シークバー） */}
          <div className="replay-timeline-wrapper">
            <input
              type="range"
              className="replay-slider"
              min={0}
              max={totalDurationMs}
              value={currentTimeMs}
              onChange={handleSeek}
              style={{
                background: `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${progressPercent}%, var(--border-color) ${progressPercent}%, var(--border-color) 100%)`
              }}
            />
            <div className="replay-time-display">
              <span>{formatTime(currentTimeMs)}</span>
              <span> / </span>
              <span>{formatTime(totalDurationMs)}</span>
            </div>
          </div>

          {/* ボタン ＆ 倍速コントロール */}
          <div className="replay-buttons-row">
            <div className="replay-btn-left">
              <button
                type="button"
                className="btn btn-primary btn-sm replay-main-btn"
                onClick={togglePlay}
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                {isPlaying ? '一時停止' : '再生'}
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleRestart}
              >
                <RotateCcw size={16} /> 最初から
              </button>
            </div>

            {/* 倍速切替ボタン (2倍速〜30倍速) */}
            <div className="replay-speed-selector">
              <span className="speed-label">
                <FastForward size={14} style={{ marginRight: 4 }} /> 再生速度:
              </span>
              {speedOptions.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  className={`speed-pill ${playbackSpeed === speed ? 'speed-pill-active' : ''}`}
                  onClick={() => setPlaybackSpeed(speed)}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
