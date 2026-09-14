"use strict";

/* Tools workspace — standalone client-side utilities, no active project or
   backend call required. Add more entries to TOOLS_REGISTRY (each an
   {id,label,render(container)}) to grow this the same way PLAYBOOK grows
   the Engagement sidebar. */
var TOOLS_REGISTRY = [
  { id: "username_extractor", label: "Username Extractor", render: renderUsernameExtractor },
  { id: "username_generator", label: "Username Generator", render: renderUsernameGenerator }
];
var activeToolId = null;

function currentTool(){
  if (!activeToolId || !TOOLS_REGISTRY.some(function(t){ return t.id === activeToolId; })){
    activeToolId = TOOLS_REGISTRY[0] ? TOOLS_REGISTRY[0].id : null;
  }
  for (var i=0;i<TOOLS_REGISTRY.length;i++){
    if (TOOLS_REGISTRY[i].id === activeToolId) return TOOLS_REGISTRY[i];
  }
  return null;
}

function renderToolsSidebar(){
  var treeEl = document.getElementById("toolsTree");
  if (!treeEl) return;
  treeEl.innerHTML = "";
  currentTool();

  var details = document.createElement("details");
  details.className = "tree-folder";
  details.open = true;
  var summary = document.createElement("summary");
  setTreeLabel(summary, "[Tools]");
  details.appendChild(summary);

  var childWrap = document.createElement("div");
  childWrap.className = "tree-children";
  TOOLS_REGISTRY.forEach(function(tool){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tree-file" + (tool.id === activeToolId ? " active" : "");
    btn.textContent = tool.label;
    btn.title = tool.label;
    btn.addEventListener("click", function(){
      activeToolId = tool.id;
      renderToolsSidebar();
      renderToolsView();
    });
    childWrap.appendChild(btn);
  });
  details.appendChild(childWrap);
  treeEl.appendChild(details);
}

function renderToolsView(){
  renderToolsSidebar();
  var content = document.getElementById("content");
  var crumb = document.getElementById("breadcrumb");
  if (crumb) crumb.textContent = "";
  var tool = currentTool();
  if (!tool || !content){
    if (content) content.innerHTML = '<div class="empty-state">No tools available.</div>';
    return;
  }
  tool.render(content);
}

/* ---------- Username Extractor ----------
   Pastes of raw enumeration output are messy (extra columns, group
   entries, banner lines) — each format below is a {label, template,
   extract(text)} tailored to one specific command's actual output shape,
   same "each source gets its own parser" approach as the nmap/rustscan
   results. "Load template" fills in a realistic dummy example so you can
   see what a format expects before you have real output to paste. */
var USERNAME_EXTRACT_FORMATS = [
  {
    id: "nxc-users",
    label: "nxc smb --users",
    template:
      "SMB   10.10.10.5   445   DC01   [*] Enumerated domain user(s)\n" +
      "SMB   10.10.10.5   445   DC01   CORP.LOCAL\\Administrator        badPwdCount: 0\n" +
      "SMB   10.10.10.5   445   DC01   CORP.LOCAL\\Guest               badPwdCount: 0\n" +
      "SMB   10.10.10.5   445   DC01   CORP.LOCAL\\krbtgt              badPwdCount: 0\n" +
      "SMB   10.10.10.5   445   DC01   CORP.LOCAL\\jdoe                badPwdCount: 0\n" +
      "SMB   10.10.10.5   445   DC01   CORP.LOCAL\\svc_backup          badPwdCount: 1",
    extract: function(text){
      var out = [];
      text.split("\n").forEach(function(line){
        var m = line.match(/^\S+\s+\S+\s+\S+\s+\S+\s+(\S+)\\(\S+)/);
        if (m && m[1].indexOf("[*]") === -1) out.push(m[2]);
      });
      return out;
    }
  },
  {
    id: "rid-brute",
    label: "nxc --rid-brute",
    template:
      "SMB   10.10.10.5   445   DC01   498: CORP\\Enterprise Read-only Domain Controllers (SidTypeGroup)\n" +
      "SMB   10.10.10.5   445   DC01   500: CORP\\Administrator (SidTypeUser)\n" +
      "SMB   10.10.10.5   445   DC01   501: CORP\\Guest (SidTypeUser)\n" +
      "SMB   10.10.10.5   445   DC01   512: CORP\\Domain Admins (SidTypeGroup)\n" +
      "SMB   10.10.10.5   445   DC01   1000: CORP\\jdoe (SidTypeUser)\n" +
      "SMB   10.10.10.5   445   DC01   1001: CORP\\svc_backup (SidTypeUser)",
    extract: function(text){
      var out = [];
      var re = /\d+:\s+\S+\\(.+?)\s+\(SidTypeUser\)/g;
      var m;
      while ((m = re.exec(text))) out.push(m[1].trim());
      return out;
    }
  },
  {
    id: "rpcclient",
    label: "rpcclient enumdomusers",
    template:
      "user:[Administrator] rid:[0x1f4]\n" +
      "user:[Guest] rid:[0x1f5]\n" +
      "user:[krbtgt] rid:[0x3e8]\n" +
      "user:[jdoe] rid:[0x450]\n" +
      "user:[svc_backup] rid:[0x451]",
    extract: function(text){
      var out = [];
      var re = /user:\[([^\]]+)\]/g;
      var m;
      while ((m = re.exec(text))) out.push(m[1].trim());
      return out;
    }
  }
];
var activeUserExtractFormat = USERNAME_EXTRACT_FORMATS[0].id;

