-- Review PR #1 (P1 + P2): pembayaran terlambat tidak boleh hilang, refund/chargeback mencabut Premium.

-- 1) mark_order_paid menerima order 'pending' maupun 'expired'.
--    create_order menandai order lama 'expired' setelah 23 jam padahal transaksi Midtrans berlaku 24 jam;
--    settlement yang tiba terlambat (signature dan nominal sudah divalidasi aplikasi) harus tetap mengaktifkan Premium.
--    Order pending lain untuk undangan yang sama ditutup agar indeks satu-pending tetap konsisten.
create or replace function public.mark_order_paid(
  p_midtrans_order_id text, p_transaction_id text, p_payment_type text,
  p_fraud_status text, p_premium_days int default 365
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_invitation uuid;
begin
  update public.orders set
    status = 'paid', paid_at = now(),
    transaction_status = 'settlement',
    transaction_id = coalesce(p_transaction_id, transaction_id),
    payment_type   = coalesce(p_payment_type, payment_type),
    fraud_status   = coalesce(p_fraud_status, fraud_status)
  where midtrans_order_id = p_midtrans_order_id and status in ('pending', 'expired')
  returning invitation_id into v_invitation;
  if not found then return false; end if;

  update public.invitations set
    plan = 'premium',
    expires_at = now() + make_interval(days => p_premium_days)
  where id = v_invitation;

  update public.orders set status = 'expired'
  where invitation_id = v_invitation and status = 'pending' and midtrans_order_id <> p_midtrans_order_id;
  return true;
end $$;

-- 2) refund / chargeback penuh: order -> 'refunded' dan undangan kembali ke Gratis, atomik.
--    Masa aktif dibatasi ke masa aktif paket Gratis (dihitung dari sekarang). partial_refund tidak memanggil fungsi ini.
create or replace function public.refund_order(
  p_midtrans_order_id text, p_transaction_status text, p_free_days int default 30
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_invitation uuid;
begin
  update public.orders set status = 'refunded', transaction_status = p_transaction_status
  where midtrans_order_id = p_midtrans_order_id and status = 'paid'
  returning invitation_id into v_invitation;
  if not found then return false; end if;

  update public.invitations set
    plan = 'free',
    expires_at = least(expires_at, now() + make_interval(days => p_free_days))
  where id = v_invitation and plan = 'premium';
  return true;
end $$;

revoke all on function public.refund_order(text, text, int) from public, anon, authenticated;
grant execute on function public.refund_order(text, text, int) to service_role;
