(function () {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('#navbar a.nav-link');

  function updateActiveNavLink() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const navbar = document.getElementById('navbar');
    const navbarHeight = navbar ? navbar.offsetHeight : 50;

    // Check if user has scrolled near the bottom of the page
    const isAtBottom = (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 30);

    let currentId = '';

    if (isAtBottom && sections.length > 0) {
      currentId = sections[sections.length - 1].getAttribute('id');
    } else {
      sections.forEach(function (section) {
        const sectionTop = section.offsetTop - navbarHeight - 60;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
          currentId = section.getAttribute('id');
        }
      });
    }

    if (!currentId && sections.length > 0 && scrollY < 200) {
      currentId = sections[0].getAttribute('id');
    }

    navLinks.forEach(function (link) {
      const href = link.getAttribute('href');
      if (href === '#' + currentId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  window.addEventListener('scroll', updateActiveNavLink, { passive: true });
  window.addEventListener('resize', updateActiveNavLink);
  window.addEventListener('load', updateActiveNavLink);
  document.addEventListener('DOMContentLoaded', updateActiveNavLink);
  updateActiveNavLink();

  // Mobile menu toggle logic
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      const isOpen = navMenu.classList.toggle('open');
      navToggle.classList.toggle('open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close menu when clicking any nav link
    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', function (e) {
      if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        navMenu.classList.remove('open');
        navToggle.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Theme toggle logic
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    function setTheme(isLight) {
      if (isLight) {
        document.documentElement.classList.add('light-mode');
        document.body.classList.add('light-mode');
        try { localStorage.setItem('theme', 'light'); } catch (e) { }
        themeToggle.setAttribute('aria-label', 'Switch to dark mode');
        themeToggle.setAttribute('title', 'Switch to dark mode');
      } else {
        document.documentElement.classList.remove('light-mode');
        document.body.classList.remove('light-mode');
        try { localStorage.setItem('theme', 'dark'); } catch (e) { }
        themeToggle.setAttribute('aria-label', 'Switch to light mode');
        themeToggle.setAttribute('title', 'Switch to light mode');
      }
    }

    // Sync initial state
    try {
      const isLight = localStorage.getItem('theme') === 'light';
      setTheme(isLight);
    } catch (e) { }

    themeToggle.addEventListener('click', function () {
      const isLight = document.body.classList.contains('light-mode') || document.documentElement.classList.contains('light-mode');
      setTheme(!isLight);
    });
  }
})();

document.addEventListener('DOMContentLoaded', () => {
  // Replace this with your actual Google Apps Script Web App URL
  const scriptURL = 'https://script.google.com/macros/s/AKfycbydVb463xNQsz3gpItwF53arOMXyWlspdpaxxLKfKk1bK-euv7pC8HbtmTB2Uy0YFVp/exec';

  const form = document.querySelector('.contact-form');
  if (!form) return; // Exit if the contact form isn't on the current page

  const submitBtn = form.querySelector('.contact-submit-btn');

  form.addEventListener('submit', e => {
    e.preventDefault();

    // Disable the button and show loading state
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    // Collect data from your input IDs
    const formData = {
      email: document.getElementById('email').value,
      name: document.getElementById('name').value,
      message: document.getElementById('message').value
    };

    fetch(scriptURL, {
      method: 'POST',
      mode: 'no-cors', // Required for Google Apps Script to bypass CORS restrictions
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    })
      .then(() => {
        // Success feedback
        alert('Thank you! Your message has been sent successfully.');
        form.reset();
      })
      .catch(error => {
        console.error('Error!', error.message);
        alert('Oops! Something went wrong. Please try again later.');
      })
      .finally(() => {
        // Re-enable the submit button
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send Message';
      });
  });
});