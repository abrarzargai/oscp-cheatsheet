"use strict";

/* Credentials vault — a right-side drawer of saved {id, user, secret} pairs.
   Selecting one fills $USER / $PASS across every note (via applySelectedCred
   in app.js). Rows are editable (e.g. strip a DOMAIN\ off the user), deletable,
   deduped. Persisted per browser. Other modules (Credential Checking) push
   creds in via the global credVaultAdd(). */

(function(){
  // Credentials are stored PER MACHINE (project). vaultMap/selMap are keyed by
  // the active project name so one box's creds never show under another.
  var CV_KEY = "CheatSheet-credvault-v2";   // { "<project>": [ {id,user,secret} ] }
  var CV_SEL = "CheatSheet-credvault-sel-v2"; // { "<project>": selId }
  var vaultMap = {}, selMap = {};
  var vault = [];        // current project's [{id, user, secret}]
  var selId = null;      // current project's selected cred id
  var seq = 1;

  // Always-present quick picks (null / guest sessions). Not counted, not
  // deletable, not editable — just selectable.
  var DEFAULTS = [
    { id: "def-guest",     user: "guest",     secret: "", label: "guest" },
    { id: "def-anonymous", user: "anonymous", secret: "", label: "anonymous" },
    { id: "def-empty",     user: "",          secret: "", label: "(empty / null session)" }
  ];

  function newId(){ return "c" + (Date.now().toString(36)) + (seq++); }
  function pairKey(u, s){ return (u || "") + "\x00" + (s || ""); }

  function currentKey(){
    return (typeof activeProject !== "undefined" && activeProject && activeProject.name) ? activeProject.name : "";
  }
  function isObj(o){ return o && typeof o === "object" && !Array.isArray(o); }
  function loadMaps(){
    try{ var r = localStorage.getItem(CV_KEY); vaultMap = JSON.parse(r); }catch(e){ vaultMap = null; }
    if (!isObj(vaultMap)) vaultMap = {};
    try{ var s = localStorage.getItem(CV_SEL); selMap = JSON.parse(s); }catch(e){ selMap = null; }
    if (!isObj(selMap)) selMap = {};
  }
  function applyBucket(){
    var k = currentKey();
    vault = Array.isArray(vaultMap[k]) ? vaultMap[k] : [];
    vault.forEach(function(c){ if (!c.id) c.id = newId(); });
    selId = selMap[k] || null;
  }
  function load(){ loadMaps(); applyBucket(); }
  function save(){
    var k = currentKey();
    vaultMap[k] = vault;
    if (selId) selMap[k] = selId; else delete selMap[k];
    try{ localStorage.setItem(CV_KEY, JSON.stringify(vaultMap)); }catch(e){}
    try{ localStorage.setItem(CV_SEL, JSON.stringify(selMap)); }catch(e){}
  }

  // Called by projects.js when the active machine changes — swap buckets.
  window.credVaultOnProjectChange = function(){
    applyBucket();
    renderList(); updateCount(); pushSelection();
  };
  function selectedCred(){
    var all = DEFAULTS.concat(vault);
    for (var i=0;i<all.length;i++){ if (all[i].id === selId) return all[i]; }
    return null;
  }
  function pushSelection(){
    if (typeof applySelectedCred === "function") applySelectedCred(selectedCred());
  }

  // Global: add a cred. Returns { added, reason }.
  window.credVaultAdd = function(user, secret){
    user = (user || "").trim();
    secret = (secret == null ? "" : String(secret));
    if (!user) return { added: false, reason: "no username" };
    var k = pairKey(user, secret);
    if (DEFAULTS.concat(vault).some(function(c){ return pairKey(c.user, c.secret) === k; })) return { added: false, reason: "already added" };
    vault.push({ id: newId(), user: user, secret: secret });
    save(); renderList(); updateCount();
    return { added: true };
  };

  // ---- DOM ----
  var toggleBtn, backdrop, drawer, listEl, msgEl, userIn, secretIn;

  function updateCount(){
    var el = toggleBtn && toggleBtn.querySelector(".cv-vault-toggle-count");
    if (el){
      var val = vault.length ? String(vault.length) : "";
      var changed = el.textContent !== val;
      el.textContent = val;
      el.hidden = !vault.length;
      if (changed && vault.length && toggleBtn){
        toggleBtn.classList.remove("edge-bump");
        void toggleBtn.offsetWidth;
        toggleBtn.classList.add("edge-bump");
      }
    }
    var title = document.getElementById("cvVaultListTitle");
    if (title) title.innerHTML = "Saved credentials" +
      (vault.length ? ' <span class="cv-vault-count-pill">' + vault.length + "</span>" : "");
  }
  function showMsg(text, cls){
    if (!msgEl) return;
    msgEl.textContent = text || "";
    msgEl.className = "cv-vault-msg" + (cls ? " " + cls : "");
    msgEl.hidden = !text;
  }

  function renderList(){
    if (!listEl) return;
    listEl.innerHTML = "";

    // Default quick picks (guest / anonymous / empty) — selectable only.
    DEFAULTS.forEach(function(c){
      var row = document.createElement("div");
      row.className = "cv-vault-row default" + (c.id === selId ? " selected" : "");
      var use = document.createElement("button");
      use.type = "button"; use.className = "cv-vault-use";
      use.textContent = c.id === selId ? "✓" : "";
      use.title = c.id === selId ? "selected — click to deselect" : "use this credential";
      use.addEventListener("click", function(){
        selId = (c.id === selId) ? null : c.id;
        save(); renderList(); pushSelection();
      });
      row.appendChild(use);
      var lbl = document.createElement("div");
      lbl.className = "cv-vault-default-label";
      var uTxt = c.user ? escapeHtml(c.user) : "(empty)";
      var pTxt = c.secret ? escapeHtml(c.secret) : "(empty)";
      lbl.innerHTML = '<div class="cv-vault-default-name">' + escapeHtml(c.label) + '</div>' +
        '<div class="cv-vault-default-vals">' +
          '<span>$USER = <b>' + uTxt + '</b></span>' +
          '<span>$PASS = <b>' + pTxt + '</b></span>' +
        '</div>';
      row.appendChild(lbl);
      var tag = document.createElement("span");
      tag.className = "cv-vault-default-tag"; tag.textContent = "default";
      row.appendChild(tag);
      listEl.appendChild(row);
    });

    vault.forEach(function(c){
      var row = document.createElement("div");
      row.className = "cv-vault-row" + (c.id === selId ? " selected" : "");

      // select toggle
      var use = document.createElement("button");
      use.type = "button"; use.className = "cv-vault-use";
      use.textContent = c.id === selId ? "✓" : "";
      use.title = c.id === selId ? "selected — click to deselect" : "use this credential ($USER / $PASS)";
      use.addEventListener("click", function(){
        selId = (c.id === selId) ? null : c.id;
        save(); renderList(); pushSelection();
      });
      row.appendChild(use);

      // editable fields
      var fields = document.createElement("div");
      fields.className = "cv-vault-fields";
      var uIn = document.createElement("input");
      uIn.type = "text"; uIn.className = "cv-vault-user-in"; uIn.value = c.user || ""; uIn.placeholder = "user";
      uIn.autocomplete = "off"; uIn.spellcheck = false;
      var sIn = document.createElement("input");
      sIn.type = "text"; sIn.className = "cv-vault-secret-in"; sIn.value = c.secret || ""; sIn.placeholder = "password / hash";
      sIn.autocomplete = "off"; sIn.spellcheck = false;
      function onEdit(){
        c.user = uIn.value.trim(); c.secret = sIn.value;
        save();
        if (c.id === selId) pushSelection();   // live-update $USER/$PASS if this one is active
      }
      uIn.addEventListener("input", onEdit);
      sIn.addEventListener("input", onEdit);
      fields.appendChild(uIn); fields.appendChild(sIn);
      row.appendChild(fields);

      var del = document.createElement("button");
      del.type = "button"; del.className = "cv-vault-del"; del.textContent = "×"; del.title = "delete";
      del.addEventListener("click", function(){
        vault = vault.filter(function(x){ return x.id !== c.id; });
        if (selId === c.id) selId = null;
        save(); renderList(); updateCount(); pushSelection();
      });
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  function openDrawer(){ if (backdrop){ backdrop.classList.add("open"); toggleBtn.classList.add("active"); } }
  function closeDrawer(){ if (backdrop){ backdrop.classList.remove("open"); toggleBtn.classList.remove("active"); } }

  function build(){
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "edge-tab cv-vault-toggle";
    toggleBtn.innerHTML =
      '<span class="cv-vault-toggle-count" hidden></span>' +
      '<span class="edge-tab-icon cv-vault-toggle-icon">' +
        '<svg class="edge-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="7.5" cy="15.5" r="4.2"/><path d="M10.6 12.4L20 3M16.5 6.5l2.2 2.2M13.5 9.5l2.2 2.2"/></svg>' +
      '</span>' +
      '<span class="edge-tab-label">Creds</span>';
    toggleBtn.title = "Credentials vault — fill $USER / $PASS";
    toggleBtn.addEventListener("click", function(){
      if (backdrop.classList.contains("open")) closeDrawer(); else openDrawer();
    });
    document.body.appendChild(toggleBtn);

    backdrop = document.createElement("div");
    backdrop.className = "cv-vault-backdrop";
    backdrop.addEventListener("click", function(e){ if (e.target === backdrop) closeDrawer(); });

    drawer = document.createElement("div");
    drawer.className = "cv-vault-drawer";
    drawer.innerHTML =
      '<div class="cv-vault-head">' +
        '<div class="cv-vault-title">⚿ Credentials</div>' +
        '<button type="button" class="modal-close" id="cvVaultClose">x</button>' +
      '</div>' +
      // pinned top: add new
      '<div class="cv-vault-top">' +
        '<div class="cv-vault-section-title">Add new</div>' +
        '<div class="cv-vault-add">' +
          '<input id="cvVaultUser" type="text" placeholder="user" autocomplete="off" spellcheck="false">' +
          '<input id="cvVaultSecret" type="text" placeholder="password / hash" autocomplete="off" spellcheck="false">' +
          '<button type="button" id="cvVaultAddBtn" class="cv-vault-addbtn">[add]</button>' +
        '</div>' +
        '<div class="cv-vault-msg" id="cvVaultMsg" hidden></div>' +
        '<div class="cv-vault-hint">Pick one (✓) to fill <code>$USER</code> / <code>$PASS</code>. Edit a field to fix it (e.g. drop a <code>DOMAIN\\</code>).</div>' +
      '</div>' +
      // scrollable: saved list
      '<div class="cv-vault-section-title" id="cvVaultListTitle">Saved credentials</div>' +
      '<div class="cv-vault-list" id="cvVaultList"></div>';
    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    listEl = drawer.querySelector("#cvVaultList");
    msgEl = drawer.querySelector("#cvVaultMsg");
    userIn = drawer.querySelector("#cvVaultUser");
    secretIn = drawer.querySelector("#cvVaultSecret");

    drawer.querySelector("#cvVaultClose").addEventListener("click", closeDrawer);
    drawer.querySelector("#cvVaultAddBtn").addEventListener("click", function(){
      var res = window.credVaultAdd(userIn.value, secretIn.value);
      if (res.added){ userIn.value = ""; secretIn.value = ""; showMsg("added", "ok"); userIn.focus(); }
      else { showMsg(res.reason, "err"); }
    });
    secretIn.addEventListener("keydown", function(e){ if (e.key === "Enter") drawer.querySelector("#cvVaultAddBtn").click(); });
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeDrawer(); });

    renderList(); updateCount();
  }

  function init(){ load(); build(); pushSelection(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
