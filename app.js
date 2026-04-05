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

  /* ── Gallery Lightbox (delegated for filter compatibility) ── */
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = lightbox.querySelector('.lightbox-close');

  // Use event delegation so lightbox works even after filter changes
  const galleryGrid = document.querySelector('.gallery-grid');
  if (galleryGrid) {
    galleryGrid.addEventListener('click', (e) => {
      const item = e.target.closest('[data-lightbox]');
      if (!item || item.classList.contains('gallery-hidden')) return;
      const src = item.getAttribute('data-lightbox');
      lightboxImg.src = src;
      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  }

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

  /* ── Gallery Filters ── */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.getAttribute('data-filter');

      // Update active button
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filter gallery items
      galleryItems.forEach(item => {
        const category = item.getAttribute('data-category');
        const matches = filter === 'all' || category === filter;

        if (matches) {
          // Show: remove hidden, restore to grid flow
          item.classList.remove('gallery-hidden');
          item.classList.add('gallery-visible');
        } else {
          // Hide with animation then collapse
          item.classList.remove('gallery-visible');
          item.classList.add('gallery-hidden');
        }
      });
    });
  });

  /* ============================================================
     BOOKING CALENDAR
     ============================================================ */
  const WEEKDAY_RATE = 300;  // Sun–Thu
  const WEEKEND_RATE = 350;  // Fri & Sat
  const MIN_NIGHTS = 3;
  const MAX_GUESTS = 8;

  // Calculate pricing based on day-of-week per night
  function calcStayPrice(ciStr, coStr) {
    if (!ciStr || !coStr) return { weekdayNights: 0, weekendNights: 0, total: 0, nights: 0 };
    const ci = new Date(ciStr + 'T00:00:00');
    const co = new Date(coStr + 'T00:00:00');
    let weekdayN = 0, weekendN = 0;
    const d = new Date(ci);
    while (d < co) {
      const dow = d.getDay(); // 0=Sun … 6=Sat
      if (dow === 5 || dow === 6) { weekendN++; } else { weekdayN++; }
      d.setDate(d.getDate() + 1);
    }
    return {
      weekdayNights: weekdayN,
      weekendNights: weekendN,
      total: weekdayN * WEEKDAY_RATE + weekendN * WEEKEND_RATE,
      nights: weekdayN + weekendN
    };
  }

  // State
  let currentMonth = 3; // April (0-indexed)
  let currentYear = 2026;
  let checkIn = null;
  let checkOut = null;
  let guestCountVal = 2;
  let selectingCheckOut = false;

  // Blocked dates — populated from Airbnb iCal + temporary holds via Netlify functions
  let blockedDates = new Set();
  let calendarSynced = false;

  // Fetch availability from Airbnb + held dates
  async function syncCalendar() {
    try {
      // Fetch Airbnb calendar and held dates in parallel
      const [calRes, holdRes] = await Promise.allSettled([
        fetch('/.netlify/functions/calendar-sync'),
        fetch('/.netlify/functions/hold-dates')
      ]);

      const allBlocked = new Set();

      // Process Airbnb dates
      if (calRes.status === 'fulfilled' && calRes.value.ok) {
        const calData = await calRes.value.json();
        if (calData.blockedDates) {
          calData.blockedDates.forEach(d => allBlocked.add(d));
        }
      }

      // Process temporarily held dates
      if (holdRes.status === 'fulfilled' && holdRes.value.ok) {
        const holdData = await holdRes.value.json();
        if (holdData.heldDates) {
          holdData.heldDates.forEach(d => allBlocked.add(d));
        }
      }

      if (allBlocked.size > 0) {
        blockedDates = allBlocked;
        calendarSynced = true;
        renderCalendar();
        const indicator = document.getElementById('syncIndicator');
        if (indicator) {
          indicator.textContent = 'Live availability · Synced with Airbnb';
          indicator.classList.add('synced');
        }
      }
    } catch (e) {
      console.log('Calendar sync unavailable, showing all dates as available');
      const indicator = document.getElementById('syncIndicator');
      if (indicator) {
        indicator.textContent = 'Availability may not be up to date';
      }
    }
  }

  // Hold dates temporarily after successful enquiry (6 hours)
  async function holdDates(ciDate, coDate, name) {
    try {
      await fetch('/.netlify/functions/hold-dates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkIn: ciDate, checkOut: coDate, guestName: name })
      });
      // Immediately add to local blockedDates so calendar updates
      const start = new Date(ciDate + 'T00:00:00');
      const end = new Date(coDate + 'T00:00:00');
      const d = new Date(start);
      while (d < end) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        blockedDates.add(`${y}-${m}-${day}`);
        d.setDate(d.getDate() + 1);
      }
      renderCalendar();
    } catch (e) {
      console.log('Could not hold dates:', e.message);
    }
  }

  // Call sync on load
  syncCalendar();

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

  const weekdayLine = document.getElementById('weekdayLine');
  const weekendLine = document.getElementById('weekendLine');
  const weekdayLabel = document.getElementById('weekdayLabel');
  const weekdayCost = document.getElementById('weekdayCost');
  const weekendLabel = document.getElementById('weekendLabel');
  const weekendCost = document.getElementById('weekendCost');
  const minStayWarning = document.getElementById('minStayWarning');

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
      const p = calcStayPrice(checkIn, checkOut);

      nightsLabel.textContent = `${p.nights} night${p.nights > 1 ? 's' : ''}`;
      nightsCost.textContent = `£${p.total}`;

      if (p.weekdayNights > 0) {
        weekdayLine.style.display = '';
        weekdayLabel.textContent = `${p.weekdayNights} × £${WEEKDAY_RATE} (Sun–Thu)`;
        weekdayCost.textContent = `£${p.weekdayNights * WEEKDAY_RATE}`;
      } else { weekdayLine.style.display = 'none'; }

      if (p.weekendNights > 0) {
        weekendLine.style.display = '';
        weekendLabel.textContent = `${p.weekendNights} × £${WEEKEND_RATE} (Fri–Sat)`;
        weekendCost.textContent = `£${p.weekendNights * WEEKEND_RATE}`;
      } else { weekendLine.style.display = 'none'; }

      totalCost.textContent = `£${p.total}`;

      // Minimum stay enforcement
      if (nights < MIN_NIGHTS) {
        minStayWarning.style.display = 'block';
        bookNowBtn.disabled = true;
      } else {
        minStayWarning.style.display = 'none';
        bookNowBtn.disabled = false;
      }
    } else {
      priceBreakdown.style.display = 'none';
      minStayWarning.style.display = 'none';
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
  bookNowBtn.addEventListener('click', () => {
    const p = calcStayPrice(checkIn, checkOut);

    const dateStr = `${formatDate(checkIn)} → ${formatDate(checkOut)}`;
    modalDates.textContent = dateStr;
    modalGuests.textContent = guestCountVal + (guestCountVal === 1 ? ' guest' : ' guests');
    let breakdown = `${p.nights} nights`;
    if (p.weekdayNights > 0) breakdown += ` · ${p.weekdayNights}×£${WEEKDAY_RATE}`;
    if (p.weekendNights > 0) breakdown += ` · ${p.weekendNights}×£${WEEKEND_RATE}`;
    modalAccom.textContent = `${breakdown} = £${p.total}`;
    modalTotal.textContent = `£${p.total}`;

    // Populate hidden fields for Netlify form
    document.getElementById('hiddenDates').value = dateStr;
    document.getElementById('hiddenNights').value = `${p.nights} nights (${p.weekdayNights} weekday, ${p.weekendNights} weekend)`;
    document.getElementById('hiddenTotal').value = `£${p.total}`;

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

  /* ── Enquiry Form Submission (Netlify Forms) ── */
  const bookingForm = document.getElementById('bookingForm');
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById('submitEnquiryBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    try {
      const formData = new FormData(bookingForm);
      const res = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData).toString()
      });

      if (res.ok) {
        // Hold dates for 6 hours while hosts process the enquiry
        const guestName = formData.get('name') || 'Guest';
        if (checkIn && checkOut) {
          holdDates(checkIn, checkOut, guestName);
        }

        bookingForm.style.display = 'none';
        document.getElementById('modalSummary').style.display = 'none';
        document.getElementById('enquirySuccess').style.display = 'block';
        bookingForm.reset();
      } else {
        throw new Error('Submission failed');
      }
    } catch (err) {
      alert('Sorry, there was a problem sending your enquiry. Please email us directly at farrarvf@gmail.com');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Enquiry';
    }
  });

  /* ── Activities Tab Toggle ── */
  const activityBtns = document.querySelectorAll('.activities-toggle-btn');
  const activityPanels = {
    roadCycling: document.getElementById('roadCyclingRoutes'),
    mtb: document.getElementById('mtbRoutes'),
    walking: document.getElementById('walkingRoutes')
  };

  if (activityBtns.length && activityPanels.roadCycling && activityPanels.mtb && activityPanels.walking) {
    activityBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-activity-tab');

        // Update button states
        activityBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        // Hide all panels, then show the selected one
        const showing = activityPanels[tab];
        const hidingPanels = Object.values(activityPanels).filter(p => p !== showing);

        hidingPanels.forEach(panel => {
          panel.classList.add('activities-routes--fade-out');
        });

        setTimeout(() => {
          hidingPanels.forEach(panel => {
            panel.classList.add('activities-routes--hidden');
            panel.classList.remove('activities-routes--fade-out');
          });

          showing.classList.remove('activities-routes--hidden');
          // Trigger reflow then fade in
          showing.offsetHeight;
          showing.style.opacity = '1';

          // Re-observe newly visible reveal elements
          showing.querySelectorAll('.reveal:not(.visible)').forEach(el => {
            revealObserver.observe(el);
          });
        }, 300);
      });
    });
  }

  /* ── Initialize ── */
  renderCalendar();
  updateGuestDisplay();

  /* ============================================================
     ACCORDION — Your Stay Section
     ============================================================ */
  document.querySelectorAll('.accordion-header').forEach(btn => {
    btn.addEventListener('click', () => {
      const isExpanded = btn.getAttribute('aria-expanded') === 'true';
      const body = btn.nextElementSibling;

      // Close all others in the same accordion
      const accordion = btn.closest('.accordion');
      if (accordion) {
        accordion.querySelectorAll('.accordion-header').forEach(otherBtn => {
          if (otherBtn !== btn) {
            otherBtn.setAttribute('aria-expanded', 'false');
            const otherBody = otherBtn.nextElementSibling;
            if (otherBody) otherBody.style.maxHeight = null;
          }
        });
      }

      // Toggle clicked item
      if (isExpanded) {
        btn.setAttribute('aria-expanded', 'false');
        body.style.maxHeight = null;
      } else {
        btn.setAttribute('aria-expanded', 'true');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

})();
