# 音频合成

把每个章节 `narrations.ts` 里的口播文字按 **step 颗粒度**合成 mp3，
落到 `presentation/public/audio/<chapter-id>/<step-N>.mp3`。运行时
Auto 模式会自动按 step 播放并自动推进——录屏可以一镜到底。

> **真相源**：每个章节的 `src/chapters/<NN>-<id>/narrations.ts` 是 step
> 数 + 口播文本的**唯一来源**。`outline.md` 不再参与音频合成，章节代码
> 也不再手写 `totalSteps`。这一改根除了"网页 step 和音频文件数对不上"
> 这个老问题。

默认用 **MiniMax CLI（`mmx-cli`）**。本机没装就**询问用户**用什么 TTS，
不要悄悄假装合成成功。

---

## 文件命名约定

```
presentation/public/audio/
├── coldopen/
│   ├── 1.mp3
│   ├── 2.mp3
│   └── ...
├── hook/
│   └── ...
└── ...
```

- 章节子目录名 = `chapters.ts` 里的 `id`
- 文件名 = `<step-N>.mp3`（**1-indexed**，对齐 narrations 数组的 index + 1）
- 格式默认 mp3。如果 TTS 后端只能出 wav，加一步用 `ffmpeg` 转换

---

## 标准流程

### 1. 抽取 segments

```bash
cd presentation
npm run extract-narrations
```

这会扫所有章节的 `narrations.ts`，按 `chapters.ts` 注册顺序生成
`audio-segments.json`：

```json
[
  { "chapter": "coldopen", "step": 1, "text": "...", "audio": "coldopen/1.mp3" },
  { "chapter": "coldopen", "step": 2, "text": "...", "audio": "coldopen/2.mp3" },
  ...
]
```

让用户**先扫一眼这个 json**，确认文本和切分都对，再开始烧 token 合成。

> 空字符串的 narration 会被自动跳过（不烧 TTS token）——运行时 Auto 模式
> 按字数估时撑过这种"无声过场"step。

### 2. 合成

```bash
which mmx
```