// Built-in/default AD & local accounts — noise you almost never want in a
// spray/bruteforce list, so they're filtered out unless the checkbox is on.
var DEFAULT_ACCOUNT_NAMES = ["krbtgt", "administrator", "guest", "defaultaccount", "wdagutilityaccount"];
var includeDefaultAccounts = false;

function currentUserExtractFormat(){
  for (var i=0;i<USERNAME_EXTRACT_FORMATS.length;i++){
    if (USERNAME_EXTRACT_FORMATS[i].id === activeUserExtractFormat) return USERNAME_EXTRACT_FORMATS[i];
  }
  return USERNAME_EXTRACT_FORMATS[0];
}

function uniqueCaseInsensitive(list){
  var seen = {}; var out = [];
  list.forEach(function(u){
    var key = u.toLowerCase();
    if (!seen[key]){ seen[key] = true; out.push(u); }
  });
  return out;
}

function applyDefaultAccountFilter(list){
  if (includeDefaultAccounts) return list;
  return list.filter(function(u){ return DEFAULT_ACCOUNT_NAMES.indexOf(u.toLowerCase()) === -1; });
}

function extractedUsernames(){
  var input = document.getElementById("userExtractInput");
  var text = input ? (input.value || "") : "";
  var found = text.trim() ? currentUserExtractFormat().extract(text) : [];
  return applyDefaultAccountFilter(uniqueCaseInsensitive(found));
}

function renderUsernameExtractor(content){
  var html = '<div class="engagement">';
  html += '<div class="eng-section">';
  html += '<div class="eng-head-row"><h3>Username Extractor</h3></div>';
  html += '<div class="eng-meta">Paste raw output from an enumeration command, pick the matching format, and pull out just the usernames.</div>';
  html += '</div>';

  html += '<div class="eng-section">';
  html += '<div class="eng-head-row"><h3>Raw output</h3>';
  html += '<select id="userExtractFormatSelect" class="proj-select" style="width:auto;"></select>';
  html += '<button type="button" class="checklist-toggle" id="loadTemplateBtn">[load template]</button>';
  html += '<button type="button" class="checklist-toggle" id="clearRawBtn">[clear]</button>';
  html += '</div>';
  html += '<textarea id="userExtractInput" class="raw-extract-input" rows="9" placeholder="Paste command output here..." spellcheck="false"></textarea>';
  html += '</div>';

  html += '<div class="eng-section">';
  html += '<div class="builder-flags">';
  html += '<label class="builder-flag"><input type="checkbox" id="includeDefaultsCb"> Include default accounts (krbtgt, Administrator, Guest, ...)</label>';
  html += '</div>';
  html += '</div>';

  html += '<div class="eng-section">';
  html += '<div class="eng-head-row"><h3>Usernames found (<span id="userExtractCount">0</span>)</h3>';
  html += '<button type="button" class="run-btn copy-cmd-btn" id="copyUsernamesBtn">[copy usernames]</button>';
  html += '</div>';
  html += '<textarea id="userExtractOutput" class="raw-extract-input" rows="9" readonly placeholder="paste output above, or [load template] to see an example."></textarea>';
  html += '</div>';
  html += '</div>';

  content.innerHTML = html;

  renderUserExtractFormatSelect();
  wireUserExtractor();
}

