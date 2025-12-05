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
// ITEM CHANGE
// =====================
itemSelect.addEventListener("change", function () {
  const brand = brandSelect.value;
  const item = this.value;

  resetUnitColour();
  if (!item) return;

  const matches = products.filter(p => p.brandName === brand && p.itemName === item && p.remaining > 0);
  const hasUnitOrColour = matches.some(p => (p.qty && p.qty.trim() !== "") || (p.colourName && p.colourName.trim() !== ""));

  if (!hasUnitOrColour) {
    colourSelect.innerHTML = `<option value="">Select Option</option>` +
      matches.map(p => `<option value="${p.stockID}" data-remaining="${p.remaining}" data-rate="${p.rate}">${p.itemName} — Rate: ${p.rate} | Stock: ${p.remaining}</option>`).join('');
    colourSelect.disabled = false;
    return;
  }

  const units = [...new Set(matches.map(p => p.qty).filter(Boolean))];
  unitSelect.innerHTML = `<option value="">Select Unit</option>` +
    units.map(u => `<option value="${u}">${u}</option>`).join('');
  unitSelect.disabled = false;
});

// =====================
// UNIT CHANGE
// =====================
unitSelect.addEventListener("change", function () {
  const brand = brandSelect.value;
  const item = itemSelect.value;
  const unit = this.value;

  colourSelect.innerHTML = `<option value="">Select Colour</option>`;
  colourSelect.disabled = true;

  if (!unit) return;

  const filtered = products.filter(p => p.brandName === brand && p.itemName === item && p.qty === unit && p.remaining > 0);

  colourSelect.innerHTML = `<option value="">Select Colour</option>` +
    filtered.map(p => {
      const label = p.colourName ? `${p.colourName} — Rate: ${p.rate} | Stock: ${p.remaining}` : `${p.itemName} | ${p.qty} — Rate: ${p.rate} | Stock: ${p.remaining}`;
      return `<option value="${p.stockID}" data-remaining="${p.remaining}" data-rate="${p.rate}">${label}</option>`;
    }).join('');
  colourSelect.disabled = false;
});

// =====================
// COLOUR CHANGE → AUTO FILL STOCK + RATE
// =====================
colourSelect.addEventListener("change", function () {
  const option = this.selectedOptions[0];
  if (!option) {
    rate.value = "";
    totalStock.value = "";
    return;
  }
  rate.value = option.dataset.rate || 0;
  totalStock.value = option.dataset.remaining || 0;
});

// =====================
// GENERATE SALE ID
// =====================
function generateSaleID(itemName) {
  const prefix = itemName.slice(0, 3).toUpperCase();
  const rand = Math.floor(Math.random() * 900000 + 100000);
  return `${prefix}-${rand}`;
}

// =====================
// ADD SALE ENTRY
// =====================
document.getElementById("add").addEventListener("click", addSaleEntry);

function addSaleEntry() {
  const brand = brandSelect.value.trim();
  const item = itemSelect.value.trim();
  const unit = unitSelect.value || "";
  const option = colourSelect.selectedOptions[0];
  const qty = parseInt(quantitySold.value) || 0;
  const rateVal = parseFloat(rate.value) || 0;

  if (!brand || !item || qty <= 0 || rateVal <= 0) {
    alert("⚠️ Please fill all fields correctly.");
    return;
  }

  let selectedProduct = null;
  if (option && option.value) {
    selectedProduct = products.find(p => String(p.stockID) === String(option.value));
  } else {
    selectedProduct = products.find(p => p.brandName === brand && p.itemName === item && (p.qty || "") === unit);
  }

  if (!selectedProduct) {
    alert("⚠️ Product not found.");
    return;
  }

  if (qty > selectedProduct.remaining) {
    alert(`⚠️ Only ${selectedProduct.remaining} units available.`);
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
// RENDER TABLE
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

  attachDeleteButtons(); // attach events after render
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
// SUBMIT SALES
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
// RESET HELPERS
// =====================
function resetDropdowns() {
  itemSelect.innerHTML = `<option value="">Select Item</option>`;
  unitSelect.innerHTML = `<option value="">Select Unit</option>`;
  colourSelect.innerHTML = `<option value="">Select Colour</option>`;
  itemSelect.disabled = true;
  unitSelect.disabled = true;
  colourSelect.disabled = true;
  quantitySold.value = "";
  rate.value = "";
  totalStock.value = "";
}

function resetUnitColour() {
  unitSelect.innerHTML = `<option value="">Select Unit</option>`;
  colourSelect.innerHTML = `<option value="">Select Colour</option>`;
  unitSelect.disabled = true;
  colourSelect.disabled = true;
}