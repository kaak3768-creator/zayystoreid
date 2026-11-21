/* ZayyStore — putaran ke-4. Aman dihapus bersama boost.css. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const say = (m) => (window.toast ? window.toast(m) : null);
  const grid = $("#productGrid");

  /* 1. navigasi bawah (HP) */
  const bnav = $(".zs-bnav");
  if (bnav) {
    bnav.addEventListener("click", (e) => {
      const el = e.target.closest("[data-go]"); if (!el) return;
      const g = el.dataset.go;
      if (g === "top") { e.preventDefault(); scrollTo({ top: 0, behavior: "smooth" }); }
      if (g === "produk") { e.preventDefault(); const t = $("#produk"); t && t.scrollIntoView({ behavior: "smooth" }); }
      if (g === "cart") { const c = $("#cartOpen"); c && c.click(); }
    });
    const cc = $("#cartCount"), bc = $("#bnavCount");
    const sync = () => { if (cc && bc) { bc.textContent = cc.textContent; bc.dataset.n = cc.textContent.trim() || "0"; } };
    if (cc) { new MutationObserver(sync).observe(cc, { childList: true, characterData: true, subtree: true }); sync(); }
    const secs = [["top", null], ["produk", $("#produk")]];
    addEventListener("scroll", () => {
      const p = $("#produk"), y = scrollY + innerHeight * 0.4;
      $$("[data-go]", bnav).forEach((a) => a.classList.remove("on"));
      const act = p && y >= p.offsetTop && y < p.offsetTop + p.offsetHeight ? "produk" : scrollY < 200 ? "top" : null;
      if (act) { const a = $(`[data-go="${act}"]`, bnav); a && a.classList.add("on"); }
    }, { passive: true });
  }

  /* 2. skeleton loading sebelum produk muncul */
  if (grid && !$(".product-card", grid)) {
    grid.innerHTML = '<div class="zs-skel"><i></i><i></i><i></i><i></i></div>'.repeat(4);
    setTimeout(() => { if (!$(".product-card", grid)) $$(".zs-skel", grid).forEach((s) => s.remove()); }, 10000); // jaga-jaga kalau gagal memuat
  }

  /* 3. bagikan produk + tautan langsung (?p=idProduk) */
  const base = () => location.href.split(/[?#]/)[0];
  const wantId = new URLSearchParams(location.search).get("p");
  let jumped = false;
  function paintShare() {
    if (!grid) return;
    $$(".product-card", grid).forEach((c) => {
      const id = c.dataset.id; if (!id || $(".share-btn", c)) return;
      const b = document.createElement("button"); b.type = "button"; b.className = "share-btn"; b.textContent = "🔗"; b.setAttribute("aria-label", "Bagikan produk");
      (c.querySelector(".sv-img") || c).appendChild(b);
    });
    if (wantId && !jumped) {
      const c = $$(".product-card", grid).find((x) => x.dataset.id === wantId);
      if (c) { jumped = true; setTimeout(() => { c.scrollIntoView({ behavior: "smooth", block: "center" }); c.classList.add("deeplink-pulse"); setTimeout(() => c.classList.remove("deeplink-pulse"), 3200); }, 500); }
    }
  }
  if (grid) {
    grid.addEventListener("click", async (e) => {
      const b = e.target.closest(".share-btn"); if (!b) return;
      e.stopPropagation();
      const c = b.closest(".product-card"), url = `${base()}?p=${encodeURIComponent(c.dataset.id)}`, name = ($("h3", c) || {}).textContent || "Produk ZayyStore";
      if (navigator.share && matchMedia("(pointer:coarse)").matches) { try { await navigator.share({ title: name, text: name + " — ZayyStore", url }); return; } catch { return; } }
      try { await navigator.clipboard.writeText(url); } catch { const t = document.createElement("textarea"); t.value = url; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); } catch {} t.remove(); }
      say("Link produk tersalin 🔗 — kirim ke temanmu!");
    });
    new MutationObserver(() => { clearTimeout(grid._sh); grid._sh = setTimeout(paintShare, 50); }).observe(grid, { childList: true });
    paintShare();
  }

  /* 5. judul tab berubah saat ditinggal */
  const title = document.title;
  document.addEventListener("visibilitychange", () => { document.title = document.hidden ? "🎮 Balik lagi ya! — ZayyStore" : title; });

  /* 6. pengingat voucher sekali per sesi saat kursor keluar dari atas halaman (desktop) */
  if (matchMedia("(pointer:fine)").matches) {
    document.addEventListener("mouseout", (e) => {
      if (e.relatedTarget || e.clientY > 0) return;
      try { if (sessionStorage.getItem("zs_exit")) return; sessionStorage.setItem("zs_exit", "1"); } catch { return; }
      say("🎟️ Jangan lupa! Pakai kode ZAYYXZELLMC untuk diskon 15%");
    });
  }
})();
