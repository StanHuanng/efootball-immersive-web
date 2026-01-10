const DOUBAO_BASE_URL = import.meta.env.VITE_DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const DOUBAO_API_KEY = import.meta.env.VITE_DOUBAO_API_KEY;
const DOUBAO_MODEL = import.meta.env.VITE_DOUBAO_MODEL || 'doubao-seed-1-8-251228';

export async function recognizeScreenshot(imageBase64) {
  if (!DOUBAO_API_KEY || DOUBAO_API_KEY === 'your_api_key_here') {
    console.warn('Using mock data');
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
          content: [{
            type: 'image_url',
            image_url: { url: imageBase64 }
          }, {
            type: 'text',
            text: 'Please identify eFootball match data and output JSON format'
          }]
        }]
      })
    });
    const data = await response.json();
    return parseVisionResponse(data);
  } catch (error) {
    console.error('Vision API error:', error);
    return getMockVisionResult();
  }
}

export async function generateComment(context) {
  if (!DOUBAO_API_KEY || DOUBAO_API_KEY === 'your_api_key_here') {
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
          content: 'You are a football forum user. Generate comments based on hostility level.'
        }, {
          role: 'user',
          content: `Player: ${player.name}, Rating: ${matchData.rating}, Hostility: ${hostility}`
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
  if (!DOUBAO_API_KEY || DOUBAO_API_KEY === 'your_api_key_here') {
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
          content: 'You are a sports journalist. Generate match reports.'
        }, {
          role: 'user',
          content: `Generate news for result: ${result}, possession: ${matchData.possession}%`
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

function getMockVisionResult() {
  const results = [
    { result: 'win', possession: 58, players: [{ name: '格列兹曼', position: 'CF', rating: 8.5 }, { name: '库蒂尼奥', position: 'CAM', rating: 7.8 }] },
    { result: 'loss', possession: 42, players: [{ name: '格列兹曼', position: 'CF', rating: 5.8 }, { name: '桑乔', position: 'RW', rating: 6.2 }] },
    { result: 'draw', possession: 51, players: [{ name: '库蒂尼奥', position: 'CAM', rating: 7.0 }, { name: '桑乔', position: 'RW', rating: 7.2 }] }
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
