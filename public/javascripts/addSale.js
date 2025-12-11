// =====================
// AGENT LOGIC
// =====================
const agentSelect = document.getElementById("agentSelect");
const agentPercentage = document.getElementById("agentPercentage");

agentSelect.addEventListener("change", function () {
  if (this.value) {
    agentPercentage.style.display = "inline-block";
  } else {
    agentPercentage.style.display = "none";
    agentPercentage.value = "";
  }
});

// =====================
// LOAD PRODUCT DATA SAFELY
// =====================
const products = JSON.parse(document.getElementById("productData").textContent);
let tempSales = [];

// =====================
// FORM ELEMENTS
// =====================
const brandSelect = document.getElementById("brandSelect");
const itemSelect = document.getElementById("itemSelect");
const unitSelect = document.getElementById("unitSelect");
// colourSelect now functions as the final Stock Option selection dropdown
const colourSelect = document.getElementById("colourSelect"); 
const quantitySold = document.getElementById("quantitySold");
const rate = document.getElementById("rate");
const totalStock = document.getElementById("totalStock");

// =====================
// BRAND CHANGE
// =====================
brandSelect.addEventListener("change", function () {
  const brand = this.value;
  resetDropdowns();

  if (!brand) return;

  const brandItems = products.filter(p => p.brandName === brand && p.remaining > 0);
  const uniqueItems = [...new Set(brandItems.map(p => p.itemName).filter(Boolean))];

  itemSelect.innerHTML = `<option value="">Select Item</option>` +
    uniqueItems.map(i => `<option value="${i}">${i}</option>`).join('');

  itemSelect.disabled = false;
});

// =====================
// ITEM CHANGE (Logic adjusted for Simple Items)
// =====================
itemSelect.addEventListener("change", function () {
  const brand = brandSelect.value;
  const item = this.value;

  resetUnitColour();
  if (!item) return;

  const matches = products.filter(p => p.brandName === brand && p.itemName === item && p.remaining > 0);
  const hasUnitOrColour = matches.some(p => (p.qty && p.qty.trim() !== "") || (p.colourName && p.colourName.trim() !== ""));

  if (!hasUnitOrColour) {
    // Case 1: No Unit/Colour (e.g., "Other Paints") - Populate colourSelect (as Option Select) directly
    colourSelect.innerHTML = `<option value="">Select Option</option>` +
      matches.map(p => {
            const label = `${p.itemName} — Rate: ${p.rate} | Stock: ${p.remaining}`;
            return `<option value="${p.stockID}" data-remaining="${p.remaining}" data-rate="${p.rate}">${label}</option>`;
        }).join('');
    colourSelect.disabled = false;
    return;
  }

  const units = [...new Set(matches.map(p => p.qty).filter(Boolean))];
  unitSelect.innerHTML = `<option value="">Select Unit</option>` +
    units.map(u => `<option value="${u}">${u}</option>`).join('');
  unitSelect.disabled = false;
});

// =====================
// UNIT CHANGE (Modified to use "Select Option" text and show full details for stockID)
// =====================
unitSelect.addEventListener("change", function () {
  const brand = brandSelect.value;
  const item = itemSelect.value;
  const unit = this.value;

  // Label change: colourSelect will now show "Select Option" always
  colourSelect.innerHTML = `<option value="">Select Option</option>`;
  colourSelect.disabled = true;

  if (!unit) return;

  const filtered = products.filter(p => p.brandName === brand && p.itemName === item && p.qty === unit && p.remaining > 0);

  colourSelect.innerHTML = `<option value="">Select Option</option>` +
    filtered.map(p => {
      // Label will show full detail including colour or unit, rate, and stock for the specific stockID
      const detail = p.colourName 
        ? `${p.colourName}` // If colour exists, show colour
        : `${p.itemName} | ${p.qty}`; // If no colour, show item and unit
      
      const label = `${detail} — Rate: ${p.rate} | Stock: ${p.remaining}`;
      
      return `<option value="${p.stockID}" data-remaining="${p.remaining}" data-rate="${p.rate}">${label}</option>`;
    }).join('');
  colourSelect.disabled = false;
});

// =====================
// COLOUR CHANGE (Now acts as Option Select → AUTO FILL STOCK + RATE)
// =====================
colourSelect.addEventListener("change", function () {
  const option = this.selectedOptions[0];
  // Mandatory check: Option must be selected and must have a value (stockID)
  if (!option || !option.value) {
    rate.value = "";
    totalStock.value = "";
    return;
  }
  rate.value = option.dataset.rate || 0;
  totalStock.value = option.dataset.remaining || 0;
});

