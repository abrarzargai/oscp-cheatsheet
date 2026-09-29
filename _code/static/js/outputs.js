"use strict";

/* Findings workspace — visualizes the saved command output for the active
   project (the "save output" tee tree, plus older scans/<tool>/… layouts).
   The backend (core/outputs.py) tags each file with a category + tool, so the
   sidebar is a hierarchy: Category › tool › files (e.g. Port Scanning › nmap ›
   all-ports.nmap). Files without a parser go under "Others (no parser)" ›
   folder › files and render raw. The overview merges every parsed file into a
   dashboard (open ports, web hits, creds). Reload re-reads from disk.

   Globals used from app.js: apiFetch, escapeHtml, setTreeLabel, viewMode,
   activeProject (projects.js). Exposes renderOutputView() globally. */

var outputFiles = [];        // [{name, rel, dir, ext, size, mtime, parseable, binary}]
var outputSelected = null;   // rel path of the open file
var outputLoading = false;
var outputSummary = null;    // /api/outputs/summary result for the overview
var OTHERS_LABEL = "Others (no parser)";
var OUTPUT_CATEGORY_ORDER = ["Port Scanning", "Web", "SMB", "Active Directory", "LDAP",
  "DNS", "SNMP", "Databases", "Brute Force", "Loot"];

function fmtBytes(n){
  if (n == null) return "";
  if (n < 1024) return n + " B";
  if (n < 1024*1024) return (n/1024).toFixed(1) + " KB";
  return (n/(1024*1024)).toFixed(1) + " MB";
}
function fmtAgo(ts){
  if (!ts) return "";
  var s = Math.floor(Date.now()/1000) - ts;
  if (s < 60) return "just now";
  if (s < 3600) return Math.floor(s/60) + "m ago";
  if (s < 86400) return Math.floor(s/3600) + "h ago";
  return Math.floor(s/86400) + "d ago";
}

/* Entry point — called by setMode("output") and on project change. Re-reads
   the tree from disk each time so it always reflects what's on disk. */
function renderOutputView(){
  var content = document.getElementById("content");
  var crumb = document.getElementById("breadcrumb");
  if (crumb) crumb.textContent = "";
  if (!content) return;

  if (typeof activeProject === "undefined" || !activeProject){
    document.getElementById("outputTree").innerHTML = "";
    content.innerHTML = '<div class="empty-state">No active project — create or select a machine to see its saved output.</div>';
    return;
  }

  outputLoading = true;
  buildOutputSidebar();
  content.innerHTML = '<div class="empty-state">Loading saved output…</div>';

  Promise.all([apiFetch("/api/outputs/tree"), apiFetch("/api/outputs/summary")]).then(function(both){
    var res = both[0];
    outputLoading = false;
    outputFiles = res.files || [];
    outputSummary = both[1];
    // Drop a stale selection if that file is gone.
    if (outputSelected && !outputFiles.some(function(f){ return f.rel === outputSelected; })){
      outputSelected = null;
    }
    buildOutputSidebar();
    if (outputSelected) showOutputFile(outputSelected);
    else showOutputOverview();
  }).catch(function(err){
    outputLoading = false;
    document.getElementById("outputTree").innerHTML = "";
    content.innerHTML = '<div class="empty-state">' + escapeHtml(err.message) + '</div>';
  });
}

function outputCategoryRank(label){
  var i = OUTPUT_CATEGORY_ORDER.indexOf(label);
  return i < 0 ? OUTPUT_CATEGORY_ORDER.length : i;
}
function sortCategories(labels){
  return labels.sort(function(a,b){
    return (outputCategoryRank(a) - outputCategoryRank(b)) || (a < b ? -1 : a > b ? 1 : 0);
  });
}

/* {category: {sub: [files]}} — parseable files nest by tool, the rest by folder. */
function outputHierarchy(){
  var h = {};
  outputFiles.forEach(function(f){
    var cat = f.parseable ? (f.category || "Other tools") : OTHERS_LABEL;
    var sub = f.parseable ? (f.tool || "misc") : (f.dir || "(project root)");
    var c = h[cat] = h[cat] || {};
    (c[sub] = c[sub] || []).push(f);
  });
  return h;
}

