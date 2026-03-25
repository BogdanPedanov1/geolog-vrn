/* ============================================================
   ГЕОЛОГ — Main JS
   Scroll reveals, quiz, accordion, progress, form
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initScrollReveal();
  initProgress();
  initAccordion();
  initCaseCards();
  initQuiz();
  initForm();
  initFieldNoteDrag();
});

/* --- SCROLL REVEAL (Intersection Observer) --- */
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => observer.observe(el));
}

/* --- PROGRESS INDICATOR --- */
function initProgress() {
  const dots = document.querySelectorAll('.progress-bar__dot');
  const screens = document.querySelectorAll('.screen[data-screen]');
  if (!dots.length || !screens.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = parseInt(entry.target.dataset.screen) - 1;
        dots.forEach((dot, i) => {
          dot.classList.remove('is-active', 'is-past');
          if (i < idx) dot.classList.add('is-past');
          if (i === idx) dot.classList.add('is-active');
        });
      }
    });
  }, { threshold: 0.4 });

  screens.forEach(s => observer.observe(s));
}

/* --- ACCORDION --- */
function initAccordion() {
  document.querySelectorAll('.accordion__trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion__item');
      item.classList.toggle('is-open');

      const content = item.querySelector('.accordion__content');
      const expanded = item.classList.contains('is-open');
      trigger.setAttribute('aria-expanded', expanded);
      content.setAttribute('aria-hidden', !expanded);
    });
  });
}

/* --- FLIP CARDS --- */
function initCaseCards() {
  document.querySelectorAll('.flip-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.toggle('is-flipped');
    });
  });
}

/* --- QUIZ --- */
function initQuiz() {
  const quiz = document.querySelector('.quiz');
  if (!quiz) return;

  const steps = quiz.querySelectorAll('.quiz__step');
  const progressSteps = quiz.querySelectorAll('.quiz__progress-step');
  const result = quiz.querySelector('.quiz__result');
  let current = 0;
  const answers = {};

  // Pricing logic
  const pricing = {
    'snt':    { base: 80000,  days_min: 45,  days_max: 90,  steps: 4 },
    'enterprise': { base: 180000, days_min: 60,  days_max: 120, steps: 5 },
    'farm':   { base: 85000,  days_min: 45,  days_max: 90,  steps: 4 }
  };

  quiz.addEventListener('click', (e) => {
    const option = e.target.closest('.quiz__option');
    if (!option) return;

    // Deselect siblings
    const siblings = option.parentElement.querySelectorAll('.quiz__option');
    siblings.forEach(s => s.classList.remove('is-selected'));
    option.classList.add('is-selected');

    // Store answer
    const stepEl = option.closest('.quiz__step');
    const qIndex = stepEl.dataset.step;
    answers[qIndex] = option.dataset.value;

    // Advance after short delay
    setTimeout(() => {
      if (current < steps.length - 1) {
        steps[current].classList.remove('is-active');
        progressSteps[current].classList.remove('is-current');
        progressSteps[current].classList.add('is-done');
        current++;
        steps[current].classList.add('is-active');
        progressSteps[current].classList.add('is-current');
      } else {
        // Show result
        steps[current].classList.remove('is-active');
        progressSteps[current].classList.remove('is-current');
        progressSteps[current].classList.add('is-done');
        showResult(answers, result);
      }
    }, 300);
  });

  function showResult(ans, resultEl) {
    const type = ans['1'] || 'snt';
    const p = pricing[type] || pricing.snt;

    let priceMultiplier = 1;
    if (ans['3'] === 'no') priceMultiplier += 0.1; // No passport = extra work
    if (ans['4'] === 'urgent') priceMultiplier += 0.15; // Urgency premium

    const price = Math.round(p.base * priceMultiplier / 1000) * 1000;
    const daysMin = ans['4'] === 'urgent' ? Math.round(p.days_min * 0.8) : p.days_min;
    const daysMax = ans['4'] === 'planned' ? p.days_max : Math.round(p.days_max * 0.9);

    const summary = resultEl.querySelector('.quiz__result-summary');
    summary.textContent = `Ваш маршрут: ${p.steps} шага — ${daysMin}–${daysMax} дней — от ${price.toLocaleString('ru-RU')} руб.`;

    resultEl.classList.add('is-active');
  }
}

/* --- FIELD NOTE DRAG & DROP --- */
function initFieldNoteDrag() {
  const notes = document.querySelectorAll('.field-note');
  if (!notes.length) return;

  notes.forEach((note, i) => {
    // Restore saved position
    const saved = localStorage.getItem('fn-pos-' + i);
    if (saved) {
      const pos = JSON.parse(saved);
      note.style.left = pos.left + 'px';
      note.style.top = pos.top + 'px';
      note.style.right = 'auto';
      note.style.bottom = 'auto';
    }

    let isDragging = false;
    let startX, startY, noteStartX, noteStartY;

    function getPos(e) {
      if (e.touches) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function onStart(e) {
      isDragging = true;
      note.classList.add('is-dragging');
      const p = getPos(e);
      startX = p.x;
      startY = p.y;

      const rect = note.getBoundingClientRect();
      const parentRect = note.parentElement.getBoundingClientRect();
      noteStartX = rect.left - parentRect.left;
      noteStartY = rect.top - parentRect.top;

      // Switch to left/top positioning
      note.style.left = noteStartX + 'px';
      note.style.top = noteStartY + 'px';
      note.style.right = 'auto';
      note.style.bottom = 'auto';

      if (e.type === 'mousedown') e.preventDefault();
    }

    function onMove(e) {
      if (!isDragging) return;
      const p = getPos(e);
      const dx = p.x - startX;
      const dy = p.y - startY;
      note.style.left = (noteStartX + dx) + 'px';
      note.style.top = (noteStartY + dy) + 'px';
      if (e.type === 'touchmove') e.preventDefault();
    }

    function onEnd() {
      if (!isDragging) return;
      isDragging = false;
      note.classList.remove('is-dragging');
      // Save position
      localStorage.setItem('fn-pos-' + i, JSON.stringify({
        left: parseInt(note.style.left),
        top: parseInt(note.style.top)
      }));
    }

    note.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    note.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  });
}

/* --- FORM --- */
function initForm() {
  const form = document.querySelector('.form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value.trim();
    const phone = form.querySelector('[name="phone"]').value.trim();
    const successMsg = form.querySelector('.form__message--success');
    const errorMsg = form.querySelector('.form__message--error');

    // Hide prev messages
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';

    if (!phone) {
      errorMsg.style.display = 'block';
      return;
    }

    // Simulate success (replace with real endpoint)
    const btn = form.querySelector('.btn');
    btn.textContent = 'Отправляем...';
    btn.disabled = true;

    setTimeout(() => {
      successMsg.style.display = 'block';
      btn.textContent = 'Отправлено';
    }, 800);
  });
}
