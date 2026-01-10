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
export function ScreenshotUploader({ onUpload, loading }) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    // 触发上传
    if (onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="screenshot-uploader">
      <div className="uploader-header">
        ═══ 上传比赛截图 ═══
      </div>
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="preview-container">
            <img src={preview} alt="Preview" className="preview-image" />
            <button 
              className="btn"
              onClick={() => {
                setPreview(null);
                document.getElementById('file-upload').value = '';
              }}
            >
              重新选择
            </button>
          </div>
        ) : (
          <div className="upload-prompt">
            <div className="upload-icon">📸</div>
            <div className="upload-text">
              {loading ? '正在识别截图...' : '点击或拖拽上传 eFootball 赛后截图'}
            </div>
            <div className="upload-hint">
              支持 JPG、PNG、WEBP 格式，最大 10MB
            </div>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleChange}
              style={{ display: 'none' }}
              disabled={loading}
            />
            <label htmlFor="file-upload" className="btn btn-primary">
              {loading ? '识别中...' : '选择文件'}
            </label>
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