/* ---------- Sidebar: reload + hierarchical file tree ---------- */
function buildOutputSidebar(){
  var tree = document.getElementById("outputTree");
  if (!tree) return;
  tree.innerHTML = "";

  var head = document.createElement("div");
  head.className = "out-side-head";
  var title = document.createElement("button");
  title.type = "button";
  title.className = "out-side-title";
  title.title = "overview";
  title.textContent = "Findings" + (outputFiles.length ? " (" + outputFiles.length + ")" : "");
  title.addEventListener("click", function(){
    outputSelected = null;
    buildOutputSidebar();
    showOutputOverview();
  });
  head.appendChild(title);
  var reload = document.createElement("button");
  reload.type = "button";
  reload.className = "reload-icon";
  reload.title = "reload output from disk";
  reload.textContent = "↻";
  reload.addEventListener("click", renderOutputView);
  head.appendChild(reload);
  tree.appendChild(head);

  if (outputLoading){
    var l = document.createElement("div"); l.className = "out-side-empty"; l.textContent = "loading…";
    tree.appendChild(l); return;
  }
  if (!outputFiles.length){
    var e = document.createElement("div"); e.className = "out-side-empty";
    e.textContent = "No saved output yet. Enable “save output” and run a scan.";
    tree.appendChild(e); return;
  }

  var h = outputHierarchy();
  var cats = sortCategories(Object.keys(h).filter(function(c){ return c !== OTHERS_LABEL; }));
  if (h[OTHERS_LABEL]) cats.push(OTHERS_LABEL);
  cats.forEach(function(cat){
    tree.appendChild(outputCategoryFolder(cat, h[cat], cat === OTHERS_LABEL));
  });
}

function outputCategoryFolder(label, subs, isOthers){
  var count = 0;
  Object.keys(subs).forEach(function(k){ count += subs[k].length; });
  var details = document.createElement("details");
  details.className = "tree-folder" + (isOthers ? " out-others" : "");
  details.open = !isOthers || !!(outputSelected && subsContain(subs, outputSelected));
  var summary = document.createElement("summary");
  setTreeLabel(summary, "[" + label + "] " + count);
  details.appendChild(summary);
  var wrap = document.createElement("div");
  wrap.className = "tree-children";
  Object.keys(subs).sort().forEach(function(sub){
    var sd = document.createElement("details");
    sd.className = "tree-folder";
    sd.open = true;
    var ss = document.createElement("summary");
    setTreeLabel(ss, sub + "/");
    sd.appendChild(ss);
    var sw = document.createElement("div");
    sw.className = "tree-children";
    subs[sub].sort(function(a,b){ return a.rel < b.rel ? -1 : 1; }).forEach(function(f){
      sw.appendChild(outputFileButton(f, isOthers));
    });
    sd.appendChild(sw);
    wrap.appendChild(sd);
  });
  details.appendChild(wrap);
  return details;
}

function subsContain(subs, rel){
  return Object.keys(subs).some(function(k){
    return subs[k].some(function(f){ return f.rel === rel; });
  });
}

function outputFileButton(f, isOthers){
  var btn = document.createElement("button");
  btn.type = "button";
  btn.className = "tree-file out-file" + (f.rel === outputSelected ? " active" : "");
  btn.title = f.rel + " · " + fmtAgo(f.mtime);
  btn.innerHTML = '<span class="out-file-name">' + escapeHtml(f.name) + '</span>' +
    '<span class="out-file-meta">' + (f.binary ? "bin" : fmtBytes(f.size)) + '</span>';
  btn.addEventListener("click", function(){ openOutputFile(f.rel); });
  return btn;
}

function openOutputFile(rel){
  outputSelected = rel;
  buildOutputSidebar();
  showOutputFile(rel);
}

