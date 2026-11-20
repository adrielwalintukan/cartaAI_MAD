/* Runtime slot CartaAI (07 §5.3). Disuntik server saat penyajian. Tanpa localStorage/cookie; teks dinamis via textContent. */
(function () {
  var C = window.__CARTA__ || {};
  var q = new URLSearchParams(location.search);
  var to = (q.get("to") || "").trim().slice(0, 100);
  function all(n) { return Array.prototype.slice.call(document.querySelectorAll('[data-carta="' + n + '"]')); }
  function el(tag, text, attrs) {
    var e = document.createElement(tag);
    if (text != null) e.textContent = text;
    for (var k in (attrs || {})) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function box(slot) { clear(slot); var b = el("div"); b.className = "carta-box"; slot.appendChild(b); return b; }

  // guest-name
  if (to) all("guest-name").forEach(function (n) { n.textContent = to; });

  // countdown
  all("countdown").forEach(function (slot) {
    var b = box(slot);
    if (!C.eventAt) return;
    var target = new Date(C.eventAt).getTime();
    var row = el("div"); row.className = "carta-cd"; b.appendChild(row);
    var msg = el("p"); b.appendChild(msg);
    var cells = {};
    [["d", "Hari"], ["h", "Jam"], ["m", "Menit"], ["s", "Detik"]].forEach(function (u) {
      var c = el("div"), v = el("b", "0"), l = el("span", u[1]);
      c.appendChild(v); c.appendChild(l); row.appendChild(c); cells[u[0]] = v;
    });
    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        row.style.display = "none";
        msg.textContent = Date.now() - target < 864e5 ? "Acara sedang berlangsung" : "Acara telah berlangsung";
        return;
      }
      var s = Math.floor(diff / 1000);
      cells.d.textContent = Math.floor(s / 86400); cells.h.textContent = Math.floor(s % 86400 / 3600);
      cells.m.textContent = Math.floor(s % 3600 / 60); cells.s.textContent = s % 60;
    }
    tick(); setInterval(tick, 1000);
  });

  // rsvp + ucapan
  all("rsvp").forEach(function (slot) {
    var b = box(slot);
    var base = C.api + "/api/public/invitations/" + encodeURIComponent(C.slug) + "/rsvps";
    var name = el("input", null, { type: "text", placeholder: "Nama", maxlength: "100", "aria-label": "Nama" });
    if (to) { name.value = to; name.readOnly = true; }
    var att = el("select", null, { "aria-label": "Kehadiran" });
    att.appendChild(el("option", "Hadir", { value: "hadir" }));
    att.appendChild(el("option", "Tidak hadir", { value: "tidak_hadir" }));
    var msg = el("textarea", null, { rows: "3", maxlength: "500", placeholder: "Ucapan & doa", "aria-label": "Ucapan" });
    var btn = el("button", "Kirim", { type: "button" });
    var status = el("p"); var list = el("div");
    [name, att, msg, btn, status, list].forEach(function (n) { b.appendChild(n); });
    function load() {
      fetch(base + "?limit=20").then(function (r) { return r.json(); }).then(function (d) {
        clear(list);
        (d.items || []).forEach(function (it) {
          var w = el("div"); w.className = "carta-wish";
          w.appendChild(el("strong", it.name)); w.appendChild(el("p", it.message));
          list.appendChild(w);
        });
      }).catch(function () {});
    }
    btn.addEventListener("click", function () {
      if (!name.value.trim()) { status.textContent = "Nama wajib diisi."; return; }
      btn.disabled = true; status.textContent = "Mengirim...";
      fetch(base, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.value, attendance: att.value, message: msg.value || null })
      }).then(function (r) {
        status.textContent = r.ok ? "Terima kasih, konfirmasi terkirim." : "Gagal mengirim, coba lagi.";
        if (r.ok) { msg.value = ""; load(); }
      }).catch(function () { status.textContent = "Gagal mengirim, coba lagi."; })
        .then(function () { btn.disabled = false; });
    });
    load();
  });

  // music
  var audio = null;
  function startMusic() { if (audio) audio.play().catch(function () {}); }
  all("music").forEach(function (slot) {
    clear(slot);
    if (!C.musicUrl) return;
    audio = el("audio", null, { src: C.musicUrl, loop: "" });
    var btn = el("button", "♪", { type: "button", "aria-label": "Putar atau jeda musik" });
    btn.className = "carta-box";
    btn.style.cssText = "width:2.75rem;height:2.75rem;border-radius:50%;padding:0;cursor:pointer";
    btn.addEventListener("click", function () { audio.paused ? audio.play().catch(function () {}) : audio.pause(); });
    slot.appendChild(audio); slot.appendChild(btn);
  });

  // gift
  all("gift").forEach(function (slot) {
    var b = box(slot);
    (C.gifts || []).forEach(function (g) {
      var card = el("div"); card.className = "carta-wish";
      card.appendChild(el("strong", g.bank)); card.appendChild(el("p", g.account_number));
      card.appendChild(el("p", "a.n. " + g.account_name));
      var cp = el("button", "Salin", { type: "button" });
      cp.addEventListener("click", function () {
        var done = function () { cp.textContent = "Tersalin"; };
        if (navigator.clipboard) navigator.clipboard.writeText(g.account_number).then(done, function () {});
      });
      card.appendChild(cp); b.appendChild(card);
    });
  });

  // open
  all("open").forEach(function (a) {
    a.addEventListener("click", function (e) {
      startMusic();
      var h = a.getAttribute("href");
      if (h && h.charAt(0) === "#") { var t = document.getElementById(h.slice(1)); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: "smooth" }); } }
    });
  });

  // watermark gratis dipasang ulang bila dihapus lewat DOM (batas diketahui: DevTools tak dicegah)
  if (C.plan === "free") {
    var wm = document.querySelector("[data-carta-watermark]");
    if (wm) new MutationObserver(function () {
      if (!document.body.contains(wm)) document.body.appendChild(wm);
    }).observe(document.body, { childList: true });
  }
})();
