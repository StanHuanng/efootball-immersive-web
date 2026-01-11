import { Player, ForumPost, IntensityType } from '../models/DataModels';

/**
 * 救赎算法引擎
 * 负责计算球员救赎值变化和状态转移
 */
export class RedemptionEngine {
  /**
   * 根据比赛数据更新球员救赎值
   * @param {Player} player - 球员对象
   * @param {Object} matchData - 比赛数据 { rating, goals, assists, ... }
   * @returns {Object} { player, change, newScore }
   */
  static updatePlayerRedemption(player, matchData) {
    const { rating } = matchData;
    
    // 添加比赛记录
    player.addMatch(matchData);
    
    // 计算救赎值变化
    const change = player.calculateRedemptionChange(rating);
    
    // 更新救赎值
    player.updateRedemption(change);
    
    return {
      player,
      change,
      newScore: player.redemptionScore
    };
  }

  /**
   * 批量更新多个球员
   * @param {Array<Player>} players - 球员数组
   * @param {Array<Object>} matchDataList - 比赛数据数组
   * @returns {Array<Object>} 更新结果数组
   */
  static batchUpdatePlayers(players, matchDataList) {
    return players.map((player, index) => {
      const matchData = matchDataList[index];
      if (matchData) {
        return this.updatePlayerRedemption(player, matchData);
      }
      return { player, change: 0, newScore: player.redemptionScore };
    });
  }

  /**
   * 启用球员信任加成
   * @param {Player} player - 球员对象
   */
  static enableTrustBonus(player) {
    player.trustBonus = true;
  }
}

/**
 * 动态舆论模型
 * 负责计算和调整网络敌对度
 */
export class SentimentEngine {
  /**
   * 根据比赛结果更新敌对度
   * @param {number} currentHostility - 当前敌对度 (0-1)
   * @param {string} result - 比赛结果 'win'|'draw'|'loss'
   * @param {number} scoreDiff - 比分差距
   * @returns {number} 新的敌对度
   */
  static updateHostility(currentHostility, result, scoreDiff = 0, averageRating = 6.5) {
    let change = 0;
    
    switch(result) {
      case 'win':
        // 胜利降低敌对度
        change = -0.1 - (scoreDiff * 0.02);
        break;
      case 'draw':
        // 平局轻微降低敌对度
        change = -0.03;
        break;
      case 'loss':
        // 失败增加敌对度
        change = 0.15 + (scoreDiff * 0.03);
        break;
    }

    // 评分加权（场均低于6.5会提高敌对度）
    if (averageRating < 6.5) {
      change += (6.5 - averageRating) * 0.03;
    } else if (averageRating > 7.2) {
      change -= (averageRating - 7.2) * 0.02;
    }
    
    const newHostility = Math.max(0, Math.min(1, currentHostility + change));
    return newHostility;
  }

  /**
   * 根据连续结果计算敌对度趋势
   * @param {Array<string>} recentResults - 最近比赛结果数组
   * @returns {number} 敌对度调整值
   */
  static calculateTrend(recentResults) {
    if (recentResults.length < 3) return 0;
    
    const recent = recentResults.slice(-3);
    const winCount = recent.filter(r => r === 'win').length;
    const lossCount = recent.filter(r => r === 'loss').length;
    
    if (winCount === 3) {
      // 连胜，大幅降低敌对度
      return -0.2;
    } else if (lossCount === 3) {
      // 连败，大幅提升敌对度
      return 0.25;
    }
    
    return 0;
  }

  /**
   * 根据敌对度生成评论类型
   * @param {number} hostility - 当前敌对度
   * @returns {string} 'toxic'|'hype'
   */
  static getCommentIntensity(hostility) {
    return hostility > 0.5 ? IntensityType.TOXIC : IntensityType.HYPE;
  }

  /**
   * 计算印象分（用于仪表盘展示）
   */
  static getImpressionScore(hostility) {
    return Math.max(0, Math.min(100, Math.round((1 - hostility) * 100)));
  }

  /**
   * 判断是否触发"攻击性爆发"
   * @param {number} hostility - 当前敌对度
   * @returns {boolean}
   */
  static isHostilityPeak(hostility) {
    return hostility >= 0.8;
  }
}

/**
 * 叙事内容生成器（本地版本，不依赖 AI）
 */
