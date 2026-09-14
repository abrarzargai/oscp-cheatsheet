"use strict";

  /* ---------- Run-in-terminal (shared by presets + per-port checklist) ---------- */
  function flashBtn(btn, label, isFail, resetLabel){
    var original = resetLabel || btn.dataset.label || btn.textContent;
    btn.dataset.label = original;
    btn.textContent = label;
    btn.classList.remove("busy","fail");
    btn.classList.add(isFail ? "fail" : "busy");
    setTimeout(function(){
      btn.textContent = original;
      btn.classList.remove("busy","fail");
    }, 1800);
  }

  function runTemplate(template, btn){
    if (!activeProject){
      flashBtn(btn, "[no active project]", true);
      return;
    }
    flashBtn(btn, "[launching…]", false);
    apiFetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template: template,
        attacker_ip: config.attackerIp || "",
        attacker_port: config.attackerPort || ""
      })
    }).then(function(){
      flashBtn(btn, "[launched]", false, btn.dataset.label);
    }).catch(function(err){
      flashBtn(btn, "[" + err.message + "]", true, btn.dataset.label);
    });
  }

  /* Mirrors resolve_template() in core/runner.py, client-side, purely for
     the copy-to-clipboard buttons — so copying doesn't need a round trip
     and shows you exactly what /api/run would launch. */
  function resolveTemplateClient(template){
    if (!activeProject) return template;
    var repl = {
      "<IP>": activeProject.target_ip || "",
      "<DOMAIN>": activeProject.domain || "",
      "<DC_IP>": activeProject.dc_ip || "",
      "<ATTACKER_IP>": config.attackerIp || "",
      "<PORT>": config.attackerPort || "",
      "<PROJECT_DIR>": activeProject.path || ("~/htb/" + activeProject.name),
      "<NAME>": activeProject.name
    };
    var out = template;
    Object.keys(repl).forEach(function(key){ out = out.split(key).join(repl[key]); });
    return out;
  }

  function makeCopyCmdBtn(template){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "run-btn copy-cmd-btn";
    btn.textContent = "[copy]";
    btn.title = "Copy resolved command";
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      copyText(resolveTemplateClient(template), btn);
    });
    return btn;
  }