// =====================
// GENERATE SALE ID (SAME)
// =====================
function generateSaleID(itemName) {
  const prefix = itemName.slice(0, 3).toUpperCase();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${rand}`;
}

// =====================
// ADD SALE ENTRY (CRITICAL CHANGE: Stock ID selection is mandatory)
// =====================
document.getElementById("add").addEventListener("click", addSaleEntry);

function addSaleEntry() {
  const brand = brandSelect.value.trim();
  const item = itemSelect.value.trim();
  
  // option is fetched from colourSelect which holds the specific stockID
  const option = colourSelect.selectedOptions[0]; 
  
  const qty = parseInt(quantitySold.value) || 0;
  const rateVal = parseFloat(rate.value) || 0;

  // NEW MANDATORY CHECK: option must be selected AND must have a stockID value
  if (!brand || !item || qty <= 0 || rateVal <= 0 || !option || !option.value) {
    alert("⚠️ Please fill all fields correctly and select a specific option (Stock ID) before adding sale.");
    return;
  }

  // selectedProduct is found ONLY using the selected option.value (stockID)
  const selectedProduct = products.find(p => String(p.stockID) === String(option.value));

  if (!selectedProduct) {
    alert("⚠️ Product not found based on selected option.");
    return;
  }

  if (qty > selectedProduct.remaining) {
    alert(`⚠️ Only ${selectedProduct.remaining} units available for the selected stock.`);
    return;
  }

  tempSales.push({
    stockID: selectedProduct.stockID,
    saleID: generateSaleID(item),
    brandName: brand,
    itemName: selectedProduct.itemName,
    qty: selectedProduct.qty || "",
    colourName: selectedProduct.colourName || "",
    quantitySold: qty,
    rate: rateVal,
    total: qty * rateVal,
  });

  renderTable();
  resetDropdowns();
}

// =====================
// RENDER TABLE (SAME)
// =====================
function renderTable() {
  const tbody = document.getElementById("saleTableBody");
  if (tempSales.length === 0) {
    tbody.innerHTML = `<tr class="no-data"><td colspan="8">No sales added yet</td></tr>`;
    return;
  }

  tbody.innerHTML = tempSales.map((p, i) => `
    <tr>
      <td>${p.brandName}</td>
      <td>${p.itemName}</td>
      <td>${p.colourName}</td>
      <td>${p.qty}</td>
      <td>${p.quantitySold}</td>
      <td>${p.rate}</td>
      <td>${p.total}</td>
      <td><button id="delete" class="delete-sale" data-index="${i}">Delete</button></td>
    </tr>
  `).join('');

  attachDeleteButtons(); 
}

function attachDeleteButtons() {
  document.querySelectorAll(".delete-sale").forEach(btn => {
    btn.addEventListener("click", function () {
      const index = parseInt(this.dataset.index);
      tempSales.splice(index, 1);
      renderTable();
    });
  });
}


// =====================
// SUBMIT SALES (SAME)
// =====================
document.getElementById("submitBtn").addEventListener("click", submitSales);

async function submitSales() {
  if (tempSales.length === 0) return alert("⚠️ No sales to submit.");

  const payload = {
    sales: tempSales,
    agentID: agentSelect.value || null,
    percentage: agentPercentage.value ? parseFloat(agentPercentage.value) : 0,
  };

  try {
    const res = await fetch("/sales/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message);

    alert("✅ Sales saved successfully!");
    window.open(`/sales/print?data=${encodeURIComponent(JSON.stringify(tempSales))}`, "_blank");

    tempSales = [];
    renderTable();
    setTimeout(() => location.reload(), 800);
  } catch (err) {
    alert("❌ Error: " + err.message);
  }
}

// =====================
// RESET HELPERS (Adjusted text)
// =====================
function resetDropdowns() {
  itemSelect.innerHTML = `<option value="">Select Item</option>`;
  unitSelect.innerHTML = `<option value="">Select Unit</option>`;
  colourSelect.innerHTML = `<option value="">Select Option</option>`;
  itemSelect.disabled = true;
  unitSelect.disabled = true;
  colourSelect.disabled = true;
  quantitySold.value = "";
  rate.value = "";
  totalStock.value = "";
}

function resetUnitColour() {
  unitSelect.innerHTML = `<option value="">Select Unit</option>`;
  colourSelect.innerHTML = `<option value="">Select Option</option>`;
  unitSelect.disabled = true;
  colourSelect.disabled = true;
}
