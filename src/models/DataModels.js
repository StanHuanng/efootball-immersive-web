/**
 * 球员救赎状态类型
 */
export const RedemptionState = {
  FALLEN: 'Fallen',      // 0-20
  WAKING: 'Waking',      // 21-80
  REDEEMED: 'Redeemed'   // 81-100
};

/**
 * 评论强度类型
 */
export const IntensityType = {
  TOXIC: 'toxic',  // 攻击性评论
  HYPE: 'hype'     // 追捧性评论
};

/**
 * 球员数据模型
 */
export class Player {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.name = data.name || '';
    this.nickname = data.nickname || '';
    this.backstory = data.backstory || '';
    this.redemptionScore = data.redemptionScore || 0;
    this.history = data.history || []; // 比赛历史记录
    this.trustBonus = data.trustBonus || false; // 教练信任加成
  }

  /**
   * 获取救赎状态
   */
  getRedemptionState() {
    if (this.redemptionScore <= 20) return RedemptionState.FALLEN;
    if (this.redemptionScore <= 80) return RedemptionState.WAKING;
    return RedemptionState.REDEEMED;
  }

  /**
   * 添加比赛记录
   */
  addMatch(matchData) {
    this.history.push({
      ...matchData,
      timestamp: Date.now()
    });
    
    // 限制历史记录长度
    if (this.history.length > 20) {
      this.history = this.history.slice(-20);
    }
  }

  /**
   * 获取最近的趋势（是否连续上升）
   */
  getRecentTrend() {
    if (this.history.length < 3) return false;
    
    const recent = this.history.slice(-3);
    const ratings = recent.map(m => m.rating);
    
    return ratings[0] < ratings[1] && ratings[1] < ratings[2];
  }

  /**
   * 计算单场比赛后的救赎值变化
   */
  calculateRedemptionChange(rating) {
    let change = 0;
    
    // 基础得分逻辑
    if (rating > 7.5) {
      change += 15;
    } else if (rating < 5.0) {
      change -= 5;
    }
    
    // 趋势奖金
    if (this.getRecentTrend()) {
      change += 10;
    }
    
    // 信任加成
    if (this.trustBonus) {
      change = Math.floor(change * 1.5);
      this.trustBonus = false; // 使用后重置
    }
    
    return change;
  }

  /**
   * 更新救赎值
   */
  updateRedemption(change) {
    this.redemptionScore = Math.max(0, Math.min(100, this.redemptionScore + change));
  }
}

/**
 * 论坛帖子数据模型
 */
export class ForumPost {
  constructor(data = {}) {
    this.id = data.id || Date.now().toString();
    this.author = data.author || '匿名网友';
    this.content = data.content || '';
    this.intensity = data.intensity || IntensityType.TOXIC;
    this.replies = data.replies || [];
    this.timestamp = data.timestamp || Date.now();
    this.playerId = data.playerId || null;
    this.likes = data.likes || 0;
    this.dislikes = data.dislikes || 0;
  }

  /**
   * 添加回复
   */
  addReply(replyData) {
    this.replies.push({
      ...replyData,
      id: Date.now().toString() + Math.random(),
      timestamp: Date.now()
    });
  }
}
