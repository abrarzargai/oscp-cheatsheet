"use strict";

/* System monitor — a wide (80vw × 80vh) modal opened from the sidebar [system]
   button. Top row of stat cards (RAM, Swap, CPU, each real disk):
     • clicking RAM or CPU sorts the process table by that resource (desc);
     • clicking any card also opens a detail panel (total / used / free …).
   The process list has a live search (PID / user / command) and each row has a
   single kill button that opens a terminal for `sudo kill`, confirmed via an
   in-app modal (not the browser's). Reads /api/system, posts /api/system/kill.
   Globals from app.js: apiFetch, escapeHtml. Exposes openSystemMonitor(). */

var SYSMON_REFRESH_MS = 4000;
var sysmonState = { sort: "rss", timer: null, data: null, top: 120, query: "", detail: null };

function sysFmtBytes(n){
  if (n == null) return "—";
  if (n < 1024) return n + " B";
  var u = ["KB","MB","GB","TB"], i = -1;
  do { n /= 1024; i++; } while (n >= 1024 && i < u.length - 1);
  return n.toFixed(n < 10 ? 1 : 0) + " " + u[i];
}
function sysFmtUptime(s){
  if (!s) return "—";
  var d = Math.floor(s/86400), h = Math.floor((s%86400)/3600), m = Math.floor((s%3600)/60);
  if (d) return d + "d " + h + "h";
  if (h) return h + "h " + m + "m";
  return m + "m";
}
function sysPctClass(p){ return p >= 90 ? "crit" : p >= 75 ? "warn" : "ok"; }

function openSystemMonitor(){
  if (document.getElementById("sysmonBackdrop")) return;
  var back = document.createElement("div");
  back.className = "modal-backdrop";
  back.id = "sysmonBackdrop";
  back.innerHTML =
    '<div class="modal-dialog sysmon-modal card" role="dialog" aria-modal="true" aria-label="System monitor">' +
      '<div class="modal-head">' +
        '<h2 class="modal-title">System monitor <span class="sysmon-host" id="sysmonHost"></span></h2>' +
        '<div class="sysmon-head-actions">' +
          '<label class="sysmon-auto"><input type="checkbox" id="sysmonAuto" checked> auto</label>' +
          '<button type="button" class="reload-icon" id="sysmonReload" title="reload">↻</button>' +
          '<button type="button" class="modal-close" id="sysmonClose" aria-label="Close">x</button>' +
        '</div>' +
      '</div>' +
      '<div class="sysmon-cards" id="sysmonCards"></div>' +
      '<div class="sysmon-detail" id="sysmonDetail" hidden></div>' +
      '<div class="sysmon-proc-head">' +
        '<div class="sysmon-proc-titles">' +
          '<span id="sysmonProcTitle">Processes by memory</span>' +
          '<span class="sysmon-proc-note" id="sysmonProcNote"></span>' +
        '</div>' +
        '<div class="sysmon-search-wrap">' +
          '<input type="search" id="sysmonSearch" class="sysmon-search" placeholder="search pid / user / command…" autocomplete="off" spellcheck="false">' +
        '</div>' +
      '</div>' +
      '<div class="sysmon-proc-wrap" id="sysmonProcWrap">' +
        '<div class="empty-state">Loading…</div>' +
      '</div>' +
    '</div>';
  document.body.appendChild(back);

  document.getElementById("sysmonClose").addEventListener("click", closeSystemMonitor);
  document.getElementById("sysmonReload").addEventListener("click", function(){ sysmonLoad(); });
  document.getElementById("sysmonAuto").addEventListener("change", function(){
    if (this.checked) sysmonStartTimer(); else sysmonStopTimer();
  });
  var search = document.getElementById("sysmonSearch");
  search.value = sysmonState.query;
  search.addEventListener("input", function(){
    sysmonState.query = this.value;
    if (sysmonState.data) sysmonRenderProcs(sysmonState.data);  // filter without refetch
  });
  back.addEventListener("click", function(e){ if (e.target === back) closeSystemMonitor(); });
  document.addEventListener("keydown", sysmonEsc);

  sysmonLoad();
  sysmonStartTimer();
}

