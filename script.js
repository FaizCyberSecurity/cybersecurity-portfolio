// ===========================================
// PORTFOLIO SCRIPT
// ===========================================

document.addEventListener("DOMContentLoaded", () => {
  initTerminalTyping();
  initMobileNav();
  initActiveNavOnScroll();
  initBackToTop();
});

// ===========================================
// 1. TERMINAL-STYLE TYPING EFFECT (HERO)
// ===========================================
function initTerminalTyping() {
  const target = document.getElementById("typedText");
  if (!target) return;

  const phrases = ["whoami", "Hello, I'm Mohd Faiz"];
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // If the user prefers reduced motion, just show the final text instantly.
  if (prefersReducedMotion) {
    target.textContent = phrases[phrases.length - 1];
    return;
  }

  let phraseIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const TYPE_SPEED = 70;
  const DELETE_SPEED = 35;
  const HOLD_TIME = 1200;

  function tick() {
    const current = phrases[phraseIndex];
    const isLastPhrase = phraseIndex === phrases.length - 1;

    if (!deleting) {
      charIndex++;
      target.textContent = current.slice(0, charIndex);

      if (charIndex === current.length) {
        // Stop typing forever once we reach the final phrase.
        if (isLastPhrase) return;
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      setTimeout(tick, TYPE_SPEED);
    } else {
      charIndex--;
      target.textContent = current.slice(0, charIndex);

      if (charIndex === 0) {
        deleting = false;
        phraseIndex++;
        setTimeout(tick, 300);
        return;
      }
      setTimeout(tick, DELETE_SPEED);
    }
  }

  tick();
}

// ===========================================
// 2. MOBILE NAV TOGGLE
// ===========================================
function initMobileNav() {
  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.classList.toggle("open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  // Close the menu whenever a nav link is tapped.
  links.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ===========================================
// 3. ACTIVE NAV LINK ON SCROLL
// ===========================================
function initActiveNavOnScroll() {
  const sections = document.querySelectorAll("section[id]");
  const navLinks = document.querySelectorAll(".nav-links a");
  if (!sections.length || !navLinks.length) return;

  const setActive = (id) => {
    navLinks.forEach((link) => {
      link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActive(entry.target.id);
        }
      });
    },
    {
      // Trigger when a section is roughly centered in the viewport.
      rootMargin: "-45% 0px -50% 0px",
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

// ===========================================
// 4. BACK-TO-TOP BUTTON VISIBILITY
// ===========================================
function initBackToTop() {
  const topBtn = document.getElementById("topBtn");
  if (!topBtn) return;

  const toggleVisibility = () => {
    topBtn.classList.toggle("visible", window.scrollY > 400);
  };

  toggleVisibility();
  window.addEventListener("scroll", toggleVisibility, { passive: true });
}
