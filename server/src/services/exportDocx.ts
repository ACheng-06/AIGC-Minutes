import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { AppError } from '../lib/errors';
import type { Minutes, TodoItem } from '../schemas/minutes';

export const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// Word 对部分控制字符敏感，写入前统一剔除。
const CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

function cleanText(value: string): string {
  return value.replace(CONTROL_CHARACTERS, '').trim();
}

function createTodoTable(todos: TodoItem[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: ['任务', '负责人', '截止时间'].map(
      (text) =>
        new TableCell({
          shading: { fill: 'F2F2F2' },
          children: [new Paragraph({ children: [new TextRun({ text, bold: true })] })],
        }),
    ),
  });

  const bodyRows =
    todos.length > 0
      ? todos.map(
          (todo) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(cleanText(todo.task))] }),
                new TableCell({ children: [new Paragraph(cleanText(todo.owner) || '未明确')] }),
                new TableCell({ children: [new Paragraph(cleanText(todo.dueDate) || '未明确')] }),
              ],
            }),
        )
      : [
          new TableRow({
            children: [
              new TableCell({
                columnSpan: 3,
                children: [new Paragraph('暂无待办事项。')],
              }),
            ],
          }),
        ];

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows],
  });
}

/** 生成中文文件名，前端与后端都可复用。 */
export function buildMinutesFileName(date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  return `会议纪要-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}.docx`;
}

/**
 * 把编辑后的纪要转换成 Word 文档。
 * 结构固定为：标题 → 摘要 → 关键决策 → 待办表格 → 免责声明，避免前端各自拼版式。
 */
export async function buildMinutesDocx(minutes: Minutes): Promise<Buffer> {
  try {
    const generatedAt = new Date().toLocaleString('zh-CN', { hour12: false });
    const summaryParagraphs = minutes.summary
      .split(/\n+/)
      .map((line) => cleanText(line))
      .filter(Boolean)
      .map((line) => new Paragraph({ text: line, spacing: { after: 120 } }));

    const decisionParagraphs =
      minutes.decisions.length > 0
        ? minutes.decisions.map(
            (decision, index) =>
              new Paragraph({
                text: `${index + 1}. ${cleanText(decision)}`,
                spacing: { after: 80 },
              }),
          )
        : [new Paragraph('本次会议未记录明确决策。')];

    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: cleanText(minutes.title),
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 240 },
              children: [
                new TextRun({
                  text: `生成时间：${generatedAt}`,
                  italics: true,
                  size: 18,
                  color: '666666',
                }),
              ],
            }),
            new Paragraph({ text: '会议摘要', heading: HeadingLevel.HEADING_2 }),
            ...summaryParagraphs,
            new Paragraph({ text: '关键决策', heading: HeadingLevel.HEADING_2 }),
            ...decisionParagraphs,
            new Paragraph({ text: '待办事项', heading: HeadingLevel.HEADING_2 }),
            createTodoTable(minutes.todos),
            new Paragraph({
              spacing: { before: 240 },
              children: [
                new TextRun({
                  text: '本纪要由 AI 辅助生成，请人工核对。',
                  italics: true,
                  size: 18,
                  color: '999999',
                }),
              ],
            }),
          ],
        },
      ],
    });

    return await Packer.toBuffer(document);
  } catch {
    throw new AppError('EXPORT_ERROR', 500, 'Word 文档生成失败，请稍后重试');
  }
}