function sysmonEsc(e){
  if (e.key !== "Escape") return;
  // A confirm dialog on top takes Escape first.
  var cd = document.getElementById("sysmonConfirm");
  if (cd){ cd.remove(); return; }
  closeSystemMonitor();
}
function closeSystemMonitor(){
  sysmonStopTimer();
  var b = document.getElementById("sysmonBackdrop");
  if (b) b.remove();
  var cd = document.getElementById("sysmonConfirm");
  if (cd) cd.remove();
  document.removeEventListener("keydown", sysmonEsc);
}
function sysmonStartTimer(){
  sysmonStopTimer();
  sysmonState.timer = setInterval(function(){ sysmonLoad(true); }, SYSMON_REFRESH_MS);
}
function sysmonStopTimer(){
  if (sysmonState.timer){ clearInterval(sysmonState.timer); sysmonState.timer = null; }
}

function sysmonLoad(quiet){
  var reload = document.getElementById("sysmonReload");
  if (reload && !quiet) reload.classList.add("spin");
  apiFetch("/api/system?top=" + sysmonState.top + "&sort=" + sysmonState.sort).then(function(res){
    sysmonState.data = res;
    sysmonRenderCards(res);
    sysmonRenderDetail(res);
    sysmonRenderProcs(res);
    var host = document.getElementById("sysmonHost");
    if (host) host.textContent = res.hostname ? "· " + res.hostname : "";
    if (reload) reload.classList.remove("spin");
  }).catch(function(err){
    if (reload) reload.classList.remove("spin");
    var wrap = document.getElementById("sysmonProcWrap");
    if (wrap && !quiet) wrap.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
  });
}

function sysmonCard(id, active, title, big, sub, pct){
  var bar = pct != null
    ? '<div class="sysmon-bar"><span class="sysmon-bar-fill ' + sysPctClass(pct) +
        '" style="width:' + Math.min(pct,100) + '%"></span></div>' : '';
  return '<button type="button" class="sysmon-card' + (active ? " active" : "") +
    (sysmonState.detail === id ? " detail-open" : "") +
    '" data-card="' + id + '">' +
    '<div class="sysmon-card-title">' + escapeHtml(title) + '</div>' +
    '<div class="sysmon-card-big">' + big + (pct != null ? '<span class="sysmon-card-pct ' +
      sysPctClass(pct) + '">' + pct + '%</span>' : '') + '</div>' +
    bar +
    '<div class="sysmon-card-sub">' + sub + '</div>' +
    '</button>';
}

function sysmonRenderCards(res){
  var cards = document.getElementById("sysmonCards");
  if (!cards) return;
  var m = res.memory || {}, c = res.cpu || {}, active = sysmonState.sort;
  var html = "";
  html += sysmonCard("rss", active === "rss", "RAM",
    sysFmtBytes(m.used), sysFmtBytes(m.used) + " / " + sysFmtBytes(m.total), m.percent);
  if (m.swap_total){
    html += sysmonCard("swap", false, "Swap",
      sysFmtBytes(m.swap_used), sysFmtBytes(m.swap_used) + " / " + sysFmtBytes(m.swap_total), m.swap_percent);
  }
  html += sysmonCard("cpu", active === "cpu", "CPU",
    (c.percent != null ? c.percent : 0) + "<small>%</small>",
    (c.cores || 1) + " cores · load " + (c.load ? c.load.join(" ") : "—") + " · up " + sysFmtUptime(c.uptime),
    c.percent);
  (res.disks || []).forEach(function(d, i){
    html += sysmonCard("disk" + i, false, "Disk " + escapeHtml(d.mount),
      sysFmtBytes(d.used), sysFmtBytes(d.free) + " free / " + sysFmtBytes(d.total) + " · " + escapeHtml(d.fstype), d.percent);
  });
  cards.innerHTML = html;

  cards.querySelectorAll(".sysmon-card").forEach(function(card){
    card.addEventListener("click", function(){
      var id = card.getAttribute("data-card");
      // RAM / CPU also re-sort the process table.
      if ((id === "cpu" || id === "rss") && sysmonState.sort !== id){
        sysmonState.sort = id;
        sysmonLoad();
        sysmonState.detail = id;
        return;
      }
      // Toggle the detail panel for the clicked card.
      sysmonState.detail = (sysmonState.detail === id) ? null : id;
      sysmonRenderCards(sysmonState.data);
      sysmonRenderDetail(sysmonState.data);
    });
  });
}

