"use strict";

/* Copy history — a right-side drawer + edge tab (matching the Creds/VPN tabs)
   that remembers the last 50 commands copied from notes. Each entry can be
   re-copied or removed, and the whole list cleared. Persisted per browser.
   app.js calls window.copyHistoryAdd(text) from its command-copy handlers. */

(function(){
  var CH_KEY = "CheatSheet-copyhistory-v1";
  var MAX = 50;
  var history = [];          // [{text, ts}] newest first
  var toggleBtn, backdrop, drawer, listEl;

  function load(){
    try{ history = JSON.parse(localStorage.getItem(CH_KEY)) || []; }catch(e){ history = []; }
    if (!Array.isArray(history)) history = [];
  }
  function save(){
    try{ localStorage.setItem(CH_KEY, JSON.stringify(history)); }catch(e){}
  }

  // Global entry point (called by app.js recordCopiedCommand).
  window.copyHistoryAdd = function(text){
    text = String(text == null ? "" : text).replace(/\s+$/, "");
    if (!text.trim()) return;
    // Drop an identical most-recent entry so re-copying the same line doesn't
    // flood the list, but move it to the top otherwise.
    history = history.filter(function(h){ return h.text !== text; });
    history.unshift({ text: text, ts: Math.floor(Date.now()/1000) });
    if (history.length > MAX) history = history.slice(0, MAX);
    save();
    updateCount();
    if (backdrop && backdrop.classList.contains("open")) renderList();
  };

  function fmtAgo(ts){
    if (!ts) return "";
    var s = Math.floor(Date.now()/1000) - ts;
    if (s < 60) return "just now";
    if (s < 3600) return Math.floor(s/60) + "m ago";
    if (s < 86400) return Math.floor(s/3600) + "h ago";
    return Math.floor(s/86400) + "d ago";
  }

  function updateCount(){
    var el = toggleBtn && toggleBtn.querySelector(".ch-toggle-count");
    if (!el) return;
    var val = history.length ? String(history.length) : "";
    var changed = el.textContent !== val;
    el.textContent = val;
    el.hidden = !history.length;
    if (changed && history.length && toggleBtn){
      toggleBtn.classList.remove("edge-bump");
      void toggleBtn.offsetWidth;               // restart the animation
      toggleBtn.classList.add("edge-bump");
    }
  }

  function copyToClipboard(text, onOk){
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(onOk, function(){ fallback(text, onOk); });
    } else { fallback(text, onOk); }
  }
  function fallback(text, onOk){
    try{
      var ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select(); document.execCommand("copy");
      document.body.removeChild(ta); onOk && onOk();
    }catch(e){}
  }

  function renderList(){
    if (!listEl) return;
    listEl.innerHTML = "";
    if (!history.length){
      var e = document.createElement("div");
      e.className = "ch-empty";
      e.textContent = "No copied commands yet. Click a command line (or a code block's [copy]) in a note.";
      listEl.appendChild(e);
      return;
    }
    history.forEach(function(h, i){
      var row = document.createElement("div");
      row.className = "ch-row";

      var code = document.createElement("button");
      code.type = "button";
      code.className = "ch-cmd";
      code.title = "click to copy";
      code.textContent = h.text;
      code.addEventListener("click", function(){
        copyToClipboard(h.text, function(){
          code.classList.add("copied");
          setTimeout(function(){ code.classList.remove("copied"); }, 700);
        });
        // bump to top
        window.copyHistoryAdd(h.text);
      });
      row.appendChild(code);

      var meta = document.createElement("div");
      meta.className = "ch-meta";
      meta.innerHTML = '<span class="ch-ago">' + fmtAgo(h.ts) + '</span>';
      var del = document.createElement("button");
      del.type = "button"; del.className = "ch-del"; del.textContent = "×"; del.title = "remove";
      del.addEventListener("click", function(ev){
        ev.stopPropagation();
        history.splice(i, 1); save(); updateCount(); renderList();
      });
      meta.appendChild(del);
      row.appendChild(meta);

      listEl.appendChild(row);
    });
  }

  function open(){ if (backdrop){ backdrop.classList.add("open"); toggleBtn.classList.add("active"); renderList(); } }
  function close(){ if (backdrop){ backdrop.classList.remove("open"); toggleBtn.classList.remove("active"); } }

  function build(){
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "edge-tab ch-toggle";
    toggleBtn.innerHTML =
      '<span class="ch-toggle-count" hidden></span>' +
      '<span class="edge-tab-icon ch-toggle-icon">' +
        '<svg class="edge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<rect x="9" y="9" width="11" height="11" rx="2"/>' +
        '<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>' +
      '</span>' +
      '<span class="edge-tab-label">Copied</span>';
    toggleBtn.title = "Last " + MAX + " copied commands";
    toggleBtn.addEventListener("click", function(){
      if (backdrop.classList.contains("open")) close(); else open();
    });
    document.body.appendChild(toggleBtn);

    backdrop = document.createElement("div");
    backdrop.className = "cv-vault-backdrop ch-backdrop";
    backdrop.addEventListener("click", function(e){ if (e.target === backdrop) close(); });

    drawer = document.createElement("div");
    drawer.className = "cv-vault-drawer";
    drawer.innerHTML =
      '<div class="cv-vault-head">' +
        '<div class="cv-vault-title">⎘ Copied commands</div>' +
        '<div class="ch-head-actions">' +
          '<button type="button" class="ch-clear" id="chClear">[clear]</button>' +
          '<button type="button" class="modal-close" id="chClose">x</button>' +
        '</div>' +
      '</div>' +
      '<div class="ch-hint">The last ' + MAX + ' commands you copied (with variables already filled). Click one to copy it again.</div>' +
      '<div class="ch-list" id="chList"></div>';
    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    listEl = drawer.querySelector("#chList");
    drawer.querySelector("#chClose").addEventListener("click", close);
    drawer.querySelector("#chClear").addEventListener("click", function(){
      if (!history.length) return;
      history = []; save(); updateCount(); renderList();
    });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") close(); });

    updateCount();
  }

  function init(){ load(); build(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