export class NarrativeEngine {
  /**
   * 生成毒舌评论模板（本地版）
   * @param {Player} player - 球员对象
   * @param {number} hostility - 敌对度
   * @param {Object} matchData - 比赛数据
   * @returns {string} 生成的评论内容
   */
  static generateToxicComment(player, hostility, matchData) {
    const { rating, result } = matchData;
    
    const toxicTemplates = [
      `${player.name}这场${rating}分？笑死，${player.nickname}名不虚传，依托构思的表现。`,
      `${player.name}又梦游了，这种球员能踢职业？牢门都焊死了属于是。`,
      `建议把${player.name}直接退役算了，看着就来气，什么顶级理解。`,
      `${rating}分还好意思领工资？${player.nickname}这个称号太贴切了。`,
      `${player.name}：我不是针对谁，我是说在座的各位都是垃圾（结果自己最垃圾）`,
      `又输了？这教练和${player.name}真是绝配，垃圾配垃圾。`
    ];
    
    const neutralTemplates = [
      `${player.name}今天表现一般般，${rating}分，看来状态还没起来。`,
      `${player.nickname}这个外号真不是白叫的，${player.name}还需要证明自己。`,
      `${player.name}评分${rating}，中规中矩吧，期待下场比赛。`
    ];
    
    if (hostility > 0.6 || rating < 6.0) {
      return toxicTemplates[Math.floor(Math.random() * toxicTemplates.length)];
    } else {
      return neutralTemplates[Math.floor(Math.random() * neutralTemplates.length)];
    }
  }

  /**
   * 生成追捧评论模板
   * @param {Player} player - 球员对象
   * @param {Object} matchData - 比赛数据
   * @returns {string} 生成的评论内容
   */
  static generateHypeComment(player, matchData) {
    const { rating, goals = 0 } = matchData;
    
    const hypeTemplates = [
      `${player.name}牛逼！${rating}分全场最佳，这才是真正的实力！`,
      `${player.name}今天太猛了，${goals > 0 ? `进了${goals}球，` : ''}谁说${player.nickname}来着？打脸了吧！`,
      `${player.name}：我就是要证明给你们看！评分${rating}，无可挑剔！`,
      `之前黑${player.name}的人呢？出来走两步？这表现够不够格？`,
      `${player.name}终于觉醒了，这才是我们认识的那个天才球员！`,
      `看到${player.name}的表现，我又相信爱情了！救赎之路开启！`
    ];
    
    return hypeTemplates[Math.floor(Math.random() * hypeTemplates.length)];
  }

  /**
   * 生成对立评论（分裂状态）
   * @param {Player} player - 球员对象
   * @param {Object} matchData - 比赛数据
   * @returns {Array<string>} 对立的两条评论
   */
  static generateDividedComments(player, matchData) {
    const { rating } = matchData;
    
    const proComment = this.generateHypeComment(player, matchData);
    const antiComment = `${rating}分？一场好球就想洗白？${player.nickname}永远是${player.nickname}！`;
    
    return [proComment, antiComment];
  }

  /**
   * 根据救赎状态生成叙事评论
   * @param {Player} player - 球员对象
   * @param {number} hostility - 敌对度
   * @param {Object} matchData - 比赛数据
   * @returns {ForumPost} 生成的论坛帖子
   */
  static generateNarrativePost(player, hostility, matchData) {
    const { rating } = matchData;
    const redemptionState = player.getRedemptionState();
    
    let content;
    let intensity;
    
    // 根据救赎状态和表现生成不同风格的评论
    if (redemptionState === 'Fallen') {
      // 深陷低谷期 - 毒舌为主
      content = this.generateToxicComment(player, hostility, matchData);
      intensity = IntensityType.TOXIC;
    } else if (redemptionState === 'Waking') {
      // 觉醒期 - 评论分裂
      if (rating >= 7.0) {
        content = this.generateHypeComment(player, matchData);
        intensity = IntensityType.HYPE;
      } else {
        content = this.generateToxicComment(player, hostility, matchData);
        intensity = IntensityType.TOXIC;
      }
    } else {
      // 救赎完成 - 追捧为主
      content = this.generateHypeComment(player, matchData);
      intensity = IntensityType.HYPE;
    }
    
    return new ForumPost({
      author: `网友${Math.floor(Math.random() * 9999)}`,
      content,
      intensity,
      playerId: player.id
    });
  }
}
