import type { Minutes } from '../types/minutes';

/**
 * 把纪要转成适合复制到聊天工具 / 文档的纯文本。
 * 未填写的负责人与日期统一显示“未明确”，与界面保持一致。
 */
export function formatMinutesText(minutes: Minutes): string {
  const title = minutes.title.trim() || '会议纪要';
  const lines: string[] = [`【${title}】`, '', '## 会议摘要', minutes.summary.trim() || '（未填写）', '', '## 关键决策'];

  if (minutes.decisions.length === 0) {
    lines.push('（无）');
  } else {
    minutes.decisions.forEach((decision, index) => {
      lines.push(`${index + 1}. ${decision}`);
    });
  }

  lines.push('', '## 待办事项');

  if (minutes.todos.length === 0) {
    lines.push('（无）');
  } else {
    minutes.todos.forEach((todo) => {
      lines.push(
        `- [ ] ${todo.task} | 负责人：${todo.owner || '未明确'} | 截止：${todo.dueDate || '未明确'}`,
      );
    });
  }

  return lines.join('\n');
}
