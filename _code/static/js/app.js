"use strict";

  var STORAGE_KEY = "CheatSheet-config-v1";
  var FIELDS = ["attackerIp","attackerPort","victimIp","domain","dcIp"];
  var VAR_MAP = [
    ["ATTACKER_IP","attackerIp"],
    ["PORT","attackerPort"],
    ["VICTIM_IP","victimIp"],
    ["DOMAIN","domain"],
    ["DC_IP","dcIp"]
  ];
  var config = {};
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
    renderTabs();
    renderActiveTab();
  }

  function closeAllTabs(){
    tabs = [];
    activeIndex = -1;
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

    content.innerHTML = '<article class="note">' + renderMarkdown(t.node.content || "*(empty note)*") + "</article>";
    highlightCodeBlocks(content);
    content.innerHTML = substituteVariables(content.innerHTML);
    enhanceContent(content);
    content.scrollTop = 0;
    crumb.textContent = "~/" + t.path.concat(t.node.name).join("/");
    if (t.node._btn) t.node._btn.classList.add("active");
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

  function findSnippet(text, q){
    var lines = text.split("\n");
    for (var i=0;i<lines.length;i++){
      var idx = lines[i].toLowerCase().indexOf(q);
      if (idx !== -1){
        var line = lines[i].trim();
        if (line.length > 100){
          var start = Math.max(0, idx - 30);
          line = (start > 0 ? "…" : "") + line.substr(start, 100) + "…";
        }
        return line;
      }
    }
    return "";
  }

  var MAX_HITS = 30;
  function runContentSearch(query){
    var box = document.getElementById("contentSearchResults");
    var q = query.trim().toLowerCase();
    if (!q){ box.hidden = true; box.innerHTML = ""; return; }

    var hits = ALL_FILES.filter(function(f){
      return (f.node.content || "").toLowerCase().indexOf(q) !== -1;
    });

    box.innerHTML = "";
    if (hits.length === 0){
      var none = document.createElement("div");
      none.className = "search-empty";
      none.textContent = "no notes contain \"" + query.trim() + "\"";
      box.appendChild(none);
      box.hidden = false;
      return;
    }

    hits.slice(0, MAX_HITS).forEach(function(f){
      var el = document.createElement("button");
      el.type = "button";
      el.className = "search-hit";

      var nameEl = document.createElement("div");
      nameEl.className = "hit-name";
      nameEl.textContent = f.node.name;
      el.appendChild(nameEl);

      var pathEl = document.createElement("div");
      pathEl.className = "hit-path";
      pathEl.textContent = "~/" + f.path.join("/");
      el.appendChild(pathEl);

      var snippet = findSnippet(f.node.content || "", q);
      if (snippet){
        var snipEl = document.createElement("div");
        snipEl.className = "hit-snippet";
        snipEl.textContent = snippet;
        el.appendChild(snipEl);
      }

      el.addEventListener("click", function(){
        openTab(f.node, f.path);
        box.hidden = true;
        document.getElementById("contentSearchInput").value = "";
      });
      box.appendChild(el);
    });

    if (hits.length > MAX_HITS){
      var more = document.createElement("div");
      more.className = "search-more";
      more.textContent = "showing first " + MAX_HITS + " of " + hits.length + " matches — refine your search";
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
    FIELDS.forEach(function(f){
      var el = document.getElementById(f);
      if (!el) return;
      el.value = config[f] || "";
      el.addEventListener("input", onConfigInput);
    });
    wireConfigCopyButtons();
    refreshStatusDots();
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

  /* ---------- Mode toggle (Notes / Engagement) ---------- */
  function setMode(mode){
    viewMode = mode;
    document.getElementById("modeNotesBtn").classList.toggle("active", mode === "notes");
    document.getElementById("modeEngageBtn").classList.toggle("active", mode === "engagement");
    document.getElementById("tabbar").classList.toggle("mode-hidden", mode === "engagement");
    document.getElementById("breadcrumb").classList.toggle("mode-hidden", mode === "engagement");
    if (mode === "engagement") renderEngagementView();
    else renderActiveTab();
  }

  function wireModeToggle(){
    document.getElementById("modeNotesBtn").addEventListener("click", function(){ setMode("notes"); });
    document.getElementById("modeEngageBtn").addEventListener("click", function(){ setMode("engagement"); });
  }

  /* ---------- Boot ---------- */
  function boot(data){
    DATA = data;
    DATA.categories.forEach(function(cat){ flattenFiles(cat.children, [cat.label]); });
    updateBrandStats();

    initConfigFields();
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

    var firstCat = DATA.categories[0];
    var start = firstCat ? firstFilePath(firstCat.children, [firstCat.label]) : null;
    if (start) openTab(start.node, start.path);
  }

  fetch("/static/data.json")
    .then(function(r){ return r.json(); })
    .then(boot)
    .catch(function(err){
      document.getElementById("content").innerHTML =
        '<div class="empty-state">Could not load cheatsheet data.<br>' + escapeHtml(String(err)) + "</div>";
    });
