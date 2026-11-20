// Tipe tulisan tangan mengikuti docs/06-api-spec.md §2. Setelah backend F1 jalan, `npm run gen:api`
// menghasilkan lib/api-schema.d.ts dari /openapi.json; ganti tipe di sini dengan itu bila sudah cocok.
export type Religion = 'islam' | 'kristen' | 'katolik' | 'hindu' | 'buddha' | 'konghucu' | 'lainnya';
export type Party = { name: string; father?: string; mother?: string };
export type InvitationData = {
  groom: Party; bride: Party; religion?: Religion; event_date: string; timezone?: 'WIB' | 'WITA' | 'WIT';
  ceremony: { label?: string; time?: string; location: string };
  reception?: { time?: string; location: string };
  notes?: string; color_theme?: string;
  gifts?: { bank: string; account_number: string; account_name: string }[];
};
export type InvitationStatus = 'draft' | 'generating' | 'published' | 'expired';
export type Plan = 'free' | 'premium';
export type Quota = { generations_used: number; generations_limit: number; guests_limit: number | null };
export type AssetKind = 'cover' | 'groom' | 'bride' | 'gallery' | 'music';
export type Asset = { id: string; kind: AssetKind; url: string; content_type: string; size_bytes: number; position: number };
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export type Job = {
  id: string; invitation_id: string; status: JobStatus; stage: string; progress: number; attempt: number;
  error: { code: string; message: string } | null; result_version_id: string | null; created_at: string; finished_at: string | null;
};
export type Invitation = {
  id: string; slug: string; title: string; status: InvitationStatus; plan: Plan; preset_id: string; data: Partial<InvitationData>;
  public_url: string | null; published_at: string | null; expires_at: string | null; is_expired: boolean; quota: Quota;
  has_previous_version: boolean; current_version: { id: string; version_no: number; created_at: string; warnings: string[] } | null;
  assets: Asset[]; active_job: { id: string; status: JobStatus; stage: string } | null; created_at: string; updated_at: string;
};
export type InvitationSummary = Pick<Invitation, 'id' | 'slug' | 'title' | 'status' | 'plan' | 'public_url' | 'expires_at' | 'is_expired' | 'quota'> & {
  event_date: string | null; cover_url: string | null; rsvp_count: number; guest_count: number;
};
export type Guest = { id: string; name: string; phone: string | null; link: string; rsvp: 'hadir' | 'tidak_hadir' | null; created_at: string };
export type RsvpItem = { id: string; guest_id: string | null; name: string; attendance: 'hadir' | 'tidak_hadir'; message: string | null; is_hidden: boolean; created_at: string };
export type RsvpStats = { guests_total: number; responded: number; attending: number; not_attending: number; no_response: number };
export type Preset = { id: string; name: string; description: string; preview_url: string | null; premium_only: boolean };
export type Me = { id: string; email: string; full_name: string | null; avatar_url: string | null; invitations_count: number };
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
export type CreateOrderResponse = { order_id: string; midtrans_order_id: string; amount: number; status: OrderStatus; redirect_url: string; snap_token: string };
export type Order = { order_id: string; invitation_id: string; status: OrderStatus; amount: number; paid_at: string | null; invitation_plan: Plan };
export type ChatTurn = { role: 'user' | 'bot'; content: string };
