import React from 'react';
import { RedemptionState } from '../models/DataModels';

/**
 * 球员列表组件
 */
export function PlayerList({ players, onPlayerSelect }) {
  const getStateClass = (state) => {
    switch(state) {
      case RedemptionState.FALLEN:
        return 'fallen';
      case RedemptionState.WAKING:
        return 'waking';
      case RedemptionState.REDEEMED:
        return 'redeemed';
      default:
        return 'fallen';
    }
  };

  const getStateText = (state) => {
    switch(state) {
      case RedemptionState.FALLEN:
        return '深陷低谷';
      case RedemptionState.WAKING:
        return '觉醒中';
      case RedemptionState.REDEEMED:
        return '完成救赎';
      default:
        return '未知';
    }
  };

  return (
    <div className="player-list">
      <div className="player-list-header">
        ═══ 失意者名单 ═══
      </div>
      {players.map(player => (
        <div 
          key={player.id} 
          className="player-item fade-in"
          onClick={() => onPlayerSelect && onPlayerSelect(player)}
        >
          <div>
            <span className="player-name">{player.name}</span>
            <span className="player-nickname">「{player.nickname}」</span>
          </div>
          <div className="player-stats">
            <div>
              救赎值: <strong>{player.redemptionScore}</strong>/100
            </div>
            <div className={`redemption-state ${getStateClass(player.getRedemptionState())}`}>
              {getStateText(player.getRedemptionState())}
            </div>
          </div>
        </div>
      ))}
      {players.length === 0 && (
        <div className="player-item" style={{ textAlign: 'center', color: '#666' }}>
          暂无球员数据，请添加球员
        </div>
      )}
    </div>
  );
}

/**
 * 敌对度指示器组件
 */
export function HostilityMeter({ hostility }) {
  const getHostilityText = (value) => {
    if (value >= 0.8) return '极度敌对';
    if (value >= 0.6) return '高度敌对';
    if (value >= 0.4) return '中度敌对';
    if (value >= 0.2) return '轻度敌对';
    return '和谐氛围';
  };

  return (
    <div className="hostility-meter">
      <div className="hostility-meter-title">
        ▼ 网络舆论敌对度
      </div>
      <div className="hostility-bar">
        <div 
          className="hostility-fill" 
          style={{ width: `${hostility * 100}%` }}
        />
        <div className="hostility-label">
          {getHostilityText(hostility)} ({Math.round(hostility * 100)}%)
        </div>
      </div>
    </div>
  );
}

/**
 * 论坛帖子组件
 */
export function ForumPost({ post, onReply, onSupport, onOppose }) {
  const [showReplyInput, setShowReplyInput] = React.useState(false);
  const [replyText, setReplyText] = React.useState('');

  const handleReply = () => {
    if (replyText.trim()) {
      onReply && onReply(post.id, replyText);
      setReplyText('');
      setShowReplyInput(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="post-item fade-in">
      <div className="post-header">
        <span className="post-author">{post.author}</span>
        <span className="post-time">{formatTime(post.timestamp)}</span>
      </div>
      <div className={`post-content ${post.intensity}`}>
        {post.content}
      </div>
      <div className="post-actions">
        <button 
          className="post-action-btn"
          onClick={() => onSupport && onSupport(post.id)}
        >
          [顶] {post.likes || 0}
        </button>
        <button 
          className="post-action-btn"
          onClick={() => onOppose && onOppose(post.id)}
        >
          [踩] {post.dislikes || 0}
        </button>
        <button 
          className="post-action-btn"
          onClick={() => setShowReplyInput(!showReplyInput)}
        >
          [回复] {post.replies?.length || 0}
        </button>
      </div>
      
      {/* 回复列表 */}
      {post.replies && post.replies.length > 0 && (
        <div style={{ marginTop: '15px', paddingLeft: '20px', borderLeft: '2px solid #333' }}>
          {post.replies.map(reply => (
            <div key={reply.id} style={{ marginBottom: '10px', fontSize: '12px' }}>
              <div style={{ color: '#6699ff' }}>{reply.author}:</div>
              <div style={{ color: '#aaa', marginTop: '3px' }}>{reply.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* 回复输入框 */}
      {showReplyInput && (
        <div style={{ marginTop: '15px' }}>
          <input
            type="text"
            className="input"
            placeholder="输入你的回复..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleReply()}
          />
          <div style={{ marginTop: '5px' }}>
            <button className="btn btn-primary" onClick={handleReply}>
              发表回复
            </button>
            <button 
              className="btn" 
              style={{ marginLeft: '10px' }}
              onClick={() => setShowReplyInput(false)}
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * 论坛帖子列表组件
 */
export function ForumPostList({ posts, onReply, onSupport, onOppose }) {
  return (
    <div className="forum-posts">
      <div className="forum-posts-header">
        ═══ 网民热议 ═══
      </div>
      {posts.map(post => (
        <ForumPost
          key={post.id}
          post={post}
          onReply={onReply}
          onSupport={onSupport}
          onOppose={onOppose}
        />
      ))}
      {posts.length === 0 && (
        <div className="post-item" style={{ textAlign: 'center', color: '#666' }}>
          暂无评论
        </div>
      )}
    </div>
  );
}
