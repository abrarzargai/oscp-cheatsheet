"use strict";

/* Engagement workspace framework: playbook loading, the engagement
   sidebar + category shells, quick-preset buttons and saved preset
   outputs, and the top-level renderEngagementView() dispatcher.
   Split out of the former monolithic nmap.js; behaviour unchanged.
   Port scanning lives in nmap/port-scan.js + nmap/port-tables.js,
   credential checking in nmap/cred-checker.js (all script globals). */
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
      // Credential Checking now lives in the Tools workspace, not here.
      if (group.id === "credential_access") return;
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
    var cat = currentPlaybookCategory();
    var html = '<div class="engagement">';

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
    html += '<div class="eng-head-row">';
    html += '<button type="button" class="reload-icon" id="reloadCredsBtn" title="reload data" aria-label="reload data">↻</button>';
    html += '<h3>' + escapeHtml(cat.label) + '</h3>';
    html += '<div class="cred-view-switch">';
    html += '<button type="button" class="cred-view-btn active" data-view="build">Build</button>';
    html += '<button type="button" class="cred-view-btn" data-view="results" id="credResultsTab">Results</button>';
    html += '</div>';
    html += '</div>';

    // View 1: build the command
    html += '<div id="credBuildView">';
    html += '<div class="eng-subhead">Services (click to toggle — check more than one in the same run)</div>';
    html += '<div class="tool-tabs" id="credServiceTabs"></div>';
    html += '<div class="eng-subhead">Mode</div>';
    html += '<div class="tool-tabs" id="credModeTabs"></div>';
    html += '<div class="eng-subhead">Credentials</div>';
    html += '<div class="cmd-builder" id="credBuilder"></div>';
    html += '</div>';

    // View 2: results + valid creds
    html += '<div id="credResultsView" hidden>';
    html += '<div class="eng-subhead">Saved runs</div>';
    html += '<div class="scan-tabs" id="credFileTabs"></div>';
    html += '<div id="credResults"></div>';
    html += '</div>';

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