/* ---------- Content: overview dashboard when nothing selected ---------- */
function showOutputOverview(){
  var content = document.getElementById("content");
  if (!content) return;
  var html = '<div class="out-view">' + outputHeader("Findings · " + activeProject.name, "");
  if (!outputFiles.length){
    html += '<div class="empty-state">No saved command output for <b>' +
      escapeHtml(activeProject.name) + '</b> yet.<br>Tick <b>save output</b> in the top bar, run a scan/enum command, then hit reload.</div></div>';
    content.innerHTML = html;
    wireOutputHeader();
    return;
  }
  var sm = outputSummary || {};
  var ports = sm.ports || [], creds = sm.creds || [];

  html += '<div class="out-stats">' +
    outStat(sm.files || outputFiles.length, "files") +
    outStat(sm.parsed || 0, "parsed") +
    outStat(ports.length, "open ports") +
    outStat(sm.web_total || 0, "web hits") +
    outStat(creds.length, "valid creds") +
    '</div>';
  if ((sm.hosts || []).length){
    html += '<div class="out-meta-line">hosts: ' + sm.hosts.map(function(h){ return '<b>' + escapeHtml(h) + '</b>'; }).join(", ") + '</div>';
  }

  // Category cards — click jumps to the first file in that category.
  html += '<div class="out-overview">';
  var cats = sortCategories(Object.keys(sm.categories || {}).filter(function(c){ return c !== "Others"; }));
  if ((sm.categories || {}).Others) cats.push("Others");
  cats.forEach(function(g){
    html += '<button type="button" class="out-ov-card" data-cat="' + escapeHtml(g) + '"><div class="out-ov-count">' + sm.categories[g] +
      '</div><div class="out-ov-label">' + escapeHtml(g === "Others" ? OTHERS_LABEL : g) + '</div></button>';
  });
  html += '</div>';

  if (ports.length){
    html += outSection("Open ports", ports.length + " unique across all scans");
    html += '<div class="out-port-grid">';
    ports.forEach(function(p){
      html += '<div class="out-port-chip" title="' + escapeHtml(p.sources.join("\n")) + '">' +
        '<span class="out-port-num">' + p.port + '<small>/' + escapeHtml(p.protocol) + '</small></span>' +
        '<span class="out-port-svc">' + escapeHtml(p.service || "?") + '</span>' +
        (p.version ? '<span class="out-port-ver">' + escapeHtml(p.version) + '</span>' : '') +
        '<span class="out-port-src">' + p.sources.length + ' scan' + (p.sources.length === 1 ? '' : 's') + '</span>' +
        '</div>';
    });
    html += '</div>';
  }

  if (sm.web_total){
    var ws = sm.web_status || {};
    html += outSection("Web content", sm.web_total + " unique path(s)");
    html += '<div class="out-bar">';
    ["2xx","3xx","4xx","5xx","?"].forEach(function(k){
      if (!ws[k]) return;
      var cls = {"2xx":"ok","3xx":"redir","4xx":"client","5xx":"server","?":""}[k];
      html += '<div class="out-bar-seg ' + cls + '" style="flex:' + ws[k] + '" title="' + k + ': ' + ws[k] + '">' + k + ' · ' + ws[k] + '</div>';
    });
    html += '</div>';
    var interesting = (sm.web || []).filter(function(r){ return /^[23]/.test(r.status); }).slice(0, 25);
    if (interesting.length){
      html += '<table class="nmap-table"><thead><tr><th>Status</th><th>Path</th><th>Source</th></tr></thead><tbody>';
      interesting.forEach(function(r){
        html += '<tr><td><span class="out-status ' + webStatusClass(r.status) + '">' + escapeHtml(r.status) + '</span></td>' +
          '<td class="out-path">' + escapeHtml(r.path) + '</td>' +
          '<td><a href="#" class="out-src-link" data-rel="' + escapeHtml(r.source) + '">' + escapeHtml(r.source.split("/").pop()) + '</a></td></tr>';
      });
      html += '</tbody></table>';
    }
  }

  if (creds.length){
    html += outSection("Credentials", creds.length + " valid");
    html += '<div class="out-cred-list">';
    creds.forEach(function(r){
      html += '<div class="out-cred-row ' + r.status + '">' +
        '<span class="cred-badge ' + r.status + '">' + r.status + '</span>' +
        '<span class="out-cred-user">' + escapeHtml(r.user || "") + '</span>' +
        (r.secret ? '<span class="out-cred-sep">:</span><span class="out-cred-secret">' + escapeHtml(r.secret) + '</span>' : '') +
        '<a href="#" class="out-src-link out-cred-src" data-rel="' + escapeHtml(r.source) + '">' + escapeHtml(r.source.split("/").pop()) + '</a>' +
        '</div>';
    });
    html += '</div>';
  }

  html += '</div>';
  content.innerHTML = html;
  wireOutputHeader();

  content.querySelectorAll(".out-src-link").forEach(function(a){
    a.addEventListener("click", function(ev){ ev.preventDefault(); openOutputFile(a.getAttribute("data-rel")); });
  });
  content.querySelectorAll(".out-ov-card").forEach(function(card){
    card.addEventListener("click", function(){
      var cat = card.getAttribute("data-cat");
      var first = outputFiles.filter(function(f){
        return cat === "Others" ? !f.parseable : (f.parseable && f.category === cat);
      }).sort(function(a,b){ return a.rel < b.rel ? -1 : 1; })[0];
      if (first) openOutputFile(first.rel);
    });
  });
}

