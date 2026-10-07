"use strict";

/* Settings — opens as a big modal overlay (backdrop + centered dialog),
   triggered by the [settings] button at the bottom of the sidebar. App-wide
   filesystem locations (SecLists / wordlists paths) with a per-field [verify]
   button that checks the path on disk via /api/verify-path. Depends on
   apiFetch and escapeHtml from app.js (globals). */

var SETTINGS_FIELDS = [
  { id: "setProjectsBase", key: "projects_base_path", label: "Projects base path (where machine folders are created)", placeholder: "~/htb", browse: true },
  { id: "setWordlistsPath", key: "wordlists_path", label: "Wordlist path ($WORDLIST_PATH)", placeholder: "/usr/share/wordlists", browse: true },
  { id: "setOpenvpnPath", key: "openvpn_path", label: "OpenVPN path (.ovpn folder)", placeholder: "~/vpn", browse: true }
];

// Base path loaded into the modal — compared on save to decide whether to
// reload the project list (the active project may now live elsewhere).
var _loadedProjectsBase = "";

function settingsFieldHtml(f){
  var browseBtn = f.browse
    ? '<button type="button" class="verify-btn" data-browse="' + f.id + '">[browse]</button>'
    : '';
  return '' +
    '<div class="settings-field">' +
      '<label for="' + f.id + '">' + escapeHtml(f.label) + '</label>' +
      '<div class="setting-row">' +
        '<input id="' + f.id + '" type="text" placeholder="' + escapeHtml(f.placeholder) + '" autocomplete="off" spellcheck="false">' +
        browseBtn +
        '<button type="button" class="verify-btn" data-verify="' + f.id + '">[verify]</button>' +
      '</div>' +
      '<div class="setting-status" id="status-' + f.id + '" hidden></div>' +
    '</div>';
}

/* Server-side folder picker for a path field. Lists directories via
   /api/list-dirs, lets the user descend / go up, and writes the chosen folder
   back into the given input. (Browsers can't open native folder dialogs for
   server-side paths, so this is a lightweight in-app browser.) */
function openDirBrowser(inputId){
  var input = document.getElementById(inputId);
  if (!input || document.getElementById("dirBrowserBackdrop")) return;
  var startPath = (input.value || "").trim() || "~";

  var back = document.createElement("div");
  back.className = "modal-backdrop";
  back.id = "dirBrowserBackdrop";
  back.innerHTML =
    '<div class="modal-dialog card dir-browser" role="dialog" aria-modal="true" aria-label="Choose folder">' +
      '<div class="modal-head"><h2 class="modal-title">Choose a folder</h2>' +
        '<button type="button" class="modal-close" data-db="close" aria-label="Close">x</button></div>' +
      '<div class="dir-browser-cur"><code id="dirBrowserPath"></code></div>' +
      '<div class="dir-browser-list" id="dirBrowserList"></div>' +
      '<div class="setting-status err" id="dirBrowserErr" hidden></div>' +
      '<div class="modal-foot"><div class="modal-actions">' +
        '<button type="button" class="modal-btn" data-db="close">[cancel]</button>' +
        '<button type="button" class="modal-btn primary" data-db="use">[use this folder]</button>' +
      '</div></div>' +
    '</div>';
  document.body.appendChild(back);

  var current = startPath;
  function close(){ back.remove(); document.removeEventListener("keydown", onKey); }
  function onKey(e){ if (e.key === "Escape") close(); }
  document.addEventListener("keydown", onKey);

  function load(path){
    apiFetch("/api/list-dirs?path=" + encodeURIComponent(path)).then(function(res){
      current = res.path;
      document.getElementById("dirBrowserErr").hidden = true;
      document.getElementById("dirBrowserPath").textContent = res.path;
      var list = document.getElementById("dirBrowserList");
      list.innerHTML = "";
      if (res.parent){
        var up = document.createElement("button");
        up.type = "button"; up.className = "dir-browser-item up"; up.textContent = "⬆ ..";
        up.addEventListener("click", function(){ load(res.parent); });
        list.appendChild(up);
      }
      (res.dirs || []).forEach(function(name){
        var row = document.createElement("button");
        row.type = "button"; row.className = "dir-browser-item";
        row.textContent = "📁 " + name;
        row.addEventListener("click", function(){ load(res.path.replace(/\/$/, "") + "/" + name); });
        list.appendChild(row);
      });
      if (!(res.dirs || []).length && !res.parent){
        list.innerHTML = '<div class="dir-browser-empty">no sub-folders</div>';
      } else if (!(res.dirs || []).length){
        list.insertAdjacentHTML("beforeend", '<div class="dir-browser-empty">no sub-folders here</div>');
      }
    }).catch(function(err){
      var e = document.getElementById("dirBrowserErr");
      if (e){ e.textContent = err.message; e.hidden = false; }
    });
  }

  back.addEventListener("click", function(e){
    if (e.target === back) return close();
    var act = e.target.getAttribute && e.target.getAttribute("data-db");
    if (act === "close") close();
    else if (act === "use"){ input.value = current; close(); }
  });
  load(startPath);
}

