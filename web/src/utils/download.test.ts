import { describe, expect, it } from 'vitest';
import { buildExportFileName } from './download';

describe('buildExportFileName', () => {
  const date = new Date(2026, 9, 18, 15, 30);

  it('使用标题与时间生成文件名', () => {
    expect(buildExportFileName('产品周会', date)).toBe('产品周会-20261018-1530.docx');
  });

  it('移除文件名中的非法字符', () => {
    expect(buildExportFileName('产品/周会: 讨论', date)).toBe('产品周会 讨论-20261018-1530.docx');
  });

  it('标题为空时回退为会议纪要', () => {
    expect(buildExportFileName('   ', date)).toBe('会议纪要-20261018-1530.docx');
  });
});
