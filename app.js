function renderBirds() {
  const body = document.getElementById("birds-body");
  if (!body) {
    console.error("Error: Could not find 'birds-body' element in HTML.");
    return;
  }

  // Safety check: ensure birds array exists
  if (!birds || !Array.isArray(birds)) {
    console.warn("Birds data not loaded yet.");
    body.innerHTML = "<tr><td colspan='5'>Loading...</td></tr>";
    return;
  }

  body.innerHTML = "";

  // Filter and Render
  const filteredBirds = birds.filter(birdMatches);

  if (filteredBirds.length === 0) {
    body.innerHTML = "<tr><td colspan='5' style='text-align:center; padding: 20px;'>Keine Vögel gefunden.</td></tr>";
    return;
  }

  filteredBirds.forEach(b => {
    // Get current selection for this bird
    const currentAction = perBirdSelection.get(b.bird_id) || "";

    const tr = document.createElement("tr");
    
    // Build the HTML string safely
    tr.innerHTML = `
      <td>
        <div style="font-weight:600;">${b.name || ""}</div>
        <div style="font-size:11px; color:#666;">${b.bird_id || ""}</div>
      </td>
      <td>${b.sex || "?"}<br>${b.age || ""}</td>
      <td>${b.territory || ""} (${b.dist || ""})<br>${b.banded_on || ""}</td>
      <td>
        <div style="display:grid; grid-template-columns:auto auto; column-gap:8px; row-gap:2px;">
          <div>${colorPill(b.L_top)}</div>
          <div>${colorPill(b.R_top)}</div>
          <div>${colorPill(b.L_bottom)}</div>
          <div>${colorPill(b.R_bottom)}</div>
        </div>
      </td>
      <td>
        <select 
          class="action-select"
          data-id="${b.bird_id}"
          style="padding: 4px 8px; border-radius: 6px; border: 1px solid #ccc; font-size: 12px; min-width: 130px; background: white;">
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

  // Re-bind event listeners to the new dropdowns
  document.querySelectorAll(".action-select").forEach(select => {
    select.onchange = function() {
      const id = this.dataset.id;
      const action = this.value;

      if (!action) {
        perBirdSelection.delete(id);
      } else {
        perBirdSelection.set(id, action);
      }
      // Optional: Visual feedback could be added here
    };
  });
}

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
