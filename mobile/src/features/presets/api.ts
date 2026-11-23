import { api } from '../../lib/api';
import type { Preset } from '../../types/api';

export const presetsApi = { list: () => api.get<{ items: Preset[] }>('/api/presets', undefined, false) };
