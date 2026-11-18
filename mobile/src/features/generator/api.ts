import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Asset, AssetKind, Job } from '../../types/api';

export type UploadTarget = { asset_id: string; upload: { bucket: string; path: string; token: string; expires_in: number } };

export const generatorApi = {
  start: (invitationId: string) => api.post<{ job_id: string; status: 'queued' }>(`/api/invitations/${invitationId}/generate`),
  job: (jobId: string) => api.get<Job>(`/api/jobs/${jobId}`),
  uploadUrl: (invitationId: string, b: { kind: AssetKind; content_type: string; size_bytes: number; position?: number }) =>
    api.post<UploadTarget>(`/api/invitations/${invitationId}/assets/upload-url`, b),
  confirm: (invitationId: string, assetId: string) => api.post<{ asset: Asset }>(`/api/invitations/${invitationId}/assets/${assetId}/confirm`),
  removeAsset: (invitationId: string, assetId: string) => api.delete(`/api/invitations/${invitationId}/assets/${assetId}`),
};

/** Minta URL bertanda tangan → unggah langsung ke Storage (`uploadToSignedUrl`) → konfirmasi ke server. */
export async function uploadAsset(
  invitationId: string,
  file: { kind: AssetKind; contentType: string; sizeBytes: number; position?: number; body: Blob | ArrayBuffer },
): Promise<Asset> {
  const target = await generatorApi.uploadUrl(invitationId, { kind: file.kind, content_type: file.contentType, size_bytes: file.sizeBytes, position: file.position });
  const { bucket, path, token } = target.upload;
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file.body, { contentType: file.contentType });
  if (error) throw error;
  return (await generatorApi.confirm(invitationId, target.asset_id)).asset;
}