function outStat(n, label){
  return '<div class="out-stat"><div class="out-stat-num">' + n + '</div><div class="out-stat-label">' + escapeHtml(label) + '</div></div>';
}
function outSection(title, sub){
  return '<div class="out-section"><span class="out-section-title">' + escapeHtml(title) + '</span>' +
    (sub ? '<span class="out-section-sub">' + escapeHtml(sub) + '</span>' : '') + '</div>';
}

function outputHeader(titleText, sub){
  return '<div class="out-header">' +
    '<div class="out-header-titles"><div class="out-title">' + escapeHtml(titleText) + '</div>' +
    (sub ? '<div class="out-sub">' + escapeHtml(sub) + '</div>' : '') + '</div>' +
    '<button type="button" class="reload-icon" id="outReloadBtn" title="reload output from disk">↻</button>' +
    '</div>';
}
function wireOutputHeader(){
  var b = document.getElementById("outReloadBtn");
  if (b) b.addEventListener("click", renderOutputView);
}

/* ---------- Content: one file ---------- */
function showOutputFile(rel){
  var content = document.getElementById("content");
  if (!content) return;
  content.innerHTML = '<div class="out-view">' + outputHeader(rel, "loading…") + '</div>';
  wireOutputHeader();

  apiFetch("/api/outputs/file?path=" + encodeURIComponent(rel)).then(function(res){
    var body = renderParsed(res);
    var sub = [res.category, res.tool].filter(Boolean).join(" › ");
    sub = (sub ? sub + " · " : "") + fmtBytes(res.size) + (res.truncated ? " · truncated" : "") +
      (res.parser ? "" : " · no parser (raw)");
    content.innerHTML = '<div class="out-view">' + outputHeader(rel, sub) + body + '</div>';
    wireOutputHeader();
  }).catch(function(err){
    content.innerHTML = '<div class="out-view">' + outputHeader(rel, "") +
      '<div class="empty-state">' + escapeHtml(err.message) + '</div></div>';
    wireOutputHeader();
  });
}

function rawBlock(res){
  var note = res.truncated ? '<div class="out-note">Showing first part only (file is large).</div>' : '';
  if (res.binary) return '<div class="empty-state">Binary file — not previewed.</div>';
  var raw = (res.raw || "").trim();
  if (!raw) return '<div class="empty-state">Empty file.</div>';
  return note + '<pre class="out-raw"><code>' + escapeHtml(raw) + '</code></pre>';
}

