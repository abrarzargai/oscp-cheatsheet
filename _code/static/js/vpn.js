"use strict";

/* VPN panel — a right-side drawer + edge tab showing OpenVPN status.
   Reads .ovpn configs from the OpenVPN path (Settings), lets you pick one and
   Connect / Disconnect (both launch a terminal, since openvpn needs sudo), and
   shows live tunnel status (green + tun IP when up, red when down). The tab
   dot reflects status and refreshes periodically. Depends on apiFetch. */

(function(){
  var configs = [];
  var lastStatus = { connected: false };
  var toggleBtn, dotEl, backdrop, drawer, selEl, statusEl, logEl, hintEl;
  var POLL_MS = 15000;
  var logTimer = null;

  function el(id){ return document.getElementById(id); }

  function renderStatus(){
    if (!statusEl) return;
    if (lastStatus.connected){
      statusEl.className = "vpn-status connected";
      var cfg = lastStatus.config ? escapeHtml(lastStatus.config) + ' &middot; ' : '';
      statusEl.innerHTML = '<span class="vpn-dot"></span>' +
        '<div><div class="vpn-status-line">Connected</div>' +
        '<div class="vpn-status-sub">' + cfg + escapeHtml(lastStatus.iface || "tun") + ' &middot; <b>' +
        escapeHtml(lastStatus.ip || "?") + '</b></div></div>';
    } else {
      statusEl.className = "vpn-status disconnected";
      statusEl.innerHTML = '<span class="vpn-dot"></span>' +
        '<div><div class="vpn-status-line">Disconnected</div>' +
        '<div class="vpn-status-sub">no tun/tap interface</div></div>';
    }
    // Warn when the picked config isn't the one that's actually up.
    if (hintEl){
      var sel = selEl && selEl.value;
      if (lastStatus.connected && lastStatus.config && sel && sel !== lastStatus.config){
        hintEl.hidden = false;
        hintEl.innerHTML = 'Active tunnel is <b>' + escapeHtml(lastStatus.config) +
          '</b>. Disconnect first, then Connect <b>' + escapeHtml(sel) + '</b> to switch.';
      } else {
        hintEl.hidden = true;
      }
    }
    // While a tunnel is up, lock the picker + Connect (disconnect to switch).
    var connectBtn = el("vpnConnect"), disconnectBtn = el("vpnDisconnect");
    if (selEl) selEl.disabled = !!lastStatus.connected;
    if (connectBtn) connectBtn.disabled = !!lastStatus.connected;
    if (disconnectBtn) disconnectBtn.disabled = !lastStatus.connected;

    if (toggleBtn) toggleBtn.classList.toggle("vpn-up", !!lastStatus.connected);
    if (dotEl) dotEl.className = "vpn-toggle-dot " + (lastStatus.connected ? "up" : "down");
  }

  function refreshLog(force){
    if (!logEl) return;
    // Only show the log while connected (or mid-connect via `force`); when the
    // tunnel is down, don't surface stale output from a previous session.
    if (!force && !lastStatus.connected){ logEl.textContent = "(not connected)"; return; }
    apiFetch("/api/vpn/log").then(function(res){
      var txt = (res && res.log) || "";
      logEl.textContent = txt || "(no openvpn output yet)";
      logEl.scrollTop = logEl.scrollHeight;
    }).catch(function(){});
  }
  function startLogPoll(){ stopLogPoll(); refreshLog(); logTimer = setInterval(function(){ refreshLog(); }, 2500); }
  function stopLogPoll(){ if (logTimer){ clearInterval(logTimer); logTimer = null; } }

  function refreshStatus(){
    var was = lastStatus.connected;
    return apiFetch("/api/vpn/status").then(function(s){
      lastStatus = s || { connected: false };
      renderStatus();
      // On a connect/disconnect flip, re-pull the Attacker IP interfaces so
      // the new tun (or its removal) shows in that dropdown.
      if (was !== lastStatus.connected && typeof loadIpOptions === "function") loadIpOptions();
    }).catch(function(){ lastStatus = { connected: false }; renderStatus(); });
  }

  function loadConfigs(){
    return apiFetch("/api/vpn/configs").then(function(res){
      configs = res.configs || [];
      if (!selEl) return;
      var prev = selEl.value;
      selEl.innerHTML = "";
      if (!configs.length){
        var o = document.createElement("option");
        o.value = ""; o.textContent = "(no .ovpn found — set the OpenVPN path in Settings)";
        selEl.appendChild(o);
        return;
      }
      configs.forEach(function(c){
        var o = document.createElement("option");
        o.value = c.name; o.textContent = c.name;
        selEl.appendChild(o);
      });
      if (prev && configs.some(function(c){ return c.name === prev; })) selEl.value = prev;
    }).catch(function(){});
  }

  function setMsg(text, cls){
    var m = el("vpnMsg");
    if (!m) return;
    m.textContent = text || ""; m.className = "vpn-msg" + (cls ? " " + cls : ""); m.hidden = !text;
  }

  function connect(){
    if (!selEl || !selEl.value){ setMsg("pick a config first", "err"); return; }
    // Re-check status first — never start a second tunnel over an existing one
    // (that leaves two tun interfaces + mixed logs). Disconnect to switch.
    setMsg("checking status…", "ok");
    refreshStatus().then(function(){
      if (lastStatus.connected){
        setMsg("Already connected to " + (lastStatus.config || "a VPN") +
          " — click Disconnect first, then Connect " + selEl.value + ".", "err");
        return;
      }
      setMsg("launching openvpn in a terminal — enter your sudo password there…", "ok");
      if (logEl) logEl.textContent = "(connecting…)";
      apiFetch("/api/vpn/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: selEl.value })
      }).then(function(){
        setTimeout(function(){ refreshStatus(); refreshLog(true); }, 4000);
        setTimeout(function(){ refreshStatus(); refreshLog(true); }, 9000);
      }).catch(function(err){ setMsg(err.message, "err"); });
    });
  }

  function disconnect(){
    setMsg("sending disconnect (sudo) in a terminal…", "ok");
    if (logEl) logEl.textContent = "(disconnecting…)";
    apiFetch("/api/vpn/disconnect", { method: "POST" }).then(function(){
      setTimeout(function(){ refreshStatus(); refreshLog(); }, 2500);
      setTimeout(function(){ refreshStatus(); refreshLog(); }, 6000);
    }).catch(function(err){ setMsg(err.message, "err"); });
  }

  function openDrawer(){ backdrop.classList.add("open"); toggleBtn.classList.add("active"); loadConfigs(); refreshStatus(); startLogPoll(); }
  function closeDrawer(){ backdrop.classList.remove("open"); toggleBtn.classList.remove("active"); stopLogPoll(); }

  function build(){
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button"; toggleBtn.className = "vpn-toggle";
    toggleBtn.innerHTML = '<span class="vpn-toggle-dot down"></span><span>VPN</span>';
    toggleBtn.title = "OpenVPN status / connect";
    dotEl = toggleBtn.querySelector(".vpn-toggle-dot");
    toggleBtn.addEventListener("click", function(){
      if (backdrop.classList.contains("open")) closeDrawer(); else openDrawer();
    });
    document.body.appendChild(toggleBtn);

    backdrop = document.createElement("div");
    backdrop.className = "cv-vault-backdrop vpn-backdrop";
    backdrop.addEventListener("click", function(e){ if (e.target === backdrop) closeDrawer(); });

    drawer = document.createElement("div");
    drawer.className = "cv-vault-drawer vpn-drawer";
    drawer.innerHTML =
      '<div class="cv-vault-head">' +
        '<div class="vpn-head-left">' +
          '<button type="button" class="reload-icon" id="vpnReloadTop" title="refresh status + configs + log">↻</button>' +
          '<div class="cv-vault-title">🔒 VPN</div>' +
        '</div>' +
        '<button type="button" class="modal-close" id="vpnClose">x</button>' +
      '</div>' +
      '<div class="vpn-status disconnected" id="vpnStatus"></div>' +
      '<div class="vpn-mismatch" id="vpnHint" hidden></div>' +
      '<div class="cv-vault-section-title" style="margin-top:1rem;">OpenVPN config</div>' +
      '<div class="vpn-pick">' +
        '<select id="vpnSelect" class="cred-service-select"></select>' +
      '</div>' +
      '<div class="vpn-actions">' +
        '<button type="button" id="vpnConnect" class="vpn-btn primary">Connect</button>' +
        '<button type="button" id="vpnDisconnect" class="vpn-btn danger">Disconnect</button>' +
      '</div>' +
      '<div class="vpn-msg" id="vpnMsg" hidden></div>' +
      '<div class="cv-vault-section-title" style="margin-top:1rem;">Log</div>' +
      '<pre class="vpn-log" id="vpnLog">(no openvpn output yet)</pre>' +
      '<p class="cv-vault-hint">Configs are read from the <b>OpenVPN path</b> in Settings. Connect/Disconnect open a terminal for the sudo prompt; its output is mirrored above.</p>';
    backdrop.appendChild(drawer);
    document.body.appendChild(backdrop);

    selEl = drawer.querySelector("#vpnSelect");
    statusEl = drawer.querySelector("#vpnStatus");
    logEl = drawer.querySelector("#vpnLog");
    hintEl = drawer.querySelector("#vpnHint");
    drawer.querySelector("#vpnClose").addEventListener("click", closeDrawer);
    drawer.querySelector("#vpnReloadTop").addEventListener("click", function(){ loadConfigs(); refreshStatus(); refreshLog(); });
    drawer.querySelector("#vpnConnect").addEventListener("click", connect);
    drawer.querySelector("#vpnDisconnect").addEventListener("click", disconnect);
    selEl.addEventListener("change", renderStatus);   // update the mismatch hint
    document.addEventListener("keydown", function(e){ if (e.key === "Escape") closeDrawer(); });

    renderStatus();
  }

  function init(){
    build();
    refreshStatus();
    setInterval(refreshStatus, POLL_MS);   // keep the tab dot current
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
