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
      if (activeProject){
        setProjectStatus("  ~/htb/" + activeProject.name);
        applyProjectToConfig(activeProject);
      } else {
        setProjectStatus("no active project — create one");
      }
      return activeProject;
    });
  }

  function bootstrapEngagement(){
    loadProjects()
      .then(refreshActiveProject)
      .catch(function(err){
        setProjectStatus("backend offline (start server.py) — " + err.message, true);
      });
  }

  function wireProjectUI(){
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
      var body = {
        name: name,
        target_ip: document.getElementById("npTargetIp").value.trim(),
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