function renderParsed(res){
  var p = res.parsed;
  if (res.parse_error) return '<div class="out-note out-err">Parser error: ' + escapeHtml(res.parse_error) + '</div>' + rawBlock(res);
  if (!p) return rawBlock(res);

  var html = "";
  if (p.type === "ports"){
    if (p.host) html += '<div class="out-meta-line">host: <b>' + escapeHtml(p.host) + '</b></div>';
    if (!p.ports.length) return html + rawBlock(res);
    var open = p.ports.filter(function(pt){ return pt.state === "open"; }).length;
    html += '<div class="out-meta-line">' + open + ' open / ' + p.ports.length + ' port(s)</div>';
    html += '<table class="nmap-table"><thead><tr><th>Port</th><th>State</th><th>Service</th><th>Version</th></tr></thead><tbody>';
    p.ports.forEach(function(pt){
      var cls = pt.state === "open" ? "open" : (pt.state.indexOf("filtered") >= 0 ? "filtered" : "closed");
      html += '<tr><td><b>' + pt.port + '/' + escapeHtml(pt.protocol) + '</b></td>' +
        '<td><span class="port-state ' + cls + '">' + escapeHtml(pt.state) + '</span></td>' +
        '<td>' + escapeHtml(pt.service || "") + '</td>' +
        '<td>' + escapeHtml(pt.version || "") + '</td></tr>';
      (pt.scripts || []).forEach(function(sc){
        html += '<tr class="out-script-row"><td></td><td colspan="3"><details><summary>' + escapeHtml(sc.id) +
          '</summary><pre class="out-raw"><code>' + escapeHtml(sc.output) + '</code></pre></details></td></tr>';
      });
    });
    html += '</tbody></table>';
    return html + collapsibleRaw(res);
  }

  if (p.type === "web"){
    if (!p.rows.length) return rawBlock(res);
    html += '<div class="out-meta-line">' + p.rows.length + ' path(s) found</div>';
    html += '<table class="nmap-table"><thead><tr><th>Status</th><th>Path</th><th>Size</th></tr></thead><tbody>';
    p.rows.forEach(function(r){
      html += '<tr><td><span class="out-status ' + webStatusClass(r.status) + '">' + escapeHtml(r.status || "?") + '</span></td>' +
        '<td class="out-path">' + escapeHtml(r.path) + '</td>' +
        '<td>' + escapeHtml(r.size || "") + '</td></tr>';
    });
    html += '</tbody></table>';
    return html + collapsibleRaw(res);
  }

  if (p.type === "creds"){
    var results = p.results || [];
    if (!results.length) return rawBlock(res);
    var order = { pwned: 0, valid: 1, failed: 2 };
    results.sort(function(a,b){ return (order[a.status] || 3) - (order[b.status] || 3); });
    html += '<div class="out-cred-list">';
    results.forEach(function(r){
      html += '<div class="out-cred-row ' + r.status + '">' +
        '<span class="cred-badge ' + r.status + '">' + r.status + '</span>' +
        '<span class="out-cred-user">' + escapeHtml(r.user || "") + '</span>' +
        (r.secret ? '<span class="out-cred-sep">:</span><span class="out-cred-secret">' + escapeHtml(r.secret) + '</span>' : '') +
        '</div>';
    });
    html += '</div>';
    return html + collapsibleRaw(res);
  }

  return rawBlock(res);
}

function webStatusClass(s){
  var n = parseInt(s, 10);
  if (n >= 200 && n < 300) return "ok";
  if (n >= 300 && n < 400) return "redir";
  if (n >= 400 && n < 500) return "client";
  if (n >= 500) return "server";
  return "";
}

// Parsed views keep the raw output one click away (verification / scripts).
function collapsibleRaw(res){
  var raw = (res.raw || "").trim();
  if (!raw) return "";
  return '<details class="out-rawtoggle"><summary>raw output</summary>' + rawBlock(res) + '</details>';
}
