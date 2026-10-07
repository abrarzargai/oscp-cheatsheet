"use strict";

/* Credential Checking tool: service/mode tabs, the credential builder,
   saved-run results with the valid/failed/pwned filter, and the
   connect drawer. Split out of nmap.js; behaviour unchanged. */
  /* ---------- Credential Checking: service tabs + mode tabs + credential
     builder (nxc/nxc) + saved-run results with a valid/failed/pwned
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
  var activeCredView = "build";   // "build" | "results" — one view at a time

  // Persist typed usernames/passwords across refreshes (per browser).
  var CRED_KEY = "CheatSheet-creds-v1";
  var CRED_ALL = "__all__";   // sentinel for the aggregate "All" tab
  var credFieldsLoaded = false;
  function loadCredFields(){
    if (credFieldsLoaded) return;
    credFieldsLoaded = true;
    try{
      var raw = localStorage.getItem(CRED_KEY);
      if (raw){
        var s = JSON.parse(raw);
        Object.keys(credFields).forEach(function(k){ if (k in s) credFields[k] = s[k]; });
      }
    }catch(e){}
  }
  function saveCredFields(){
    try{ localStorage.setItem(CRED_KEY, JSON.stringify(credFields)); }catch(e){}
  }

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
    // By default nxc stops at the first valid login; with multiple users or
    // passwords (spray/brute) we want EVERY hit, so keep going after a success.
    if (usernames.length > 1 || passwords.length > 1) nxcArgs.push("--continue-on-success");
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
        saveCredFields();
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
      saveCredFields();
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
    if (!activeCredFile || (activeCredFile !== CRED_ALL && files.indexOf(activeCredFile) === -1)){
      // default to the aggregate view when there's more than one service
      activeCredFile = files.length > 1 ? CRED_ALL : files[files.length - 1];
    }
    // The service picker now lives as a dropdown in the results toolbar
    // (built in renderCredResults), so nothing is rendered here.
    tabsWrap.innerHTML = "";
    loadCredResults();
  }

  function loadCredResults(){
    var resultsWrap = document.getElementById("credResults");
    if (!resultsWrap) return;
    if (!activeCredFile){ resultsWrap.innerHTML = ""; return; }
    resultsWrap.innerHTML = '<div class="eng-status">loading results…</div>';

    if (activeCredFile === CRED_ALL){
      // Fetch every service file and merge, tagging each row with its source
      // service so per-cred verify still knows which protocol to re-check.
      var files = credFiles || [];
      Promise.all(files.map(function(name){
        return apiFetch("/api/creds?scan=" + encodeURIComponent(name))
          .then(function(d){ return { name: name, results: d.results || [] }; })
          .catch(function(){ return { name: name, results: [] }; });
      })).then(function(all){
        var merged = [];
        all.forEach(function(entry){
          entry.results.forEach(function(r){ r._service = entry.name; merged.push(r); });
        });
        renderCredResults({ results: merged }, resultsWrap, "");
      });
      return;
    }

    apiFetch("/api/creds?scan=" + encodeURIComponent(activeCredFile)).then(function(data){
      renderCredResults(data, resultsWrap, activeCredFile);
    }).catch(function(err){
      resultsWrap.innerHTML = '<div class="eng-status err">' + escapeHtml(err.message) + '</div>';
    });
  }

  function credStatusClass(status){
    if (status === "pwned") return "pwned";
    if (status === "valid") return "valid";
    return "failed";
  }

  /* Connection-command cheat sheet per service, filled with a real cred.
     Returns [{label, cmd}] — different tools you can use to connect/exec. */
  function connectCommandsFor(service, user, secret, ip){
    var q = shQuote;
    var u = (user || "").trim();
    var domain = "";
    if (u.indexOf("\\") !== -1){ var p = u.split("\\"); domain = p[0]; u = p.slice(1).join("\\"); }
    var pass = secret || "";
    var target = (domain ? domain + "/" : "") + u;          // impacket DOMAIN/user
    var upct = (domain ? domain + "\\" : "") + u + "%" + pass; // smbclient -U 'dom\user%pass'
    var dFlag = domain ? " -d " + q(domain) : "";
    var svc = (service || "").toLowerCase();

    var map = {
      smb: [
        { label: "NetExec — auth check / --shares / -x", cmd: "nxc smb " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag },
        { label: "smbclient — list shares", cmd: "smbclient -L //" + ip + "/ -U " + q(upct) },
        { label: "impacket — psexec (SYSTEM shell)", cmd: "impacket-psexec " + q(target + ":" + pass + "@" + ip) },
        { label: "impacket — wmiexec (stealthier)", cmd: "impacket-wmiexec " + q(target + ":" + pass + "@" + ip) }
      ],
      winrm: [
        { label: "evil-winrm — interactive shell", cmd: "evil-winrm -i " + ip + " -u " + q(u) + " -p " + q(pass) },
        { label: "NetExec winrm — check / -x", cmd: "nxc winrm " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag }
      ],
      ssh: [
        { label: "ssh — interactive", cmd: "ssh " + u + "@" + ip },
        { label: "sshpass — non-interactive", cmd: "sshpass -p " + q(pass) + " ssh " + u + "@" + ip },
        { label: "NetExec ssh", cmd: "nxc ssh " + ip + " -u " + q(u) + " -p " + q(pass) }
      ],
      rdp: [
        { label: "xfreerdp", cmd: "xfreerdp /u:" + q(u) + " /p:" + q(pass) + " /v:" + ip + " /cert:ignore" + (domain ? " /d:" + q(domain) : "") },
        { label: "rdesktop", cmd: "rdesktop -u " + q(u) + " -p " + q(pass) + " " + ip },
        { label: "NetExec rdp — check / screenshot", cmd: "nxc rdp " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag }
      ],
      ldap: [
        { label: "NetExec ldap — --users / --kerberoasting", cmd: "nxc ldap " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag },
        { label: "ldapsearch", cmd: "ldapsearch -x -H ldap://" + ip + " -D " + q(u + (domain ? "@" + domain : "")) + " -w " + q(pass) + " -b " + q("DC=domain,DC=tld") }
      ],
      mssql: [
        { label: "impacket-mssqlclient", cmd: "impacket-mssqlclient " + q(target + ":" + pass + "@" + ip) + (domain ? " -windows-auth" : "") },
        { label: "NetExec mssql — -x / -q", cmd: "nxc mssql " + ip + " -u " + q(u) + " -p " + q(pass) + (domain ? dFlag : " --local-auth") }
      ],
      wmi: [
        { label: "impacket-wmiexec", cmd: "impacket-wmiexec " + q(target + ":" + pass + "@" + ip) },
        { label: "NetExec wmi", cmd: "nxc wmi " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag }
      ],
      ftp: [
        { label: "NetExec ftp", cmd: "nxc ftp " + ip + " -u " + q(u) + " -p " + q(pass) },
        { label: "ftp — interactive", cmd: "ftp " + ip }
      ]
    };
    return map[svc] || [
      { label: "NetExec " + svc, cmd: "nxc " + svc + " " + ip + " -u " + q(u) + " -p " + q(pass) + dFlag }
    ];
  }

  function closeConnectDrawer(){
    var d = document.getElementById("connectDrawer");
    if (d) d.remove();
    document.removeEventListener("keydown", connectDrawerEsc);
  }
  function connectDrawerEsc(e){ if (e.key === "Escape") closeConnectDrawer(); }

  function openConnectDrawer(service, user, secret, ip){
    closeConnectDrawer();
    var connectCmds = connectCommandsFor(service, user, secret, ip);

    // Verify command (same one the tag copies) — its own section.
    var vu = (user || "").trim(), vdom = "";
    if (vu.indexOf("\\") !== -1){ var vp = vu.split("\\"); vdom = vp[0]; vu = vp.slice(1).join("\\"); }
    var verifyCmd = "nxc " + service + " " + ip + " -u " + shQuote(vu) + " -p " + shQuote(secret || "") +
      (vdom ? " -d " + shQuote(vdom) : "");
    var verifyCmds = [{ label: "NetExec — is this cred still valid?", cmd: verifyCmd }];

    var back = document.createElement("div");
    back.className = "connect-backdrop";
    back.id = "connectDrawer";

    var drawer = document.createElement("div");
    drawer.className = "connect-drawer";

    var head = document.createElement("div");
    head.className = "connect-drawer-head";
    head.innerHTML = '<div class="connect-drawer-title">Connect &middot; <span class="cv-service">' +
      escapeHtml(service) + '</span></div>';
    var closeBtn = document.createElement("button");
    closeBtn.type = "button"; closeBtn.className = "modal-close"; closeBtn.textContent = "x";
    closeBtn.addEventListener("click", closeConnectDrawer);
    head.appendChild(closeBtn);
    drawer.appendChild(head);

    var sub = document.createElement("div");
    sub.className = "connect-drawer-sub";
    sub.textContent = (user || "-") + " : " + (secret || "-") + "   @ " + ip;
    drawer.appendChild(sub);

    function renderSection(title, items){
      var sec = document.createElement("div");
      sec.className = "connect-section";
      var h = document.createElement("div");
      h.className = "connect-section-title"; h.textContent = title;
      sec.appendChild(h);
      var list = document.createElement("div");
      list.className = "connect-cmd-list";
      items.forEach(function(item){
        var row = document.createElement("div");
        row.className = "connect-cmd";
        var lab = document.createElement("div");
        lab.className = "connect-cmd-label"; lab.textContent = item.label;
        row.appendChild(lab);
        var line = document.createElement("div");
        line.className = "connect-cmd-row";
        var code = document.createElement("code");
        code.className = "connect-cmd-code"; code.textContent = item.cmd;
        line.appendChild(code);
        var copy = document.createElement("button");
        copy.type = "button"; copy.className = "cv-verify-btn"; copy.textContent = "[copy]";
        copy.addEventListener("click", function(){ copyText(item.cmd, copy, { reset: "[copy]" }); });
        line.appendChild(copy);
        row.appendChild(line);
        list.appendChild(row);
      });
      sec.appendChild(list);
      return sec;
    }

    drawer.appendChild(renderSection("Verify", verifyCmds));
    drawer.appendChild(renderSection("Connect / other commands", connectCmds));

    back.appendChild(drawer);
    back.addEventListener("click", function(e){ if (e.target === back) closeConnectDrawer(); });
    document.body.appendChild(back);
    document.addEventListener("keydown", connectDrawerEsc);
    // trigger slide-in
    requestAnimationFrame(function(){ back.classList.add("open"); });
  }

  /* One editable valid-credential ticket for a grouped credential:
       { user, secret, services: { svc: "valid"|"pwned", ... } }
     Shows every protocol the cred is valid on (pwned ones marked). Clicking a
     service tag copies the nxc command for THAT service. */
  function makeCredVerifyRow(grp){
    var services = Object.keys(grp.services);
    var anyPwned = services.some(function(s){ return grp.services[s] === "pwned"; });
    var card = document.createElement("div");
    card.className = "cred-ticket" + (anyPwned ? " pwned" : " valid");

    var main = document.createElement("div");
    main.className = "cred-ticket-main";

    // Fields as click-to-copy TEXT (not inputs): click user → copy user,
    // click secret → copy secret. Brief green flash on copy.
    var body = document.createElement("div");
    body.className = "cred-ticket-fields";
    function field(labelText, cls, value){
      var g = document.createElement("div");
      g.className = "cv-group";
      var lab = document.createElement("label");
      lab.className = "cv-label"; lab.textContent = labelText;
      var val = document.createElement("button");
      val.type = "button";
      val.className = "cv-value " + cls;
      val.textContent = value || "-";
      val.title = "click to copy";
      val.addEventListener("click", function(){
        writeClipboard(value || "", function(){
          val.classList.add("copied");
          setTimeout(function(){ val.classList.remove("copied"); }, 700);
        });
      });
      g.appendChild(lab); g.appendChild(val);
      return g;
    }
    body.appendChild(field("USER", "cv-user", grp.user));
    body.appendChild(field("SECRET / HASH", "cv-secret", grp.secret));

    // Build the nxc command for one service.
    function cmdFor(svc){
      var u = (grp.user || "").trim();
      var ip = (typeof activeProject !== "undefined" && activeProject && activeProject.target_ip)
        ? activeProject.target_ip : "<IP>";
      var domain = "";
      if (u.indexOf("\\") !== -1){ var parts = u.split("\\"); domain = parts[0]; u = parts.slice(1).join("\\"); }
      var c = "nxc " + svc + " " + ip + " -u " + shQuote(u) + " -p " + shQuote(grp.secret || "");
      if (domain) c += " -d " + shQuote(domain);
      return c;
    }

    // Header strip: one CLICKABLE tag per protocol (click = copy that cmd).
    var top = document.createElement("div");
    top.className = "cred-ticket-top";
    var svcWrap = document.createElement("div");
    svcWrap.className = "cred-ticket-svcs";
    var ipFor = (typeof activeProject !== "undefined" && activeProject && activeProject.target_ip)
      ? activeProject.target_ip : "<IP>";
    services.forEach(function(svc){
      var isPwned = grp.services[svc] === "pwned";
      var wrap = document.createElement("span");
      wrap.className = "cv-service-wrap";

      var tag = document.createElement("button");
      tag.type = "button";
      tag.className = "cv-service clickable" + (isPwned ? " pwned" : "");
      tag.textContent = svc + (isPwned ? " ★" : "");
      tag.title = "click to copy the nxc command for " + svc;
      tag.addEventListener("click", function(){
        writeClipboard(cmdFor(svc), function(){
          tag.classList.add("copied");
          setTimeout(function(){ tag.classList.remove("copied"); }, 700);
        });
      });
      wrap.appendChild(tag);

      // Info icon → opens the right drawer with connect commands for this svc.
      var info = document.createElement("button");
      info.type = "button";
      info.className = "cv-info" + (isPwned ? " pwned" : "");
      info.textContent = "ⓘ";   // ⓘ
      info.title = "connection commands for " + svc;
      info.addEventListener("click", function(e){
        e.stopPropagation();
        openConnectDrawer(svc, grp.user, grp.secret, ipFor);
      });
      wrap.appendChild(info);

      svcWrap.appendChild(wrap);
    });
    top.appendChild(svcWrap);
    var flag = document.createElement("span");
    flag.className = "cred-ticket-flag";
    flag.textContent = anyPwned ? "★ PWNED" : "✓ VALID";
    top.appendChild(flag);

    // Save this cred into the vault (fills $USER/$PASS in notes).
    var vaultBtn = document.createElement("button");
    vaultBtn.type = "button"; vaultBtn.className = "cred-vault-add";
    vaultBtn.textContent = "⚿ vault";
    vaultBtn.title = "add to the credentials vault";
    vaultBtn.addEventListener("click", function(){
      if (typeof credVaultAdd !== "function") return;
      var res = credVaultAdd(grp.user, grp.secret);
      vaultBtn.textContent = res.added ? "✓ added" : "✓ " + (res.reason || "in vault");
      setTimeout(function(){ vaultBtn.textContent = "⚿ vault"; }, 1200);
    });
    top.appendChild(vaultBtn);

    main.appendChild(top);
    main.appendChild(body);
    card.appendChild(main);
    return card;
  }

  function renderCredResults(data, wrap, service){
    if (!wrap) return;
    var results = data.results || [];
    // NOTE: don't early-return on empty results — that would wipe the toolbar
    // (and its service dropdown), trapping the user on an empty service. We
    // always render the summary + toolbar, and show an empty note in place of
    // the table below.
    wrap.innerHTML = "";

    var order = ["pwned", "valid", "failed"];
    var seen = {}; var states = [];
    results.forEach(function(r){ if (!seen[r.status]){ seen[r.status] = true; states.push(r.status); } });
    states.sort(function(a, b){ return order.indexOf(a) - order.indexOf(b); });

    if (service === undefined) service = activeCredFile || "";

    // ---- Valid credentials summary (always visible, prominent) ----
    // Group every success by user:secret, collecting ALL services it's valid
    // on (and marking which are pwned), so one ticket lists every protocol.
    var vgroups = {}; var vorder = [];
    results.forEach(function(r){
      if (r.status !== "valid" && r.status !== "pwned") return;
      var key = (r.user || "") + ":" + (r.secret || "");
      var svc = r._service || service || "?";
      if (!vgroups[key]){ vgroups[key] = { user: r.user || "", secret: r.secret || "", services: {} }; vorder.push(key); }
      var g = vgroups[key];
      if (g.services[svc] !== "pwned") g.services[svc] = (r.status === "pwned" ? "pwned" : "valid");
    });
    var validCreds = vorder.map(function(k){ return vgroups[k]; });

    // Badge the Results tab with the valid-cred count so it's visible from
    // the Build view too.
    var resTab = document.getElementById("credResultsTab");
    if (resTab){
      resTab.innerHTML = "Results" + (validCreds.length
        ? ' <span class="cred-view-badge">' + validCreds.length + "</span>" : "");
    }

    var summary = document.createElement("div");
    summary.className = "cred-summary " + (validCreds.length ? "has-valid" : "none");
    if (validCreds.length){
      var head = document.createElement("div");
      head.className = "cred-summary-head";
      head.innerHTML = '<span class="cred-summary-count">✓ ' + validCreds.length +
        ' valid credential' + (validCreds.length === 1 ? '' : 's') +
        (service ? '</span><span class="cred-summary-hint">across <b>' + escapeHtml(service) + '</b>'
                 : '</span><span class="cred-summary-hint">across all services') + '</span>';
      summary.appendChild(head);

      var list = document.createElement("div");
      list.className = "cred-verify-list";
      validCreds.forEach(function(g){ list.appendChild(makeCredVerifyRow(g)); });
      summary.appendChild(list);
    } else {
      summary.textContent = "No valid credentials yet.";
    }
    wrap.appendChild(summary);

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
        renderCredResults(data, wrap, service);
      });
      filterGroup.appendChild(btn);
    });
    bar.appendChild(filterGroup);

    // Right-side controls: copy + the service picker dropdown.
    var rightGroup = document.createElement("div");
    rightGroup.className = "cred-toolbar-right";

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
    rightGroup.appendChild(copyBtn);

    // Service dropdown (All + each saved service file).
    var files = credFiles || [];
    if (files.length){
      var sel = document.createElement("select");
      sel.className = "cred-service-select";
      var opts = files.length > 1 ? [CRED_ALL].concat(files) : files.slice();
      opts.forEach(function(name){
        var opt = document.createElement("option");
        opt.value = name;
        opt.textContent = name === CRED_ALL ? "All services" : name;
        if (name === activeCredFile) opt.selected = true;
        sel.appendChild(opt);
      });
      sel.addEventListener("change", function(){
        activeCredFile = sel.value;
        loadCredResults();
      });
      rightGroup.appendChild(sel);
    }

    bar.appendChild(rightGroup);
    wrap.appendChild(bar);

    var visible = current === "all" ? results : results.filter(function(r){ return r.status === current; });
    if (visible.length === 0){
      var none = document.createElement("div");
      none.className = "eng-status";
      none.textContent = results.length === 0
        ? "no credential attempts parsed for this service yet."
        : "no results match this filter.";
      wrap.appendChild(none);
      return;
    }

    var showSvc = !service;   // All/merged view → include a SERVICE column
    var table = document.createElement("table");
    table.className = "nmap-table" + (showSvc ? " has-service" : "");
    var thead = document.createElement("thead");
    thead.innerHTML = "<tr><th>STATUS</th>" + (showSvc ? "<th>SERVICE</th>" : "") + "<th>USER</th><th>SECRET</th></tr>";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    visible.forEach(function(r){
      var tr = document.createElement("tr");
      tr.title = r.raw;
      tr.className = "cred-row " + credStatusClass(r.status);

      var tdStatus = document.createElement("td");
      var statusSpan = document.createElement("span");
      statusSpan.className = "cred-badge " + credStatusClass(r.status);
      statusSpan.textContent = r.status;
      tdStatus.appendChild(statusSpan);
      tr.appendChild(tdStatus);

      if (showSvc){
        var tdSvc = document.createElement("td");
        var svcTag = document.createElement("span");
        svcTag.className = "cv-service";
        svcTag.textContent = r._service || "-";
        tdSvc.appendChild(svcTag);
        tr.appendChild(tdSvc);
      }

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

  function setCredView(view){
    activeCredView = view;
    var buildV = document.getElementById("credBuildView");
    var resV = document.getElementById("credResultsView");
    if (buildV) buildV.hidden = view !== "build";
    if (resV) resV.hidden = view !== "results";
    document.querySelectorAll(".cred-view-btn").forEach(function(b){
      b.classList.toggle("active", b.getAttribute("data-view") === view);
    });
    // Reload only makes sense for results — hide it on the Build view.
    var reloadBtn = document.getElementById("reloadCredsBtn");
    if (reloadBtn) reloadBtn.hidden = view !== "results";
  }

  function renderCredCheckerPanel(cat){
    loadCredFields();   // restore persisted usernames/passwords
    renderCredServiceTabs(cat);
    renderCredModeTabs(cat);
    renderCredBuilder(cat);
    refreshCredFiles(cat);
    setCredView(activeCredView || "build");

    document.querySelectorAll(".cred-view-btn").forEach(function(btn){
      btn.addEventListener("click", function(){ setCredView(btn.getAttribute("data-view")); });
    });

    var reloadBtn = document.getElementById("reloadCredsBtn");
    if (reloadBtn && !reloadBtn.dataset.wired){
      reloadBtn.dataset.wired = "1";
      reloadBtn.addEventListener("click", function(){ refreshCredFiles(cat); });
    }
  }

