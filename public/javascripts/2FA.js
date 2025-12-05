// ===============================
// 2FA Page JS - Modular Version
// ===============================

document.addEventListener('DOMContentLoaded', () => {
  initParticles(30);       // Floating background particles
  initOTPInputs();         // Auto-focus & backspace handling
  initOTPForm();           // OTP form submit
  initLogoutButton();      // Logout functionality
});

// ===== Floating Particles =====
function initParticles(count = 30) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.classList.add('particle');
    const size = 5 + Math.random() * 8;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}vw`;
    p.style.top = `${Math.random() * 100}vh`;
    p.style.opacity = 0.2 + Math.random() * 0.6;
    document.body.appendChild(p);
    particles.push({ el: p, speedX: Math.random() * 0.5, speedY: Math.random() * 0.3 });
  }

  function animate() {
    particles.forEach(p => {
      let top = parseFloat(p.el.style.top);
      let left = parseFloat(p.el.style.left);
      top -= p.speedY;
      left += Math.sin(Date.now() * 0.001) * p.speedX;
      if (top < -10) top = 100;
      if (left > 100) left = 0;
      p.el.style.top = top + 'vh';
      p.el.style.left = left + 'vw';
    });
    requestAnimationFrame(animate);
  }
  animate();
}

// ===== OTP Inputs Auto-Focus =====
function initOTPInputs() {
  const otpInputs = document.querySelectorAll('.otp-container input');
  otpInputs.forEach((input, idx) => {
    input.addEventListener('input', (e) => {
      if (e.target.value.length === 1 && idx < otpInputs.length - 1) otpInputs[idx + 1].focus();
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === "Backspace" && !e.target.value && idx > 0) otpInputs[idx - 1].focus();
    });
  });
}

// ===== OTP Form Submit =====
function initOTPForm() {
  const loginForm = document.getElementById('loginForm');
  const otpInputs = document.querySelectorAll('.otp-container input');
  const messageEl = document.getElementById('message');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    messageEl.textContent = "";

    let otp = '';
    otpInputs.forEach(input => otp += input.value.trim());

    if (otp.length < otpInputs.length) {
      showMessage("Please enter complete OTP!", "red");
      return;
    }

    try {
      const res = await fetch('/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();

      if (!data.success) {
        showMessage(data.message, "red");
        return;
      }

      showMessage("OTP Verified! Redirecting...", "lightgreen");
      otpInputs.forEach(input => input.value = "");
      setTimeout(() => { window.location.href = "/home"; }, 1000);

    } catch (err) {
      console.error(err);
      showMessage("Server error. Try again!", "red");
    }
  });

  function showMessage(msg, color) {
    messageEl.style.color = color;
    messageEl.textContent = msg;
  }
}

// ===== Logout Button =====
function initLogoutButton() {
  const logoutBtn = document.getElementById('logout');
  if (!logoutBtn) return;

  logoutBtn.addEventListener('click', async () => {
    try {
      const res = await fetch('/auth/logout-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) window.location.href = '/auth/login';
    } catch (err) {
      console.error(err);
    }
  });
}
