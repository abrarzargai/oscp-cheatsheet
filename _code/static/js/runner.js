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
        attacker_port: config.attackerPort || "",
        scheme: config.scheme || "http"
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
      "<SCHEME>": config.scheme || "http",
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
    btn.addEventListener("click", function(e){
      e.stopPropagation();
      copyText(resolveTemplateClient(template), btn);
    });
    attachCommandTooltip(btn, template);
    return btn;
  }

  /* ---------- Command tooltip — themed hover preview of the resolved
     command, shared by every run/copy button (preset buttons, checklist
     [run]/[copy]). Built once and repositioned on hover rather than one
     tooltip element per button. */
  var cmdTooltipEl = null;

  function ensureCmdTooltip(){
    if (!cmdTooltipEl){
      cmdTooltipEl = document.createElement("div");
      cmdTooltipEl.className = "cmd-tooltip";
      cmdTooltipEl.setAttribute("role", "tooltip");
      document.body.appendChild(cmdTooltipEl);
    }
    return cmdTooltipEl;
  }

  function positionCmdTooltip(tip, btn){
    var r = btn.getBoundingClientRect();
    var tr = tip.getBoundingClientRect();
    var left = r.left + (r.width - tr.width) / 2;
    left = Math.max(8, Math.min(left, window.innerWidth - tr.width - 8));
    var top = r.top - tr.height - 9;
    var below = top < 8;
    if (below) top = r.bottom + 9;
    tip.style.left = left + "px";
    tip.style.top = top + "px";
    tip.classList.toggle("below", below);
  }

  /* templateOrFn may be a fixed string (presets) or a zero-arg function
     returning the current template (the command builder, whose flags can
     change between hovers without re-attaching a new listener). */
  function attachCommandTooltip(btn, templateOrFn){
    var tip;
    function show(){
      var template = typeof templateOrFn === "function" ? templateOrFn() : templateOrFn;
      if (!template) return;
      tip = ensureCmdTooltip();
      tip.textContent = "$ " + resolveTemplateClient(template);
      tip.classList.add("visible");
      positionCmdTooltip(tip, btn);
    }
    function hide(){
      if (tip) tip.classList.remove("visible");
    }
    btn.addEventListener("mouseenter", show);
    btn.addEventListener("mouseleave", hide);
    btn.addEventListener("focus", show);
    btn.addEventListener("blur", hide);
    btn.addEventListener("click", hide);
  }

