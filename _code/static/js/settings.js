"use strict";

/* Settings — opens as a big modal overlay (backdrop + centered dialog),
   triggered by the [settings] button at the bottom of the sidebar. App-wide
   filesystem locations (SecLists / wordlists paths) with a per-field [verify]
   button that checks the path on disk via /api/verify-path. Depends on
   apiFetch and escapeHtml from app.js (globals). */

var SETTINGS_FIELDS = [
  { id: "setWordlistsPath", key: "wordlists_path", label: "Wordlist path ($WORDLIST_PATH)", placeholder: "/usr/share/wordlists" }
];

function settingsFieldHtml(f){
  return '' +
    '<div class="settings-field">' +
      '<label for="' + f.id + '">' + escapeHtml(f.label) + '</label>' +
      '<div class="setting-row">' +
        '<input id="' + f.id + '" type="text" placeholder="' + escapeHtml(f.placeholder) + '" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="verify-btn" data-verify="' + f.id + '">[verify]</button>' +
      '</div>' +
      '<div class="setting-status" id="status-' + f.id + '" hidden></div>' +
    '</div>';
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
var SETTINGS_SECTIONS = [
  { id: "paths", label: "Paths", body: pathsPanelBody },
  { id: "modules", label: "Modules", body: modulesPanelBody }
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
  back.querySelectorAll(".verify-btn").forEach(function(btn){
    btn.addEventListener("click", function(){ settingsVerify(btn.getAttribute("data-verify")); });
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
    var hidden = Array.isArray(s.hidden_modules) ? s.hidden_modules : [];
    back.querySelectorAll(".module-box").forEach(function(box){
      box.checked = hidden.indexOf(box.getAttribute("data-mod")) === -1;  // checked = shown
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
