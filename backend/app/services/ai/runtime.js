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
  // Warna teks mengikuti latar di belakang kotak sistem (hitung mundur, RSVP): terang di latar gelap, gelap di latar terang.
  function parseColor(c) {
    var m = c && c.match(/(?:rgba?|color\(srgb)\s*\(?\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?/);
    if (!m) return null;
    var k = m[0].indexOf("color") === 0 ? 255 : 1;
    return [m[1] * k, m[2] * k, m[3] * k, m[4] == null ? 1 : +m[4]];
  }
  function bgLum(n) {
    for (; n && n.nodeType === 1; n = n.parentElement) {
      var st = getComputedStyle(n), p = parseColor(st.backgroundColor);
      if (!p || p[3] < 0.6) p = st.backgroundImage.indexOf("gradient") > -1 ? parseColor(st.backgroundImage) : null;
      if (p && p[3] >= 0.6) return (0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]) / 255;
    }
    return 1;
  }
  function box(slot) {
    clear(slot); var b = el("div"); b.className = "carta-box"; slot.appendChild(b);
    b.classList.add(bgLum(slot) < 0.5 ? "carta-on-dark" : "carta-on-light");
    return b;
  }

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

  // music: bubble kanan bawah di <body> (di luar sampul yang bergeser); klik = mute, klik lagi = unmute
  var audio = null, syncMusic = function () {};
  function startMusic() { if (audio) { audio.muted = false; audio.play().catch(function () {}); syncMusic(); } }
  var ICON_ON = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var ICON_OFF = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m22 9-6 6"/><path d="m16 9 6 6"/></svg>';
  all("music").forEach(function (slot) {
    clear(slot);
    if (!C.musicUrl || audio) { slot.remove(); return; }
    audio = el("audio", null, { src: C.musicUrl, loop: "", preload: "none" });
    var btn = el("button", null, { type: "button", "aria-label": "Matikan suara musik" });
    btn.className = "carta-music";
    slot.removeAttribute("style"); slot.className = "carta-music-wrap";
    document.body.appendChild(slot);
    syncMusic = function () {
      var on = !audio.paused && !audio.muted;
      btn.innerHTML = on ? ICON_ON : ICON_OFF;
      btn.setAttribute("aria-label", on ? "Matikan suara musik" : "Nyalakan suara musik");
      btn.classList.toggle("carta-music-on", on);
    };
    btn.addEventListener("click", function () {
      if (audio.paused) { audio.muted = false; audio.play().catch(function () {}); } else audio.muted = !audio.muted;
      syncMusic();
    });
    audio.addEventListener("play", syncMusic); audio.addEventListener("pause", syncMusic);
    slot.appendChild(audio); slot.appendChild(btn); syncMusic();
  });

  // gift: kartu bank (gradien aksen, chip, nomor, nama, Salin)
  var CHIP = '<svg viewBox="0 0 44 34" width="44" height="34" aria-hidden="true"><rect width="44" height="34" rx="6" fill="#e6c97a"/><path d="M0 12h44M0 22h44M15 0v34M29 0v34" stroke="#b89a45" stroke-width="1.2" fill="none"/></svg>';
  function fmtAcc(n) { return String(n).replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim(); }
  all("gift").forEach(function (slot) {
    clear(slot);
    var b = el("div"); b.className = "carta-gifts"; slot.appendChild(b);
    (C.gifts || []).forEach(function (g, i) {
      var card = el("div"); card.className = "carta-bank carta-reveal carta-delay-" + Math.min(i + 1, 3);
      var top = el("div"); top.className = "carta-bank-top";
      top.appendChild(el("span", g.bank)); card.appendChild(top);
      var chip = el("div"); chip.className = "carta-bank-chip"; chip.innerHTML = CHIP; card.appendChild(chip);
      card.appendChild(el("div", fmtAcc(g.account_number))).className = "carta-bank-no";
      var foot = el("div"); foot.className = "carta-bank-foot";
      var who = el("div"); who.appendChild(el("small", "Atas nama")); who.appendChild(el("b", g.account_name)); foot.appendChild(who);
      var cp = el("button", "Salin", { type: "button" });
      cp.addEventListener("click", function () {
        var done = function () { cp.textContent = "Tersalin"; setTimeout(function () { cp.textContent = "Salin"; }, 1800); };
        if (navigator.clipboard) navigator.clipboard.writeText(g.account_number).then(done, function () {});
      });
      foot.appendChild(cp); card.appendChild(foot); b.appendChild(card);
    });
  });

  // galeri: kolom dengan rasio asli foto, tidak ada yang dipotong
  all("gallery").forEach(function (slot) {
    clear(slot);
    var list = C.gallery || [];
    if (!list.length) { slot.remove(); return; }
    var g = el("div"); g.className = "carta-gallery"; slot.appendChild(g);
    list.forEach(function (u, i) {
      var f = el("figure"); f.className = "carta-reveal carta-delay-" + (i % 3 + 1);
      f.appendChild(el("img", null, { src: u, alt: "Galeri " + (i + 1), loading: "lazy", decoding: "async" }));
      g.appendChild(f);
    });
  });

  // potret mempelai: bingkai lengkung, rasio asli
  all("portrait").forEach(function (slot) {
    var u = (C.portraits || {})[slot.getAttribute("data-who")];
    clear(slot);
    if (!u) { slot.remove(); return; }
    slot.classList.add("carta-portrait", "carta-reveal");
    slot.appendChild(el("img", null, { src: u, alt: slot.getAttribute("data-who") === "bride" ? "Foto mempelai wanita" : "Foto mempelai pria", decoding: "async" }));
  });

  // peta: gambar ubin OpenStreetMap di titik lokasi (tanpa iframe, tampil benar di semua perangkat);
  // tanpa koordinat: embed Google Maps sebagai cadangan
  function tileMap(w, ll) {
    var dpr = window.devicePixelRatio || 1, hi = dpr >= 1.5, z = hi ? 17 : 16, T = hi ? 128 : 256, n = Math.pow(2, z);
    var W = w.clientWidth || 320, H = 190, la = ll[0] * Math.PI / 180;
    var fx = (ll[1] + 180) / 360 * n, fy = (1 - Math.log(Math.tan(la) + 1 / Math.cos(la)) / Math.PI) / 2 * n;
    w.className += " carta-map-static";
    var x0 = Math.floor(fx - W / 2 / T), x1 = Math.floor(fx + W / 2 / T), y0 = Math.floor(fy - H / 2 / T), y1 = Math.floor(fy + H / 2 / T);
    for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) {
      if (y < 0 || y >= n) continue;
      var im = el("img", null, { src: "https://tile.openstreetmap.org/" + z + "/" + (((x % n) + n) % n) + "/" + y + ".png", alt: "", width: T, height: T, decoding: "async", loading: "lazy" });
      im.style.left = Math.round(W / 2 + (x - fx) * T) + "px"; im.style.top = Math.round(H / 2 + (y - fy) * T) + "px";
      im.style.width = im.style.height = T + "px";
      w.appendChild(im);
    }
    var pin = el("div"); pin.className = "carta-map-pin";
    pin.innerHTML = '<svg viewBox="0 0 34 44" width="34" height="44"><path d="M17 0C7.6 0 0 7.5 0 16.8 0 29 17 44 17 44s17-15 17-27.2C34 7.5 26.400 0 17 0z" fill="currentColor"/><circle cx="17" cy="16.500" r="6.500" fill="#fff"/></svg>';
    w.appendChild(pin);
    var cr = el("div"); cr.className = "carta-map-credit";
    cr.appendChild(el("a", "© OpenStreetMap", { href: "https://www.openstreetmap.org/copyright", target: "_blank", rel: "noopener noreferrer" }));
    w.appendChild(cr);
  }
  Array.prototype.slice.call(document.querySelectorAll('a[href^="https://www.google.com/maps/search/"]')).forEach(function (a) {
    var qs; try { qs = new URL(a.href).searchParams.get("query"); } catch (e) { return; }
    if (!qs) return;
    var w = el("div"); w.className = "carta-map carta-reveal";
    a.parentNode.insertBefore(w, a);
    var ll = (C.places || {})[qs];
    if (ll) tileMap(w, ll);
    else w.appendChild(el("iframe", null, { src: "https://www.google.com/maps?q=" + encodeURIComponent(qs) + "&output=embed", title: "Peta " + qs, loading: "lazy", referrerpolicy: "no-referrer" }));
  });

  // reveal saat scroll (kit desain); tanpa IntersectionObserver langsung tampil
  var root = document.documentElement;
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  root.classList.add("carta-js");
  var rev = Array.prototype.slice.call(document.querySelectorAll(".carta-reveal"));
  if (!("IntersectionObserver" in window) || still) rev.forEach(function (n) { n.classList.add("carta-in"); });
  else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add("carta-in"); io.unobserve(x.target); } });
    }, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
    rev.forEach(function (n) { io.observe(n); });
  }

  // open: sampul mengunci scroll sampai dibuka; tanpa tombol open tidak ada kunci
  // Kunci hanya bila aman: tombol terlihat utuh di layar pertama, sampul bukan seluruh halaman (tidak memuat
  // slot RSVP/hitung mundur), dan tamu tidak datang lewat #anchor. Ukuran layar berubah → kunci dilepas.
  var opens = all("open");
  var cover = opens.length && opens[0].closest("section,header");
  if (cover && (cover === document.body || cover.querySelector('[data-carta="rsvp"],[data-carta="countdown"]'))) cover = null;
  // ?preview=1: pratinjau di situs pemasaran, tanpa kunci scroll sampul.
  if (cover && !location.hash && !q.has("preview")) {
    var r = opens[0].getBoundingClientRect(), cs = getComputedStyle(opens[0]);
    if (r.width && r.height && r.top >= 0 && r.bottom <= innerHeight && cs.visibility !== "hidden" && cs.opacity !== "0") {
      root.classList.add("carta-locked");
      addEventListener("resize", function () { root.classList.remove("carta-locked"); }, { once: true });
    }
  }
  opens.forEach(function (a) {
    a.addEventListener("click", function (e) {
      startMusic();
      var h = a.getAttribute("href");
      var t = h && h.charAt(0) === "#" ? document.getElementById(h.slice(1)) : null;
      if (t || cover) e.preventDefault();
      if (cover && root.classList.contains("carta-locked")) {
        root.classList.remove("carta-locked");
        cover.classList.add("carta-cover-out");
        setTimeout(function () { cover.style.display = "none"; if (t) t.scrollIntoView(); else window.scrollTo(0, 0); }, still ? 0 : 900);
      } else if (t) t.scrollIntoView({ behavior: "smooth" });
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
