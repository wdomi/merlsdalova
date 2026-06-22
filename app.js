function renderBirds() {
  const body = document.getElementById("birds-body");
  if (!body) return;

  body.innerHTML = "";

  birds.filter(birdMatches).forEach(b => {
    // Get the currently selected action for this bird (if any)
    const currentAction = perBirdSelection.get(b.bird_id) || "";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${b.name}<div class="tag">${b.bird_id}</div></td>
      <td>${b.sex}<br>${b.age}</td>
      <td>${b.territory} (${b.dist})<br>${b.banded_on}</td>
      <td>
        <div style="display:grid; grid-template-columns:auto auto; column-gap:16px;">
          <div>${colorPill(b.L_top) || ""}</div>
          <div>${colorPill(b.R_top) || ""}</div>
          <div>${colorPill(b.L_bottom) || ""}</div>
          <div>${colorPill(b.R_bottom) || ""}</div>
        </div>
      </td>
      <td>
        <!-- ✅ REPLACED BUTTONS WITH DROPDOWN -->
        <select 
          class="action-select"
          data-id="${b.bird_id}"
          style="padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 12px; min-width: 140px;">
          <option value="">Aktion wählen...</option>
          <option value="sighted" ${currentAction === "sighted" ? "selected" : ""}>beobachtet</option>
          <option value="maybe" ${currentAction === "maybe" ? "selected" : ""}>unsicher</option>
          <option value="catch" ${currentAction === "catch" ? "selected" : ""}>gefangen</option>
          <option value="nest_ringing" ${currentAction === "nest_ringing" ? "selected" : ""}>Nest_Beringung</option>
          <option value="dead_find" ${currentAction === "dead_find" ? "selected" : ""}>Totfund</option>
        </select>
      </td>
    `;
    body.appendChild(tr);
  });

  // ✅ Bind change event to the new dropdowns
  document.querySelectorAll(".action-select").forEach(select => {
    select.onchange = () => {
      const id = select.dataset.id;
      const action = select.value;

      if (!action) {
        perBirdSelection.delete(id); // Clear if "Choose..." is selected
      } else {
        perBirdSelection.set(id, action); // Set the action
      }
      // No need to re-render, the selection is stored in the Map
    };
  });
}
