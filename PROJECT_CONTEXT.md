# 失意者联盟 (Misfit Alliance BBS) - 全量开发上下文

## 1. 项目愿景 (Project Vision)

本网站是一个 eFootball 模拟叙事站，旨在为玩家提供极强的“黑马逆袭”带入感。

- **背景设定**：玩家扮演一名不被看好的教练，执教一群现实中陷入低谷、被贴上负面标签的球员（失意者联盟）。
- **核心叙事**：通过玩家在 eFootball 中真实的比赛截图，驱动 AI 生成带有偏见的“复古 BBS 论坛”评论。
- **救赎曲线**：随着球员表现提升，网民评价从“全网黑”逐渐演变为“分裂对线”，最终实现“全网粉”的救赎史诗。

## 2. 视觉与交互规范 (UI/UX)

- **风格**：2000 年代初中文足球 BBS（如老版网易体育论坛、天涯）。
- **视觉元素**：深色背景 (#111)、1px 细边框、点阵字体效果、密集的文字信息流。
- **核心交互**：
  - **上传截图**：调用豆包 Vision API 识别球员与数据。
  - **舆论互动**：点击“点踩/回击”可触发玩家与键盘侠的对线，影响后续叙事。

## 3. 核心算法逻辑 (Core Algorithms)

### 3.1 球员救赎算法 (Redemption State)

- **状态转移**：`Fallen` (0-20) -> `Waking` (21-80) -> `Redeemed` (81-100)。
- **得分逻辑**：
  - **单场高分**：Rating > 7.5 (+15 分)；Rating < 5.0 (−5 分)。
  - **趋势奖金**：连续 3 场评分上升趋势，救赎值额外 +10。
  - **信任加成**：若教练在评论区“维护”该球员，下场比赛救赎加成系数为 1.5。

### 3.2 动态舆论模型 (Social Sentiment)

- **敌对度 (Hostility)**：0.0 - 1.0。
- **逻辑**：
  - 连败或低谷：Hostility 飙升，触发“攻击性爆发”，评论充斥现代足球梗（牢X、依托构思、什么顶级理解）。
  - 触底反击：Hostility 下降，评论区出现“死硬黑粉”与“新晋理智粉”的激烈对线。

## 4. 豆包 API 技术规格 (Technical Specs)

### 4.1 认证与端点

- **Base URL**: `https://ark.cn-beijing.volces.com/api/v3/responses`
- **Model**: `doubao-seed-1-8-251228` (或指定的推理接入点 ID)
- **Header**: `Authorization: Bearer <YOUR_API_KEY>`

### 4.2 视觉识别 (Vision) 请求格式

```
{
  "model": "doubao-seed-1-8-251228",
  "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_image",
          "image_url": "BASE64_OR_URL"
        },
        {
          "type": "input_text",
          "text": "请识别图中 eFootball 球员的姓名、位置、评分及球队控球率数据，并以 JSON 格式输出。"
        }
      ]
    }
  ]
}
```

### 4.3 文本叙事 (Chat) 请求格式

- **System Prompt**: "你是一个 2000 年代足球论坛的资深键盘侠，说话刻薄，精通现代足球梗（牢X、神仙球反讽、顶级理解）。你需要根据比赛数据生成带有偏见、分裂感强烈的回帖。"

## 5. 开发路线图 (Roadmap)

1. **Phase 1**: 搭建复古 BBS UI 及 LocalStorage 持久化逻辑。
2. **Phase 2**: 集成豆包 Vision 服务，实现截图自动解析。
3. **Phase 3**: 编写 NarrativeEngine 逻辑，实现“数值驱动”的毒舌评论。
4. **Phase 4**: 实现“点踩回击”交互对球员状态的反馈闭环。

## 6. 数据字典 (Schema)

- **Player**: `{ id, name, nickname, backstory, redemptionScore, history: [] }`
- **ForumPost**: `{ id, author, content, intensity: 'toxic'|'hype', replies: [] }`