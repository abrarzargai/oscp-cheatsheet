"use strict";

/* Nmap results rendering — recon-scan preset buttons, the parsed ports
   table, and per-port NSE script output. Per-port checklist ITEMS are
   rendered by checklist.js's renderChecklistItems(), called below; the
   expand/collapse of that combined row is still owned here since it's a
   table-row concern, not a checklist concern. */
var currentScanFile = "full";
var availableScans = [];

  /* ---------- Engagement view rendering ---------- */
  function engagementShell(){
    if (!activeProject){
      return '<div class="empty-state">No active project.<br>Use the Project selector in the top bar to create or pick one.</div>';
    }
    var p = activeProject;
    var html = '<div class="engagement">';
    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>[' + escapeHtml(p.name) + ']</h3></div>';
    html += '<div class="eng-meta">target: <b>' + escapeHtml(p.target_ip || "-") + '</b>';
    if (p.domain) html += ' &middot; domain: <b>' + escapeHtml(p.domain) + '</b>';
    if (p.dc_ip) html += ' &middot; dc_ip: <b>' + escapeHtml(p.dc_ip) + '</b>';
    html += ' &middot; ~/htb/' + escapeHtml(p.name) + '</div>';
    html += '</div>';

    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>Recon scans</h3></div>';
    html += '<div class="preset-list" id="presetList"></div>';
    html += '</div>';

    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>Nmap results</h3>';
    html += '<select id="scanFileSelect" class="proj-select" style="width:auto;"></select>';
    html += '<button type="button" class="checklist-toggle" id="reloadNmapBtn">[reload results]</button>';
    html += '</div>';
    html += '<div id="nmapTableWrap"><div class="eng-status">loading scan results…</div></div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderPresetButtons(){
    var wrap = document.getElementById("presetList");
    if (!wrap) return;
    apiFetch("/api/presets").then(function(res){
      wrap.innerHTML = "";
      (res.nmap || []).forEach(function(preset){
        var group = document.createElement("div");
        group.className = "preset-pair";

        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "preset-btn";
        btn.textContent = preset.label;
        btn.dataset.label = preset.label;
        btn.addEventListener("click", function(){ runTemplate(preset.cmd, btn); });
        group.appendChild(btn);
        group.appendChild(makeCopyCmdBtn(preset.cmd));

        wrap.appendChild(group);
      });
    }).catch(function(err){
      wrap.innerHTML = '<div class="eng-status err">could not load presets — ' + escapeHtml(err.message) + '</div>';
    });
  }


  function portStateClass(state){
    if (state === "open") return "open";
    if (state === "filtered") return "filtered";
    return "closed";
  }

  function toggleChecklistRow(portKey){
    var row = document.querySelector('.checklist-row[data-for="' + portKey + '"]');
    if (row) row.hidden = !row.hidden;
  }

  function renderNmapTable(data){
    var wrap = document.getElementById("nmapTableWrap");
    if (!wrap) return;
    if (!data.ports || data.ports.length === 0){
      wrap.innerHTML = '<div class="eng-status">no ports parsed yet — run a scan above, then [reload results].</div>';
      return;
    }

    var table = document.createElement("table");
    table.className = "nmap-table";
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>PORT</th><th>STATE</th><th>SERVICE</th><th>VERSION</th><th>NSE / CHECKLIST</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");

    data.ports.forEach(function(p){
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
      var hasChecklist = !!(p.checklist && p.checklist.length);

      var tdToggle = document.createElement("td");
      if (hasScripts || hasChecklist){
        var toggleBtn = document.createElement("button");
        toggleBtn.type = "button";
        toggleBtn.className = "checklist-toggle";
        toggleBtn.textContent = "[details]";
        toggleBtn.addEventListener("click", function(){ toggleChecklistRow(portKey); });
        tdToggle.appendChild(toggleBtn);
      }
      tr.appendChild(tdToggle);
      tbody.appendChild(tr);

      if (hasScripts || hasChecklist){
        var crow = document.createElement("tr");
        crow.className = "checklist-row";
        crow.hidden = true;
        crow.setAttribute("data-for", portKey);
        var ctd = document.createElement("td");
        ctd.colSpan = 5;

        if (hasScripts){
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
        }

        var itemsWrap = document.createElement("div");
        itemsWrap.className = "checklist-items";
        renderChecklistItems(itemsWrap, p.checklist, p.checked, portKey);

        ctd.appendChild(itemsWrap);
        crow.appendChild(ctd);
        tbody.appendChild(crow);
      }
    });

    table.appendChild(tbody);
    wrap.innerHTML = "";
    var scrollWrap = document.createElement("div");
    scrollWrap.className = "table-scroll";
    scrollWrap.appendChild(table);
    wrap.appendChild(scrollWrap);
  }

  function loadNmapResults(scanName){
    var wrap = document.getElementById("nmapTableWrap");
    if (wrap) wrap.innerHTML = '<div class="eng-status">loading scan results…</div>';
    apiFetch("/api/nmap?scan=" + encodeURIComponent(scanName))
      .then(renderNmapTable)
      .catch(function(err){
        if (wrap) wrap.innerHTML = '<div class="eng-status err">' + escapeHtml(err.message) + '</div>';
      });
  }

  function populateScanFileSelect(){
    var sel = document.getElementById("scanFileSelect");
    if (!sel) return;
    apiFetch("/api/nmap/scans").then(function(res){
      availableScans = res.scans || [];
      sel.innerHTML = "";
      if (availableScans.indexOf("full") === -1) availableScans.unshift("full");
      availableScans.forEach(function(name){
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name + ".xml";
        sel.appendChild(opt);
      });
      currentScanFile = availableScans.indexOf(currentScanFile) !== -1 ? currentScanFile : availableScans[0];
      sel.value = currentScanFile;
      loadNmapResults(currentScanFile);
    }).catch(function(){
      currentScanFile = "full";
      loadNmapResults(currentScanFile);
    });
  }

  function renderEngagementView(){
    var content = document.getElementById("content");
    var crumb = document.getElementById("breadcrumb");
    content.innerHTML = engagementShell();
    crumb.textContent = activeProject ? "~/htb/" + activeProject.name : "";
    if (!activeProject) return;

    renderPresetButtons();
    populateScanFileSelect();

    var scanSel = document.getElementById("scanFileSelect");
    scanSel.addEventListener("change", function(){
      currentScanFile = scanSel.value;
      loadNmapResults(currentScanFile);
    });
    document.getElementById("reloadNmapBtn").addEventListener("click", function(){
      populateScanFileSelect();
    });
  }

