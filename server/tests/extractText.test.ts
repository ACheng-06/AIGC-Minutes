import { describe, expect, it } from 'vitest';
import { Document, Packer, Paragraph } from 'docx';
import { extractTextFromFile, prepareMeetingText } from '../src/services/extractText';
import type { UploadedFileInfo } from '../src/services/extractText';

/** 在测试里现场生成一个最小 DOCX，避免提交二进制夹具。 */
async function createDocxBuffer(text: string): Promise<Buffer> {
  const document = new Document({
    sections: [{ children: [new Paragraph(text)] }],
  });
  return Packer.toBuffer(document);
}

function makeFile(name: string, buffer: Buffer): UploadedFileInfo {
  return {
    originalname: name,
    buffer,
    size: buffer.length,
    mimetype: 'application/octet-stream',
  };
}

describe('extractText', () => {
  it('读取 UTF-8 文本并压缩多余空行', async () => {
    const buffer = Buffer.from('  第一行\r\n\r\n\r\n第二行  ', 'utf8');
    const result = await extractTextFromFile(makeFile('meeting.txt', buffer));

    expect(result.text).toBe('第一行\n\n第二行');
    expect(result.charCount).toBe(result.text.length);
  });

  it('UTF-8 解码失败时回退 GBK', async () => {
    // “会议”的 GBK 编码，不是合法 UTF-8 序列。
    const gbkBuffer = Buffer.from([0xbb, 0xe1, 0xd2, 0xe9]);
    const result = await extractTextFromFile(makeFile('gbk.txt', gbkBuffer));

    expect(result.text).toBe('会议');
  });

  it('使用 mammoth 提取 DOCX 正文', async () => {
    const buffer = await createDocxBuffer('会议讨论了上线计划');
    const result = await extractTextFromFile(makeFile('meeting.docx', buffer));

    expect(result.text).toContain('会议讨论了上线计划');
  });

  it('拒绝扩展名为 docx 但不是 ZIP 的文件', async () => {
    const promise = extractTextFromFile(makeFile('fake.docx', Buffer.from('not a zip')));

    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE', status: 415 });
  });

  it('拒绝不支持的扩展名', async () => {
    const promise = extractTextFromFile(makeFile('meeting.pdf', Buffer.from('pdf')));

    await expect(promise).rejects.toMatchObject({ code: 'UNSUPPORTED_FILE_TYPE', status: 415 });
  });

  it('空白文本抛出 EMPTY_CONTENT', () => {
    expect(() => prepareMeetingText('   \n\n\t  ')).toThrowError(/未提取到有效文本/);
  });

  it('超长文本抛出 CONTENT_TOO_LONG', () => {
    const longText = '字'.repeat(30001);

    expect(() => prepareMeetingText(longText)).toThrowError(/字符上限/);
  });
});
