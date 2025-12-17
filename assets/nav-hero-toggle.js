(function () {
  const nav = document.querySelector('.main-nav');
  if (!nav) return;

  // OPTION B: read page type from data attribute on the .main-nav element
  const onHome = (nav.getAttribute('data-page-type') === 'index');

  const toTransparent = () => {
    nav.classList.add('main-nav--transparent');
    nav.classList.remove('main-nav--solid');
  };
  const toSolid = () => {
    nav.classList.add('main-nav--solid');
    nav.classList.remove('main-nav--transparent');
  };

  // Non-home pages are always solid
  if (!onHome) { toSolid(); return; }

  // Try to find the homepage hero (mark your hero wrapper with data-nav-hero for best results)
  const hero =
    document.querySelector('[data-nav-hero]') ||
    document.querySelector('.slideshow, .image-banner, .banner, .hero') ||
    document.querySelector('.shopify-section'); // fallback

  if (!hero) { toSolid(); return; }

  // Offset the detection line by the header height
  const headerHeight = nav.getBoundingClientRect().height || 80;

  // Intersection Observer toggles states as you scroll past the hero
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.target !== hero) return;
      if (entry.isIntersecting && entry.intersectionRatio > 0.05) {
        toTransparent();
      } else {
        toSolid();
      }
    });
  }, {
    root: null,
    rootMargin: `-${headerHeight + 1}px 0px 0px 0px`,
    threshold: [0, 0.05, 0.2, 0.5, 0.8, 1]
  });

  io.observe(hero);

  // Set the initial state immediately (handles page loads mid-scroll)
  const init = () => {
    const r = hero.getBoundingClientRect();
    const lineY = headerHeight + 1;
    if (r.top < lineY && r.bottom > lineY) toTransparent(); else toSolid();
  };
  init();

  // Small safety for instant jump-to-top
  window.addEventListener('scroll', () => {
    if (window.scrollY <= 4) toTransparent();
  }, { passive: true });
})();
