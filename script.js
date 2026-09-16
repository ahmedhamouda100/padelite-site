// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('nav').classList.toggle('open');
});

// Close nav after tapping a link (mobile)
document.querySelectorAll('.nav-links a').forEach(a => {
  a.addEventListener('click', () => {
    document.getElementById('nav').classList.remove('open');
  });
});
