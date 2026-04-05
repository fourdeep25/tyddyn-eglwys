/* ============================================================
   Tyddyn Eglwys — Application JavaScript
   ============================================================ */
(function () {
  'use strict';

  /* ── Dark Mode Toggle ── */
  const themeToggle = document.querySelector('[data-theme-toggle]');
  const root = document.documentElement;
  let currentTheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  root.setAttribute('data-theme', currentTheme);
  updateThemeIcon();

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', currentTheme);
      updateThemeIcon();
    });
  }

  function updateThemeIcon() {
    if (!themeToggle) return;
    themeToggle.setAttribute('aria-label', 'Switch to ' + (currentTheme === 'dark' ? 'light' : 'dark') + ' mode');
    themeToggle.innerHTML = currentTheme === 'dark'
      ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>'
      : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  }

  /* ── Sticky Header ── */
  const header = document.getElementById('siteHeader');
  let lastScroll = 0;

  function handleScroll() {
    const scrollY = window.scrollY;
    if (scrollY > 60) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
    lastScroll = scrollY;
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  /* ── Mobile Nav ── */
  const hamburger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileNav');

  hamburger.addEventListener('click', () => {
    const isOpen = mobileNav.classList.toggle('active');
    hamburger.classList.toggle('active');
    hamburger.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  mobileNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      mobileNav.classList.remove('active');
      hamburger.classList.remove('active');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  /* ── Scroll Reveal ── */
  const reveals = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));

  /* ── Back to Top ── */
  const backToTop = document.getElementById('backToTop');
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 600);
  }, { passive: true });
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ── Gallery Lightbox ── */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = lightbox.querySelector('.lightbox-close');

  document.querySelectorAll('[data-lightbox]').forEach(item => {
    item.addEventListener('click', () => {
      const src = item.getAttribute('data-lightbox');
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLightbox();
      closeModal();
    }
  });

  /* ============================================================
     BOOKING CALENDAR
     ============================================================ */
  const PRICE_PER_NIGHT = 185;
  const CLEANING_FEE = 75;
  const MAX_GUESTS = 8;

  // State
  let currentMonth = 3; // April (0-indexed)
  let currentYear = 2026;
  let checkIn = null;
  let checkOut = null;
  let guestCountVal = 2;
  let selectingCheckOut = false;

  // Blocked dates (simulate some unavailable dates)
  const blockedDates = new Set([
    '2026-04-10', '2026-04-11', '2026-04-12', '2026-04-13',
    '2026-04-24', '2026-04-25', '2026-04-26',
    '2026-05-01', '2026-05-02', '2026-05-03', '2026-05-04',
    '2026-05-15', '2026-05-16', '2026-05-17',
    '2026-05-29', '2026-05-30', '2026-05-31',
    '2026-06-12', '2026-06-13', '2026-06-14', '2026-06-15', '2026-06-16',
    '2026-06-26', '2026-06-27', '2026-06-28',
    '2026-07-04', '2026-07-05', '2026-07-06', '2026-07-07',
    '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21', '2026-07-22',
    '2026-08-01', '2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05',
    '2026-08-06', '2026-08-07',
    '2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18',
    '2026-08-28', '2026-08-29', '2026-08-30',
  ]);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const calendarTitle = document.getElementById('calendarTitle');
  const calendarGrid = document.getElementById('calendarGrid');
  const calPrev = document.getElementById('calPrev');
  const calNext = document.getElementById('calNext');

  function dateStr(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  function formatDate(d) {
    if (!d) return null;
    const parts = d.split('-');
    const day = parseInt(parts[2]);
    const mon = monthNames[parseInt(parts[1]) - 1].slice(0, 3);
    return `${day} ${mon} ${parts[0]}`;
  }

  function isBlocked(ds) {
    return blockedDates.has(ds);
  }

  function isPast(ds) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(ds + 'T00:00:00');
    return d < today;
  }

  function isToday(ds) {
    const today = new Date();
    return ds === dateStr(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function hasBlockedInRange(start, end) {
    const s = new Date(start + 'T00:00:00');
    const e = new Date(end + 'T00:00:00');
    const cur = new Date(s);
    while (cur <= e) {
      const ds = dateStr(cur.getFullYear(), cur.getMonth(), cur.getDate());
      if (isBlocked(ds)) return true;
      cur.setDate(cur.getDate() + 1);
    }
    return false;
  }

  function renderCalendar() {
    calendarTitle.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    calendarGrid.innerHTML = '';

    // Weekday headers
    dayNames.forEach(d => {
      const el = document.createElement('div');
      el.className = 'calendar-weekday';
      el.textContent = d;
      calendarGrid.appendChild(el);
    });

    const firstDay = new Date(currentYear, currentMonth, 1);
    let startDay = firstDay.getDay() - 1; // Monday = 0
    if (startDay < 0) startDay = 6;

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty cells before first day
    for (let i = 0; i < startDay; i++) {
      const el = document.createElement('div');
      el.className = 'calendar-day empty';
      calendarGrid.appendChild(el);
    }

    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = dateStr(currentYear, currentMonth, d);
      const el = document.createElement('div');
      el.className = 'calendar-day';
      el.textContent = d;
      el.dataset.date = ds;

      if (isPast(ds) || isBlocked(ds)) {
        el.classList.add('disabled');
      } else {
        el.addEventListener('click', () => selectDate(ds));
      }

      if (isToday(ds)) el.classList.add('today');

      // Range highlighting
      if (checkIn && ds === checkIn) el.classList.add('selected-start');
      if (checkOut && ds === checkOut) el.classList.add('selected-end');
      if (checkIn && checkOut && ds > checkIn && ds < checkOut) {
        el.classList.add('in-range');
      }

      calendarGrid.appendChild(el);
    }
  }

  function selectDate(ds) {
    if (!checkIn || (checkIn && checkOut) || selectingCheckOut === false) {
      // Start new selection
      checkIn = ds;
      checkOut = null;
      selectingCheckOut = true;
    } else {
      // Selecting check-out
      if (ds <= checkIn) {
        // Clicked before check-in, restart
        checkIn = ds;
        checkOut = null;
        selectingCheckOut = true;
      } else if (hasBlockedInRange(checkIn, ds)) {
        // Blocked dates in range, restart
        checkIn = ds;
        checkOut = null;
        selectingCheckOut = true;
      } else {
        checkOut = ds;
        selectingCheckOut = false;
      }
    }

    renderCalendar();
    updateBookingSummary();
  }

  calPrev.addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    renderCalendar();
  });

  calNext.addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    renderCalendar();
  });

  /* ── Guest Counter ── */
  const guestMinus = document.getElementById('guestMinus');
  const guestPlus = document.getElementById('guestPlus');
  const guestCountEl = document.getElementById('guestCount');

  guestMinus.addEventListener('click', () => {
    if (guestCountVal > 1) {
      guestCountVal--;
      updateGuestDisplay();
    }
  });

  guestPlus.addEventListener('click', () => {
    if (guestCountVal < MAX_GUESTS) {
      guestCountVal++;
      updateGuestDisplay();
    }
  });

  function updateGuestDisplay() {
    guestCountEl.textContent = guestCountVal + (guestCountVal === 1 ? ' guest' : ' guests');
    guestMinus.disabled = guestCountVal <= 1;
    guestPlus.disabled = guestCountVal >= MAX_GUESTS;
  }

  /* ── Booking Summary ── */
  const checkinDisplay = document.getElementById('checkinDisplay');
  const checkoutDisplay = document.getElementById('checkoutDisplay');
  const priceBreakdown = document.getElementById('priceBreakdown');
  const nightsLabel = document.getElementById('nightsLabel');
  const nightsCost = document.getElementById('nightsCost');
  const totalCost = document.getElementById('totalCost');
  const bookNowBtn = document.getElementById('bookNowBtn');

  function getNights() {
    if (!checkIn || !checkOut) return 0;
    const d1 = new Date(checkIn + 'T00:00:00');
    const d2 = new Date(checkOut + 'T00:00:00');
    return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
  }

  function updateBookingSummary() {
    if (checkIn) {
      checkinDisplay.textContent = formatDate(checkIn);
      checkinDisplay.classList.remove('placeholder');
    } else {
      checkinDisplay.textContent = 'Select date';
      checkinDisplay.classList.add('placeholder');
    }

    if (checkOut) {
      checkoutDisplay.textContent = formatDate(checkOut);
      checkoutDisplay.classList.remove('placeholder');
    } else {
      checkoutDisplay.textContent = 'Select date';
      checkoutDisplay.classList.add('placeholder');
    }

    const nights = getNights();
    if (nights > 0) {
      priceBreakdown.style.display = 'block';
      const accom = PRICE_PER_NIGHT * nights;
      const total = accom + CLEANING_FEE;
      nightsLabel.textContent = `£${PRICE_PER_NIGHT} × ${nights} night${nights > 1 ? 's' : ''}`;
      nightsCost.textContent = `£${accom}`;
      totalCost.textContent = `£${total}`;
      bookNowBtn.disabled = false;
    } else {
      priceBreakdown.style.display = 'none';
      bookNowBtn.disabled = true;
    }
  }

  /* ── Booking Modal ── */
  const bookingModal = document.getElementById('bookingModal');
  const modalClose = document.getElementById('modalClose');
  const modalDates = document.getElementById('modalDates');
  const modalGuests = document.getElementById('modalGuests');
  const modalAccom = document.getElementById('modalAccom');
  const modalTotal = document.getElementById('modalTotal');
  const stripePayBtn = document.getElementById('stripePayBtn');

  bookNowBtn.addEventListener('click', () => {
    const nights = getNights();
    const accom = PRICE_PER_NIGHT * nights;
    const total = accom + CLEANING_FEE;

    modalDates.textContent = `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
    modalGuests.textContent = guestCountVal + (guestCountVal === 1 ? ' guest' : ' guests');
    modalAccom.textContent = `£${PRICE_PER_NIGHT} × ${nights} nights = £${accom}`;
    modalTotal.textContent = `£${total}`;

    bookingModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  });

  function closeModal() {
    bookingModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  bookingModal.addEventListener('click', (e) => {
    if (e.target === bookingModal) closeModal();
  });

  /* ── Stripe Integration (Demo) ── */
  stripePayBtn.addEventListener('click', () => {
    const name = document.getElementById('guestName').value.trim();
    const email = document.getElementById('guestEmail').value.trim();

    if (!name || !email) {
      alert('Please fill in your name and email.');
      return;
    }

    // Demo: Initialize Stripe with test key
    try {
      const stripe = Stripe('pk_test_TYooMQauvdEDq54NiTphI7jx');
      // In production, this would redirect to a Stripe Checkout session
      // created by your backend. For demo purposes, show a confirmation.
      alert(
        `Demo Booking Confirmed!\n\n` +
        `Name: ${name}\n` +
        `Email: ${email}\n` +
        `Dates: ${formatDate(checkIn)} → ${formatDate(checkOut)}\n` +
        `Guests: ${guestCountVal}\n` +
        `Total: £${PRICE_PER_NIGHT * getNights() + CLEANING_FEE}\n\n` +
        `In production, this would redirect to Stripe Checkout.`
      );
      closeModal();
    } catch (err) {
      alert('Stripe demo: ' + err.message);
    }
  });

  /* ── Initialize ── */
  renderCalendar();
  updateGuestDisplay();

})();
