/**
 * LocalStorage 数据持久化管理
 */

const STORAGE_KEYS = {
  PLAYERS: 'misfit_alliance_players',
  POSTS: 'misfit_alliance_posts',
  HOSTILITY: 'misfit_alliance_hostility',
  GAME_STATE: 'misfit_alliance_game_state',
  MATCH_HISTORY: 'misfit_alliance_match_history'
};

/**
 * 存储管理器
 */
export class StorageManager {
  /**
   * 保存数据到 LocalStorage
   */
  static save(key, data) {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(key, serialized);
      return true;
    } catch (error) {
      console.error('Storage save error:', error);
      return false;
    }
  }

  /**
   * 从 LocalStorage 读取数据
   */
  static load(key, defaultValue = null) {
    try {
      const serialized = localStorage.getItem(key);
      return serialized ? JSON.parse(serialized) : defaultValue;
    } catch (error) {
      console.error('Storage load error:', error);
      return defaultValue;
    }
  }

  /**
   * 删除数据
   */
  static remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Storage remove error:', error);
      return false;
    }
  }

  /**
   * 清空所有数据
   */
  static clearAll() {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.remove(key);
    });
  }

  /**
   * 保存球员数据
   */
  static savePlayers(players) {
    return this.save(STORAGE_KEYS.PLAYERS, players);
  }

  /**
   * 加载球员数据
   */
  static loadPlayers() {
    return this.load(STORAGE_KEYS.PLAYERS, []);
  }

  /**
   * 保存论坛帖子
   */
  static savePosts(posts) {
    return this.save(STORAGE_KEYS.POSTS, posts);
  }

  /**
   * 加载论坛帖子
   */
  static loadPosts() {
    return this.load(STORAGE_KEYS.POSTS, []);
  }

  /**
   * 保存敌对度
   */
  static saveHostility(hostility) {
    return this.save(STORAGE_KEYS.HOSTILITY, hostility);
  }

  /**
   * 加载敌对度
   */
  static loadHostility() {
    return this.load(STORAGE_KEYS.HOSTILITY, 0.5);
  }

  /**
   * 保存游戏状态
   */
  static saveGameState(state) {
    return this.save(STORAGE_KEYS.GAME_STATE, {
      ...state,
      lastSaved: Date.now()
    });
  }

  /**
   * 加载游戏状态
   */
  static loadGameState() {
    return this.load(STORAGE_KEYS.GAME_STATE, {
      wins: 0,
      losses: 0,
      draws: 0,
      matchCount: 0,
      recentResults: []
    });
  }

  /**
   * 保存比赛历史
   */
  static saveMatchHistory(history) {
    return this.save(STORAGE_KEYS.MATCH_HISTORY, history);
  }

  /**
   * 读取比赛历史
   */
  static loadMatchHistory() {
    return this.load(STORAGE_KEYS.MATCH_HISTORY, []);
  }
}

/**
 * 初始化默认数据
 */
export function initializeDefaultData() {
  const existingPlayers = StorageManager.loadPlayers();
  
  // 如果没有数据，创建示例球员
  if (existingPlayers.length === 0) {
    const defaultPlayers = [
      {
        id: '1',
        name: '格列兹曼',
        nickname: '法国软脚虾',
        backstory: '曾经的金球奖候选人，如今沦为巴萨替补，被球迷称为"水货"。',
        redemptionScore: 10,
        history: []
      },
      {
        id: '2',
        name: '库蒂尼奥',
        nickname: '巴萨最贵水货',
        backstory: '1.6亿先生，从利物浦巨星跌落至欧洲流浪汉。',
        redemptionScore: 5,
        history: []
      },
      {
        id: '3',
        name: '桑乔',
        nickname: '英超隐形人',
        backstory: '多特蒙德的天才少年，来到曼联后迷失自我。',
        redemptionScore: 15,
        history: []
      }
    ];
    
    StorageManager.savePlayers(defaultPlayers);
  }
  
  // 初始化默认舆论状态
  const hostility = StorageManager.loadHostility();
  if (hostility === null || hostility === undefined) {
    StorageManager.saveHostility(0.7); // 初始高敌对度
  }

  // 初始化比赛历史
  const history = StorageManager.loadMatchHistory();
  if (!Array.isArray(history)) {
    StorageManager.saveMatchHistory([]);
  }
}
