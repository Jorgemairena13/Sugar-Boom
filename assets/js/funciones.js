document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('.menu-btn');
  const aside = document.querySelector('.aside');
  const main = document.querySelector('.main');

  if (btn) {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      aside.classList.toggle('active');
      main.classList.toggle('shifted');

      if (window.innerWidth <= 768) {
        document.body.classList.toggle('menu-open');
      }
    });
  }

  document.addEventListener('click', (e) => {
    if (aside && aside.classList.contains('active') && !aside.contains(e.target) && btn && !btn.contains(e.target)) {
      aside.classList.remove('active');
      main.classList.remove('shifted');

      if (window.innerWidth <= 768) {
        document.body.classList.remove('menu-open');
      }
    }
  });
});
// Seleccionar productos
const productos = document.querySelectorAll('.producto');

// Observar el scroll
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {

    if (entry.isIntersecting) {

      entry.target.classList.add('animate');

      observer.unobserve(entry.target);
    }
  });
}, {

  threshold: 0.1
});

// 6. Le decimos al observador que vigile cada uno de los productos
productos.forEach(producto => {
  observer.observe(producto);
});