function renderUserExtractFormatSelect(){
  var sel = document.getElementById("userExtractFormatSelect");
  if (!sel) return;
  sel.innerHTML = "";
  USERNAME_EXTRACT_FORMATS.forEach(function(fmt){
    var opt = document.createElement("option");
    opt.value = fmt.id;
    opt.textContent = fmt.label;
    sel.appendChild(opt);
  });
  sel.value = activeUserExtractFormat;
}

function runUserExtraction(){
  var output = document.getElementById("userExtractOutput");
  var countEl = document.getElementById("userExtractCount");
  if (!output) return;

  var unique = extractedUsernames();
  if (countEl) countEl.textContent = String(unique.length);
  output.value = unique.join("\n");
}

function wireUserExtractor(){
  var input = document.getElementById("userExtractInput");
  var formatSelect = document.getElementById("userExtractFormatSelect");
  var includeDefaultsCb = document.getElementById("includeDefaultsCb");
  var loadBtn = document.getElementById("loadTemplateBtn");
  var clearBtn = document.getElementById("clearRawBtn");
  var copyBtn = document.getElementById("copyUsernamesBtn");

  if (input) input.addEventListener("input", runUserExtraction);
  if (formatSelect){
    formatSelect.addEventListener("change", function(){
      activeUserExtractFormat = formatSelect.value;
      runUserExtraction();
    });
  }
  if (includeDefaultsCb){
    includeDefaultsCb.checked = includeDefaultAccounts;
    includeDefaultsCb.addEventListener("change", function(){
      includeDefaultAccounts = includeDefaultsCb.checked;
      runUserExtraction();
    });
  }
  if (loadBtn) loadBtn.addEventListener("click", function(){
    input.value = currentUserExtractFormat().template;
    runUserExtraction();
  });
  if (clearBtn) clearBtn.addEventListener("click", function(){
    input.value = "";
    runUserExtraction();
  });
  if (copyBtn) copyBtn.addEventListener("click", function(){
    copyText(extractedUsernames().join("\n"), copyBtn, { reset: "[copy usernames]" });
  });

  runUserExtraction();
}