/* Expanded breakdown for whichever card is selected (total / used / free …). */
function sysmonRenderDetail(res){
  var el = document.getElementById("sysmonDetail");
  if (!el) return;
  var id = sysmonState.detail;
  if (!id){ el.hidden = true; el.innerHTML = ""; return; }
  var rows = [];
  var m = res.memory || {}, c = res.cpu || {};
  if (id === "rss"){
    rows = [["Total", sysFmtBytes(m.total)], ["Used", sysFmtBytes(m.used)],
            ["Available", sysFmtBytes(m.available)], ["Usage", (m.percent || 0) + "%"]];
    if (m.swap_total) rows.push(["Swap used", sysFmtBytes(m.swap_used) + " / " + sysFmtBytes(m.swap_total)]);
  } else if (id === "swap"){
    rows = [["Total", sysFmtBytes(m.swap_total)], ["Used", sysFmtBytes(m.swap_used)],
            ["Free", sysFmtBytes(m.swap_total - m.swap_used)], ["Usage", (m.swap_percent || 0) + "%"]];
  } else if (id === "cpu"){
    rows = [["Cores", String(c.cores || 1)], ["Usage", (c.percent || 0) + "%"],
            ["Load (1/5/15m)", c.load ? c.load.join("  ") : "—"], ["Uptime", sysFmtUptime(c.uptime)]];
  } else if (id.indexOf("disk") === 0){
    var d = (res.disks || [])[parseInt(id.slice(4), 10)];
    if (d) rows = [["Device", d.device], ["Mount", d.mount], ["Filesystem", d.fstype],
                   ["Total", sysFmtBytes(d.total)], ["Used", sysFmtBytes(d.used) + " (" + d.percent + "%)"],
                   ["Free", sysFmtBytes(d.free)]];
  }
  if (!rows.length){ el.hidden = true; el.innerHTML = ""; return; }
  el.hidden = false;
  el.innerHTML = rows.map(function(r){
    return '<div class="sysmon-detail-item"><span class="sysmon-detail-k">' + escapeHtml(r[0]) +
      '</span><span class="sysmon-detail-v">' + escapeHtml(String(r[1])) + '</span></div>';
  }).join("");
}

