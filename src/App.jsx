import React, { useState, useEffect, useMemo } from 'react';
import { Player, ForumPost } from './models/DataModels';
import { StorageManager, initializeDefaultData } from './utils/storage';
import { PlayerList, HostilityMeter, ForumPostList } from './components/BBSComponents';
import { ScreenshotUploader, MatchResultCard, NewsReport, FormationResultCard } from './components/UploadComponents';
import { RedemptionEngine, SentimentEngine } from './engine/GameEngine';
import { recognizeLineup, recognizeMatchScreenshots, generateComment, generateNewsReport, generateBackstories } from './services/doubaoAPI';
import { fileToBase64, compressImage, validateImageFile } from './utils/imageUtils';
import './styles/retro.css';

const PAGES = {
  RECRUIT: 'recruit',
  MEDIA: 'media',
  DASH: 'dashboard'
};

function App() {
  const [activePage, setActivePage] = useState(PAGES.RECRUIT);
  const [players, setPlayers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hostility, setHostility] = useState(0.65);
  const [gameState, setGameState] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    matchCount: 0,
    recentResults: []
  });
  const [matchHistory, setMatchHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [latestNews, setLatestNews] = useState(null);
  const [formationDraft, setFormationDraft] = useState(null);
  const [lineupLoading, setLineupLoading] = useState(false);
  const [recruitError, setRecruitError] = useState('');
  const [recruitFiles, setRecruitFiles] = useState([]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaError, setMediaError] = useState('');

  useEffect(() => {
    initializeDefaultData();
    loadData();
  }, []);

  const loadData = () => {
    const loadedPlayers = StorageManager.loadPlayers().map(p => new Player(p));
    const loadedPosts = StorageManager.loadPosts().map(p => new ForumPost(p));
    const loadedHostility = StorageManager.loadHostility();
    const loadedGameState = StorageManager.loadGameState();
    const loadedHistory = StorageManager.loadMatchHistory();
    setPlayers(loadedPlayers);
    setPosts(loadedPosts);
    setHostility(loadedHostility);
    setGameState(loadedGameState);
    setMatchHistory(loadedHistory);
  };

  useEffect(() => {
    StorageManager.savePlayers(players);
    StorageManager.savePosts(posts);
    StorageManager.saveHostility(hostility);
    StorageManager.saveGameState(gameState);
    StorageManager.saveMatchHistory(matchHistory);
  }, [players, posts, hostility, gameState, matchHistory]);

  const averageRating = useMemo(() => {
    if (!matchResult || !matchResult.players || matchResult.players.length === 0) return null;
    const total = matchResult.players.reduce((sum, p) => sum + (Number(p.rating) || 0), 0);
    return (total / matchResult.players.length).toFixed(2);
  }, [matchResult]);

  const handleReply = (postId, content) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        const newPost = new ForumPost(post);
        newPost.addReply({ author: '教练（你）', content: content });
        return newPost;
      }
      return post;
    });
    setPosts(updatedPosts);
    setHostility(Math.max(0, hostility - 0.05));
  };

  const handleSupport = (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, likes: (post.likes || 0) + 1 };
      }
      return post;
    });
    setPosts(updatedPosts);
  };

  const handleOppose = (postId) => {
    const updatedPosts = posts.map(post => {
      if (post.id === postId) {
        return { ...post, dislikes: (post.dislikes || 0) + 1 };
      }
      return post;
    });
    setPosts(updatedPosts);
    setHostility(Math.min(1, hostility + 0.03));
  };

  const handleFormationUpload = (files) => {
    const file = files?.[0];
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setRecruitError(validation.error);
      setRecruitFiles([]);
      return;
    }
    setRecruitFiles([file]);
    setRecruitError('');
    setFormationDraft(null);
    setActivePage(PAGES.RECRUIT);
  };

  const confirmFormationUpload = async () => {
    const file = recruitFiles?.[0];
    if (!file) {
      setRecruitError('请先选择阵容文件再确认识别。');
      return;
    }
    const validation = validateImageFile(file);
    if (!validation.valid) {
      setRecruitError(validation.error);
      return;
    }
    setLineupLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      const result = await recognizeLineup(compressed);
      const enrichedPlayers = await injectBackstories(result.players || []);
      setFormationDraft({ ...result, players: enrichedPlayers });
      setRecruitError('');
    } catch (error) {
      console.error('阵容识别失败:', error);
      setRecruitError(buildAIErrorHints(error));
    } finally {
      setLineupLoading(false);
    }
  };

  const injectBackstories = async (playerList) => {
    if (!playerList || playerList.length === 0) return [];
    try {
      const generated = await generateBackstories(playerList);
      return generated.map((p, idx) => ({
        ...playerList[idx],
        ...p,
        redemptionScore: p.redemptionScore || 50
      }));
    } catch (error) {
      console.error('生成人设失败:', error);
      return playerList.map(p => ({ ...p, nickname: p.nickname || '失意者', backstory: p.backstory || '曾经的天才，如今沉沦', redemptionScore: 50 }));
    }
  };

  const handleConfirmFormation = () => {
    if (!formationDraft) return;
    const newPlayers = formationDraft.players.map(p => new Player({
      ...p,
      redemptionScore: p.redemptionScore ?? 50,
      history: []
    }));
    setPlayers(newPlayers);
    setPosts([]);
    setHostility(0.68);
    setGameState({ wins: 0, losses: 0, draws: 0, matchCount: 0, recentResults: [] });
    setMatchHistory([]);
    setFormationDraft(null);
    setActivePage(PAGES.MEDIA);
  };

  const handleMatchUpload = (files) => {
    if (!files || files.length === 0) return;
    for (const file of files) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setMediaError(validation.error);
        setMediaFiles([]);
        return;
      }
    }
    setMediaFiles(Array.from(files));
    setMediaError('');
    setMatchResult(null);
  };

  const confirmMatchUpload = async () => {
    if (!mediaFiles || mediaFiles.length === 0) {
      setMediaError('请先选择比赛截图再确认识别。');
      return;
    }
    for (const file of mediaFiles) {
      const validation = validateImageFile(file);
      if (!validation.valid) {
        setMediaError(validation.error);
        return;
      }
    }
    setLoading(true);
    try {
      const encoded = [];
      for (const file of mediaFiles) {
        const base64 = await fileToBase64(file);
        const compressed = await compressImage(base64);
        encoded.push(compressed);
      }
      const result = await recognizeMatchScreenshots(encoded, players);
      setMatchResult(result);
      setMediaError('');
    } catch (error) {
      console.error('比赛截图识别失败:', error);
      setMediaError(buildAIErrorHints(error));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmMatch = async () => {
    if (!matchResult) return;
    setLoading(true);
    try {
      const matchPlayers = matchResult.players || [];
      const news = await generateNewsReport({
        matchData: matchResult,
        players: matchPlayers,
        result: matchResult.result
      });
      setLatestNews({ ...news, scoreline: matchResult.score || news.scoreline });

      const updatedPlayers = players.map(player => {
        const matchPlayer = matchPlayers.find(p => p.name === player.name);
        if (matchPlayer) {
          const newPlayer = new Player(player);
          const updateResult = RedemptionEngine.updatePlayerRedemption(newPlayer, {
            rating: matchPlayer.rating,
            position: matchPlayer.position,
            goals: matchPlayer.goals || 0,
            assists: matchPlayer.assists || 0
          });
          return updateResult.player;
        }
        return player;
      });
      setPlayers(updatedPlayers);

      const avgRatingValue = averageRating ? Number(averageRating) : 6.5;
      const scoreDiff = computeScoreDiff(matchResult.score);
      let newHostility = SentimentEngine.updateHostility(hostility, matchResult.result, scoreDiff, avgRatingValue);
      const trendAdjustment = SentimentEngine.calculateTrend([...(gameState.recentResults || []), matchResult.result]);
      newHostility = Math.max(0, Math.min(1, newHostility + trendAdjustment));
      setHostility(newHostility);

      const newGameState = { ...gameState };
      newGameState.matchCount += 1;
      if (matchResult.result === 'win') newGameState.wins += 1;
      else if (matchResult.result === 'draw') newGameState.draws += 1;
      else if (matchResult.result === 'loss') newGameState.losses += 1;
      newGameState.recentResults = [...(gameState.recentResults || []), matchResult.result].slice(-5);
      setGameState(newGameState);

      const newPosts = [];
      for (const matchPlayer of matchPlayers) {
        const player = players.find(p => p.name === matchPlayer.name);
        if (player) {
          const comment = await generateComment({
            player: player,
            matchData: { rating: matchPlayer.rating },
            hostility: newHostility,
            redemptionState: player.getRedemptionState()
          });
          if (comment) {
            const intensity = SentimentEngine.getCommentIntensity(newHostility);
            const post = new ForumPost({
              author: `网友${Math.floor(Math.random() * 9999)}`,
              content: comment,
              intensity: intensity,
              playerId: player.id
            });
            newPosts.push(post);
          }
        }
      }
      const ensuredPosts = [...newPosts];
      const fillersNeeded = Math.max(0, 5 - ensuredPosts.length);
      for (let i = 0; i < fillersNeeded; i += 1) {
        ensuredPosts.push(buildFillerPost(newHostility));
      }
      setPosts([...ensuredPosts, ...posts].slice(0, 100));

      const topPerformers = [...matchPlayers]
        .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 3)
        .map(p => `${p.name} ${Number(p.rating || 0).toFixed(1)}`);
      const newHistory = [{
        id: Date.now().toString(),
        result: matchResult.result,
        score: matchResult.score || '',
        possession: matchResult.possession,
        averageRating: avgRatingValue,
        topPerformers,
        hostility: newHostility,
        timestamp: Date.now()
      }, ...matchHistory].slice(0, 15);
      setMatchHistory(newHistory);

      setMatchResult(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('处理比赛结果失败:', error);
      alert('处理失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMatch = () => {
    setMatchResult(null);
    setMediaFiles([]);
  };

  const renderRecruitPage = () => (
    <div className="page-grid">
      <div className="panel">
        <div className="panel-title">阵型截图上传</div>
        <p className="panel-desc">上传包含首发名单/阵型的截图，AI 将识别球员并生成“失意者背景”。</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className="btn btn-primary" onClick={() => {
            const el = document.getElementById('recruit-upload');
            if (el) el.click();
          }}>选择阵容文件</button>
          <button className="btn btn-primary" disabled={recruitFiles.length === 0 || lineupLoading} onClick={confirmFormationUpload}>确认识别</button>
          <button className="btn" onClick={() => setRecruitError('')}>清除提示</button>
        </div>
        <ScreenshotUploader onUpload={handleFormationUpload} loading={lineupLoading} title="═══ 上传阵型截图 ═══" maxFiles={1} triggerId="recruit-upload" />
        {recruitError && (
          <div className="error-box" style={{ marginTop: 12 }}>
            <div className="error-title">AI 识别失败可能原因</div>
            <ul className="error-list">
              {Array.isArray(recruitError) ? recruitError.map((t, i) => (<li key={i}>{t}</li>)) : (<li>{recruitError}</li>)}
            </ul>
          </div>
        )}
        {formationDraft && (
          <FormationResultCard
            formation={formationDraft}
            onConfirm={handleConfirmFormation}
            onCancel={() => { setFormationDraft(null); setRecruitFiles([]); }}
          />
        )}
      </div>
      <div className="panel">
        <div className="panel-title">当前失意者名单</div>
        <PlayerList players={players} />
      </div>
    </div>
  );

  const renderMediaPage = () => (
    <div className="page-grid">
      <div className="panel">
        <div className="panel-title">赛后媒体中心</div>
        <p className="panel-desc">上传 1-3 张赛后统计截图，识别结果后生成新闻与论坛回帖。</p>
        {!matchResult && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <button className="btn btn-primary" onClick={() => {
                const el = document.getElementById('media-upload');
                if (el) el.click();
              }}>选择比赛截图</button>
              <button className="btn btn-primary" disabled={mediaFiles.length === 0 || loading} onClick={confirmMatchUpload}>确认识别</button>
              <button className="btn" onClick={() => setMediaError('')}>清除提示</button>
            </div>
            <ScreenshotUploader onUpload={handleMatchUpload} loading={loading} title="═══ 上传比赛截图 ═══" maxFiles={3} triggerId="media-upload" />
            {mediaError && (
              <div className="error-box" style={{ marginTop: 12 }}>
                <div className="error-title">AI 识别失败可能原因</div>
                <ul className="error-list">
                  {Array.isArray(mediaError) ? mediaError.map((t, i) => (<li key={i}>{t}</li>)) : (<li>{mediaError}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
        {matchResult && (
          <MatchResultCard
            matchData={matchResult}
            onConfirm={handleConfirmMatch}
            onCancel={handleCancelMatch}
          />
        )}
        {latestNews && <NewsReport news={latestNews} />}
      </div>
      <div className="panel">
        <div className="panel-title">论坛实时回帖</div>
        <HostilityMeter hostility={hostility} />
        <ForumPostList
          posts={posts}
          onReply={handleReply}
          onSupport={handleSupport}
          onOppose={handleOppose}
        />
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="page-grid">
      <div className="panel">
        <div className="panel-title">主教练面板</div>
        <div className="stat-line">战绩：{gameState.wins}胜 {gameState.draws}平 {gameState.losses}负 · 场次 {gameState.matchCount}</div>
        <div className="impression-row">
          <div>
            <div className="mini-label">网络印象分</div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${SentimentEngine.getImpressionScore(hostility)}%` }} />
            </div>
            <div className="mini-value">{SentimentEngine.getImpressionScore(hostility)} / 100</div>
          </div>
          <div>
            <div className="mini-label">敌对度</div>
            <HostilityMeter hostility={hostility} />
          </div>
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">人设卡片</div>
        <div className="card-grid">
          {players.map(player => (
            <div key={player.id} className="story-card">
              <div className="story-header">
                <div>
                  <div className="player-name">{player.name}</div>
                  <div className="player-nickname">「{player.nickname}」</div>
                </div>
                <div className={`redemption-state ${player.getRedemptionState().toLowerCase()}`}>
                  {player.getRedemptionState()}
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${player.redemptionScore}%` }} />
              </div>
              <div className="mini-value">救赎值 {player.redemptionScore}/100</div>
              <div className="story-text">{player.backstory}</div>
              <div className="mini-label">最近表现</div>
              <div className="mini-history">
                {(player.history || []).slice(-3).map((h, idx) => (
                  <span key={idx} className="history-chip">{Number(h.rating || 0).toFixed(1)}</span>
                ))}
                {(player.history || []).length === 0 && <span className="history-chip empty">暂无数据</span>}
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <div className="empty-hint">暂无球员，请先完成阵容招募。</div>
          )}
        </div>
      </div>
      <div className="panel">
        <div className="panel-title">历史记录</div>
        <div className="history-list">
          {matchHistory.map(item => (
            <div key={item.id} className="history-item">
              <div className="history-left">
                <div className="history-result">{getResultText(item.result)} {item.score}</div>
                <div className="history-meta">控球 {item.possession}% · 场均 {item.averageRating.toFixed(2)}</div>
                <div className="history-meta">敌对度 {Math.round(item.hostility * 100)}%</div>
              </div>
              <div className="history-right">
                {item.topPerformers?.map((p, idx) => (
                  <span key={idx} className="history-chip">{p}</span>
                ))}
              </div>
            </div>
          ))}
          {matchHistory.length === 0 && <div className="empty-hint">暂无历史记录，上传赛后截图生成首条战报。</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      {(loading || lineupLoading) && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">⚽</div>
            <div className="loading-text">
              {lineupLoading ? '正在识别阵容...' : (matchResult ? '正在生成评论...' : '正在识别截图...')}
            </div>
          </div>
        </div>
      )}
      <div className="header">
        <h1 className="retro-text">═══ 失意者联盟 ═══</h1>
        <div className="subtitle">eFootball 复古论坛 | 见证黑马逆袭史诗</div>
      </div>

      <div className="page-nav">
        {Object.values(PAGES).map(page => (
          <button
            key={page}
            className={`nav-tab ${activePage === page ? 'active' : ''}`}
            onClick={() => setActivePage(page)}
          >
            {page === PAGES.RECRUIT && '球队组建'}
            {page === PAGES.MEDIA && '动态媒体中心'}
            {page === PAGES.DASH && '主教练面板'}
          </button>
        ))}
      </div>

      {activePage === PAGES.RECRUIT && renderRecruitPage()}
      {activePage === PAGES.MEDIA && renderMediaPage()}
      {activePage === PAGES.DASH && renderDashboard()}

      <div className="footer">
        <div>═══════════════════════════════</div>
        <div style={{ marginTop: '10px' }}>失意者联盟 BBS · 2000-2026 · 见证逆袭传奇</div>
      </div>
    </div>
  );
}

function getResultText(result) {
  const map = {
    win: '✓ 胜利',
    draw: '— 平局',
    loss: '✗ 失败'
  };
  return map[result] || '未知';
}

function computeScoreDiff(scoreStr) {
  if (!scoreStr || typeof scoreStr !== 'string') return 0;
  const match = scoreStr.match(/(\d+)\s*[-:]\s*(\d+)/);
  if (!match) return 0;
  return Math.abs(parseInt(match[1], 10) - parseInt(match[2], 10));
}

function buildAIErrorHints(error) {
  const hints = [
    '未配置或填错 VITE_DOUBAO_API_KEY（请在 Vercel 环境变量或 .env.local 配置）',
    'VITE_DOUBAO_BASE_URL 不可达或非 https://ark.cn-beijing.volces.com/api/v3',
    'VITE_DOUBAO_MODEL 无效或无访问权限（确认模型 ID）',
    '截图不清晰或格式/大小不符合（仅支持 JPG/PNG/WEBP，≤10MB）',
    '跨域或网络代理拦截，建议改用后端代理（Serverless Function）',
    'Ark /responses 返回内容非 JSON 或解析失败（请重试）'
  ];
  const msg = (error && (error.message || String(error))) || '';
  if (msg) {
    return [msg, ...hints];
  }
  return hints;
}

function buildFillerPost(hostility) {
  const intensity = SentimentEngine.getCommentIntensity(hostility);
  const toxicPool = [
    '牢大又梦游了？顶级理解变顶级遛弯，依托构思笑死人。',
    '神仙球没了，全是神仙操作的反面教材，论坛敌对度直接拉满。',
    '又输了？队徽先卸下来吧，这救赎值要掉到地下室了。'
  ];
  const hypePool = [
    '今天是真硬刚，谁还敢叫他水货？我要写道歉信了。',
    '逆袭味儿出来了，牢弟开始把剧情拉回来了，点赞先上。',
    '这场真有顶级理解，黑子们先别急，先把键盘放下。'
  ];
  const pool = intensity === 'toxic' ? toxicPool : hypePool;
  const content = pool[Math.floor(Math.random() * pool.length)];
  return new ForumPost({
    author: `围观群众${Math.floor(Math.random() * 9999)}`,
    content,
    intensity,
    playerId: null
  });
}

export default App;