/* Checkboxes for which top-level modules show in the Notes tree, built from
   the loaded categories (DATA.categories from app.js). */
function modulesSectionHtml(){
  var cats = (typeof DATA !== "undefined" && DATA && DATA.categories) ? DATA.categories : [];
  if (!cats.length) return "";
  var boxes = cats.map(function(cat){
    return '' +
      '<label class="module-check">' +
        '<input type="checkbox" class="module-box" data-mod="' + escapeHtml(cat.id) + '">' +
        '<span>' + escapeHtml(cat.label) + '</span>' +
      '</label>';
  }).join("");
  return '' +
    '<div class="settings-field">' +
      '<label>Modules shown in Notes</label>' +
      '<div class="module-list">' + boxes + '</div>' +
    '</div>';
}

/* Checkboxes for which Workspace-dropdown options are shown, built from
   WORKSPACE_OPTIONS (app.js). "notes" is locked on — shown but read-only. */
function workspacesSectionHtml(){
  var opts = (typeof WORKSPACE_OPTIONS !== "undefined" && WORKSPACE_OPTIONS) ? WORKSPACE_OPTIONS : [];
  if (!opts.length) return "";
  var boxes = opts.map(function(o){
    var locked = !!o.locked;
    return '' +
      '<label class="module-check' + (locked ? " locked" : "") + '"' +
        (locked ? ' title="Notes is always available"' : "") + '>' +
        '<input type="checkbox" class="workspace-box" data-ws="' + escapeHtml(o.value) + '"' +
          (locked ? " checked disabled" : "") + '>' +
        '<span>' + escapeHtml(o.label) +
          (locked ? ' <em class="ws-locked-note">(always shown)</em>' : "") + '</span>' +
      '</label>';
  }).join("");
  return '' +
    '<div class="settings-field">' +
      '<label>Options shown in the Workspace dropdown</label>' +
      '<div class="module-list">' + boxes + '</div>' +
    '</div>';
}

/* Settings sections — a left-nav item + a right-pane body each. */
function pathsPanelBody(){
  return '' +
    '<p class="settings-sub">App-wide paths used by wordlist-based commands. Saved for every project.</p>' +
    SETTINGS_FIELDS.map(settingsFieldHtml).join("");
}
function modulesPanelBody(){
  return '' +
    '<p class="settings-sub">Choose which top-level modules appear in the Notes sidebar.</p>' +
    modulesSectionHtml();
}
function workspacesPanelBody(){
  return '' +
    '<p class="settings-sub">Choose which options appear in the Workspace dropdown. ' +
    'Hiding one only removes it from the dropdown — its data and state are kept, ' +
    'and it returns unchanged when re-enabled.</p>' +
    workspacesSectionHtml();
}
// The System monitor now opens from the sidebar's [system] button (see
// sysmon.js), so it's no longer a Settings section.
var SETTINGS_SECTIONS = [
  { id: "paths", label: "Paths", body: pathsPanelBody },
  { id: "modules", label: "Modules", body: modulesPanelBody },
  { id: "workspaces", label: "Workspace", body: workspacesPanelBody }
];

