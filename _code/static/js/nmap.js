"use strict";

/* Port Scanning: playbook tool tabs (nmap/rustscan), quick presets, the
   command builder, and each tool's own results table (state filter +
   [copy ports] toolbar, [details] expand for nmap's NSE script output).
   Per-port checklist items (checklist.js's renderChecklistItems()) aren't
   wired into these result tables for now — the data still comes back from
   the API (see p.checklist/p.checked), just unused here until that's
   revisited. */
  /* ---------- Playbook (Engagement sidebar categories) ---------- */
  var PLAYBOOK = null;
  var activePlaybookCategory = null; // e.g. "port_scanning"

  function loadPlaybook(){
    if (PLAYBOOK) return Promise.resolve(PLAYBOOK);
    return apiFetch("/api/playbook").then(function(res){
      PLAYBOOK = res.groups || [];
      return PLAYBOOK;
    }).catch(function(){
      PLAYBOOK = [];
      return PLAYBOOK;
    });
  }

  function currentPlaybookCategory(){
    if (!PLAYBOOK) return null;
    for (var i=0;i<PLAYBOOK.length;i++){
      var cats = PLAYBOOK[i].categories || [];
      for (var j=0;j<cats.length;j++){
        if (cats[j].id === activePlaybookCategory) return cats[j];
      }
    }
    return null;
  }

  function renderEngagementSidebar(){
    var treeEl = document.getElementById("engagementTree");
    if (!treeEl) return;
    treeEl.innerHTML = "";
    (PLAYBOOK || []).forEach(function(group){
      var details = document.createElement("details");
      details.className = "tree-folder";
      details.open = true;
      var summary = document.createElement("summary");
      setTreeLabel(summary, "[" + group.label + "]");
      details.appendChild(summary);

      var childWrap = document.createElement("div");
      childWrap.className = "tree-children";
      (group.categories || []).forEach(function(cat){
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tree-file";
        if (cat.id === activePlaybookCategory) btn.classList.add("active");
        btn.textContent = cat.label;
        btn.title = cat.label;
        btn.addEventListener("click", function(){
          activePlaybookCategory = cat.id;
          renderEngagementSidebar();
          renderEngagementView();
        });
        childWrap.appendChild(btn);
      });
      details.appendChild(childWrap);
      treeEl.appendChild(details);
    });
  }

  /* ---------- Engagement view rendering ---------- */
  function engagementShell(){
    if (!activeProject){
      return '<div class="empty-state">No active project.<br>Use the Project selector in the top bar to create or pick one.</div>';
    }
    var p = activeProject;
    var cat = currentPlaybookCategory();
    var html = '<div class="engagement">';
    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>[' + escapeHtml(p.name) + ']</h3></div>';
    html += '<div class="eng-meta">target: <b>' + escapeHtml(p.target_ip || "-") + '</b>';
    if (p.domain) html += ' &middot; domain: <b>' + escapeHtml(p.domain) + '</b>';
    if (p.dc_ip) html += ' &middot; dc_ip: <b>' + escapeHtml(p.dc_ip) + '</b>';
    html += ' &middot; ~/htb/' + escapeHtml(p.name) + '</div>';
    html += '</div>';

    if (cat && cat.tools){
      html += portScanningShell(cat);
    } else if (cat && cat.cred_checker){
      html += credCheckerShell(cat);
    } else {
      html += genericPresetShell(cat);
    }
    html += '</div>';
    return html;
  }

  function genericPresetShell(cat){
    var html = '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>' + escapeHtml(cat ? cat.label : "Recon scans") + '</h3></div>';
    html += '<div class="preset-list" id="presetList"></div>';
    html += '</div>';

    if (cat && cat.output){
      html += '<div class="eng-section">';
      html += '<div class="eng-head-row"><h3>Saved output</h3>';
      html += '<button type="button" class="checklist-toggle" id="reloadPresetOutputsBtn">[reload data]</button>';
      html += '</div>';
      html += '<div class="scan-tabs" id="presetFileTabs"></div>';
      html += '<div id="presetOutputView"></div>';
      html += '</div>';
    }
    return html;
  }

  function credCheckerShell(cat){
    var html = '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>' + escapeHtml(cat.label) + '</h3>';
    html += '<button type="button" class="checklist-toggle" id="reloadCredsBtn">[reload data]</button>';
    html += '</div>';

    html += '<div class="eng-subhead">Services (click to toggle — check more than one in the same run)</div>';
    html += '<div class="tool-tabs" id="credServiceTabs"></div>';

    html += '<div class="eng-subhead">Mode</div>';
    html += '<div class="tool-tabs" id="credModeTabs"></div>';

    html += '<div class="eng-subhead">Credentials</div>';
    html += '<div class="cmd-builder" id="credBuilder"></div>';

    html += '<div class="eng-subhead">Saved runs</div>';
    html += '<div class="scan-tabs" id="credFileTabs"></div>';
    html += '<div id="credResults"></div>';
    html += '</div>';
    return html;
  }

  function portScanningShell(cat){
    var html = '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>' + escapeHtml(cat.label) + '</h3>';
    html += '<button type="button" class="checklist-toggle" id="reloadPortScanBtn">[reload data]</button>';
    html += '</div>';
    html += '<div class="tool-tabs" id="portScanToolTabs"></div>';

    html += '<div class="eng-subhead">Quick commands</div>';
    html += '<div class="preset-list" id="portScanQuickList"></div>';

    html += '<div class="eng-subhead">Build a command</div>';
    html += '<div class="cmd-builder" id="portScanBuilder"></div>';

    html += '<div class="eng-subhead">Saved scans</div>';
    html += '<div class="scan-tabs" id="portScanFileTabs"></div>';
    html += '<div id="portScanResults"></div>';
    html += '</div>';
    return html;
  }

  function makePresetPair(preset){
    var group = document.createElement("div");
    group.className = "preset-pair";

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "preset-btn";
    btn.textContent = preset.label;
    btn.dataset.label = preset.label;
    btn.addEventListener("click", function(){ runTemplate(preset.cmd, btn); });
    attachCommandTooltip(btn, preset.cmd);
    group.appendChild(btn);
    group.appendChild(makeCopyCmdBtn(preset.cmd));
    return group;
  }

  function renderPresetButtons(){
    var wrap = document.getElementById("presetList");
    if (!wrap) return;
    var cat = currentPlaybookCategory();
    var presetList = cat ? (cat.presets || []) : [];
    wrap.innerHTML = "";
    if (presetList.length === 0){
      wrap.innerHTML = '<div class="eng-status">no scripts added yet for this category — add one to core/checklists.py\'s PLAYBOOK entry.</div>';
      return;
    }
    presetList.forEach(function(preset){ wrap.appendChild(makePresetPair(preset)); });
  }

  /* ---------- Generic "saved output" viewer, for any flat-preset category
     that declares an `output` spec (directory_bruteforce, smb_enum,
     dns_enum, web_tech_fingerprint, subdomain_vhost_enum). Each preset's
     command tees its own output into that category's output.dir under a
     filename matching the preset's id (see core/checklists.py) — this just
     lists whatever's there and shows the raw text of whichever one you
     pick, the same [reload data] + file-tabs pattern Port Scanning uses,
     minus any tool-specific parsing since these are plain-text tool logs. */
  var presetOutputFiles = {};      // categoryId -> [file names]
  var activePresetOutputFile = {}; // categoryId -> file name

  function refreshPresetOutputs(cat){
    var tabsWrap = document.getElementById("presetFileTabs");
    if (!tabsWrap) return;
    tabsWrap.innerHTML = '<div class="eng-status">loading saved output…</div>';
    apiFetch("/api/playbook/outputs?tool=" + encodeURIComponent(cat.id)).then(function(res){
      presetOutputFiles[cat.id] = res.files || [];
      renderPresetOutputTabs(cat);
    }).catch(function(err){
      tabsWrap.innerHTML = '<div class="eng-status err">could not list saved output — ' + escapeHtml(err.message) + '</div>';
    });
  }

  function renderPresetOutputTabs(cat){
    var tabsWrap = document.getElementById("presetFileTabs");
    var viewWrap = document.getElementById("presetOutputView");
    if (!tabsWrap || !viewWrap) return;
    var files = presetOutputFiles[cat.id] || [];
    tabsWrap.innerHTML = "";
    if (files.length === 0){
      tabsWrap.innerHTML = '<div class="eng-status">no saved output yet — run a command above, then [reload data].</div>';
      viewWrap.innerHTML = "";
      return;
    }
    if (!activePresetOutputFile[cat.id] || files.indexOf(activePresetOutputFile[cat.id]) === -1){
      activePresetOutputFile[cat.id] = files[0];
    }
    files.forEach(function(name){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scan-tab" + (name === activePresetOutputFile[cat.id] ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", function(){
        activePresetOutputFile[cat.id] = name;
        renderPresetOutputTabs(cat);
      });
      tabsWrap.appendChild(btn);
    });
    loadPresetOutput(cat);
  }

  function loadPresetOutput(cat){
    var viewWrap = document.getElementById("presetOutputView");
    if (!viewWrap) return;
    var name = activePresetOutputFile[cat.id];
    if (!name){ viewWrap.innerHTML = ""; return; }
    viewWrap.innerHTML = '<div class="eng-status">loading output…</div>';
    apiFetch("/api/playbook/raw?tool=" + encodeURIComponent(cat.id) + "&file=" + encodeURIComponent(name)).then(function(res){
      var pre = document.createElement("pre");
      pre.className = "raw-output";
      pre.textContent = res.content && res.content.trim() ? res.content : "(empty file)";
      viewWrap.innerHTML = "";
      viewWrap.appendChild(pre);
    }).catch(function(err){
      viewWrap.innerHTML = '<div class="eng-status err">' + escapeHtml(err.message) + '</div>';
    });
  }

  /* ---------- Port Scanning: tool tabs + quick presets + command builder
     + saved-scan file tabs. Each tool (nmap, rustscan, …) carries its own
     quick presets, its own builder flag set, and its own results endpoint —
     see PORT_SCANNING_TOOLS in core/checklists.py. ---------- */
  var activePortScanTool = null;         // e.g. "nmap"
  var portScanBuilderState = {};         // toolId -> {flagId: bool}
  var portScanFiles = {};                // toolId -> [scan names]
  var activePortScanFile = {};           // toolId -> scan name

  function currentPortScanTool(cat){
    cat = cat || currentPlaybookCategory();
    if (!cat || !cat.tools || !cat.tools.length) return null;
    if (!activePortScanTool || !cat.tools.some(function(t){ return t.id === activePortScanTool; })){
      activePortScanTool = cat.tools[0].id;
    }
    for (var i=0;i<cat.tools.length;i++){
      if (cat.tools[i].id === activePortScanTool) return cat.tools[i];
    }
    return cat.tools[0];
  }

  function renderPortScanToolTabs(cat){
    var wrap = document.getElementById("portScanToolTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    cat.tools.forEach(function(tool){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tool-tab" + (tool.id === activePortScanTool ? " active" : "");
      btn.textContent = tool.label;
      btn.addEventListener("click", function(){
        activePortScanTool = tool.id;
        renderPortScanningPanel(cat);
      });
      wrap.appendChild(btn);
    });
  }

  var portScanBuilderPorts = {}; // toolId -> ports string, e.g. "80,445"

  function buildCustomTemplate(tool){
    var state = portScanBuilderState[tool.id] || {};
    var flags = (tool.builder.flags || [])
      .filter(function(f){ return state[f.id]; })
      .map(function(f){ return f.flag; });
    var ports = (portScanBuilderPorts[tool.id] || "").trim();
    return tool.builder.template
      .replace("{FLAGS}", flags.join(" "))
      .replace("{PORTS}", ports ? "-p " + ports : "")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  function renderPortScanBuilder(tool){
    var wrap = document.getElementById("portScanBuilder");
    if (!wrap) return;
    wrap.innerHTML = "";
    if (!tool.builder){
      wrap.innerHTML = '<div class="eng-status">no command builder for this tool.</div>';
      return;
    }
    if (!portScanBuilderState[tool.id]){
      var init = {};
      (tool.builder.flags || []).forEach(function(f){ init[f.id] = !!f.default; });
      portScanBuilderState[tool.id] = init;
    }
    var state = portScanBuilderState[tool.id];

    var flagsWrap = document.createElement("div");
    flagsWrap.className = "builder-flags";
    (tool.builder.flags || []).forEach(function(f){
      var label = document.createElement("label");
      label.className = "builder-flag";
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!state[f.id];
      cb.addEventListener("change", function(){
        state[f.id] = cb.checked;
        refreshPreview();
      });
      label.appendChild(cb);
      label.appendChild(document.createTextNode(" " + f.label));
      flagsWrap.appendChild(label);
    });
    wrap.appendChild(flagsWrap);

    var portsRow = document.createElement("div");
    portsRow.className = "builder-ports";
    var portsLabel = document.createElement("label");
    portsLabel.textContent = "Ports";
    portsLabel.setAttribute("for", "portScanBuilderPorts-" + tool.id);
    var portsInput = document.createElement("input");
    portsInput.type = "text";
    portsInput.id = "portScanBuilderPorts-" + tool.id;
    portsInput.placeholder = "optional, e.g. 80,445 — paste from [copy ports] below";
    portsInput.autocomplete = "off";
    portsInput.spellcheck = false;
    portsInput.value = portScanBuilderPorts[tool.id] || "";
    portsInput.addEventListener("input", function(){
      portScanBuilderPorts[tool.id] = portsInput.value;
      refreshPreview();
    });
    portsRow.appendChild(portsLabel);
    portsRow.appendChild(portsInput);
    wrap.appendChild(portsRow);

    var previewCode = document.createElement("code");
    previewCode.className = "builder-preview-cmd";
    wrap.appendChild(previewCode);

    var actions = document.createElement("div");
    actions.className = "preset-pair";
    var runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "preset-btn";
    runBtn.textContent = "[run custom]";
    runBtn.dataset.label = "[run custom]";
    runBtn.addEventListener("click", function(){ runTemplate(buildCustomTemplate(tool), runBtn); });
    attachCommandTooltip(runBtn, function(){ return buildCustomTemplate(tool); });
    actions.appendChild(runBtn);

    var copySlot = document.createElement("span");
    actions.appendChild(copySlot);
    wrap.appendChild(actions);

    function refreshPreview(){
      var tmpl = buildCustomTemplate(tool);
      previewCode.textContent = tmpl;
      copySlot.innerHTML = "";
      copySlot.appendChild(makeCopyCmdBtn(tmpl));
    }
    refreshPreview();
  }

  function refreshPortScanFiles(tool){
    var tabsWrap = document.getElementById("portScanFileTabs");
    if (!tabsWrap) return;
    tabsWrap.innerHTML = '<div class="eng-status">loading saved scans…</div>';
    apiFetch("/api/playbook/outputs?tool=" + encodeURIComponent(tool.id)).then(function(res){
      portScanFiles[tool.id] = res.files || [];
      renderPortScanFileTabs(tool);
    }).catch(function(err){
      tabsWrap.innerHTML = '<div class="eng-status err">could not list scans — ' + escapeHtml(err.message) + '</div>';
    });
  }

  function renderPortScanFileTabs(tool){
    var tabsWrap = document.getElementById("portScanFileTabs");
    var resultsWrap = document.getElementById("portScanResults");
    if (!tabsWrap || !resultsWrap) return;
    var files = portScanFiles[tool.id] || [];
    tabsWrap.innerHTML = "";
    if (files.length === 0){
      tabsWrap.innerHTML = '<div class="eng-status">no saved ' + escapeHtml(tool.label) + ' scans yet — run a command above, then [reload data].</div>';
      resultsWrap.innerHTML = "";
      return;
    }
    if (!activePortScanFile[tool.id] || files.indexOf(activePortScanFile[tool.id]) === -1){
      activePortScanFile[tool.id] = files[0];
    }
    files.forEach(function(name){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scan-tab" + (name === activePortScanFile[tool.id] ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", function(){
        activePortScanFile[tool.id] = name;
        renderPortScanFileTabs(tool);
      });
      tabsWrap.appendChild(btn);
    });
    loadPortScanResults(tool);
  }

  function loadPortScanResults(tool){
    var resultsWrap = document.getElementById("portScanResults");
    if (!resultsWrap) return;
    var name = activePortScanFile[tool.id];
    if (!name){ resultsWrap.innerHTML = ""; return; }
    resultsWrap.innerHTML = '<div class="eng-status">loading ' + escapeHtml(tool.label) + ' results…</div>';
    apiFetch(tool.results_endpoint + "?scan=" + encodeURIComponent(name)).then(function(data){
      if (tool.results_kind === "port_list") renderRustscanResults(data, resultsWrap);
      else renderNmapTable(data, resultsWrap);
    }).catch(function(err){
      resultsWrap.innerHTML = '<div class="eng-status err">' + escapeHtml(err.message) + '</div>';
    });
  }

  function renderPortScanningPanel(cat){
    renderPortScanToolTabs(cat);
    var tool = currentPortScanTool(cat);
    if (!tool) return;

    var quickWrap = document.getElementById("portScanQuickList");
    quickWrap.innerHTML = "";
    if ((tool.quick_presets || []).length === 0){
      quickWrap.innerHTML = '<div class="eng-status">no quick commands for this tool.</div>';
    } else {
      tool.quick_presets.forEach(function(preset){ quickWrap.appendChild(makePresetPair(preset)); });
    }

    renderPortScanBuilder(tool);
    refreshPortScanFiles(tool);

    // reloadPortScanBtn is outside the sub-panels this function redraws on
    // every tool-tab click, so it survives across tool switches — wire it
    // exactly once, and resolve the active tool at click-time rather than
    // capturing it, so a stale closure can't pile up from earlier tools.
    var reloadBtn = document.getElementById("reloadPortScanBtn");
    if (reloadBtn && !reloadBtn.dataset.wired){
      reloadBtn.dataset.wired = "1";
      reloadBtn.addEventListener("click", function(){
        var t = currentPortScanTool(cat);
        if (t) refreshPortScanFiles(t);
      });
    }
  }

  function portStateClass(state){
    if (state === "open") return "open";
    if (state === "filtered") return "filtered";
    return "closed";
  }

  function toggleDetailRow(portKey){
    var row = document.querySelector('.checklist-row[data-for="' + portKey + '"]');
    if (row) row.hidden = !row.hidden;
  }

  /* ---------- Port results: state filter + [copy ports] toolbar, shared by
     both nmap's table and rustscan's table so filtering/copying works the
     same way regardless of which tool produced the data. ---------- */
  var portResultsFilter = {}; // storageKey -> "all" | a state string

  function uniquePortStates(ports){
    var seen = {}, out = [];
    ports.forEach(function(p){
      var s = p.state || "unknown";
      if (!seen[s]){ seen[s] = true; out.push(s); }
    });
    return out;
  }

  function filterPortsByState(ports, filter){
    if (!filter || filter === "all") return ports;
    return ports.filter(function(p){ return (p.state || "unknown") === filter; });
  }

  function renderPortResultsToolbar(wrap, ports, storageKey, onChange){
    var states = uniquePortStates(ports);
    var current = portResultsFilter[storageKey] || "all";
    if (current !== "all" && states.indexOf(current) === -1) current = "all";
    portResultsFilter[storageKey] = current;

    var bar = document.createElement("div");
    bar.className = "port-toolbar";

    var filterGroup = document.createElement("div");
    filterGroup.className = "port-filter-group";
    ["all"].concat(states).forEach(function(state){
      var count = state === "all" ? ports.length : filterPortsByState(ports, state).length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "port-filter-btn " + (state === "all" ? "all" : portStateClass(state)) + (state === current ? " active" : "");
      btn.textContent = (state === "all" ? "All" : state) + " (" + count + ")";
      btn.addEventListener("click", function(){
        portResultsFilter[storageKey] = state;
        onChange();
      });
      filterGroup.appendChild(btn);
    });
    bar.appendChild(filterGroup);

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "run-btn copy-cmd-btn";
    copyBtn.textContent = "[copy ports]";
    copyBtn.title = "Copy the ports shown below (comma-separated) — paste into the builder's Ports field";
    copyBtn.addEventListener("click", function(){
      var visible = filterPortsByState(ports, current);
      var list = visible.map(function(p){ return p.port; }).join(",");
      copyText(list, copyBtn, { reset: "[copy ports]" });
    });
    bar.appendChild(copyBtn);

    wrap.appendChild(bar);
    return current;
  }

  /* rustscan finds open ports without fingerprinting them, so it gets its
     own compact table (PORT/PROTOCOL/STATE only) rather than nmap's — there
     is no service/version/script data to show. */
  function renderRustscanResults(data, wrap){
    if (!wrap) return;
    if (!data.ports || data.ports.length === 0){
      wrap.innerHTML = '<div class="eng-status">no open ports parsed yet.</div>';
      return;
    }
    wrap.innerHTML = "";
    var allPorts = data.ports;
    var current = renderPortResultsToolbar(wrap, allPorts, "rustscan", function(){ renderRustscanResults(data, wrap); });
    var ports = filterPortsByState(allPorts, current);

    if (ports.length === 0){
      var none = document.createElement("div");
      none.className = "eng-status";
      none.textContent = "no ports match this filter.";
      wrap.appendChild(none);
      return;
    }

    var table = document.createElement("table");
    table.className = "nmap-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>PORT</th><th>PROTOCOL</th><th>STATE</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");

    ports.forEach(function(p){
      var tr = document.createElement("tr");
      var tdPort = document.createElement("td");
      tdPort.textContent = p.port;
      tr.appendChild(tdPort);
      var tdProto = document.createElement("td");
      tdProto.textContent = p.protocol;
      tr.appendChild(tdProto);
      var tdState = document.createElement("td");
      var stateSpan = document.createElement("span");
      stateSpan.className = "port-state " + portStateClass(p.state);
      stateSpan.textContent = p.state;
      tdState.appendChild(stateSpan);
      tr.appendChild(tdState);
      tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    var scrollWrap = document.createElement("div");
    scrollWrap.className = "table-scroll";
    scrollWrap.appendChild(table);
    wrap.appendChild(scrollWrap);
  }

  function renderNmapTable(data, wrap){
    if (!wrap) return;
    if (!data.ports || data.ports.length === 0){
      wrap.innerHTML = '<div class="eng-status">no ports parsed yet — run a scan above, then [reload data].</div>';
      return;
    }
    wrap.innerHTML = "";
    var allPorts = data.ports;
    var current = renderPortResultsToolbar(wrap, allPorts, "nmap", function(){ renderNmapTable(data, wrap); });
    var ports = filterPortsByState(allPorts, current);

    if (ports.length === 0){
      var none = document.createElement("div");
      none.className = "eng-status";
      none.textContent = "no ports match this filter.";
      wrap.appendChild(none);
      return;
    }

    var table = document.createElement("table");
    table.className = "nmap-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>PORT</th><th>STATE</th><th>SERVICE</th><th>VERSION</th><th>NSE SCRIPTS</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");

    ports.forEach(function(p){
      var portKey = p.port + "/" + p.protocol;
      var tr = document.createElement("tr");

      var tdPort = document.createElement("td");
      tdPort.textContent = portKey;
      tr.appendChild(tdPort);

      var tdState = document.createElement("td");
      var stateSpan = document.createElement("span");
      stateSpan.className = "port-state " + portStateClass(p.state);
      stateSpan.textContent = p.state;
      tdState.appendChild(stateSpan);
      tr.appendChild(tdState);

      var tdService = document.createElement("td");
      tdService.textContent = p.service || "-";
      tr.appendChild(tdService);

      var tdVersion = document.createElement("td");
      var versionText = [p.product, p.version, p.extrainfo ? "(" + p.extrainfo + ")" : ""].filter(Boolean).join(" ");
      tdVersion.className = "service-version";
      tdVersion.textContent = versionText || "-";
      tr.appendChild(tdVersion);

      var hasScripts = !!(p.scripts && p.scripts.length);
      var tdToggle = document.createElement("td");
      if (hasScripts){
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "checklist-toggle";
        toggleBtn.textContent = "[details]";
        toggleBtn.addEventListener("click", function(){ toggleDetailRow(portKey); });
        tdToggle.appendChild(toggleBtn);
      } else {
        tdToggle.textContent = "-";
      }
      tr.appendChild(tdToggle);
      tbody.appendChild(tr);

      if (hasScripts){
        var crow = document.createElement("tr");
        crow.className = "checklist-row";
        crow.hidden = true;
        crow.setAttribute("data-for", portKey);
        var ctd = document.createElement("td");
        ctd.colSpan = 5;

        var scriptsWrap = document.createElement("div");
        scriptsWrap.className = "nse-scripts";
        p.scripts.forEach(function(script){
          var scriptEl = document.createElement("div");
          scriptEl.className = "nse-script";
          var idEl = document.createElement("div");
          idEl.className = "nse-id";
          idEl.textContent = script.id || "(script)";
          scriptEl.appendChild(idEl);
          if (script.output){
            var outEl = document.createElement("pre");
            outEl.className = "nse-output";
            outEl.textContent = script.output;
            scriptEl.appendChild(outEl);
          }
          scriptsWrap.appendChild(scriptEl);
        });
        ctd.appendChild(scriptsWrap);

        crow.appendChild(ctd);
        tbody.appendChild(crow);
      }
    });

    table.appendChild(tbody);
    var scrollWrap = document.createElement("div");
    scrollWrap.className = "table-scroll";
    scrollWrap.appendChild(table);
    wrap.appendChild(scrollWrap);
  }

  /* ---------- Credential Checking: service tabs + mode tabs + credential
     builder (nxc/NetExec) + saved-run results with a valid/failed/pwned
     filter. Unlike Port Scanning's checkbox-flag builder, this one needs
     free-text username/password fields whose SHAPE depends on the chosen
     mode, so it gets its own dedicated builder rather than reusing
     renderPortScanBuilder. */
  var CRED_MODES = [
    { id: "single", label: "Single" },
    { id: "spray", label: "Password Spray" },
    { id: "bruteforce", label: "Brute Force" }
  ];
  var activeCredServices = []; // multi-select — at least one stays checked
  var activeCredMode = "single";
  var credFields = { username: "", password: "", usernames: "", passwords: "", extraFlags: "", verbose: true };
  var credFiles = null;
  var activeCredFile = null;
  var credResultsFilter = "all";

  function ensureCredServiceSelection(cat){
    var services = (cat.cred_checker && cat.cred_checker.services) || [];
    var validIds = services.map(function(s){ return s.id; });
    activeCredServices = activeCredServices.filter(function(id){ return validIds.indexOf(id) !== -1; });
    if (activeCredServices.length === 0 && services[0]) activeCredServices = [services[0].id];
  }

  function renderCredServiceTabs(cat){
    var wrap = document.getElementById("credServiceTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    ensureCredServiceSelection(cat);
    (cat.cred_checker.services || []).forEach(function(svc){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tool-tab" + (activeCredServices.indexOf(svc.id) !== -1 ? " active" : "");
      btn.textContent = svc.label;
      btn.addEventListener("click", function(){
        var idx = activeCredServices.indexOf(svc.id);
        if (idx !== -1){
          // last one stays checked — a run needs at least one service
          if (activeCredServices.length > 1) activeCredServices.splice(idx, 1);
        } else {
          activeCredServices.push(svc.id);
        }
        renderCredServiceTabs(cat);
        renderCredBuilder(cat);
      });
      wrap.appendChild(btn);
    });
  }

  function renderCredModeTabs(cat){
    var wrap = document.getElementById("credModeTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    CRED_MODES.forEach(function(mode){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tool-tab" + (mode.id === activeCredMode ? " active" : "");
      btn.textContent = mode.label;
      btn.addEventListener("click", function(){
        activeCredMode = mode.id;
        renderCredModeTabs(cat);
        renderCredBuilder(cat);
      });
      wrap.appendChild(btn);
    });
  }

  function shQuote(s){
    return "'" + String(s).replace(/'/g, "'\\''") + "'";
  }

  function splitLines(text){
    return (text || "").split("\n").map(function(s){ return s.trim(); }).filter(Boolean);
  }

  /* Builds the whole run as one shell one-liner:
       1. mkdir -p the output dirs — once, up front, not per service.
       2. write any multi-value username/password list to a file under
          loot/creds (nxc's -u/-p both accept a file path) — also once.
       3. loop over the selected services, running nxc once per service and
          APPENDING (tee -a) into a fixed scans/creds/<service>.txt.
     Fixed per-service filenames + append means running the same service
     10 times across an engagement grows one file instead of piling up 10
     timestamped ones — the saved-runs list stays at most one tab per
     service, and each tab's valid/failed/pwned counts reflect every
     attempt ever made against that service, not just the latest run. */
  function buildCredsTemplate(cat){
    ensureCredServiceSelection(cat);
    var services = activeCredServices.slice();
    var usernames, passwords;
    if (activeCredMode === "single"){
      usernames = splitLines(credFields.username);
      passwords = splitLines(credFields.password);
    } else if (activeCredMode === "spray"){
      usernames = splitLines(credFields.usernames);
      passwords = splitLines(credFields.password);
    } else {
      usernames = splitLines(credFields.usernames);
      passwords = splitLines(credFields.passwords);
    }
    if (services.length === 0 || usernames.length === 0 || passwords.length === 0) return null;

    var steps = ["mkdir -p <PROJECT_DIR>/scans/creds <PROJECT_DIR>/loot/creds"];
    var userArg, passArg;
    if (usernames.length === 1){
      userArg = "-u " + shQuote(usernames[0]);
    } else {
      steps.push("printf '%s\\n' " + usernames.map(shQuote).join(" ") + " > <PROJECT_DIR>/loot/creds/users.txt");
      userArg = "-u <PROJECT_DIR>/loot/creds/users.txt";
    }
    if (passwords.length === 1){
      passArg = "-p " + shQuote(passwords[0]);
    } else {
      steps.push("printf '%s\\n' " + passwords.map(shQuote).join(" ") + " > <PROJECT_DIR>/loot/creds/passwords.txt");
      passArg = "-p <PROJECT_DIR>/loot/creds/passwords.txt";
    }
    var extra = (credFields.extraFlags || "").trim();

    // service ids only ever come from CREDENTIAL_SERVICES (a fixed
    // dropdown, never free text), so interpolating them into the loop's
    // service list is safe without per-value shell-quoting.
    //
    // nxc's --verbose is a GLOBAL option, parsed before the protocol
    // subcommand — `nxc smb <IP> ... --verbose` errors with "unrecognized
    // arguments: -v" (there's no short form either; it has to be
    // `nxc --verbose smb <IP> ...`). -u/-p and anything in Extra Flags are
    // protocol-level options, which DO go after the protocol + target.
    var verbosePrefix = credFields.verbose !== false ? "--verbose " : "";
    var nxcArgs = [userArg, passArg];
    if (extra) nxcArgs.push(extra);
    // `nxc ... | tee` alone block-buffers nxc's stdout (it's no longer a
    // TTY from nxc's point of view), so nothing shows up in the terminal
    // until the run finishes or the buffer fills — defeating the point of
    // --verbose. `stdbuf -oL -eL` forces line-buffering through the pipe,
    // so each attempt still streams live while also landing in the file.
    // `2>&1` merges stderr in too — nxc's connection errors/timeouts print
    // there, not stdout, so without it a failed run leaves an empty file
    // even though the terminal showed exactly what went wrong.
    var loop = "for svc in " + services.join(" ") + "; do stdbuf -oL -eL nxc " + verbosePrefix + "\"$svc\" <IP> " + nxcArgs.join(" ") +
      " 2>&1 | tee -a <PROJECT_DIR>/scans/creds/\"$svc\".txt; done";
    steps.push(loop);

    return steps.join(" && ");
  }

  function renderCredBuilder(cat){
    var wrap = document.getElementById("credBuilder");
    if (!wrap) return;
    wrap.innerHTML = "";

    var fieldsWrap = document.createElement("div");
    fieldsWrap.className = "cred-fields";

    function makeField(labelText, key, isTextarea, placeholder){
      var row = document.createElement("div");
      row.className = "cred-field";
      var label = document.createElement("label");
      label.textContent = labelText;
      label.setAttribute("for", "credField-" + key);
      row.appendChild(label);
      var el = document.createElement(isTextarea ? "textarea" : "input");
      el.id = "credField-" + key;
      if (!isTextarea) el.type = "text";
      else el.rows = 3;
      el.placeholder = placeholder || "";
      el.autocomplete = "off";
      el.spellcheck = false;
      el.value = credFields[key] || "";
      el.addEventListener("input", function(){
        credFields[key] = el.value;
        refreshPreview();
      });
      row.appendChild(el);
      fieldsWrap.appendChild(row);
    }

    if (activeCredMode === "single"){
      makeField("Username", "username", false, "admin");
      makeField("Password", "password", false, "Password123");
    } else if (activeCredMode === "spray"){
      makeField("Usernames (one per line)", "usernames", true, "admin\njdoe\nsvc_backup");
      makeField("Password", "password", false, "Summer2024!");
    } else {
      makeField("Usernames (one per line)", "usernames", true, "admin\njdoe\nsvc_backup");
      makeField("Passwords (one per line)", "passwords", true, "Password123\nSummer2024!\nWelcome1");
    }
    makeField("Extra flags (optional)", "extraFlags", false, "--local-auth, -x whoami, ...");

    wrap.appendChild(fieldsWrap);

    var flagsWrap = document.createElement("div");
    flagsWrap.className = "builder-flags";
    var verboseLabel = document.createElement("label");
    verboseLabel.className = "builder-flag";
    var verboseCb = document.createElement("input");
    verboseCb.type = "checkbox";
    verboseCb.checked = credFields.verbose !== false;
    verboseCb.addEventListener("change", function(){
      credFields.verbose = verboseCb.checked;
      refreshPreview();
    });
    verboseLabel.appendChild(verboseCb);
    verboseLabel.appendChild(document.createTextNode(" --verbose (stream each attempt's progress live)"));
    flagsWrap.appendChild(verboseLabel);
    wrap.appendChild(flagsWrap);

    var previewCode = document.createElement("code");
    previewCode.className = "builder-preview-cmd";
    wrap.appendChild(previewCode);

    var actions = document.createElement("div");
    actions.className = "preset-pair";
    var runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "preset-btn";
    runBtn.textContent = "[run]";
    runBtn.dataset.label = "[run]";
    runBtn.addEventListener("click", function(){
      var tmpl = buildCredsTemplate(cat);
      if (!tmpl){ flashBtn(runBtn, "[need user + pass]", true); return; }
      runTemplate(tmpl, runBtn);
    });
    attachCommandTooltip(runBtn, function(){ return buildCredsTemplate(cat); });
    actions.appendChild(runBtn);

    var copySlot = document.createElement("span");
    actions.appendChild(copySlot);
    wrap.appendChild(actions);

    function refreshPreview(){
      var tmpl = buildCredsTemplate(cat);
      previewCode.textContent = tmpl || "fill in at least one username and one password to build the command.";
      copySlot.innerHTML = "";
      if (tmpl) copySlot.appendChild(makeCopyCmdBtn(tmpl));
    }
    refreshPreview();
  }

  function refreshCredFiles(cat){
    var tabsWrap = document.getElementById("credFileTabs");
    if (!tabsWrap) return;
    tabsWrap.innerHTML = '<div class="eng-status">loading saved runs…</div>';
    apiFetch("/api/playbook/outputs?tool=" + encodeURIComponent(cat.id)).then(function(res){
      credFiles = res.files || [];
      renderCredFileTabs(cat);
    }).catch(function(err){
      tabsWrap.innerHTML = '<div class="eng-status err">could not list saved runs — ' + escapeHtml(err.message) + '</div>';
    });
  }

  function renderCredFileTabs(cat){
    var tabsWrap = document.getElementById("credFileTabs");
    var resultsWrap = document.getElementById("credResults");
    if (!tabsWrap || !resultsWrap) return;
    var files = credFiles || [];
    tabsWrap.innerHTML = "";
    if (files.length === 0){
      tabsWrap.innerHTML = '<div class="eng-status">no saved runs yet — run a check above, then [reload data].</div>';
      resultsWrap.innerHTML = "";
      return;
    }
    if (!activeCredFile || files.indexOf(activeCredFile) === -1) activeCredFile = files[files.length - 1];
    files.forEach(function(name){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "scan-tab" + (name === activeCredFile ? " active" : "");
      btn.textContent = name;
      btn.addEventListener("click", function(){
        activeCredFile = name;
        renderCredFileTabs(cat);
      });
      tabsWrap.appendChild(btn);
    });
    loadCredResults();
  }

  function loadCredResults(){
    var resultsWrap = document.getElementById("credResults");
    if (!resultsWrap) return;
    if (!activeCredFile){ resultsWrap.innerHTML = ""; return; }
    resultsWrap.innerHTML = '<div class="eng-status">loading results…</div>';
    apiFetch("/api/creds?scan=" + encodeURIComponent(activeCredFile)).then(function(data){
      renderCredResults(data, resultsWrap);
    }).catch(function(err){
      resultsWrap.innerHTML = '<div class="eng-status err">' + escapeHtml(err.message) + '</div>';
    });
  }

  function credStatusClass(status){
    if (status === "pwned") return "pwned";
    if (status === "valid") return "valid";
    return "failed";
  }

  function renderCredResults(data, wrap){
    if (!wrap) return;
    var results = data.results || [];
    if (results.length === 0){
      wrap.innerHTML = '<div class="eng-status">no credential attempts parsed from this run yet.</div>';
      return;
    }
    wrap.innerHTML = "";

    var order = ["pwned", "valid", "failed"];
    var seen = {}; var states = [];
    results.forEach(function(r){ if (!seen[r.status]){ seen[r.status] = true; states.push(r.status); } });
    states.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });

    var current = credResultsFilter;
    if (current !== "all" && states.indexOf(current) === -1) current = "all";
    credResultsFilter = current;

    var bar = document.createElement("div");
    bar.className = "port-toolbar";
    var filterGroup = document.createElement("div");
    filterGroup.className = "port-filter-group";
    ["all"].concat(states).forEach(function(st){
      var count = st === "all" ? results.length : results.filter(function(r){ return r.status === st; }).length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "port-filter-btn " + (st === "all" ? "all" : credStatusClass(st)) + (st === current ? " active" : "");
      btn.textContent = (st === "all" ? "All" : st) + " (" + count + ")";
      btn.addEventListener("click", function(){
        credResultsFilter = st;
        renderCredResults(data, wrap);
      });
      filterGroup.appendChild(btn);
    });
    bar.appendChild(filterGroup);

    var copyBtn = document.createElement("button");
    copyBtn.type = "button";
    copyBtn.className = "run-btn copy-cmd-btn";
    copyBtn.textContent = "[copy creds]";
    copyBtn.title = "Copy the filtered user:pass pairs, one per line";
    copyBtn.addEventListener("click", function(){
      var visible = current === "all" ? results : results.filter(function(r){ return r.status === current; });
      var list = visible.map(function(r){ return r.user + ":" + r.secret; }).join("\n");
      copyText(list, copyBtn, { reset: "[copy creds]" });
    });
    bar.appendChild(copyBtn);
    wrap.appendChild(bar);

    var visible = current === "all" ? results : results.filter(function(r){ return r.status === current; });
    if (visible.length === 0){
      var none = document.createElement("div");
      none.className = "eng-status";
      none.textContent = "no results match this filter.";
      wrap.appendChild(none);
      return;
    }

    var table = document.createElement("table");
    table.className = "nmap-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>STATUS</th><th>USER</th><th>SECRET</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    visible.forEach(function(r){
      var tr = document.createElement("tr");
      tr.title = r.raw;

      var tdStatus = document.createElement("td");
      var statusSpan = document.createElement("span");
      statusSpan.className = "port-state " + credStatusClass(r.status);
      statusSpan.textContent = r.status;
      tdStatus.appendChild(statusSpan);
      tr.appendChild(tdStatus);

      var tdUser = document.createElement("td");
      tdUser.textContent = r.user || "-";
      tr.appendChild(tdUser);

      var tdSecret = document.createElement("td");
      tdSecret.textContent = r.secret || "-";
      tr.appendChild(tdSecret);

      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var scrollWrap = document.createElement("div");
    scrollWrap.className = "table-scroll";
    scrollWrap.appendChild(table);
    wrap.appendChild(scrollWrap);
  }

  function renderCredCheckerPanel(cat){
    renderCredServiceTabs(cat);
    renderCredModeTabs(cat);
    renderCredBuilder(cat);
    refreshCredFiles(cat);

    var reloadBtn = document.getElementById("reloadCredsBtn");
    if (reloadBtn && !reloadBtn.dataset.wired){
      reloadBtn.dataset.wired = "1";
      reloadBtn.addEventListener("click", function(){ refreshCredFiles(cat); });
    }
  }

  function renderEngagementView(){
    var content = document.getElementById("content");
    var crumb = document.getElementById("breadcrumb");

    function draw(){
      content.innerHTML = engagementShell();
      crumb.textContent = activeProject ? "~/htb/" + activeProject.name : "";
      if (!activeProject) return;

      var cat = currentPlaybookCategory();
      if (cat && cat.tools){
        renderPortScanningPanel(cat);
        return;
      }
      if (cat && cat.cred_checker){
        renderCredCheckerPanel(cat);
        return;
      }
      renderPresetButtons();
      if (cat && cat.output){
        refreshPresetOutputs(cat);
        var reloadBtn = document.getElementById("reloadPresetOutputsBtn");
        if (reloadBtn) reloadBtn.addEventListener("click", function(){ refreshPresetOutputs(cat); });
      }
    }

    if (!PLAYBOOK){
      loadPlaybook().then(function(groups){
        if (!activePlaybookCategory){
          var firstCat = groups[0] && groups[0].categories && groups[0].categories[0];
          if (firstCat) activePlaybookCategory = firstCat.id;
        }
        renderEngagementSidebar();
        draw();
      });
    } else {
      draw();
    }
  }

