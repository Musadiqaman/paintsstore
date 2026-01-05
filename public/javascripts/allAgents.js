document.addEventListener("DOMContentLoaded", () => {
    // --- 1. Elements Selection ---
    const filterForm = document.getElementById("filterForm");
    const filterSelect = document.getElementById("filter");
    const fromInput = document.getElementById("from");
    const toInput = document.getElementById("to");
    const applyBtn = document.getElementById("applyBtn");
    const tbody = document.querySelector('tbody');

    /**
     * 2. TOGGLE DATE INPUTS
     * Sirf inputs dikhayega, data fetch NAHI karega.
     */
    function toggleDateInputs(value) {
        if (value === "custom") {
            if (fromInput) fromInput.style.display = "inline-block";
            if (toInput) toInput.style.display = "inline-block";
        } else {
            if (fromInput) fromInput.style.display = "none";
            if (toInput) toInput.style.display = "none";
        }
    }

    /**
     * 3. CORE FILTER FUNCTION (SPA STYLE)
     * Ye function backend se data layega aur table ko update karega bina reload ke.
     */
    const runFilter = async () => {
        // Form data ko query string mein badalna
        const formData = new URLSearchParams(new FormData(filterForm)).toString();
        
        // UX: Table ko halka sa dhundla karna loading feel dene ke liye
        tbody.style.opacity = '0.4';

        try {
            const res = await fetch(`/agents/all?${formData}`, {
                headers: { 
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });
            const data = await res.json();

            if (data.success) {
                // --- A. Stats Boxes Update ---
                const statsPs = document.querySelectorAll('.stat-box p');
                if (statsPs.length >= 4) {
                    statsPs[0].innerText = data.stats.totalAgents;
                    statsPs[1].innerText = `Rs ${Number(data.stats.totalPercentageAmount).toFixed(2)}`;
                    statsPs[2].innerText = `Rs ${Number(data.stats.totalPercentageAmountGiven).toFixed(2)}`;
                    statsPs[3].innerText = `Rs ${Number(data.stats.totalPercentageAmountLeft).toFixed(2)}`;
                }

                // --- B. Table Content Rebuild ---
                let html = '';
                if (data.agents.length === 0) {
                    html = `<tr><td colspan="5" class="no-data" style="text-align:center; padding:20px;">No agents found for the selected filter.</td></tr>`;
                } else {
                    data.agents.forEach(a => {
                        const dateObj = new Date(a.createdAt);
                        const dateStr = dateObj.toLocaleDateString('en-GB', { 
                            day: '2-digit', month: 'short', year: 'numeric' 
                        });
                        const timeStr = dateObj.toLocaleTimeString('en-GB', { 
                            hour: '2-digit', minute: '2-digit', hour12: true 
                        });

                        html += `
                        <tr>
                            <td>${a.name || 'N/A'}</td>
                            <td>${a.phone || 'N/A'}</td>
                            <td>${a.cnic || 'N/A'}</td>
                            <td>
                                ${dateStr}<br>
                                <small style="color: #007bff; font-weight: bold;">${timeStr}</small>
                            </td>
                            <td class="action-buttons">
                                <button id="view">
                                    <a href="/agents/view-agent/${a._id}" style="text-decoration: none; color: inherit;">View</a>
                                </button>
                                ${data.role === "admin" ? `
                                <button type="button" class="delete-btn" data-id="${a._id}">Delete</button>
                                ` : ''}
                            </td>
                        </tr>`;
                    });
                }

                // Table update karna
                tbody.innerHTML = html;

                // URL update karna (bina refresh ke) taake refresh pe wohi filter rahe
                window.history.pushState({}, '', `/agents/all?${formData}`);

                // Delete buttons pe listeners dobara lagana
                attachDeleteListeners();
            }
        } catch (err) {
            console.error("SPA Filter Error:", err);
            alert("Error loading data. Please check console.");
        } finally {
            tbody.style.opacity = '1';
        }
    };

    /**
     * 4. DELETE AGENT LOGIC
     */
    async function deleteAgent(agentId) {
        if (!confirm("Are you sure you want to delete this agent?")) return;

        try {
            const res = await fetch(`/agents/delete-agent/${agentId}`, { method: "DELETE" });
            const data = await res.json();

            if (data.success) {
                // Delete ke baad table ko refresh karna (SPA style)
                runFilter();
            } else {
                alert(data.message || "Failed to delete");
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    }

    /**
     * 5. ATTACH LISTENERS
     */
    function attachDeleteListeners() {
        document.querySelectorAll(".delete-btn").forEach((btn) => {
            btn.onclick = (e) => {
                e.preventDefault();
                const id = btn.getAttribute("data-id");
                deleteAgent(id);
            };
        });
    }

    // --- Events Bindings ---

    // Apply Button: Strictly click pe filter chalaye
    if (applyBtn) {
        applyBtn.addEventListener("click", (e) => {
            e.preventDefault();
            runFilter();
        });
    }

    // Dropdown: Sirf custom dates toggle kare
    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            toggleDateInputs(filterSelect.value);
        });
        // Initial visibility check
        toggleDateInputs(filterSelect.value);
    }

    // Form: Enter dabane se reload rokna
    if (filterForm) {
        filterForm.onsubmit = (e) => {
            e.preventDefault();
            runFilter(); // Enter dabane par bhi filter chale reload na ho
            return false;
        };
    }

    // Pehli dafa listeners lagana
    attachDeleteListeners();
});