function settingsShowStatus(inputId, cls, text){
  var s = document.getElementById("status-" + inputId);
  if (!s) return;
  s.className = "setting-status " + cls;
  s.textContent = text;
  s.hidden = false;
}

function settingsVerify(inputId){
  var input = document.getElementById(inputId);
  if (!input) return;
  var path = input.value.trim();
  if (!path){ settingsShowStatus(inputId, "err", "enter a path first"); return; }
  settingsShowStatus(inputId, "checking", "checking…");
  apiFetch("/api/verify-path", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: path })
  }).then(function(res){
    if (res.ok) settingsShowStatus(inputId, "ok", "✓ " + (res.message || "ok"));
    else settingsShowStatus(inputId, "err", "✗ " + (res.message || "not found"));
  }).catch(function(err){
    settingsShowStatus(inputId, "err", "✗ " + err.message);
  });
}

function settingsSave(){
  var body = {};
  SETTINGS_FIELDS.forEach(function(f){
    var input = document.getElementById(f.id);
    if (input) body[f.key] = input.value.trim();
  });
  // Unchecked modules → hidden.
  var hidden = [];
  document.querySelectorAll(".module-box").forEach(function(box){
    if (!box.checked) hidden.push(box.getAttribute("data-mod"));
  });
  body.hidden_modules = hidden;

  // Unchecked workspace options → hidden (the locked "Notes" box is disabled,
  // so it can never end up here).
  var hiddenWs = [];
  document.querySelectorAll(".workspace-box").forEach(function(box){
    if (!box.disabled && !box.checked) hiddenWs.push(box.getAttribute("data-ws"));
  });
  body.hidden_workspaces = hiddenWs;

  var status = document.getElementById("settingsSaveStatus");
  if (status){ status.className = "setting-status checking"; status.textContent = "saving…"; status.hidden = false; }
  return apiFetch("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }).then(function(){
    if (status){ status.className = "setting-status ok"; status.textContent = "✓ saved"; }
    // Push the new base path + module visibility into the live UI.
    if (typeof applyWordlistPath === "function") applyWordlistPath(body.wordlists_path || "");
    if (typeof applyHiddenModules === "function") applyHiddenModules(hidden);
    if (typeof applyHiddenWorkspaces === "function") applyHiddenWorkspaces(hiddenWs);
    // If the projects base path changed, the project list now lives elsewhere —
    // reload it and re-render the current workspace so the UI follows.
    if ((body.projects_base_path || "") !== _loadedProjectsBase){
      _loadedProjectsBase = body.projects_base_path || "";
      if (typeof loadProjects === "function"){
        loadProjects().then(function(){
          if (typeof refreshActiveProject === "function") return refreshActiveProject();
        }).then(function(){
          if (typeof viewMode !== "undefined"){
            if (viewMode === "engagement" && typeof renderEngagementView === "function") renderEngagementView();
            else if (viewMode === "output" && typeof renderOutputView === "function") renderOutputView();
          }
        }).catch(function(){ /* leave current view as-is on error */ });
      }
    }
  }).catch(function(err){
    if (status){ status.className = "setting-status err"; status.textContent = "✗ " + err.message; }
  });
}

function closeSettingsModal(){
  var back = document.getElementById("settingsBackdrop");
  if (back) back.remove();
  document.removeEventListener("keydown", settingsEscHandler);
}

function settingsEscHandler(e){
  if (e.key === "Escape") closeSettingsModal();
}

