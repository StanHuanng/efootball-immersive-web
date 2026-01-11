import React, { useState } from 'react';

/**
 * 足球新闻报道组件
 */
export function NewsReport({ news }) {
  if (!news) return null;

  return (
    <div className="news-report fade-in" style={{ marginBottom: '20px' }}>
      <div className="news-header">
        <span className="news-badge">⚽ 赛后快讯</span>
        <span className="news-time">{formatTime(news.timestamp)}</span>
      </div>
      <div className="news-title">{news.title}</div>
      {news.scoreline && (
        <div className="news-scoreline">{news.scoreline}</div>
      )}
      <div className="news-content">{news.content}</div>
      {news.highlights && news.highlights.length > 0 && (
        <div className="news-highlights">
          {news.highlights.map((highlight, index) => (
            <div key={index} className="news-highlight-item">
              • {highlight}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * 截图上传组件
 */
export function ScreenshotUploader({ onUpload, loading, title = '═══ 上传比赛截图 ═══', maxFiles = 3, triggerId = 'file-upload' }) {
  const [dragActive, setDragActive] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [error, setError] = useState('');

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files) => {
    const limited = Array.from(files).slice(0, maxFiles);
    try {
      const readers = await Promise.all(limited.map(file => toDataUrl(file)));
      setPreviews(readers);
      setError('');
      onUpload && onUpload(limited);
    } catch (err) {
      console.error(err);
      setError('预览生成失败，请重试');
    }
  };

  return (
    <div className="screenshot-uploader">
      <div className="uploader-header">
        {title}
      </div>
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {previews.length > 0 ? (
          <div className="preview-container multi">
            <div className="preview-grid">
              {previews.map((src, idx) => (
                <img key={idx} src={src} alt={`Preview ${idx + 1}`} className="preview-image" />
              ))}
            </div>
            <button 
              className="btn"
              onClick={() => {
                setPreviews([]);
                const input = document.getElementById(triggerId);
                if (input) input.value = '';
              }}
            >
              重新选择
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📸</div>
            <div className="upload-text">
              {loading ? '正在识别截图...' : `点击或拖拽上传 1-${maxFiles} 张 eFootball 截图`}
            </div>
            <div className="upload-hint">
              支持 JPG、PNG、WEBP 格式，最大 10MB/张
            </div>
            <input
              id={triggerId}
              type="file"
              accept="image/*"
              onChange={handleChange}
              style={{ display: 'none' }}
              multiple
              disabled={loading}
            />
            <label htmlFor={triggerId} className="btn btn-primary">
              {loading ? '识别中...' : '选择文件'}
            </label>
            {error && <div className="upload-error">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 比赛结果卡片
 */
export function MatchResultCard({ matchData, onConfirm, onCancel }) {
  return (
    <div className="match-result-card fade-in">
      <div className="result-header">
        ═══ 识别结果确认 ═══
      </div>
      <div className="result-content">
        <div className="result-row">
          <span className="result-label">比赛结果:</span>
          <span className="result-value">{getResultText(matchData.result)}</span>
        </div>
        {matchData.score && (
          <div className="result-row">
            <span className="result-label">比分:</span>
            <span className="result-value">{matchData.score}</span>
          </div>
        )}
        <div className="result-row">
          <span className="result-label">控球率:</span>
          <span className="result-value">{matchData.possession}%</span>
        </div>
        <div className="result-divider">───────────</div>
        <div className="result-players">
          {matchData.players.map((player, index) => (
            <div key={index} className="result-player">
              <span className="player-name">{player.name}</span>
              <span className="player-position">{player.position}</span>
              <span className={`player-rating ${getRatingClass(player.rating)}`}>
                {player.rating.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onConfirm}>
          确认并生成评论
        </button>
        <button className="btn" onClick={onCancel}>
          取消
        </button>
      </div>
    </div>
  );
}

/**
 * 阵容确认卡片（招募阶段）
 */
export function FormationResultCard({ formation, onConfirm, onCancel }) {
  if (!formation) return null;
  return (
    <div className="match-result-card fade-in">
      <div className="result-header">═══ 阵容识别确认 ═══</div>
      <div className="result-content">
        <div className="result-row">
          <span className="result-label">球队名:</span>
          <span className="result-value">{formation.teamName || '失意者联盟'}</span>
        </div>
        <div className="result-divider">───────────</div>
        <div className="result-players">
          {formation.players.map((player, index) => (
            <div key={index} className="result-player">
              <span className="player-name">{player.name}</span>
              <span className="player-position">{player.position || '未知'}</span>
              {player.rating && (
                <span className="player-rating rating-average">
                  {typeof player.rating === 'number' ? player.rating.toFixed(1) : player.rating}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="result-actions">
        <button className="btn btn-primary" onClick={onConfirm}>
          确认并注入人设
        </button>
        <button className="btn" onClick={onCancel}>
          重新上传
        </button>
      </div>
    </div>
  );
}

// 辅助函数
function formatTime(timestamp) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function getResultText(result) {
  const map = {
    win: '✓ 胜利',
    draw: '— 平局',
    loss: '✗ 失败'
  };
  return map[result] || '未知';
}

function getRatingClass(rating) {
  if (rating >= 8.0) return 'rating-excellent';
  if (rating >= 7.0) return 'rating-good';
  if (rating >= 6.0) return 'rating-average';
  return 'rating-poor';
}

function toDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