/* ---------- Username Generator ----------
   Turns one name (or a pasted list of names) into common username
   permutations. Two layers of pill selection: the "[manage rules]" modal
   lists every rule in ALL_UG_RULES and lets the user choose which ones are
   even worth showing (ugVisibleRuleIds); only that visible subset is then
   rendered as pills in the main Rules section, where the user does the
   actual apply/don't-apply toggling (ugSelectedRuleIds). A name is reduced
   to lowercase-letters-only before any rule runs, so punctuation/spaces in
   a pasted name never leak into the output. */
  function ugCleanName(s){
    return String(s || "").toLowerCase().replace(/[^a-z]/g, "");
  }

  var DEFAULT_UG_RULES = [
    { id: "first.last", label: "first.last", apply: function(f,l){ return f + "." + l; } },
    { id: "flast", label: "flast", apply: function(f,l){ return f.charAt(0) + l; } },
    { id: "firstlast", label: "firstlast", apply: function(f,l){ return f + l; } },
    { id: "first_last", label: "first_last", apply: function(f,l){ return f + "_" + l; } },
    { id: "f.last", label: "f.last", apply: function(f,l){ return f.charAt(0) + "." + l; } },
    { id: "first.l", label: "first.l", apply: function(f,l){ return f + "." + l.charAt(0); } },
    { id: "firstl", label: "firstl", apply: function(f,l){ return f + l.charAt(0); } },
    { id: "last.first", label: "last.first", apply: function(f,l){ return l + "." + f; } },
    { id: "lastfirst", label: "lastfirst", apply: function(f,l){ return l + f; } },
    { id: "last_first", label: "last_first", apply: function(f,l){ return l + "_" + f; } },
    { id: "first", label: "first", apply: function(f,l){ return f; } },
    { id: "last", label: "last", apply: function(f,l){ return l; } },
    { id: "first-last", label: "first-last", apply: function(f,l){ return f + "-" + l; } }
  ];
  var MORE_UG_RULES = [
    { id: "l.first", label: "l.first", apply: function(f,l){ return l.charAt(0) + "." + f; } },
    { id: "lfirst", label: "lfirst", apply: function(f,l){ return l.charAt(0) + f; } },
    { id: "last.f", label: "last.f", apply: function(f,l){ return l + "." + f.charAt(0); } },
    { id: "lastf", label: "lastf", apply: function(f,l){ return l + f.charAt(0); } },
    { id: "f_last", label: "f_last", apply: function(f,l){ return f.charAt(0) + "_" + l; } },
    { id: "last_f", label: "last_f", apply: function(f,l){ return l + "_" + f.charAt(0); } },
    { id: "fl", label: "fl (initials)", apply: function(f,l){ return f.charAt(0) + l.charAt(0); } },
    { id: "lf", label: "lf (initials)", apply: function(f,l){ return l.charAt(0) + f.charAt(0); } },
    { id: "last-first", label: "last-first", apply: function(f,l){ return l + "-" + f; } },
    { id: "first_l", label: "first_l", apply: function(f,l){ return f + "_" + l.charAt(0); } },
    { id: "l_first", label: "l_first", apply: function(f,l){ return l.charAt(0) + "_" + f; } },
    { id: "first3last3", label: "first3last3", apply: function(f,l){ return f.slice(0,3) + l.slice(0,3); } },
    { id: "first3last", label: "first3+last", apply: function(f,l){ return f.slice(0,3) + l; } },
    { id: "firstlast3", label: "first+last3", apply: function(f,l){ return f + l.slice(0,3); } }
  ];
  var ALL_UG_RULES = DEFAULT_UG_RULES.concat(MORE_UG_RULES);

  var ugVisibleRuleIds = {}; // rule id -> bool — shown as a pill in the main Rules section
  DEFAULT_UG_RULES.forEach(function(r){ ugVisibleRuleIds[r.id] = true; });
  MORE_UG_RULES.forEach(function(r){ ugVisibleRuleIds[r.id] = false; });

  var ugSelectedRuleIds = {}; // rule id -> bool — actually applied when generating
  ["first.last", "flast", "firstlast", "f.last"].forEach(function(id){ ugSelectedRuleIds[id] = true; });
  var ugMode = "single"; // single | bulk

  function ugSafeApply(rule, first, last){
    var out;
    try{ out = rule.apply(first || "", last || ""); }catch(e){ return ""; }
    return String(out || "").replace(/^[._-]+|[._-]+$/g, "");
  }

  function currentUgPeople(){
    if (ugMode === "single"){
      var f = ugCleanName((document.getElementById("ugFirstName") || {}).value);
      var l = ugCleanName((document.getElementById("ugLastName") || {}).value);
      return (f || l) ? [{ first: f, last: l }] : [];
    }
    var text = (document.getElementById("ugBulkNames") || {}).value || "";
    var people = [];
    text.split("\n").forEach(function(line){
      line = line.trim();
      if (!line) return;
      var parts = line.split(/\s+/);
      var first = ugCleanName(parts[0]);
      var last = ugCleanName(parts.slice(1).join(""));
      if (first || last) people.push({ first: first, last: last });
    });
    return people;
  }

  function generateUsernames(){
    var people = currentUgPeople();
    var rules = ALL_UG_RULES.filter(function(r){ return ugVisibleRuleIds[r.id] && ugSelectedRuleIds[r.id]; });
    if (people.length === 0 || rules.length === 0) return [];

    var out = [];
    people.forEach(function(p){
      rules.forEach(function(rule){
        var base = ugSafeApply(rule, p.first, p.last);
        if (base) out.push(base);
      });
    });
    return uniqueCaseInsensitive(out);
  }

  function renderUsernameGenerator(content){
    var html = '<div class="engagement">';
    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>Username Generator</h3></div>';
    html += '<div class="eng-meta">Turn a name — or a pasted list of names — into common username permutations.</div>';
    html += '</div>';

    html += '<div class="eng-section">';
    html += '<div class="eng-subhead">Input</div>';
    html += '<div class="tool-tabs" id="ugModeTabs"></div>';
    html += '<div id="ugInputArea"></div>';
    html += '</div>';

    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>Rules</h3>';
    html += '<button type="button" class="checklist-toggle" id="ugManageRulesBtn">[manage rules]</button>';
    html += '</div>';
    html += '<div class="tool-tabs" id="ugRulesList"></div>';
    html += '</div>';

    html += '<div class="eng-section">';
    html += '<div class="eng-head-row"><h3>Usernames generated (<span id="ugCount">0</span>)</h3>';
    html += '<button type="button" class="run-btn copy-cmd-btn" id="ugCopyBtn">[copy usernames]</button>';
    html += '</div>';
    html += '<textarea id="ugOutput" class="raw-extract-input" rows="10" readonly placeholder="fill in a name above and pick at least one rule."></textarea>';
    html += '</div>';

    html += '<div class="modal-backdrop" id="ugRulesModalBackdrop" hidden>';
    html += '<div class="modal-dialog card" role="dialog" aria-modal="true" aria-labelledby="ugRulesModalTitle">';
    html += '<div class="modal-head"><h4 id="ugRulesModalTitle">Choose rules to show</h4>';
    html += '<button type="button" class="modal-close" id="ugRulesModalCloseBtn" aria-label="Close">&times;</button>';
    html += '</div>';
    html += '<div class="modal-body">';
    html += '<div class="eng-meta">Pick which rules show up in the Rules section. You can then pick which of those to actually apply.</div>';
    html += '<div class="tool-tabs" id="ugAllRulesList"></div>';
    html += '</div>';
    html += '<div class="modal-actions"><button type="button" id="ugRulesModalDoneBtn">Done</button></div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    content.innerHTML = html;

    renderUgModeTabs();
    renderUgInputArea();
    renderUgRulesList();
    wireUsernameGenerator();
  }

  function renderUgModeTabs(){
    var wrap = document.getElementById("ugModeTabs");
    if (!wrap) return;
    wrap.innerHTML = "";
    [{ id: "single", label: "Single name" }, { id: "bulk", label: "Bulk list" }].forEach(function(m){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tool-tab" + (m.id === ugMode ? " active" : "");
      btn.textContent = m.label;
      btn.addEventListener("click", function(){
        ugMode = m.id;
        renderUgModeTabs();
        renderUgInputArea();
        runUsernameGeneration();
      });
      wrap.appendChild(btn);
    });
  }

  function renderUgInputArea(){
    var wrap = document.getElementById("ugInputArea");
    if (!wrap) return;
    if (ugMode === "single"){
      wrap.innerHTML =
        '<div class="cred-fields">' +
        '<div class="cred-field"><label for="ugFirstName">First name</label>' +
        '<input type="text" id="ugFirstName" placeholder="John" autocomplete="off" spellcheck="false"></div>' +
        '<div class="cred-field"><label for="ugLastName">Last name</label>' +
        '<input type="text" id="ugLastName" placeholder="Doe" autocomplete="off" spellcheck="false"></div>' +
        '</div>';
    } else {
      wrap.innerHTML =
        '<div class="cred-fields">' +
        '<div class="cred-field"><label for="ugBulkNames">Full names, one per line (first + last separated by a space)</label>' +
        '<textarea id="ugBulkNames" rows="6" placeholder="John Doe\nJane Smith\nBob Van Buren" spellcheck="false"></textarea></div>' +
        '</div>';
    }
    var f = document.getElementById("ugFirstName"), l = document.getElementById("ugLastName"), b = document.getElementById("ugBulkNames");
    [f, l, b].forEach(function(el){ if (el) el.addEventListener("input", runUsernameGeneration); });
  }

  function makeRulePill(rule){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-tab" + (ugSelectedRuleIds[rule.id] ? " active" : "");
    var nameSpan = document.createElement("span");
    nameSpan.textContent = rule.label;
    btn.appendChild(nameSpan);
    var exampleSpan = document.createElement("span");
    exampleSpan.className = "rule-pill-example";
    exampleSpan.textContent = " (" + ugSafeApply(rule, "john", "doe") + ")";
    btn.appendChild(exampleSpan);
    btn.addEventListener("click", function(){
      ugSelectedRuleIds[rule.id] = !ugSelectedRuleIds[rule.id];
      btn.classList.toggle("active", ugSelectedRuleIds[rule.id]);
      runUsernameGeneration();
    });
    return btn;
  }

  function renderUgRulesList(){
    var wrap = document.getElementById("ugRulesList");
    if (!wrap) return;
    wrap.innerHTML = "";
    ALL_UG_RULES.filter(function(r){ return ugVisibleRuleIds[r.id]; })
      .forEach(function(rule){ wrap.appendChild(makeRulePill(rule)); });
  }

  function makeVisibilityPill(rule){
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-tab" + (ugVisibleRuleIds[rule.id] ? " active" : "");
    var nameSpan = document.createElement("span");
    nameSpan.textContent = rule.label;
    btn.appendChild(nameSpan);
    var exampleSpan = document.createElement("span");
    exampleSpan.className = "rule-pill-example";
    exampleSpan.textContent = " (" + ugSafeApply(rule, "john", "doe") + ")";
    btn.appendChild(exampleSpan);
    btn.addEventListener("click", function(){
      ugVisibleRuleIds[rule.id] = !ugVisibleRuleIds[rule.id];
      btn.classList.toggle("active", ugVisibleRuleIds[rule.id]);
      renderUgRulesList();
      runUsernameGeneration();
    });
    return btn;
  }

  function renderUgAllRulesModalList(){
    var wrap = document.getElementById("ugAllRulesList");
    if (!wrap) return;
    wrap.innerHTML = "";
    ALL_UG_RULES.forEach(function(rule){ wrap.appendChild(makeVisibilityPill(rule)); });
  }

  function openUgRulesModal(){
    var backdrop = document.getElementById("ugRulesModalBackdrop");
    if (!backdrop) return;
    renderUgAllRulesModalList();
    backdrop.hidden = false;
  }

  function closeUgRulesModal(){
    var backdrop = document.getElementById("ugRulesModalBackdrop");
    if (backdrop) backdrop.hidden = true;
  }

  function runUsernameGeneration(){
    var output = document.getElementById("ugOutput");
    var countEl = document.getElementById("ugCount");
    if (!output) return;
    var list = generateUsernames();
    if (countEl) countEl.textContent = String(list.length);
    output.value = list.join("\n");
  }

  function wireUsernameGenerator(){
    var manageRulesBtn = document.getElementById("ugManageRulesBtn");
    var copyBtn = document.getElementById("ugCopyBtn");
    var modalBackdrop = document.getElementById("ugRulesModalBackdrop");
    var modalCloseBtn = document.getElementById("ugRulesModalCloseBtn");
    var modalDoneBtn = document.getElementById("ugRulesModalDoneBtn");

    if (manageRulesBtn) manageRulesBtn.addEventListener("click", openUgRulesModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeUgRulesModal);
    if (modalDoneBtn) modalDoneBtn.addEventListener("click", closeUgRulesModal);
    if (modalBackdrop){
      modalBackdrop.addEventListener("click", function(e){
        if (e.target === modalBackdrop) closeUgRulesModal();
      });
    }
    if (copyBtn){
      copyBtn.addEventListener("click", function(){
        copyText(generateUsernames().join("\n"), copyBtn, { reset: "[copy usernames]" });
      });
    }

    runUsernameGeneration();
  }
