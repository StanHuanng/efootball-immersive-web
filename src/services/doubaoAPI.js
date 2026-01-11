const DOUBAO_BASE_URL = import.meta.env.VITE_DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_KEY = import.meta.env.VITE_DOUBAO_API_KEY;
const DOUBAO_MODEL = import.meta.env.VITE_DOUBAO_MODEL || 'doubao-seed-1-8-251228';

function hasApiKey() {
  return !!(DOUBAO_API_KEY && DOUBAO_API_KEY !== 'your_api_key_here');
}

function buildImageMessages(imagesBase64) {
  return imagesBase64.map(img => ({ type: 'image_url', image_url: { url: img } }));
}

export async function recognizeScreenshot(imageBase64) {
  return recognizeMatchScreenshots([imageBase64]);
}

export async function generateComment(context) {
  if (!hasApiKey()) {
    return getMockComment(context);
  }
  const { player, matchData, hostility } = context;
  try {
    const response = await fetch(`${DOUBAO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [{
          role: 'system',
          content: '你现在是一个混合身份：一半是毒舌足球解说，一半是资深论坛键盘侠。根据传入的球员评分与敌对度，生成带有现代梗（牢X、依托构思、神仙球反讽、顶级理解）且偏见强烈的分裂评论，用中文输出，1-2 句话即可。'
        }, {
          role: 'user',
          content: `球员: ${player.name}(${player.nickname})
评分: ${matchData.rating}
敌对度: ${hostility}
救赎状态: ${player.getRedemptionState?.() || 'Fallen'}
剧情背景: ${player.backstory || '失意者'}
请生成一条论坛回帖风格短评，包含现代足球网络梗。`
        }]
      })
    });
    const data = await response.json();
    return parseChatResponse(data);
  } catch (error) {
    console.error('Chat API error:', error);
    return getMockComment(context);
  }
}

export async function generateNewsReport(context) {
  if (!hasApiKey()) {
    return getMockNewsReport(context);
  }
  try {
    const { matchData, players, result } = context;
    const response = await fetch(`${DOUBAO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [{
          role: 'system',
          content: '你是《踢球者》风格的体育记者，需用中文撰写赛后简报，并附上亮点 bullet 列表（3-5 条）。语气专业但带一点戏谑。'
        }, {
          role: 'user',
          content: `比分结果: ${result}
控球率: ${matchData.possession}%
关键球员: ${players.map(p => `${p.name}${p.rating ? `(${p.rating})` : ''}`).join(', ')}
请生成一个 JSON，包含 title(20 字内)、content(80-120 字)、highlights(数组)。`
        }]
      })
    });
    const data = await response.json();
    return parseNewsResponse(data);
  } catch (error) {
    console.error('News API error:', error);
    return getMockNewsReport(context);
  }
}

export async function generateBackstories(players) {
  if (!hasApiKey()) {
    return getMockBackstories(players);
  }
  try {
    const response = await fetch(`${DOUBAO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [{
          role: 'system',
          content: '为每位球员生成失意者背景和外号，外号 2-5 字，背景 1 句话，偏毒舌，JSON 数组输出。'
        }, {
          role: 'user',
          content: `球员列表: ${players.map(p => `${p.name}(${p.position || '未知'})`).join(', ')}`
        }]
      })
    });
    const data = await response.json();
    return parseBackstoryResponse(data, players);
  } catch (error) {
    console.error('Backstory API error:', error);
    return getMockBackstories(players);
  }
}

export async function recognizeLineup(imageBase64) {
  if (!hasApiKey()) {
    return getMockFormationResult();
  }
  try {
    const response = await fetch(`${DOUBAO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [{
          role: 'user',
          content: [{
            type: 'image_url',
            image_url: { url: imageBase64 }
          }, {
            type: 'text',
            text: '识别这张 eFootball 阵容/计划截图，输出 JSON：{teamName, players:[{name, position, rating}]}'
          }]
        }]
      })
    });
    const data = await response.json();
    return parseFormationResponse(data);
  } catch (error) {
    console.error('Lineup vision error:', error);
    return getMockFormationResult();
  }
}