- 找到 → 走 [2.A](#2a-mmx-cli-合成)
- 没找到 → 走 [2.B](#2b-退化路径)

#### 2.A mmx-cli 合成

##### 鉴权检查

```bash
mmx auth status
```

未登录 → 提示用户：

```
你的 mmx-cli 未登录。请运行：
  mmx auth login --api-key sk-xxxxx
（API key 在 https://platform.minimaxi.com 获取）
```

登录前**不要继续**。

##### 调用合成脚本

```bash
npm run synthesize-audio              # 增量：跳过已存在的 mp3
npm run synthesize-audio -- --force   # 全部重合成
npm run synthesize-audio -- --voice=<voice-id>  # 指定音色
```

脚本**串行**调 mmx（避免 rate limit），**自动跳过已存在文件**（断点续合
不烧重复 token）。每条打印进度：

```
[  3/24] coldopen/3.mp3   ✓ 4s
[  4/24] coldopen/4.mp3   skip (exists)
```

##### 校验时长

合成完后跑：

```bash
for f in public/audio/*/*.mp3; do
  d=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$f")
  echo "$f  ${d}s"
done
```

把每条的实际秒数汇总告诉用户。**重点关注 ≥ 15s 的条目**——口播太长意味
着该 step 的 narration 写得过密，或者 step 没拆够。让用户决定**改稿子
重合**还是**回章节代码拆 step**。

#### 2.B 退化路径（mmx-cli 没装）

不要假装能合成。问用户：

```
本机没检测到 mmx-cli。我可以：

  1. 帮你安装 MiniMax CLI（推荐）
     需要：npm 全局安装 + 一个 API key
     运行：npm install -g mmx-cli && mmx auth login --api-key sk-xxxxx
     API key 在 https://platform.minimaxi.com 获取

  2. 用其它 TTS（你来提供）
     告诉我用什么 —— OpenAI TTS / 阿里云 / Azure / ElevenLabs / 其它
     最好附上调用方式（CLI 命令 / API endpoint + 参数）
     我会改 scripts/synthesize-audio.sh 让它调你的工具，
     输出文件路径仍按 audio-segments.json 的 audio 字段写

  3. 暂时跳过
     稿子和 narrations 都在，你自己用任意 TTS 录制即可
```

如果用户选 2，按相同的"读 audio-segments.json → 串行调用 → 落盘 →
校验"流程，把 `mmx speech synthesize` 那一行换成对方的命令即可。

---

## 用户自带 TTS 的最小契约

任何 TTS 后端只要满足三个能力即可接进来：

| 能力 | 输入 | 输出 |
|---|---|---|
| 单段合成 | 一段文字（≤ 5000 字符）+ 音色 id（可选） | 一个 mp3 / wav 文件 |
| 错误反馈 | —— | 失败时明确报错（rate limit / auth / 内容审核 / 网络） |
| 输出可指定路径 | 目标文件路径 | 直接写到该路径 |

不满足"输出可指定路径"的 API（比如返回二进制流）就在外面包一层 curl /
node script 把响应写到目标路径。

---

## 运行时如何使用合成的音频

合成完成后，**不需要任何额外配置**——脚手架的 `App.tsx` 已经接好：

| 模式 | 触发方式 | 行为 |
|---|---|---|
| **Manual**（默认） | 直接打开页面 | 不播音频，点击 / 方向键推进 |
| **Audio**（半自动） | URL `?audio=1` 或按 `M` 键 | 进入 step 自动播音频，但你手动推进（点鼠标） |
| **Auto**（全自动） | URL `?auto=1` 或按两次 `M` 键 | 进入 step 播音频 → 播完自动 next() → 进下个 step → ... |

Auto 模式首次需要按一次 `Space` 启动（绕过浏览器自动播放限制），之后
全自动跑。**录屏时打开屏幕录制 → 按 Space → 整片自动跑完 → stop**。

> **Auto 模式的推进规则就一句话**：每段音频播完 + 200ms 缓冲 → 自动 next。
> **没有"等动画跑完"的兜底**——如果你写的视觉动画比口播长，会被当场切。
> 解决办法：写更长口播 / 拆 step / 调动画速度（详见
> [`CHAPTER-CRAFT.md`](CHAPTER-CRAFT.md) 「代码层最小约束」）。
>
> 音频文件缺失（还没合成 / 404）或 narration 是空串 → 退化到字数估时
> （`max(1500ms, 字数 × 250ms)`），保证预览也能整片跑通。

---

## 故障排查

| 现象 | 原因 / 修法 |
|---|---|
| `chapter id "X" registered but no matching folder found` | 章节文件夹应命名为 `NN-<id>`；id 必须等于 chapters.ts 里注册的 |
| `narrations.ts in X must export an array named "narrations"` | 该章节的 narrations.ts 没 export 名为 narrations 的数组 |
| `mmx: command not found` | `npm install -g mmx-cli`；npm 全局 bin 不在 PATH 时 `npm config get prefix` 看一下 |
| `401 / unauthorized` | `mmx auth login --api-key sk-xxxxx` 重新登录 |
| 中间断了几条没合成 | `npm run synthesize-audio` 重跑 —— 已存在文件会跳过 |
| 中文音色不自然 | mmx 默认音色未必最佳；查 `mmx speech --help` 看 `--voice` 可选项，然后传 `--voice=<id>` |
| 整段合成被截断 | 单段过长（mmx 默认上限约 5000 字符）。在 narrations.ts 里把这条拆成两条（也意味着该 step 应该拆成两个 step） |
| 浏览器没播音频 | Auto / Audio 模式下首次需要用户手势——确认你按了 SPACE 启动 Auto，或者点过页面 |
| 音频 404 但 Auto 模式还能跑 | 找不到 mp3 时 useAudioPlayer 退化到字数估时（4 字/秒），保证预览不中断 |

---

## 相关链接

- mmx-cli 仓库：<https://github.com/MiniMax-AI/cli>
- 官方文档：<https://platform.minimaxi.com/docs/token-plan/minimax-cli>
- 参数 / 音色查询：`mmx speech --help`
