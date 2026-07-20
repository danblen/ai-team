export interface Example {
  icon: string;
  title: string;
  prompt: string;
}

/** Starter prompts shown on the empty state to help users get going fast. */
export const EXAMPLES: Example[] = [
  {
    icon: '✅',
    title: '待办清单',
    prompt:
      '做一个精致的待办清单应用：可以添加、完成、删除任务，支持按“全部/进行中/已完成”筛选，数据用 localStorage 持久化，界面用现代深色主题。',
  },
  {
    icon: '🌦️',
    title: '天气卡片',
    prompt:
      '做一个漂亮的天气仪表盘卡片（数据用假数据即可）：显示当前温度、天气图标、未来 5 天预报和湿度/风速等指标，带毛玻璃效果和渐变背景。',
  },
  {
    icon: '🧮',
    title: '计算器',
    prompt: '做一个 iOS 风格的计算器，支持加减乘除、百分比、正负号和清除，按键有点击动画。',
  },
  {
    icon: '🎯',
    title: '番茄钟',
    prompt:
      '做一个番茄工作法计时器：25 分钟专注 + 5 分钟休息，带开始/暂停/重置，圆环进度动画，结束时有提示。',
  },
  {
    icon: '🎨',
    title: '落地页',
    prompt:
      '为一个虚构的 AI 笔记产品做一个营销落地页：包含醒目的 Hero 区、功能亮点、价格表和页脚，风格现代、有动画。',
  },
  {
    icon: '🐍',
    title: '贪吃蛇小游戏',
    prompt: '用 canvas 做一个可玩的贪吃蛇游戏：方向键控制，吃到食物变长并计分，撞墙或撞到自己结束游戏。',
  },
];
