import { reactive } from 'vue';
import type { GenerateResult, Minutes, MinutesMeta } from '../types/minutes';

interface MinutesState {
  minutes: Minutes | null;
  meta: MinutesMeta | null;
  loading: boolean;
  error: string;
  dirty: boolean;
}

// 模块级单例：工作台与本地记录页共享同一份“当前纪要”，不引入 Pinia。
const state = reactive<MinutesState>({
  minutes: null,
  meta: null,
  loading: false,
  error: '',
  dirty: false,
});

function setResult(result: GenerateResult): void {
  state.minutes = result.minutes;
  state.meta = result.meta;
  state.error = '';
  state.dirty = false;
}

function setMinutes(minutes: Minutes, meta: MinutesMeta | null = null): void {
  state.minutes = minutes;
  state.meta = meta;
  state.error = '';
  state.dirty = false;
}

function setLoading(value: boolean): void {
  state.loading = value;
}

function setError(message: string): void {
  state.error = message;
}

function markDirty(): void {
  state.dirty = true;
}

function reset(): void {
  state.minutes = null;
  state.meta = null;
  state.error = '';
  state.dirty = false;
}

export function useMinutesStore() {
  return {
    state,
    setResult,
    setMinutes,
    setLoading,
    setError,
    markDirty,
    reset,
  };
}
