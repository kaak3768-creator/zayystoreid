/* ZayyStore — putaran ke-8. Aman dihapus bersama nova4.css. Tidak menyentuh checkout/pembayaran. */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const grid = $("#productGrid");
  const watch = (el, fn, o) => { if (el) new MutationObserver(fn).observe(el, o || { childList: true }); };

  /* 1. kategori berwarna (dari data nyata; klik = buka kategori + gulir ke produk) */
  const sec = $("#kategori"), box = $("#novaCats");
  function paintCats() {
    const cats = window.ZS_CATS || [], list = window.ZS_LIST || [];
    if (!sec || !box || !cats.length || !list.length) return;
    box.innerHTML = cats.map((c) => {
      const n = list.filter((p) => p.cat === c.id || String(p.cat || "").startsWith(c.id + "-")).length;
      return `<button type="button" class="nova-cat" data-cat="${esc(c.id)}"><i>${c.icon || "🎮"}</i><b>${esc(c.name)}</b><small>${n ? n + " produk" : "Segera hadir"}</small></button>`;
    }).join("");
    sec.hidden = false;
  }
  if (box) box.addEventListener("click", (e) => {
    const b = e.target.closest(".nova-cat"); if (!b) return;
    const tab = $(`#catTabs [data-cat="${CSS.escape(b.dataset.cat)}"]`); if (tab) tab.click();
    const t = $("#produk"); t && t.scrollIntoView({ behavior: "smooth" });
  });
  watch(grid, () => setTimeout(paintCats, 120)); paintCats();

  /* 2. bar keranjang mini */
  const cc = $("#cartCount"), ct = $("#cartTotal");
  if (cc && ct) {
    const mini = document.createElement("button"); mini.type = "button"; mini.className = "nova-mini"; mini.setAttribute("aria-label", "Buka keranjang");
    mini.innerHTML = "<span>🛒 <em style='font-style:normal' id='novaMiniN'>0</em> item • <b id='novaMiniT'>Rp 0</b></span><i>Lihat keranjang ›</i>";
    document.body.appendChild(mini);
    const sync = () => {
      const n = parseInt(cc.textContent, 10) || 0;
      $("#novaMiniN").textContent = n; $("#novaMiniT").textContent = ct.textContent.trim() || "";
      mini.classList.toggle("on", n > 0);
    };
    [cc, ct].forEach((el) => watch(el, sync, { childList: true, characterData: true, subtree: true }));
    mini.addEventListener("click", () => { const o = $("#cartOpen"); o && o.click(); });
    sync();
  }

  /* 3. zoom foto produk */
  const lb = document.createElement("div"); lb.className = "nova-lb"; lb.innerHTML = '<button type="button" aria-label="Tutup">×</button><img alt="">';
  document.body.appendChild(lb);
  const closeLb = () => lb.classList.remove("open");
  lb.addEventListener("click", closeLb);
  document.addEventListener("click", (e) => {
    const im = e.target.closest("img.sv-photo"); if (!im) return;
    $("img", lb).src = im.currentSrc || im.src; $("img", lb).alt = im.alt || ""; lb.classList.add("open");
  });

  /* 4. pasang sebagai aplikasi (tombol hanya muncul bila browser mengizinkan) */
  if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  let deferred = null;
  const sup = $$(".sv-foot-grid > div").find((d) => /Support/i.test((d.querySelector("h4") || {}).textContent || ""));
  if (sup) {
    const a = document.createElement("a"); a.id = "novaInstall"; a.hidden = true; a.textContent = "📲 Pasang aplikasi"; a.href = "#"; sup.appendChild(a);
    window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferred = e; a.hidden = false; });
    a.addEventListener("click", async (e) => { e.preventDefault(); if (!deferred) return; deferred.prompt(); try { await deferred.userChoice; } catch {} deferred = null; a.hidden = true; });
    window.addEventListener("appinstalled", () => (a.hidden = true));
  }

  /* 5. pintasan keyboard: C keranjang, N mode malam, ? bantuan */
  const kb = document.createElement("div"); kb.className = "nova-kb";
  kb.innerHTML = '<div role="dialog" aria-label="Pintasan keyboard"><h3>⌨️ Pintasan keyboard</h3><p>Cari produk <kbd>/</kbd></p><p>Buka keranjang <kbd>C</kbd></p><p>Mode malam / siang <kbd>N</kbd></p><p>Tampilkan bantuan ini <kbd>?</kbd></p><p>Tutup jendela <kbd>Esc</kbd></p><small>Klik di mana saja untuk menutup</small></div>';
  document.body.appendChild(kb);
  kb.addEventListener("click", () => kb.classList.remove("open"));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeLb(); kb.classList.remove("open"); return; }
    const t = e.target; if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    const k = e.key.toLowerCase();
    if (k === "c") { const o = $("#cartOpen"); o && o.click(); }
    else if (k === "n") { const n = $("#novaTheme"); n && n.click(); }
    else if (e.key === "?") kb.classList.toggle("open");
  });
})();
