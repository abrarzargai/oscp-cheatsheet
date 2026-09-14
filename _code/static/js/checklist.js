"use strict";

/* Per-port checklist: rendering each checklist item (checkbox + label +
   command + [run]/[copy] buttons) and persisting checkbox state via
   /api/checklist. Called from nmap.js's renderNmapTable() once per port. */
function renderChecklistItems(itemsWrap, checklist, checked, portKey){
  (checklist || []).forEach(function(item){
    var isChecked = !!(checked && checked[item.id]);
    var itemEl = document.createElement("div");
    itemEl.className = "checklist-item" + (isChecked ? " done" : "");

    var cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = isChecked;
    cb.addEventListener("change", function(){ onChecklistCheckbox(cb, portKey, item.id); });
    itemEl.appendChild(cb);

    var label = document.createElement("span");
    label.className = "item-label";
    label.textContent = item.label;
    itemEl.appendChild(label);

    var cmdEl = document.createElement("code");
    cmdEl.className = "item-cmd";
    cmdEl.textContent = item.cmd;
    itemEl.appendChild(cmdEl);

    var runBtn = document.createElement("button");
    runBtn.type = "button";
    runBtn.className = "run-btn";
    runBtn.textContent = "[run]";
    runBtn.dataset.label = "[run]";
    runBtn.addEventListener("click", function(){ runTemplate(item.cmd, runBtn); });
    itemEl.appendChild(runBtn);
    itemEl.appendChild(makeCopyCmdBtn(item.cmd));

    itemsWrap.appendChild(itemEl);
  });
}

  function onChecklistCheckbox(cb, portKey, itemId){
    apiFetch("/api/checklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ port_key: portKey, item_id: itemId, checked: cb.checked })
    }).then(function(){
      var itemEl = cb.closest(".checklist-item");
      if (itemEl) itemEl.classList.toggle("done", cb.checked);
    }).catch(function(){
      cb.checked = !cb.checked; // revert on failure
    });
  }
