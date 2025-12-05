// Show/Hide Date Inputs
function toggleDateInputs(value) {
  const from = document.getElementById("from");
  const to = document.getElementById("to");

  if (value === "custom") {
    from.style.display = "inline-block";
    to.style.display = "inline-block";
  } else {
    from.style.display = "none";
    to.style.display = "none";
  }
}

// Delete Agent
async function deleteAgent(agentId) {
  if (!confirm("Are you sure you want to delete this agent?")) return;

  try {
    const res = await fetch(`/agents/delete-agent/${agentId}`, {
      method: "DELETE",
    });

    const data = await res.json();

    if (data.success) {
      alert("Agent deleted successfully!");
      location.reload();
    } else {
      alert(data.message || "Failed to delete agent");
    }
  } catch (err) {
    alert("Error deleting agent");
    console.error("Delete Agent Error:", err);
  }
}

// Attach event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Filter dropdown
  const filterSelect = document.getElementById("filter");
  if (filterSelect) {
    filterSelect.addEventListener("change", () => {
      toggleDateInputs(filterSelect.value);
    });
    toggleDateInputs(filterSelect.value);
  }

  // DELETE BUTTONS
  const deleteButtons = document.querySelectorAll(".delete-btn");

  deleteButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteAgent(id);
    });
  });
});
