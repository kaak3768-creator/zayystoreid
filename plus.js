/* ZayyStore — fitur tambahan. Aman dihapus bersama plus.css. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const rp = (n) => "Rp " + Number(n || 0).toLocaleString("id-ID");
  const say = (m) => (window.toast ? window.toast(m) : null);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 1. progress scroll + tombol ke atas */
  const bar = Object.assign(document.createElement("div"), { className: "zs-progress" });
  const top = Object.assign(document.createElement("button"), { className: "zs-top", type: "button", ariaLabel: "Ke atas", innerHTML: "<i>↑</i>" });
  document.body.append(bar, top);
  const onScroll = () => {
    const h = document.documentElement, max = h.scrollHeight - innerHeight, p = max > 0 ? scrollY / max : 0;
    bar.style.width = (p * 100).toFixed(1) + "%"; top.style.setProperty("--p", (p * 100).toFixed(0) + "%");
    top.classList.toggle("show", scrollY > 600);
  };
  addEventListener("scroll", onScroll, { passive: true }); onScroll();
  top.addEventListener("click", () => scrollTo({ top: 0, behavior: "smooth" }));

  /* 2. salin kode voucher */
  document.addEventListener("click", async (e) => {
    const b = e.target.closest("#copyVoucher"); if (!b) return;
    const code = "ZAYYXZELLMC";
    try { await navigator.clipboard.writeText(code); }
    catch { const t = document.createElement("textarea"); t.value = code; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove(); }
    const old = b.innerHTML; b.classList.add("ok"); b.innerHTML = "✓ Kode tersalin!";
    say("Kode " + code + " tersalin — tempel di kolom kode promo saat bayar 🎉");
    setTimeout(() => { b.classList.remove("ok"); b.innerHTML = old; }, 1800);
  });

  /* 3. keranjang: badge membal + ikon bergetar saat bertambah */
  const cc = $("#cartCount");
  if (cc) {
    let prev = cc.textContent;
    new MutationObserver(() => {
      if (cc.textContent !== prev && Number(cc.textContent) > Number(prev || 0)) {
        cc.classList.remove("bump"); void cc.offsetWidth; cc.classList.add("bump");
        const bt = $("#cartOpen"); if (bt) { bt.classList.remove("ring"); void bt.offsetWidth; bt.classList.add("ring"); }
      }
      prev = cc.textContent;
    }).observe(cc, { childList: true, characterData: true, subtree: true });
  }

  /* 4. favorit (hati) + filter favorit */
  const FK = "zs_fav";
  const favs = () => { try { return new Set(JSON.parse(localStorage.getItem(FK) || "[]")); } catch { return new Set(); } };
  const saveFavs = (s) => { try { localStorage.setItem(FK, JSON.stringify([...s])); } catch {} };
  const grid = $("#productGrid");
  let favBar = null;
  function paintFavs() {
    if (!grid) return;
    const f = favs();
    $$(".product-card", grid).forEach((c) => {
      const id = c.dataset.id; if (!id) return;
      let b = $(".fav-btn", c);
      if (!b) { b = document.createElement("button"); b.type = "button"; b.className = "fav-btn"; b.textContent = "♡"; b.setAttribute("aria-label", "Favorit"); (c.querySelector(".sv-img") || c).appendChild(b); }
      const on = f.has(id); b.classList.toggle("on", on); b.textContent = on ? "♥" : "♡"; c.classList.toggle("is-fav", on);
    });
    if (!favBar) {
      favBar = document.createElement("div"); favBar.className = "fav-bar";
      favBar.innerHTML = '<button type="button" id="favToggle"></button>'; grid.parentNode.insertBefore(favBar, grid);
      favBar.addEventListener("click", (e) => { if (!e.target.closest("#favToggle")) return; grid.classList.toggle("fav-only"); paintFavs(); });
    }
    const t = $("#favToggle", favBar), only = grid.classList.contains("fav-only");
    favBar.hidden = f.size === 0 && !only;
    t.classList.toggle("on", only); t.textContent = (only ? "✕ Tutup favorit" : "♥ Favorit saya") + " (" + f.size + ")";
    let em = $(".fav-empty", grid.parentNode);
    const none = only && !$$(".product-card.is-fav", grid).length;
    if (none && !em) { em = document.createElement("div"); em.className = "fav-empty"; em.textContent = "Belum ada produk favorit di halaman ini. Tekan ♡ di kartu produk."; grid.parentNode.insertBefore(em, grid); }
    if (!none && em) em.remove();
  }
  if (grid) {
    grid.addEventListener("click", (e) => {
      const b = e.target.closest(".fav-btn"); if (!b) return;
      e.stopPropagation(); const id = b.closest(".product-card").dataset.id, s = favs();
      s.has(id) ? s.delete(id) : s.add(id); saveFavs(s); paintFavs();
      say(s.has(id) ? "Ditambahkan ke favorit ♥" : "Dihapus dari favorit");
    });
    new MutationObserver(() => { clearTimeout(grid._t); grid._t = setTimeout(paintFavs, 30); }).observe(grid, { childList: true });
    paintFavs();
  }

  /* 5. pencarian langsung (pengganti kotak prompt) */
  const sr = document.createElement("div"); sr.className = "zs-search";
  sr.innerHTML = '<div class="box"><div class="row"><span aria-hidden="true">🔍</span><input id="srInput" type="search" placeholder="Cari produk… (skin, server, mod)" autocomplete="off"/><button class="x" type="button" aria-label="Tutup">✕</button></div><div class="res" id="srRes"></div><div class="hint">Enter = tampilkan semua hasil • Esc = tutup • tekan “/” kapan saja</div></div>';
  document.body.appendChild(sr);
  const inp = $("#srInput", sr), res = $("#srRes", sr);
  let sel = 0, list = [];
  const open = () => { sr.classList.add("open"); inp.value = ""; render(); setTimeout(() => inp.focus(), 60); };
  const close = () => sr.classList.remove("open");
  function find(q) {
    q = q.trim().toLowerCase(); const all = window.ZS_LIST || [];
    if (!q) return all.slice(0, 6);
    return all.filter((p) => (p.name + " " + (p.desc || "")).toLowerCase().includes(q)).slice(0, 12);
  }
  function render() {
    list = find(inp.value); sel = 0;
    res.innerHTML = list.length ? list.map((p, i) => `<button type="button" class="it${i ? "" : " sel"}" data-i="${i}">${p.img ? `<img src="${p.img.replace(/"/g, "")}" alt="">` : "🎮"}<b>${(p.name || "").replace(/</g, "&lt;")}</b><span>${rp(p.price)}</span></button>`).join("")
      : '<div class="hint" style="padding:18px 0">Produk tidak ditemukan 😢</div>';
  }
  function showOnly(ids) {
    $$(".product-card", grid).forEach((c) => { c.style.display = ids.includes(c.dataset.id) ? "" : "none"; });
    $$(".filter").forEach((b) => b.classList.remove("active"));
    close(); const t = $("#produk"); t && t.scrollIntoView({ behavior: "smooth" });
    say(ids.length ? `Ditemukan ${ids.length} produk.` : "Produk tidak ditemukan.");
  }
  inp.addEventListener("input", render);
  res.addEventListener("click", (e) => { const b = e.target.closest(".it"); if (b) showOnly([list[+b.dataset.i].id]); });
  $(".x", sr).addEventListener("click", close);
  sr.addEventListener("click", (e) => { if (e.target === sr) close(); });
  inp.addEventListener("keydown", (e) => {
    const its = $$(".it", res);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + its.length) % (its.length || 1); its.forEach((b, i) => b.classList.toggle("sel", i === sel)); }
    if (e.key === "Enter") { e.preventDefault(); const q = inp.value.trim(); showOnly(q ? list.map((p) => p.id) : (its[sel] ? [list[sel].id] : [])); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") close();
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test((document.activeElement || {}).tagName || "")) { e.preventDefault(); open(); }
  });
  const st = $("#searchToggle");
  if (st) st.addEventListener("click", (e) => { e.stopImmediatePropagation(); e.preventDefault(); open(); }, true);

  /* 6. konfeti saat pembayaran berhasil */
  window.zsConfetti = () => {
    if (reduce) return;
    const box = document.createElement("div"); box.className = "zs-confetti"; document.body.appendChild(box);
    const col = ["#ffd23f", "#46d1ff", "#ff7bd5", "#2dffb0", "#ffffff", "#8c6bff"];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement("i");
      p.style.cssText = `left:${Math.random() * 100}%;background:${col[i % col.length]};--t:${2.4 + Math.random() * 2}s;--dx:${(Math.random() * 240 - 120)}px;--r:${Math.random() * 900 - 450}deg;animation-delay:${Math.random() * .6}s`;
      box.appendChild(p);
    }
    setTimeout(() => box.remove(), 5500);
  };
})();