function openSettingsModal(){
  if (document.getElementById("settingsBackdrop")) return;  // already open

  var back = document.createElement("div");
  back.className = "modal-backdrop";
  back.id = "settingsBackdrop";
  var navHtml = SETTINGS_SECTIONS.map(function(s, i){
    return '<button type="button" class="settings-nav-btn' + (i === 0 ? " active" : "") +
      '" data-section="' + s.id + '">' + escapeHtml(s.label) + '</button>';
  }).join("");
  var paneHtml = SETTINGS_SECTIONS.map(function(s, i){
    return '<section class="settings-section' + (i === 0 ? " active" : "") +
      '" data-section="' + s.id + '">' + s.body() + '</section>';
  }).join("");

  back.innerHTML =
    '<div class="modal-dialog settings-modal card" role="dialog" aria-modal="true" aria-label="Settings">' +
      '<div class="modal-head">' +
        '<h2 class="modal-title">Settings</h2>' +
        '<button type="button" class="modal-close" id="closeSettingsBtn" aria-label="Close settings">x</button>' +
      '</div>' +
      '<div class="settings-layout">' +
        '<nav class="settings-nav">' + navHtml + '</nav>' +
        '<div class="settings-content">' + paneHtml + '</div>' +
      '</div>' +
      '<div class="modal-foot">' +
        '<span class="setting-status" id="settingsSaveStatus" hidden></span>' +
        '<div class="modal-actions">' +
          '<button type="button" id="cancelSettingsBtn" class="modal-btn">[cancel]</button>' +
          '<button type="button" id="saveSettingsBtn" class="modal-btn primary">[save]</button>' +
        '</div>' +
      '</div>' +
    '</div>';

  document.body.appendChild(back);

  // Section switching (left nav ↔ right pane).
  back.querySelectorAll(".settings-nav-btn").forEach(function(navBtn){
    navBtn.addEventListener("click", function(){
      var id = navBtn.getAttribute("data-section");
      back.querySelectorAll(".settings-nav-btn").forEach(function(b){ b.classList.toggle("active", b === navBtn); });
      back.querySelectorAll(".settings-section").forEach(function(sec){
        sec.classList.toggle("active", sec.getAttribute("data-section") === id);
      });
    });
  });

  // Wiring.
  back.querySelectorAll("[data-verify]").forEach(function(btn){
    btn.addEventListener("click", function(){ settingsVerify(btn.getAttribute("data-verify")); });
  });
  back.querySelectorAll("[data-browse]").forEach(function(btn){
    btn.addEventListener("click", function(){ openDirBrowser(btn.getAttribute("data-browse")); });
  });
  document.getElementById("saveSettingsBtn").addEventListener("click", settingsSave);
  document.getElementById("cancelSettingsBtn").addEventListener("click", closeSettingsModal);
  document.getElementById("closeSettingsBtn").addEventListener("click", closeSettingsModal);
  back.addEventListener("click", function(e){ if (e.target === back) closeSettingsModal(); });
  document.addEventListener("keydown", settingsEscHandler);

  // Populate current values.
  apiFetch("/api/settings").then(function(res){
    var s = res.settings || {};
    SETTINGS_FIELDS.forEach(function(f){
      var input = document.getElementById(f.id);
      if (input) input.value = s[f.key] || "";
    });
    _loadedProjectsBase = s.projects_base_path || "";
    var hidden = Array.isArray(s.hidden_modules) ? s.hidden_modules : [];
    back.querySelectorAll(".module-box").forEach(function(box){
      box.checked = hidden.indexOf(box.getAttribute("data-mod")) === -1;  // checked = shown
    });
    var hiddenWs = Array.isArray(s.hidden_workspaces) ? s.hidden_workspaces : [];
    back.querySelectorAll(".workspace-box").forEach(function(box){
      if (box.disabled) return;  // locked "Notes" stays checked
      box.checked = hiddenWs.indexOf(box.getAttribute("data-ws")) === -1;  // checked = shown
    });
  }).catch(function(){ /* backend offline — leave placeholders */ });
}

(function(){
  function wire(){
    var toggle = document.getElementById("settingsToggle");
    if (toggle) toggle.addEventListener("click", openSettingsModal);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