function sysmonRenderProcs(res){
  var wrap = document.getElementById("sysmonProcWrap");
  var title = document.getElementById("sysmonProcTitle");
  var note = document.getElementById("sysmonProcNote");
  if (!wrap) return;
  if (title) title.textContent = "Processes by " + (sysmonState.sort === "cpu" ? "CPU" : "memory");

  var procs = res.processes || [];
  var q = (sysmonState.query || "").trim().toLowerCase();
  if (q){
    procs = procs.filter(function(p){
      return String(p.pid).indexOf(q) === 0 ||
        (p.user || "").toLowerCase().indexOf(q) !== -1 ||
        (p.cmd || p.name || "").toLowerCase().indexOf(q) !== -1;
    });
  }
  if (note){
    var base = res.has_psutil ? "" : "CPU% needs psutil";
    var count = q ? procs.length + " match" + (procs.length === 1 ? "" : "es") : (res.processes || []).length + " shown";
    note.textContent = base ? base + " · " + count : count;
  }

  if (!procs.length){
    wrap.innerHTML = '<div class="empty-state">' + (q ? "No process matches “" + escapeHtml(q) + "”." : "No processes.") + '</div>';
    return;
  }

  var html = '<table class="sysmon-table"><thead><tr>' +
    '<th class="num">PID</th><th>User</th><th class="num">Memory</th>' +
    '<th class="memcol">Usage</th><th class="num">CPU</th><th>Command</th><th class="killcol"></th>' +
    '</tr></thead><tbody>';
  procs.forEach(function(p){
    html += '<tr>' +
      '<td class="num sysmon-pid">' + p.pid + '</td>' +
      '<td class="sysmon-user">' + escapeHtml(p.user || "") + '</td>' +
      '<td class="num">' + sysFmtBytes(p.rss) + '</td>' +
      '<td class="memcol"><div class="sysmon-memcell"><span class="sysmon-minibar"><span class="sysmon-minibar-fill ' +
        sysPctClass(p.mem_percent) + '" style="width:' + Math.min(p.mem_percent,100) + '%"></span></span>' +
        '<span class="sysmon-mempct">' + (p.mem_percent || 0) + '%</span></div></td>' +
      '<td class="num">' + (p.cpu != null ? p.cpu : 0) + '</td>' +
      '<td class="sysmon-cmd" title="' + escapeHtml(p.cmd || "") + '">' + escapeHtml(p.cmd || p.name || "") + '</td>' +
      '<td class="killcol">' +
        '<button type="button" class="sysmon-kill" data-pid="' + p.pid + '" data-name="' +
        escapeHtml(p.name || "") + '" title="open a terminal and sudo kill this process">✕ kill</button>' +
      '</td>' +
    '</tr>';
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;

  wrap.querySelectorAll(".sysmon-kill").forEach(function(btn){
    btn.addEventListener("click", function(){
      sysmonKill(btn.getAttribute("data-pid"), btn.getAttribute("data-name"), btn);
    });
  });
}

/* In-app confirm dialog (replaces window.confirm). onYes runs if confirmed. */
function sysmonConfirmDialog(title, body, onYes){
  var old = document.getElementById("sysmonConfirm");
  if (old) old.remove();
  var d = document.createElement("div");
  d.className = "sysmon-confirm-backdrop";
  d.id = "sysmonConfirm";
  d.innerHTML =
    '<div class="sysmon-confirm card" role="alertdialog" aria-modal="true">' +
      '<div class="sysmon-confirm-title">' + escapeHtml(title) + '</div>' +
      '<div class="sysmon-confirm-body">' + body + '</div>' +
      '<div class="sysmon-confirm-actions">' +
        '<button type="button" class="modal-btn" id="sysmonConfirmNo">[cancel]</button>' +
        '<button type="button" class="modal-btn danger" id="sysmonConfirmYes">[kill]</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(d);
  function close(){ d.remove(); }
  d.addEventListener("click", function(e){ if (e.target === d) close(); });
  d.querySelector("#sysmonConfirmNo").addEventListener("click", close);
  d.querySelector("#sysmonConfirmYes").addEventListener("click", function(){ close(); onYes(); });
  d.querySelector("#sysmonConfirmYes").focus();
}

// One action: open a terminal running `sudo kill <pid>` so the user can enter
// their password and confirm. Confirmation uses the in-app dialog above.
function sysmonKill(pid, name, btn){
  var body = 'Open a terminal to run <code>sudo kill ' + escapeHtml(String(pid)) + '</code>' +
    (name ? ' for <b>' + escapeHtml(name) + '</b>' : '') + '?';
  sysmonConfirmDialog("Kill process", body, function(){
    var row = btn.closest("tr");
    if (row) row.classList.add("sysmon-killing");
    apiFetch("/api/system/kill", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pid: Number(pid), terminal: true })
    }).then(function(res){
      if (!res.ok){
        if (row) row.classList.remove("sysmon-killing");
        sysmonConfirmDialog("Error", escapeHtml(res.error || "could not open terminal"), function(){});
        return;
      }
      setTimeout(function(){ sysmonLoad(); }, 1500);
    }).catch(function(err){
      if (row) row.classList.remove("sysmon-killing");
      sysmonConfirmDialog("Error", escapeHtml(err.message), function(){});
    });
  });
}

/* Wire the sidebar [system] button. */
(function(){
  function wire(){
    var btn = document.getElementById("sysmonToggle");
    if (btn) btn.addEventListener("click", openSystemMonitor);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wire);
  else wire();
})();
