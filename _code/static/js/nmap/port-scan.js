"use strict";

/* Port Scanning tool: per-tool tabs, the flag/port command builder,
   saved-scan file tabs, and the results panel. Result TABLES live in
   nmap/port-tables.js. Split out of nmap.js; behaviour unchanged. */

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
