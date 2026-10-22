import { http } from './http';
import type { GenerateResult, HealthInfo, Minutes } from '../types/minutes';

interface DataResponse<T> {
  data: T;
}

export async function generateByText(
  text: string,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const response = await http.post<DataResponse<GenerateResult>>(
    '/minutes/generate',
    { text },
    { signal },
  );
  return response.data.data;
}

export async function generateByFile(
  file: File,
  signal?: AbortSignal,
): Promise<GenerateResult> {
  const formData = new FormData();
  formData.append('file', file);
  // 不手动设置 Content-Type，让浏览器自动带上 multipart boundary。
  const response = await http.post<DataResponse<GenerateResult>>('/minutes/generate', formData, {
    signal,
  });
  return response.data.data;
}

export async function exportMinutes(minutes: Minutes): Promise<Blob> {
  const response = await http.post('/minutes/export', { minutes }, { responseType: 'blob' });
  return response.data as Blob;
}

export async function fetchHealth(): Promise<HealthInfo> {
  const response = await http.get<DataResponse<HealthInfo>>('/health');
  return response.data.data;
}
