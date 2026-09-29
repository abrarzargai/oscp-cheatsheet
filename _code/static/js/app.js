"use strict";

  /* ---------- Theme (dark/light) ----------
     The actual color values live in theme.css as CSS custom properties;
     this just flips the html element's data-theme attribute and persists
     the choice. An inline script at the top of index.html applies any
     saved choice before first paint (see there for why). No saved choice
     means the OS-level prefers-color-scheme media query decides — this
     code never has to know or care which one is currently in effect. */
  var THEME_KEY = "CheatSheet-theme-v1";

  function systemTheme(){
    return (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";
  }

  function activeTheme(){
    return document.documentElement.getAttribute("data-theme") || systemTheme();
  }

  function updateThemeToggleLabel(){
    var btn = document.getElementById("themeToggle");
    if (btn) btn.textContent = activeTheme() === "light" ? "[light]" : "[dark]";
  }

  function initTheme(){
    updateThemeToggleLabel();
    var btn = document.getElementById("themeToggle");
    if (!btn) return;
    btn.addEventListener("click", function(){
      var next = activeTheme() === "light" ? "dark" : "light";
      document.documentElement.setAttribute("data-theme", next);
      try{ localStorage.setItem(THEME_KEY, next); }catch(e){}
      updateThemeToggleLabel();
    });
  }

  initTheme();

  var STORAGE_KEY = "CheatSheet-config-v1";
  var TABS_KEY = "CheatSheet-tabs-v1";
  var MODE_KEY = "CheatSheet-mode-v1";
  var FIELDS = ["attackerIp","attackerPort","victimIp","domain","dcIp","scheme"];
  var VAR_MAP = [
    ["ATTACKER_IP","attackerIp"],
    ["PORT","attackerPort"],
    ["VICTIM_IP","victimIp"],
    ["DOMAIN","domain"],
    ["DC_IP","dcIp"],
    ["SCHEME","scheme"]
  ];
  var config = {};
  var wordlistPath = "";       // $WORDLIST_PATH base, loaded from Settings
  var hiddenModules = [];      // top-level category ids hidden from the Notes tree (Settings)
  var selectedCred = null;     // {user, secret} from the Creds vault → $USER/$PASS
  var tabs = [];
  var activeIndex = -1;
  var debounceTimer = null;
  var DATA = null;
  var ALL_FILES = [];

  function activeNode(){
    return (activeIndex >= 0 && tabs[activeIndex]) ? tabs[activeIndex].node : null;
  }

  function loadConfig(){
    try{
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    }catch(e){ return {}; }
  }
  function saveConfig(){
    try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(config)); }catch(e){}
  }

  /* ---------- Open-tabs persistence ----------
     Remember which notes are open and which one is active, keyed by the
     file's category+relpath (stable across reloads), so a refresh restores
     the exact session instead of starting from the first note. */
  function saveTabs(){
    try{
      var data = {
        open: tabs.map(function(t){
          return { category: t.node.category, relpath: t.node.relpath };
        }),
        active: activeIndex
      };
      localStorage.setItem(TABS_KEY, JSON.stringify(data));
    }catch(e){}
  }
  function loadSavedTabs(){
    try{
      var raw = localStorage.getItem(TABS_KEY);
      return raw ? JSON.parse(raw) : null;
    }catch(e){ return null; }
  }
  function restoreTabs(){
    var saved = loadSavedTabs();
    if (!saved || !saved.open || !saved.open.length) return false;
    saved.open.forEach(function(ref){
      var match = null;
      for (var i=0;i<ALL_FILES.length;i++){
        var n = ALL_FILES[i].node;
        if (n.category === ref.category && n.relpath === ref.relpath){ match = ALL_FILES[i]; break; }
      }
      // Skip refs that no longer resolve (note renamed/deleted since last visit).
      if (match && !tabs.some(function(t){ return t.node === match.node; })){
        tabs.push({ node: match.node, path: match.path });
      }
    });
    if (!tabs.length) return false;
    activeIndex = Math.min(Math.max(saved.active | 0, 0), tabs.length - 1);
    renderTabs();
    renderActiveTab();
    return true;
  }

  function escapeHtml(s){
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }

  /* ---------- Obsidian-flavored markdown preprocessing (fence-aware) ---------- */
  var CALLOUT_TAGS = {
    info:"[i]", tip:"[tip]", warning:"[!]", danger:"[!!]", error:"[!!]",
    note:"[note]", question:"[?]", example:"[ex]", success:"[ok]", bug:"[bug]", quote:"[quote]"
  };

  function transformLine(line){
    var out = line.replace(/!\[\[([^\]]+)\]\]/g, function(_, name){
      return "*[image: " + name.trim() + "]*";
    });
    // Obsidian-style topic tags, e.g. #AD_DEFINATION_SPN — turn into a clickable
    // link that triggers the content search for that tag (handled in enhanceContent).
    out = out.replace(/#(AD_[A-Za-z0-9_]+)/g, function(_, tagName){
      return "[#" + tagName + "](tag:" + tagName + ")";
    });
    var m = out.match(/^(\s*>\s*)\[!(\w+)\]\s*(.*)$/);
    if (m){
      var type = m[2].toLowerCase();
      var tag = CALLOUT_TAGS[type] || "[*]";
      var title = m[3].trim();
      out = m[1] + tag + " **" + (title || m[2]) + "**";
    }
    return out;
  }

  function preprocessMarkdown(md){
    var lines = md.split("\n");
    var inFence = false, marker = "";
    var out = [];
    for (var i=0;i<lines.length;i++){
      var line = lines[i];
      var fm = line.match(/^(\s*)(```|~~~)/);
      if (fm){
        if (!inFence){ inFence = true; marker = fm[2]; out.push(line); continue; }
        else if (line.indexOf(marker) !== -1){ inFence = false; out.push(line); continue; }
        else { out.push(line); continue; }
      }
      out.push(inFence ? line : transformLine(line));
    }
    return out.join("\n");
  }

  function renderMarkdown(raw){
    return marked.parse(preprocessMarkdown(raw));
  }

  /* ---------- Syntax highlighting ---------- */
  var LANG_ALIASES = { "shell":"bash", "shell-session":"shellsession", "text":"plaintext", "plain":"plaintext" };

  function resolveLang(raw){
    if (!window.hljs) return null;
    var lang = (raw || "").toLowerCase().trim();
    if (LANG_ALIASES[lang]) lang = LANG_ALIASES[lang];
    if (hljs.getLanguage(lang)) return lang;
    if (/power/.test(lang) && hljs.getLanguage("powershell")) return "powershell";
    return null;
  }

  function highlightCodeBlocks(container){
    if (!window.hljs) return;
    container.querySelectorAll("pre code").forEach(function(code){
      var m = (code.className || "").match(/language-(\S+)/);
      var lang = resolveLang(m ? m[1] : "");
      var result;
      try{
        result = lang
          ? hljs.highlight(code.textContent, { language: lang, ignoreIllegals: true })
          : hljs.highlightAuto(code.textContent);
      }catch(e){ return; }
      code.innerHTML = result.value;
      code.classList.add("hljs");
    });
  }

  /* ---------- Variable substitution (runs on serialized HTML, after highlighting) ---------- */
  function substituteVariables(html){
    VAR_MAP.forEach(function(pair){
      var name = pair[0], field = pair[1];
      var val = (config[field] || "").trim();
      var re = new RegExp("\\$" + name + "(?![A-Z_])", "g");
      if (val){
        html = html.replace(re, '<span class="var-filled" title="$' + name + '">' + escapeHtml(val) + "</span>");
      } else {
        html = html.replace(re, '<span class="var-unset" title="Set ' + name + ' above to fill this in">$' + name + "</span>");
      }
    });
    // $WORDLIST_PATH is the wordlist base path from Settings (SecLists lives
    // inside it as $WORDLIST_PATH/seclists/...), not a top-bar config field.
    var wp = (wordlistPath || "").trim();
    html = html.replace(/\$WORDLIST_PATH(?![A-Z_])/g, wp
      ? '<span class="var-filled" title="$WORDLIST_PATH">' + escapeHtml(wp) + "</span>"
      : '<span class="var-unset" title="Set the Wordlist path in Settings">$WORDLIST_PATH</span>');

    // $USER / $PASS come from the credential selected in the Creds vault
    // (right-side drawer). Once a cred is selected, both fill even if empty
    // (e.g. guest / null session → -p '' becomes '').
    if (selectedCred){
      var cu = selectedCred.user || "";
      var cp = selectedCred.secret != null ? selectedCred.secret : "";
      html = html.replace(/\$USER(?![A-Z_])/g,
        '<span class="var-filled" title="$USER">' + escapeHtml(cu) + "</span>");
      html = html.replace(/\$PASS(?![A-Z_])/g,
        '<span class="var-filled" title="$PASS">' + escapeHtml(cp) + "</span>");
    } else {
      html = html.replace(/\$USER(?![A-Z_])/g,
        '<span class="var-unset" title="Pick a credential in the Creds vault (right)">$USER</span>');
      html = html.replace(/\$PASS(?![A-Z_])/g,
        '<span class="var-unset" title="Pick a credential in the Creds vault (right)">$PASS</span>');
    }
    return html;
  }

  /* ---------- Per-line splitting (so each line of a code block is individually
     hoverable/copyable) — walks the already-highlighted, already-substituted HTML
     and re-wraps it one <span class="code-line"> per source line, re-opening any
     tag that was left open across a line break so each line stays well-formed. ---------- */
  function splitHighlightedLines(html){
    var openTags = [];
    var lines = [];
    var current = "";
    var i = 0, n = html.length;

    function reopenPrefix(){
      var s = "";
      for (var k=0;k<openTags.length;k++) s += openTags[k].raw;
      return s;
    }
    function closeSuffix(){
      var s = "";
      for (var k=openTags.length-1;k>=0;k--) s += "</" + openTags[k].name + ">";
      return s;
    }

    while (i < n){
      var ch = html[i];
      if (ch === "<"){
        var end = html.indexOf(">", i);
        if (end === -1){ current += html.slice(i); break; }
        var tag = html.slice(i, end+1);
        current += tag;
        var m = tag.match(/^<\/?([a-zA-Z0-9-]+)/);
        if (m){
          var name = m[1];
          if (tag.charAt(1) === "/"){
            for (var k2=openTags.length-1;k2>=0;k2--){
              if (openTags[k2].name === name){ openTags.splice(k2,1); break; }
            }
          } else if (tag.charAt(tag.length-2) !== "/"){
            openTags.push({ name: name, raw: tag });
          }
        }
        i = end + 1;
        continue;
      }
      if (ch === "\n"){
        lines.push(current + closeSuffix());
        current = reopenPrefix();
        i++;
        continue;
      }
      current += ch;
      i++;
    }
    lines.push(current + closeSuffix());
    return lines;
  }

  function wrapCodeLines(code){
    var lines = splitHighlightedLines(code.innerHTML);
    code.innerHTML = lines.map(function(lineHtml){
      return '<span class="code-line">' + lineHtml + "</span>";
    }).join("");
  }

  /* ---------- Copy buttons + table scroll wrappers ---------- */
  function enhanceContent(container){
    container.querySelectorAll("pre").forEach(function(pre){
      var code = pre.querySelector("code");
      if (!code) return;

      wrapCodeLines(code);

      var wrap = document.createElement("div");
      wrap.className = "code-wrap";
      pre.parentNode.insertBefore(wrap, pre);
      wrap.appendChild(pre);

      var toolbar = document.createElement("div");
      toolbar.className = "code-toolbar";

      var langMatch = (code.className || "").match(/language-(\S+)/);
      if (langMatch){
        var tag = document.createElement("span");
        tag.className = "lang-tag";
        tag.textContent = "[" + langMatch[1] + "]";
        toolbar.appendChild(tag);
      }

      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "copy-btn";
      btn.textContent = "[copy]";
      btn.setAttribute("aria-label","Copy whole block to clipboard");
      btn.addEventListener("click", function(){
        var lineEls = code.querySelectorAll(".code-line");
        var text = lineEls.length
          ? Array.prototype.map.call(lineEls, function(el){ return el.textContent; }).join("\n")
          : code.textContent;
        copyText(text, btn);
      });
      toolbar.appendChild(btn);
      wrap.appendChild(toolbar);

      // Click a single line to copy just that line (doesn't hijack a manual text selection).
      code.addEventListener("click", function(e){
        var line = e.target.closest(".code-line");
        if (!line) return;
        var sel = window.getSelection();
        if (sel && sel.toString().length > 0) return;
        var lineText = line.textContent;
        if (!lineText.trim()) return;
        copyLine(lineText, line);
      });
    });

    container.querySelectorAll("table").forEach(function(table){
      var wrap = document.createElement("div");
      wrap.className = "table-scroll";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    container.querySelectorAll('a[href^="tag:"]').forEach(function(a){
      a.classList.add("tag-link");
      a.removeAttribute("href");
      a.setAttribute("role","button");
      a.setAttribute("tabindex","0");
      a.addEventListener("click", function(e){
        e.stopPropagation(); // don't let the document-level "close dropdown on outside click" undo this
        triggerContentSearch(a.textContent.trim());
      });
      a.addEventListener("keydown", function(e){
        if (e.key === "Enter" || e.key === " "){
          e.preventDefault();
          e.stopPropagation();
          triggerContentSearch(a.textContent.trim());
        }
      });
    });
  }

  function writeClipboard(text, onSuccess, onFail){
    function tryFallback(){
      try{
        var ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        onSuccess();
      }catch(e){
        if (onFail) onFail();
      }
    }
    if (navigator.clipboard && navigator.clipboard.writeText){
      navigator.clipboard.writeText(text).then(onSuccess, tryFallback);
    } else {
      tryFallback();
    }
  }

  function copyText(text, btn, labels){
    labels = labels || {};
    var successLabel = labels.success || "[copied]";
    var resetLabel = labels.reset || "[copy]";
    var failLabel = labels.fail || "[select & copy manually]";
    writeClipboard(text, function(){
      btn.textContent = successLabel;
      btn.classList.add("copied");
      setTimeout(function(){ btn.textContent = resetLabel; btn.classList.remove("copied"); }, 1400);
    }, function(){
      btn.textContent = failLabel;
      setTimeout(function(){ btn.textContent = resetLabel; }, 1800);
    });
  }

  function showLineCopiedBadge(lineEl){
    var existing = lineEl.querySelector(".line-copied-badge");
    if (existing) existing.remove();
    var badge = document.createElement("span");
    badge.className = "line-copied-badge";
    badge.textContent = "[copied]";
    lineEl.appendChild(badge);
    requestAnimationFrame(function(){ badge.classList.add("visible"); });
    setTimeout(function(){
      badge.classList.remove("visible");
      setTimeout(function(){ if (badge.parentNode) badge.parentNode.removeChild(badge); }, 250);
    }, 700);
  }

  function copyLine(text, lineEl){
    writeClipboard(text, function(){
      lineEl.classList.add("copied");
      showLineCopiedBadge(lineEl);
      setTimeout(function(){ lineEl.classList.remove("copied"); }, 500);
    });
  }

  /* ---------- Tabs ---------- */
  function openTab(node, path){
    var idx = -1;
    for (var i=0;i<tabs.length;i++){ if (tabs[i].node === node){ idx = i; break; } }
    if (idx === -1){
      tabs.push({ node: node, path: path });
      idx = tabs.length - 1;
    }
    activeIndex = idx;
    saveTabs();
    renderTabs();
    renderActiveTab();
    if (window.matchMedia("(max-width:820px)").matches){
      closeSidebar();
    }
  }

  function closeTab(index){
    var wasActive = index === activeIndex;
    tabs.splice(index, 1);
    if (tabs.length === 0){
      activeIndex = -1;
    } else if (wasActive){
      activeIndex = Math.min(index, tabs.length - 1);
    } else if (index < activeIndex){
      activeIndex -= 1;
    }
    saveTabs();
    renderTabs();
    renderActiveTab();
  }

  function closeAllTabs(){
    tabs = [];
    activeIndex = -1;
    saveTabs();
    renderTabs();
    renderActiveTab();
  }

  function renderTabs(){
    var bar = document.getElementById("tabbar");
    var scroll = document.getElementById("tabsScroll");
    var closeAllBtn = document.getElementById("closeAllBtn");
    scroll.innerHTML = "";
    tabs.forEach(function(t, i){
      var tabEl = document.createElement("div");
      tabEl.className = "tab" + (i === activeIndex ? " active" : "");

      var label = document.createElement("button");
      label.type = "button";
      label.className = "tab-label";
      label.textContent = t.node.name;
      label.title = "~/" + t.path.concat(t.node.name).join("/");
      label.addEventListener("click", function(){
        activeIndex = i;
        saveTabs();
        renderTabs();
        renderActiveTab();
      });

      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "tab-close";
      closeBtn.textContent = "x";
      closeBtn.setAttribute("aria-label", "Close " + t.node.name + " tab");
      closeBtn.addEventListener("click", function(e){
        e.stopPropagation();
        closeTab(i);
      });

      tabEl.appendChild(label);
      tabEl.appendChild(closeBtn);
      scroll.appendChild(tabEl);
    });
    bar.classList.toggle("has-tabs", tabs.length > 0);
    closeAllBtn.hidden = tabs.length === 0;
  }

  /* ---------- File rendering ---------- */
  function renderActiveTab(){
    var content = document.getElementById("content");
    var crumb = document.getElementById("breadcrumb");
    var t = tabs[activeIndex];

    document.querySelectorAll("button.tree-file").forEach(function(b){ b.classList.remove("active"); });

    if (!t){
      content.innerHTML = '<div class="empty-state">No notes open -- pick one from the sidebar.</div>';
      crumb.textContent = "";
      return;
    }

    crumb.textContent = "~/" + t.path.concat(t.node.name).join("/");
    if (t.node._btn) t.node._btn.classList.add("active");

    // Content comes from the vault's .md files on demand (see /api/notes/*
    // in core/notes.py) rather than a prebuilt data.json, so it doesn't
    // exist on the node yet the first time a note is opened. Fetch once and
    // cache it on the (shared) node object — every other place that opens
    // this same file (search results, re-opening the tab later) reuses that
    // cache instead of refetching.
    if (t.node.content === undefined){
      content.innerHTML = '<div class="empty-state">Loading note…</div>';
      fetchNoteContent(t.node).then(function(){
        if (tabs[activeIndex] === t) renderActiveTab();
      });
      return;
    }

    content.innerHTML = '<article class="note">' + renderMarkdown(t.node.content || "*(empty note)*") + "</article>";
    highlightCodeBlocks(content);
    content.innerHTML = substituteVariables(content.innerHTML);
    enhanceContent(content);
    content.scrollTop = 0;
  }

  function fetchNoteContent(node){
    return apiFetch("/api/notes/content?category=" + encodeURIComponent(node.category) + "&path=" + encodeURIComponent(node.relpath))
      .then(function(body){ node.content = body.content || ""; })
      .catch(function(err){ node.content = "*(could not load this note: " + escapeHtml(String(err.message || err)) + ")*"; });
  }

  /* ---------- Sidebar tree (filename-only filter) ---------- */
  // Folder/category labels sit next to a "+"/"-" prefix inside a flex <summary>;
  // wrapping the text in its own span lets it truncate independently, same as tree-file buttons.
  function setTreeLabel(el, text){
    var span = document.createElement("span");
    span.className = "tree-label";
    span.textContent = text;
    el.title = text;
    el.appendChild(span);
  }

  function buildTree(nodes, path, filter){
    var frag = document.createDocumentFragment();
    var any = false;
    nodes.forEach(function(node){
      if (node.type === "folder"){
        var childResult = buildTree(node.children, path.concat(node.name), filter);
        if (!childResult.any) return;
        any = true;
        var details = document.createElement("details");
        details.className = "tree-folder";
        if (filter) details.open = true;
        var summary = document.createElement("summary");
        setTreeLabel(summary, node.name + "/");
        details.appendChild(summary);
        var childWrap = document.createElement("div");
        childWrap.className = "tree-children";
        childWrap.appendChild(childResult.frag);
        details.appendChild(childWrap);
        frag.appendChild(details);
      } else {
        if (filter && node.name.toLowerCase().indexOf(filter) === -1) return;
        any = true;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "tree-file";
        btn.textContent = node.name;
        btn.title = node.name;
        node._btn = btn;
        btn.addEventListener("click", function(){ openTab(node, path); });
        frag.appendChild(btn);
      }
    });
    return { frag: frag, any: any };
  }

  function renderTree(filterRaw){
    var filter = (filterRaw || "").trim().toLowerCase();
    var treeEl = document.getElementById("tree");
    treeEl.innerHTML = "";
    var topFrag = document.createDocumentFragment();
    var anyTop = false;
    DATA.categories.forEach(function(cat){
      if (hiddenModules.indexOf(cat.id) !== -1) return;   // module hidden in Settings
      var result = buildTree(cat.children, [cat.label], filter);
      if (!result.any) return;
      anyTop = true;
      var details = document.createElement("details");
      details.className = "tree-folder";
      if (filter) details.open = true;
      var summary = document.createElement("summary");
      setTreeLabel(summary, "[" + cat.label + "]");
      details.appendChild(summary);
      var childWrap = document.createElement("div");
      childWrap.className = "tree-children";
      childWrap.appendChild(result.frag);
      details.appendChild(childWrap);
      topFrag.appendChild(details);
    });
    if (!anyTop){
      var none = document.createElement("div");
      none.className = "no-results";
      none.textContent = "no notes named \"" + filterRaw + "\"";
      treeEl.appendChild(none);
      return;
    }
    treeEl.appendChild(topFrag);
    var an = activeNode();
    if (an && an._btn) an._btn.classList.add("active");
  }

  function firstFilePath(nodes, path){
    for (var i=0;i<nodes.length;i++){
      var n = nodes[i];
      if (n.type === "file") return { node:n, path:path };
      if (n.type === "folder"){
        var f = firstFilePath(n.children, path.concat(n.name));
        if (f) return f;
      }
    }
    return null;
  }

  /* ---------- Whole-vault content search ---------- */
  function flattenFiles(nodes, path){
    nodes.forEach(function(n){
      if (n.type === "file") ALL_FILES.push({ node:n, path:path });
      else flattenFiles(n.children, path.concat(n.name));
    });
  }

  function updateBrandStats(){
    var el = document.getElementById("brandStats");
    if (!el) return;
    var counts = DATA.categories.map(function(cat){
      var n = 0;
      ALL_FILES.forEach(function(f){ if (f.path[0] === cat.label) n++; });
      return { label: cat.label, count: n };
    });
    el.textContent = ALL_FILES.length + " notes | " + DATA.categories.length + " sections";
    el.title = counts.map(function(c){ return c.label + ": " + c.count; }).join(" · ");
  }

  // Content search runs server-side now (core/notes.py's search_notes) since
  // note text is no longer preloaded into the browser's memory — a stale
  // token guards against a slower earlier request's response landing after
  // a newer one while the user is still typing.
  var contentSearchToken = 0;
  function runContentSearch(query){
    var box = document.getElementById("contentSearchResults");
    var q = query.trim();
    if (!q){ box.hidden = true; box.innerHTML = ""; return; }

    var token = ++contentSearchToken;
    apiFetch("/api/notes/search?q=" + encodeURIComponent(q)).then(function(body){
      if (token !== contentSearchToken) return;
      renderContentSearchHits(box, q, body);
    }).catch(function(){
      if (token !== contentSearchToken) return;
      box.innerHTML = "";
      var err = document.createElement("div");
      err.className = "search-empty";
      err.textContent = "search failed — is the backend running?";
      box.appendChild(err);
      box.hidden = false;
    });
  }

  function renderContentSearchHits(box, q, body){
    var hits = body.hits || [];
    box.innerHTML = "";
    if (hits.length === 0){
      var none = document.createElement("div");
      none.className = "search-empty";
      none.textContent = "no notes contain \"" + q + "\"";
      box.appendChild(none);
      box.hidden = false;
      return;
    }

    hits.forEach(function(hit){
      // Match back to the already-loaded metadata tree for the shared node
      // object (openTab/tabs/ALL_FILES all key off that same reference).
      var match = ALL_FILES.filter(function(f){
        return f.node.category === hit.category && f.node.relpath === hit.relpath;
      })[0];
      if (!match) return;

      var el = document.createElement("button");
      el.type = "button";
      el.className = "search-hit";

      var nameEl = document.createElement("div");
      nameEl.className = "hit-name";
      nameEl.textContent = match.node.name;
      el.appendChild(nameEl);

      var pathEl = document.createElement("div");
      pathEl.className = "hit-path";
      pathEl.textContent = "~/" + match.path.join("/");
      el.appendChild(pathEl);

      if (hit.snippet){
        var snipEl = document.createElement("div");
        snipEl.className = "hit-snippet";
        snipEl.textContent = hit.snippet;
        el.appendChild(snipEl);
      }

      el.addEventListener("click", function(){
        openTab(match.node, match.path);
        box.hidden = true;
        document.getElementById("contentSearchInput").value = "";
      });
      box.appendChild(el);
    });

    if (body.truncated){
      var more = document.createElement("div");
      more.className = "search-more";
      more.textContent = "showing first " + hits.length + " matches — refine your search";
      box.appendChild(more);
    }
    box.hidden = false;
  }

  function triggerContentSearch(query){
    var input = document.getElementById("contentSearchInput");
    var clearBtn = document.getElementById("contentSearchClear");
    input.value = query;
    if (clearBtn) clearBtn.hidden = !query;
    input.focus();
    runContentSearch(query);
  }

  /* ---------- Sidebar toggle (mobile) ---------- */
  function openSidebar(){
    document.getElementById("sidebar").classList.add("open");
    document.getElementById("menuToggle").setAttribute("aria-expanded","true");
  }
  function closeSidebar(){
    document.getElementById("sidebar").classList.remove("open");
    document.getElementById("menuToggle").setAttribute("aria-expanded","false");
  }

  /* ---------- Config wiring ---------- */
  function refreshStatusDots(){
    FIELDS.forEach(function(f){
      var on = !!(config[f]||"").trim();
      var dot = document.getElementById("dot-" + f);
      if (dot){
        dot.textContent = on ? "[x] " : "[ ] ";
        dot.classList.toggle("on", on);
      }
      var copyBtn = document.getElementById("copy-" + f);
      if (copyBtn) copyBtn.disabled = !on;
    });
  }

  function wireConfigCopyButtons(){
    FIELDS.forEach(function(f){
      var btn = document.getElementById("copy-" + f);
      var input = document.getElementById(f);
      if (!btn || !input) return;
      btn.addEventListener("click", function(){
        if (!input.value) return;
        copyText(input.value, btn, { success:"[ok]", reset:"[c]", fail:"[!]" });
      });
    });
  }

  function onConfigInput(){
    FIELDS.forEach(function(f){
      var el = document.getElementById(f);
      if (el) config[f] = el.value;
    });
    refreshStatusDots();
    saveConfig();
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function(){
      renderActiveTab();
    }, 120);
  }

  function initConfigFields(){
    config = loadConfig();
    if (!config.scheme) config.scheme = "http";
    FIELDS.forEach(function(f){
      var el = document.getElementById(f);
      if (!el) return;
      el.value = config[f] || "";
      el.addEventListener("input", onConfigInput);
      el.addEventListener("change", onConfigInput);
    });
    wireConfigCopyButtons();
    refreshStatusDots();
    initAttackerIpDetection();
  }

  /* ---------- Attacker IP dropdown (local interface IPs) ----------
     A themed panel off /api/local-ips so the Attacker IP field can be
     picked from a dropdown (e.g. your VPN's tun0 address) — the input
     itself stays a normal free-text field the whole time, this is purely
     a suggestion list on top of it. A native <input list=datalist> would
     do the same job but can't be restyled at all in Chromium, hence a
     hand-built dropdown instead (same shape as .search-dropdown). */
  var attackerIpsCache = null; // null = not loaded yet (or last load failed)

  function ipDropdownEls(){
    return {
      dd: document.getElementById("attackerIpDropdown"),
      input: document.getElementById("attackerIp"),
      list: document.getElementById("attackerIpList"),
      refresh: document.getElementById("refetchIpsBtn")
    };
  }

  function openIpDropdown(){
    var els = ipDropdownEls();
    if (!els.dd) return;
    els.dd.hidden = false;
    if (els.input) els.input.setAttribute("aria-expanded", "true");
    if (!attackerIpsCache) loadIpOptions();
  }

  function closeIpDropdown(){
    var els = ipDropdownEls();
    if (!els.dd) return;
    els.dd.hidden = true;
    if (els.input) els.input.setAttribute("aria-expanded", "false");
  }

  function renderIpList(ips){
    var list = ipDropdownEls().list;
    if (!list) return;
    list.innerHTML = "";
    if (!ips || ips.length === 0){
      list.innerHTML = '<div class="ip-dropdown-status">no network interfaces detected — type an IP manually.</div>';
      return;
    }
    ips.forEach(function(entry){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "ip-option";
      btn.setAttribute("role", "option");

      var ipSpan = document.createElement("span");
      ipSpan.className = "ip-option-ip";
      ipSpan.textContent = entry.ip;
      btn.appendChild(ipSpan);

      var ifaceSpan = document.createElement("span");
      ifaceSpan.className = "ip-option-iface";
      ifaceSpan.textContent = entry.iface;
      btn.appendChild(ifaceSpan);

      // mousedown (not click) fires before the input's blur, so selecting
      // an option registers before blur's closeIpDropdown() would otherwise
      // remove it out from under the click.
      btn.addEventListener("mousedown", function(e){
        e.preventDefault();
        var input = ipDropdownEls().input;
        if (!input) return;
        input.value = entry.ip;
        onConfigInput();
        closeIpDropdown();
      });
      list.appendChild(btn);
    });
  }

  function loadIpOptions(){
    var els = ipDropdownEls();
    if (els.list) els.list.innerHTML = '<div class="ip-dropdown-status">detecting interfaces…</div>';
    if (els.refresh) els.refresh.classList.add("busy");
    return apiFetch("/api/local-ips").then(function(res){
      attackerIpsCache = res.ips || [];
      renderIpList(attackerIpsCache);
    }).catch(function(err){
      attackerIpsCache = null;
      if (els.list) els.list.innerHTML = '<div class="ip-dropdown-status err">could not detect interfaces — ' + escapeHtml(err.message) + '</div>';
    }).finally(function(){
      if (els.refresh) els.refresh.classList.remove("busy");
    });
  }

  function initAttackerIpDetection(){
    var els = ipDropdownEls();
    if (!els.input || !els.dd) return;

    loadIpOptions(); // pre-warm so the first focus opens instantly

    els.input.addEventListener("focus", openIpDropdown);
    // Also on click, not just focus: closing via the document-level
    // outside-click listener below doesn't necessarily blur the input (a
    // click on a non-focusable area like <body> can close the dropdown
    // without moving focus away), so a plain "focus" listener would never
    // fire again on the next click and the dropdown would stay stuck shut.
    els.input.addEventListener("click", openIpDropdown);
    els.input.addEventListener("blur", function(){ setTimeout(closeIpDropdown, 120); });
    els.input.addEventListener("keydown", function(e){
      if (e.key === "Escape") closeIpDropdown();
    });
    if (els.refresh){
      els.refresh.addEventListener("mousedown", function(e){ e.preventDefault(); });
      els.refresh.addEventListener("click", function(){ loadIpOptions(); });
    }
    document.addEventListener("click", function(e){
      var els2 = ipDropdownEls();
      if (!els2.dd.hidden && !els2.dd.contains(e.target) && e.target !== els2.input) closeIpDropdown();
    });
  }

  /* ---------- Engagement workspace wiring ----------
     Shared by projects.js / runner.js / nmap.js / checklist.js. The
     frontend is now served by the same Flask app as the API (app.py), so
     API_BASE stays empty (relative, same-origin) instead of pointing at a
     separate origin/port. */
  var API_BASE = "";
  var viewMode = "notes";      // "notes" | "engagement"

  function apiFetch(path, opts){
    return fetch(API_BASE + path, opts).then(function(r){
      return r.json().then(function(body){
        if (!r.ok) throw new Error(body.error || ("HTTP " + r.status));
        return body;
      });
    });
  }

  /* ---------- $WORDLIST_PATH base (from Settings) ----------
     Global so settings.js can push a new value after a save. */
  function applyWordlistPath(p){
    wordlistPath = (p || "").trim();
    if (viewMode === "notes") renderActiveTab();  // re-render open note with the new base path
  }
  /* Hide/show top-level modules in the Notes tree (from Settings). Global so
     settings.js can push a new list after a save. */
  function applyHiddenModules(list){
    hiddenModules = Array.isArray(list) ? list.slice() : [];
    var f = document.getElementById("treeSearchInput");
    renderTree(f ? f.value : "");
  }
  function loadAppSettings(){
    apiFetch("/api/settings").then(function(res){
      var s = res.settings || {};
      applyWordlistPath(s.wordlists_path || "");
      applyHiddenModules(s.hidden_modules || []);
    }).catch(function(){ /* backend offline — defaults stay */ });
  }

  /* Selected credential from the Creds vault (creds-vault.js). Global so the
     vault can push a new selection; re-renders the open note's $USER/$PASS. */
  function applySelectedCred(cred){
    selectedCred = cred || null;   // keep even if empty (guest / null session)
    if (viewMode === "notes") renderActiveTab();
  }

  /* ---------- Mode toggle (Notes / Engagement / Tools) ---------- */
  function setMode(mode){
    viewMode = mode;
    try{ localStorage.setItem(MODE_KEY, mode); }catch(e){}
    var sel = document.getElementById("modeSelect");
    if (sel && sel.value !== mode) sel.value = mode;

    var isNotes = mode === "notes";
    var isEngagement = mode === "engagement";
    var isTools = mode === "tools";

    document.getElementById("notesSidebarHead").classList.toggle("mode-hidden", !isNotes);
    document.getElementById("tree").classList.toggle("mode-hidden", !isNotes);
    document.getElementById("engagementTree").hidden = !isEngagement;
    document.getElementById("toolsTree").hidden = !isTools;
    document.getElementById("tabbar").classList.toggle("mode-hidden", !isNotes);
    document.getElementById("breadcrumb").classList.toggle("mode-hidden", !isNotes);

    if (isEngagement) renderEngagementView();
    else if (isTools) renderToolsView();
    else renderActiveTab();
  }

  function wireModeToggle(){
    document.getElementById("modeSelect").addEventListener("change", function(e){
      setMode(e.target.value);
    });
  }

  /* ---------- Boot ---------- */
  function boot(data){
    DATA = data;
    DATA.categories.forEach(function(cat){ flattenFiles(cat.children, [cat.label]); });
    updateBrandStats();

    initConfigFields();
    loadAppSettings();
    renderTree("");
    renderTabs();

    document.getElementById("treeSearchInput").addEventListener("input", function(e){
      renderTree(e.target.value);
    });

    var contentSearchTimer = null;
    var contentSearchInput = document.getElementById("contentSearchInput");
    var contentSearchClear = document.getElementById("contentSearchClear");
    contentSearchInput.addEventListener("input", function(e){
      var val = e.target.value;
      contentSearchClear.hidden = !val;
      clearTimeout(contentSearchTimer);
      contentSearchTimer = setTimeout(function(){ runContentSearch(val); }, 150);
    });
    contentSearchInput.addEventListener("keydown", function(e){
      if (e.key === "Escape"){
        e.target.value = "";
        contentSearchClear.hidden = true;
        document.getElementById("contentSearchResults").hidden = true;
      }
    });
    contentSearchClear.addEventListener("click", function(){
      contentSearchInput.value = "";
      contentSearchClear.hidden = true;
      var results = document.getElementById("contentSearchResults");
      results.hidden = true;
      results.innerHTML = "";
      contentSearchInput.focus();
    });
    document.addEventListener("click", function(e){
      var wrap = document.getElementById("contentSearchWrap");
      if (wrap && !wrap.contains(e.target)){
        document.getElementById("contentSearchResults").hidden = true;
      }
    });

    document.getElementById("closeAllBtn").addEventListener("click", closeAllTabs);

    document.getElementById("menuToggle").addEventListener("click", function(){
      if (document.getElementById("sidebar").classList.contains("open")) closeSidebar(); else openSidebar();
    });

    wireProjectUI();
    wireModeToggle();
    bootstrapEngagement();

    // Restore the previous session's open tabs + active tab; only if nothing
    // was restored (first visit, or all saved notes gone) fall back to the
    // first note.
    if (!restoreTabs()){
      var firstCat = DATA.categories[0];
      var start = firstCat ? firstFilePath(firstCat.children, [firstCat.label]) : null;
      if (start) openTab(start.node, start.path);
    }

    // Restore the last workspace mode (Notes / Engagement / Tools).
    var savedMode = null;
    try{ savedMode = localStorage.getItem(MODE_KEY); }catch(e){}
    if (savedMode && savedMode !== "notes") setMode(savedMode);
  }

  apiFetch("/api/notes/tree")
    .then(boot)
    .catch(function(err){
      document.getElementById("content").innerHTML =
        '<div class="empty-state">Could not load cheatsheet data.<br>' + escapeHtml(String(err)) + "</div>";
    });
