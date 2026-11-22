-- Re-review PR #1 (P1): dua transaksi untuk satu undangan tidak boleh sama-sama 'paid'.
-- Order lama tetap bisa dibayar selama jendela Midtrans 24 jam walau sudah digantikan order baru. Bila undangan sudah punya
-- order 'paid', settlement berikutnya ditandai 'duplicate' (pembayaran ganda, perlu refund manual di Midtrans) dan TIDAK
-- mengubah undangan (tanpa perpanjangan masa aktif). refund_order hanya bekerja pada 'paid', jadi refund pembayaran ganda
-- tidak mencabut Premium yang sah.

alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'expired', 'refunded', 'duplicate'));

create or replace function public.mark_order_paid(
  p_midtrans_order_id text, p_transaction_id text, p_payment_type text,
  p_fraud_status text, p_premium_days int default 365
) returns boolean
language plpgsql security definer set search_path = public as $$
declare v_invitation uuid;
begin
  select invitation_id into v_invitation from public.orders
  where midtrans_order_id = p_midtrans_order_id and status in ('pending', 'expired');
  if not found then return false; end if;

  -- Serialkan settlement untuk undangan yang sama agar dua order tidak lolos bersamaan.
  perform 1 from public.invitations where id = v_invitation for update;

  if exists (select 1 from public.orders
             where invitation_id = v_invitation and status = 'paid' and midtrans_order_id <> p_midtrans_order_id) then
    update public.orders set
      status = 'duplicate', paid_at = now(), transaction_status = 'settlement',
      transaction_id = coalesce(p_transaction_id, transaction_id),
      payment_type   = coalesce(p_payment_type, payment_type),
      fraud_status   = coalesce(p_fraud_status, fraud_status)
    where midtrans_order_id = p_midtrans_order_id and status in ('pending', 'expired');
    return false;
  end if;

  update public.orders set
    status = 'paid', paid_at = now(),
    transaction_status = 'settlement',
    transaction_id = coalesce(p_transaction_id, transaction_id),
    payment_type   = coalesce(p_payment_type, payment_type),
    fraud_status   = coalesce(p_fraud_status, fraud_status)
  where midtrans_order_id = p_midtrans_order_id and status in ('pending', 'expired');
  if not found then return false; end if;

  update public.invitations set
    plan = 'premium',
    expires_at = now() + make_interval(days => p_premium_days)
  where id = v_invitation;

  update public.orders set status = 'expired'
  where invitation_id = v_invitation and status = 'pending' and midtrans_order_id <> p_midtrans_order_id;
  return true;
end $$;
