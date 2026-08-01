(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Speck field: drifting particles with per-depth scroll parallax */
  var cv = document.getElementById('bg');
  if (cv && !reduce && cv.getContext) {
    var ctx = cv.getContext('2d');
    var W, H;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var size = function () {
      W = cv.width = window.innerWidth * dpr;
      H = cv.height = window.innerHeight * dpr;
    };
    size();
    window.addEventListener('resize', size);

    var specks = [];
    var count = Math.min(90, Math.floor(window.innerWidth / 14) + 30);
    for (var i = 0; i < count; i++) {
      specks.push({
        x: Math.random(),
        y: Math.random(),
        depth: 0.15 + Math.random() * 0.85,
        r: 0.8 + Math.random() * 1.8,
        drift: (Math.random() - 0.5) * 0.0001,
        phase: Math.random() * 6.2832,
        volt: Math.random() < 0.55
      });
    }
    var frame = function (now) {
      requestAnimationFrame(frame);
      ctx.clearRect(0, 0, W, H);
      var sc = window.scrollY || 0;
      for (var i = 0; i < specks.length; i++) {
        var s = specks[i];
        s.x = ((s.x + s.drift) % 1 + 1) % 1;
        var bob = Math.sin(now * 0.0004 + s.phase) * 0.006;
        var y = ((s.y + bob - sc * s.depth * 0.00035) % 1 + 1) % 1;
        ctx.globalAlpha = 0.1 + s.depth * 0.22;
        ctx.fillStyle = s.volt ? '#e7f11e' : '#f6f6f2';
        ctx.beginPath();
        ctx.arc(s.x * W, y * H, s.r * s.depth * dpr, 0, 6.2832);
        ctx.fill();
      }
    };
    requestAnimationFrame(frame);
  } else if (cv) {
    cv.remove();
  }

  /* Hero doodle tilts with scroll */
  var doodle = document.querySelector('.hero-art .blob svg');
  if (doodle && !reduce) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        doodle.style.transform = 'rotate(' + window.scrollY * 0.04 + 'deg)';
        ticking = false;
      });
    }, { passive: true });
  }

  /* Staggered scroll reveals */
  if (!reduce && 'IntersectionObserver' in window) {
    var els = document.querySelectorAll(
      '.section-head, .burger-card, .fries-note, .item-row, .frame, .bev-card, .day, .cta-banner, .contact-card'
    );
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) {
      var idx = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.classList.add('reveal');
      el.style.setProperty('--d', Math.min(idx, 6) * 70 + 'ms');
      io.observe(el);
    });
  }

  /* Horarios: estado abierto/cerrado en vivo + tarjeta de hoy */
  var OPEN_DAYS = [2, 3, 4, 5, 6]; /* martes a sábado */
  var OPEN_MIN = 18 * 60 + 30, CLOSE_MIN = 23 * 60;
  var DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  function renderHorarios() {
    var head = document.querySelector('#horarios .section-head');
    var days = document.querySelectorAll('#horarios .week .day');
    if (!head || !days.length) return;

    var now = new Date();
    var dow = now.getDay();
    var mins = now.getHours() * 60 + now.getMinutes();
    var isOpenDay = OPEN_DAYS.indexOf(dow) !== -1;
    var isRestDay = dow === 0 || dow === 1; /* domingo y lunes */
    var openNow = isOpenDay && mins >= OPEN_MIN && mins < CLOSE_MIN;
    var untilOpen = OPEN_MIN - mins; /* solo relevante si abre hoy */
    var WARMUP_MIN = 45;
    var warming = isOpenDay && untilOpen > 0 && untilOpen <= WARMUP_MIN;

    var msg;
    if (openNow) {
      msg = 'Abierto ahora · cerramos a las 11:00 PM';
    } else if (warming) {
      msg = 'Calentando la plancha · abrimos en ' + untilOpen + ' min';
    } else if (isOpenDay && mins < OPEN_MIN) {
      var hrs = Math.floor(untilOpen / 60), rem = untilOpen % 60;
      msg = 'Cerrado · la plancha se enciende en ' +
        (hrs > 0 ? hrs + ' h ' + rem + ' min' : rem + ' min');
    } else {
      var d = dow, add = 0;
      do { d = (d + 1) % 7; add++; } while (OPEN_DAYS.indexOf(d) === -1);
      var when = (add === 1 ? 'mañana' : 'el ' + DAY_NAMES[d]) + ' a las 6:30 PM';
      msg = isRestDay
        ? 'La plancha está descansando · volvemos ' + when
        : 'Cerrado · abrimos ' + when;
    }

    var pill = head.querySelector('.status-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'status-pill';
      head.appendChild(pill);
    }
    pill.classList.toggle('is-open', openNow);
    pill.classList.toggle('is-warming', warming);
    pill.innerHTML = '<span class="dot"></span>' + msg;

    var todayIdx = (dow + 6) % 7; /* tarjetas ordenadas lun..dom */
    for (var i = 0; i < days.length; i++) {
      days[i].classList.toggle('today', i === todayIdx);
      days[i].classList.toggle('open-now', i === todayIdx && openNow);
      var tag = days[i].querySelector('.hoy-tag');
      if (i === todayIdx && !tag) {
        tag = document.createElement('span');
        tag.className = 'hoy-tag';
        tag.textContent = 'hoy';
        days[i].appendChild(tag);
      } else if (i !== todayIdx && tag) {
        tag.remove();
      }
    }
  }
  renderHorarios();
  setInterval(renderHorarios, 60000);

  /* Lightbox: click a burger/papas photo to see it full-size */
  var lightbox = document.getElementById('lightbox');
  if (lightbox) {
    var lbImg = lightbox.querySelector('img');
    var lbClose = lightbox.querySelector('.lightbox-close');

    var openLightbox = function (img) {
      lbImg.src = img.currentSrc || img.src;
      lbImg.alt = img.alt || '';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    };
    var closeLightbox = function () {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.burger-photo img, .item-photo img').forEach(function (img) {
      img.addEventListener('click', function () { openLightbox(img); });
    });
    lbClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }
})();
