import React, { useState, useEffect } from 'react';
import { Player, ForumPost } from './models/DataModels';
import { StorageManager, initializeDefaultData } from './utils/storage';
import { PlayerList, HostilityMeter, ForumPostList } from './components/BBSComponents';
import { ScreenshotUploader, MatchResultCard, NewsReport } from './components/UploadComponents';
import { RedemptionEngine, SentimentEngine } from './engine/GameEngine';
import { recognizeScreenshot, generateComment, generateNewsReport } from './services/doubaoAPI';
import { fileToBase64, compressImage, validateImageFile } from './utils/imageUtils';
import './styles/retro.css';

function App() {
  const [players, setPlayers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [hostility, setHostility] = useState(0.5);
  const [gameState, setGameState] = useState({
    wins: 0,
    losses: 0,
    draws: 0,
    matchCount: 0
  });
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [matchResult, setMatchResult] = useState(null);
  const [latestNews, setLatestNews] = useState(null);
  const [showUploader, setShowUploader] = useState(true);

  useEffect(() => {
    initializeDefaultData();
    loadData();
  }, []);

  const loadData = () => {
    const loadedPlayers = StorageManager.loadPlayers().map(p => new Player(p));
    const loadedPosts = StorageManager.loadPosts().map(p => new ForumPost(p));
    const loadedHostility = StorageManager.loadHostility();
    const loadedGameState = StorageManager.loadGameState();
    setPlayers(loadedPlayers);
    setPosts(loadedPosts);
    setHostility(loadedHostility);
    setGameState(loadedGameState);
  };

  const saveData = () => {
    StorageManager.savePlayers(players);
    StorageManager.savePosts(posts);
    StorageManager.saveHostility(hostility);
    StorageManager.saveGameState(gameState);
  };

  useEffect(() => {
    saveData();
  }, [players, posts, hostility, gameState]);

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
  };

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

  const handleImageUpload = async (file) => {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const compressed = await compressImage(base64);
      const result = await recognizeScreenshot(compressed);
      setMatchResult(result);
      setLoading(false);
    } catch (error) {
      console.error('图片处理失败:', error);
      alert('图片处理失败，请重试');
      setLoading(false);
    }
  };

  const handleConfirmMatch = async () => {
    if (!matchResult) return;
    setLoading(true);
    try {
      const news = await generateNewsReport({
        matchData: matchResult,
        players: matchResult.players,
        result: matchResult.result
      });
      setLatestNews(news);

      const updatedPlayers = players.map(player => {
        const matchPlayer = matchResult.players.find(p => p.name === player.name);
        if (matchPlayer) {
          const newPlayer = new Player(player);
          const updateResult = RedemptionEngine.updatePlayerRedemption(newPlayer, {
            rating: matchPlayer.rating,
            position: matchPlayer.position,
            goals: 0,
            assists: 0
          });
          return updateResult.player;
        }
        return player;
      });
      setPlayers(updatedPlayers);

      const newHostility = SentimentEngine.updateHostility(hostility, matchResult.result, 0);
      setHostility(newHostility);

      const newGameState = { ...gameState };
      newGameState.matchCount += 1;
      if (matchResult.result === 'win') newGameState.wins += 1;
      else if (matchResult.result === 'draw') newGameState.draws += 1;
      else if (matchResult.result === 'loss') newGameState.losses += 1;
      setGameState(newGameState);

      const newPosts = [];
      for (const matchPlayer of matchResult.players) {
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
      setPosts([...newPosts, ...posts]);
      setMatchResult(null);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('处理比赛结果失败:', error);
      alert('处理失败，请重试');
      setLoading(false);
    }
  };

  const handleCancelMatch = () => {
    setMatchResult(null);
  };

  return (
    <div className="container">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner">⚽</div>
            <div className="loading-text">
              {matchResult ? '正在生成评论...' : '正在识别截图...'}
            </div>
          </div>
        </div>
      )}
      <div className="header">
        <h1 className="retro-text">═══ 失意者联盟 ═══</h1>
        <div className="subtitle">eFootball 复古论坛 | 见证黑马逆袭史诗</div>
      </div>
      <div className="info-bar">
        <div>
          <span className="stat">
            <span className="stat-label">战绩:</span>
            <span className="stat-value">
              {gameState.wins}胜 {gameState.draws}平 {gameState.losses}负
            </span>
          </span>
          <span className="stat">
            <span className="stat-label">场次:</span>
            <span className="stat-value">{gameState.matchCount}</span>
          </span>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowUploader(!showUploader)}>
            {showUploader ? '隐藏上传' : '上传截图'}
          </button>
        </div>
      </div>
      {showUploader && !matchResult && (
        <ScreenshotUploader onUpload={handleImageUpload} loading={loading} />
      )}
      {matchResult && (
        <MatchResultCard
          matchData={matchResult}
          onConfirm={handleConfirmMatch}
          onCancel={handleCancelMatch}
        />
      )}
      {latestNews && <NewsReport news={latestNews} />}
      <HostilityMeter hostility={hostility} />
      <PlayerList players={players} onPlayerSelect={handlePlayerSelect} />
      <ForumPostList
        posts={posts}
        onReply={handleReply}
        onSupport={handleSupport}
        onOppose={handleOppose}
      />
      <div className="footer">
        <div>═══════════════════════════════</div>
        <div style={{ marginTop: '10px' }}>失意者联盟 BBS · 2000-2026 · 见证逆袭传奇</div>
      </div>
    </div>
  );
}

export default App;
