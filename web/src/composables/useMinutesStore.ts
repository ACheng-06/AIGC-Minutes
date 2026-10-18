import { reactive } from 'vue';
import type {
  GenerateResult,
  LocalMinutesRecord,
  Minutes,
  MinutesMeta,
  SourceSnapshot,
} from '../types/minutes';

interface MinutesState {
  minutes: Minutes | null;
  meta: MinutesMeta | null;
  source: SourceSnapshot | null;
  loading: boolean;
  error: string;
  dirty: boolean;
  recordId: string | null;
}

// 模块级单例：工作台与本地记录页共享同一份“当前纪要”，不引入 Pinia。
const state = reactive<MinutesState>({
  minutes: null,
  meta: null,
  source: null,
  loading: false,
  error: '',
  dirty: false,
  recordId: null,
});

function setResult(result: GenerateResult): void {
  state.minutes = result.minutes;
  state.meta = result.meta;
  state.source = null;
  state.error = '';
  state.dirty = false;
  state.recordId = null;
}

function setMinutes(minutes: Minutes, meta: MinutesMeta | null = null): void {
  state.minutes = minutes;
  state.meta = meta;
  state.source = null;
  state.error = '';
  state.dirty = false;
}

/** 从本地记录载入时复制一份，避免编辑历史列表里的原始对象。 */
function setLoadedRecord(record: LocalMinutesRecord): void {
  state.minutes = JSON.parse(JSON.stringify(record.minutes)) as Minutes;
  state.meta = null;
  state.source = null;
  state.error = '';
  state.dirty = false;
  state.recordId = record.id;
}

function setSource(source: SourceSnapshot): void {
  state.source = source;
}

function clearSource(): void {
  state.source = null;
}

function setRecordId(id: string | null): void {
  state.recordId = id;
}

function markSaved(): void {
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
  state.source = null;
  state.error = '';
  state.dirty = false;
  state.recordId = null;
}

export function useMinutesStore() {
  return {
    state,
    setResult,
    setMinutes,
    setLoadedRecord,
    setSource,
    clearSource,
    setRecordId,
    markSaved,
    setLoading,
    setError,
    markDirty,
    reset,
  };
}
