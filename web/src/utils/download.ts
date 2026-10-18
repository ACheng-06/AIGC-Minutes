const INVALID_FILE_NAME_CHARACTERS = /[\\/:*?"<>|]/g;

/** 用纪要标题生成安全的下载文件名；路径分隔符等字符会被移除。 */
export function buildExportFileName(title: string, date = new Date()): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const datePart = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}${pad(date.getMinutes())}`;
  const safeTitle = title.replace(INVALID_FILE_NAME_CHARACTERS, '').trim() || '会议纪要';

  return `${safeTitle}-${datePart}-${timePart}.docx`;
}

/** 触发浏览器下载 Blob，并释放临时对象 URL。 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
