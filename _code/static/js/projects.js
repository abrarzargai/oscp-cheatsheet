"use strict";

/* Project create / switch / list — the "Project" fieldset in the top bar
   and its "+ new" popup form. Depends on apiFetch/config/saveConfig/
   refreshStatusDots/renderActiveTab from app.js, and viewMode/
   renderEngagementView from app.js / nmap.js (all globals, loaded before
   this file runs its own top-level code). */
var activeProject = null;    // {name,target_ip,domain,dc_ip,created,path}
var projectList = [];

  function setProjectStatus(text, isErr){
    var el = document.getElementById("projectStatus");
    el.textContent = text;
    el.classList.toggle("err", !!isErr);
  }

  /* Project's target_ip/domain/dc_ip become the source of truth for the
     existing Victim/Domain/DC_IP fields once a project is active, so every
     note's $VICTIM_IP/$DOMAIN/$DC_IP substitution follows the active box. */
  function applyProjectToConfig(project){
    if (!project) return;
    var map = { victimIp: project.target_ip, domain: project.domain, dcIp: project.dc_ip };
    Object.keys(map).forEach(function(field){
      var el = document.getElementById(field);
      var val = map[field] || "";
      if (el) el.value = val;
      config[field] = val;
    });
    saveConfig();
    refreshStatusDots();
    renderActiveTab();
  }

  function populateProjectSelect(){
    var sel = document.getElementById("projectSelect");
    sel.innerHTML = "";
    if (projectList.length === 0){
      var opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "(none — create one)";
      sel.appendChild(opt);
      return;
    }
    projectList.forEach(function(p){
      var opt = document.createElement("option");
      opt.value = p.name;
      opt.textContent = p.name + " (" + (p.target_ip || "no ip") + ")";
      sel.appendChild(opt);
    });
    if (activeProject) sel.value = activeProject.name;
  }

  function loadProjects(){
    return apiFetch("/api/projects").then(function(res){
      projectList = res.projects || [];
      populateProjectSelect();
      return res;
    });
  }

  function refreshActiveProject(){
    return apiFetch("/api/active").then(function(res){
      activeProject = res.project || null;
      populateProjectSelect();
      var statusEl = document.getElementById("projectStatus");
      if (activeProject){
        setProjectStatus("  ~/htb/" + activeProject.name);
        // Clicking the status copies the project path (see wireProjectUI).
        statusEl.dataset.copyPath = "~/htb/" + activeProject.name;
        statusEl.classList.add("copyable");
        statusEl.title = "click to copy project path";
        applyProjectToConfig(activeProject);
      } else {
        setProjectStatus("no active project — create one");
        delete statusEl.dataset.copyPath;
        statusEl.classList.remove("copyable");
        statusEl.removeAttribute("title");
      }
      // Credentials are stored per machine — reload the vault for this project.
      if (typeof credVaultOnProjectChange === "function") credVaultOnProjectChange();
      return activeProject;
    });
  }

  /* Persist a top-bar field edit back into the active project's project.json,
     so domain/DC IP (unknown at creation) — and a corrected target IP — are
     saved for later sessions, not just held in browser config. Maps the
     config field id to the stored project key. */
  var PROJECT_FIELD_KEYS = { victimIp: "target_ip", domain: "domain", dcIp: "dc_ip" };

  function persistProjectField(fieldId){
    if (!activeProject) return;
    var key = PROJECT_FIELD_KEYS[fieldId];
    var el = document.getElementById(fieldId);
    if (!key || !el) return;
    var val = el.value.trim();
    // Don't blank out the identifying target IP.
    if (key === "target_ip" && !val) return;
    if ((activeProject[key] || "") === val) return;
    var body = {};
    body[key] = val;
    apiFetch("/api/projects/" + encodeURIComponent(activeProject.name), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function(res){
      if (res && res.project) activeProject = res.project;
      populateProjectSelect();
    }).catch(function(err){ setProjectStatus(err.message, true); });
  }

  function bootstrapEngagement(){
    loadProjects()
      .then(refreshActiveProject)
      .catch(function(err){
        setProjectStatus("backend offline (start server.py) — " + err.message, true);
      });
  }

  function wireProjectUI(){
    // Click the active-project status to copy its ~/htb/<name> path.
    var statusEl = document.getElementById("projectStatus");
    if (statusEl){
      statusEl.addEventListener("click", function(){
        var path = statusEl.dataset.copyPath;
        if (!path) return;
        writeClipboard(path, function(){
          statusEl.classList.add("copied");
          setTimeout(function(){ statusEl.classList.remove("copied"); }, 1200);
        });
      });
    }

    // Save later edits to the top-bar IP/DOMAIN/DC_IP into the active project
    // on blur/change (app.js already keeps browser config in sync separately).
    Object.keys(PROJECT_FIELD_KEYS).forEach(function(fieldId){
      var el = document.getElementById(fieldId);
      if (el) el.addEventListener("change", function(){ persistProjectField(fieldId); });
    });

    var sel = document.getElementById("projectSelect");
    sel.addEventListener("change", function(){
      if (!sel.value) return;
      apiFetch("/api/active", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: sel.value })
      }).then(function(){
        return refreshActiveProject();
      }).then(function(){
        if (viewMode === "engagement") renderEngagementView();
      }).catch(function(err){ setProjectStatus(err.message, true); });
    });

    var panel = document.getElementById("newProjectPanel");
    var newBtn = document.getElementById("newProjectBtn");
    var cancelBtn = document.getElementById("cancelProjectBtn");
    var closePanelBtn = document.getElementById("closeProjectPanelBtn");
    var createBtn = document.getElementById("createProjectBtn");
    var errEl = document.getElementById("newProjectErr");

    function closeNewProjectPanel(){
      panel.hidden = true;
      errEl.hidden = true;
    }

    newBtn.addEventListener("click", function(){
      if (!panel.hidden){ closeNewProjectPanel(); return; }
      panel.hidden = false;
      errEl.hidden = true;
      document.getElementById("npName").focus();
    });
    cancelBtn.addEventListener("click", closeNewProjectPanel);
    closePanelBtn.addEventListener("click", closeNewProjectPanel);
    document.addEventListener("keydown", function(e){
      if (e.key === "Escape" && !panel.hidden) closeNewProjectPanel();
    });
    document.addEventListener("click", function(e){
      if (!panel.hidden && !panel.contains(e.target) && e.target !== newBtn){
        closeNewProjectPanel();
      }
    });

    createBtn.addEventListener("click", function(){
      var name = document.getElementById("npName").value.trim();
      var targetIp = document.getElementById("npTargetIp").value.trim();
      // Target IP is the identifying field and is required; domain/dc_ip are
      // optional here and can be filled in later from the top-bar fields.
      if (!targetIp){
        errEl.textContent = "Target IP is required.";
        errEl.hidden = false;
        document.getElementById("npTargetIp").focus();
        return;
      }
      var body = {
        name: name,
        target_ip: targetIp,
        domain: document.getElementById("npDomain").value.trim(),
        dc_ip: document.getElementById("npDcIp").value.trim()
      };
      errEl.hidden = true;
      apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }).then(function(){
        closeNewProjectPanel();
        ["npName","npTargetIp","npDomain","npDcIp"].forEach(function(id){
          document.getElementById(id).value = "";
        });
        return loadProjects().then(refreshActiveProject);
      }).then(function(){
        if (viewMode === "engagement") renderEngagementView();
      }).catch(function(err){
        errEl.textContent = err.message;
        errEl.hidden = false;
      });
    });
  }
