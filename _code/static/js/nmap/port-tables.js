"use strict";

/* Port Scanning result tables: the rustscan + nmap results tables, the
   port-state filter toolbar, and NSE script detail rows. Split out of
   nmap.js; behaviour unchanged. */

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

