import { useQuery } from '@tanstack/react-query';
import { presetsApi } from './api';

export const usePresets = () => useQuery({ queryKey: ['presets'], queryFn: presetsApi.list, staleTime: 10 * 60_000 });
