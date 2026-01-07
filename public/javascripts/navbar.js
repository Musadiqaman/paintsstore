const sidebar = document.getElementById("sidebar");
const hamburger = document.getElementById("hamburger");
const overlay = document.getElementById("overlay");

/* HAMBURGER FIX (REAL MOBILE SAFE) */
function toggleSidebar() {
  sidebar.classList.toggle("mobile-open");
  overlay.classList.toggle("show");
}

hamburger.addEventListener("click", toggleSidebar);
hamburger.addEventListener("touchstart", toggleSidebar);

overlay.addEventListener("click", toggleSidebar);
overlay.addEventListener("touchstart", toggleSidebar);

/* SUBMENU */
document.querySelectorAll(".menu-group").forEach(group => {
  const dropdown = group.querySelector(".dropdown");
  const submenu = group.querySelector(".submenu");
  const arrow = group.querySelector(".arrow");

  dropdown.addEventListener("click", () => {
    submenu.classList.toggle("open");
    arrow.textContent = submenu.classList.contains("open") ? "▼" : "▶";
  });
});



// 1. Jab naya page khul jaye to loader chhupa do
window.addEventListener('load', () => {
    const loader = document.getElementById('global-page-loader');
    if (loader) {
        loader.style.display = 'none';
    }
});

// 2. Jab kisi link par click ho to loader dikha do
document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', (e) => {
        // Sirf un links par jo naya page kholtay hain (not target="_blank" or same page anchors)
        if (!link.hash && link.target !== '_blank' && link.href.startsWith(window.location.origin)) {
            const loader = document.getElementById('global-page-loader');
            if (loader) {
                loader.style.display = 'flex';
            }
        }
    });
});

// 3. Form submit hotay waqt bhi loader dikhao
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', () => {
        const loader = document.getElementById('global-page-loader');
        if (loader) {
            loader.style.display = 'flex';
        }
    });
});