export async function recognizeMatchScreenshots(imagesBase64, knownPlayers = []) {
  if (!hasApiKey()) {
    return getMockVisionResult();
  }
  try {
    const response = await fetch(`${DOUBAO_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DOUBAO_API_KEY}`
      },
      body: JSON.stringify({
        model: DOUBAO_MODEL,
        messages: [{
          role: 'user',
          content: [
            ...buildImageMessages(imagesBase64),
            {
              type: 'text',
              text: `识别这些 eFootball 赛后统计截图。请对比球员名单: ${knownPlayers.map(p => p.name).join(', ')}, 输出 JSON {result:'win|draw|loss', score:'2-1', possession: number, players:[{name, position, rating}]}`
            }
          ]
        }]
      })
    });
    const data = await response.json();
    return parseVisionResponse(data);
  } catch (error) {
    console.error('Match vision error:', error);
    return getMockVisionResult();
  }
}

function parseVisionResponse(data) {
  try {
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return getMockVisionResult();
  } catch (error) {
    return getMockVisionResult();
  }
}

function parseChatResponse(data) {
  return data.choices?.[0]?.message?.content || '';
}

function parseNewsResponse(data) {
  try {
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return { ...parsed, timestamp: Date.now() };
    }
    return getMockNewsReport({});
  } catch (error) {
    return getMockNewsReport({});
  }
}

function parseFormationResponse(data) {
  try {
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr);
    }
    return getMockFormationResult();
  } catch (error) {
    return getMockFormationResult();
  }
}

function parseBackstoryResponse(data, players) {
  try {
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      return parsed.map((item, idx) => ({
        ...players[idx],
        nickname: item.nickname || players[idx]?.nickname || '失意者',
        backstory: item.backstory || players[idx]?.backstory || '曾经天才，如今沉沦',
        redemptionScore: item.redemptionScore || 50
      }));
    }
    return getMockBackstories(players);
  } catch (error) {
    return getMockBackstories(players);
  }
}

function getMockVisionResult() {
  const results = [
    { result: 'win', score: '3-1', possession: 58, players: [{ name: '格列兹曼', position: 'CF', rating: 8.5 }, { name: '库蒂尼奥', position: 'CAM', rating: 7.8 }] },
    { result: 'loss', score: '0-2', possession: 42, players: [{ name: '格列兹曼', position: 'CF', rating: 5.8 }, { name: '桑乔', position: 'RW', rating: 6.2 }] },
    { result: 'draw', score: '2-2', possession: 51, players: [{ name: '库蒂尼奥', position: 'CAM', rating: 7.0 }, { name: '桑乔', position: 'RW', rating: 7.2 }] }
  ];
  return results[Math.floor(Math.random() * results.length)];
}

function getMockComment(context) {
  const { player, matchData } = context;
  return `${player.name}这场${matchData.rating}分？依托构思的表现，${player.nickname}名不虚传。`;
}

function getMockNewsReport(context) {
  const { result } = context;
  const templates = {
    win: { title: '逆风翻盘！失意者联盟终获胜利', content: '在今天的比赛中，失意者联盟展现出了不屈的斗志。', highlights: ['全队士气高涨', '多名球员评分超过7.5分', '控球优势明显'] },
    draw: { title: '艰难守住平局，失意者略有起色', content: '面对强敌，失意者联盟顽强地守住了平局。', highlights: ['防守端表现稳固', '球员状态逐渐回升', '控球数据有所改善'] },
    loss: { title: '再遭败绩，失意者仍在低谷挣扎', content: '失意者联盟今日再次品尝败果。', highlights: ['控球率不足，场面被动', '多名球员评分低于及格线', '网络舆论持续恶化'] }
  };
  const template = templates[result] || templates.loss;
  return { ...template, timestamp: Date.now() };
}

function getMockBackstories(players) {
  const pool = [
    { nickname: '更衣室炸弹', backstory: '曾被寄予厚望，如今只能在替补席数冷板凳。', redemptionScore: 45 },
    { nickname: '玻璃人', backstory: '少年成名，却因伤病错过巅峰，求一个重启按钮。', redemptionScore: 50 },
    { nickname: '数据幻术师', backstory: '纸面数据惊艳，场上隐身，球迷口中的依托构思代表。', redemptionScore: 55 }
  ];
  return players.map((p, idx) => ({
    ...p,
    ...pool[idx % pool.length]
  }));
}

function getMockFormationResult() {
  return {
    teamName: '失意者联盟',
    players: [
      { name: '格列兹曼', position: 'CF', rating: 82 },
      { name: '库蒂尼奥', position: 'CAM', rating: 80 },
      { name: '桑乔', position: 'RW', rating: 78 },
      { name: '马奎尔', position: 'CB', rating: 79 }
    ]
  };
}
