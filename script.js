// script.js
// Consolidated site JS: nav, search, cart, favorites, image viewer, quiz, etc.
// All logic runs after DOMContentLoaded to avoid null errors.

document.addEventListener('DOMContentLoaded', () => {

  /* ===========================
     NAV / TOGGLES / UI
     =========================== */
  const navbar = document.querySelector('.navbar');
  const searchForm = document.querySelector('.search-form');
  const cartItem = document.querySelector('.cart-items-container');
  const searchBtn = document.querySelector('#search-btn');
  const cartBtn = document.querySelector('#cart-btn');
  const menuBtn = document.querySelector('#menu-btn');

  function closeAllToggles(...elements) {
    elements.forEach(el => { if (el) el.classList.remove('active'); });
  }
  function closeOtherToggles(...elements) {
    elements.forEach(el => { if (el) el.classList.remove('active'); });
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      if (navbar) navbar.classList.toggle('active');
      closeOtherToggles(searchForm, cartItem);
    });
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      if (searchForm) searchForm.classList.toggle('active');
      closeOtherToggles(navbar, cartItem);
    });
  }

  if (cartBtn) {
    cartBtn.addEventListener('click', () => {
      if (cartItem) cartItem.classList.toggle('active');
      closeOtherToggles(navbar, searchForm);
    });
  }

  window.addEventListener('scroll', () => closeAllToggles(navbar, searchForm, cartItem));

  document.addEventListener('click', (e) => {
    if (cartItem && !cartItem.contains(e.target) && !e.target.closest('#cart-btn')) cartItem.classList.remove('active');
    if (searchForm && !searchForm.contains(e.target) && !e.target.closest('#search-btn')) searchForm.classList.remove('active');
  });



  /* ===========================
     HELPER: changeMainImage
     =========================== */
  window.changeMainImage = function changeMainImage(mainPhotoId, newSrc) {
    const mainPhoto = document.getElementById(mainPhotoId);
    if (mainPhoto) mainPhoto.src = newSrc;
  };


  /* ===========================
     NAV TO COLLECTION (hash)
     =========================== */
  window.goToCollection = function goToCollection(itemId) {
    window.location.href = `collection.html#${itemId}`;
  };

  (function handleHashScroll() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const target = document.querySelector(`[data-item="${hash}"]`);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }
  })();


  /* ===========================
     BLOGS: toggleContent
     =========================== */
  window.toggleContent = function toggleContent(button) {
    const shortContent = button.previousElementSibling?.previousElementSibling;
    const fullContent = button.previousElementSibling;
    if (!shortContent || !fullContent) return;

    if (fullContent.style.display === "none") {
      fullContent.style.display = "block";
      shortContent.style.display = "none";
      button.textContent = "read less";
    } else {
      fullContent.style.display = "none";
      shortContent.style.display = "block";
      button.textContent = "read more";
    }
  };




  /* ===========================
     IMAGE VIEWER MODULE
     =========================== */
  (function imageViewerModule() {
    const viewer = document.getElementById('image-viewer');
    if (!viewer) return;

    const viewerImg = document.getElementById('viewer-img');
    const viewerBody = document.getElementById('viewer-body');
    const viewerBack = document.getElementById('viewer-back');
    const downloadBtn = document.getElementById('download-btn');
    const zoomRange = document.getElementById('zoom-range');
    const viewerCaption = document.getElementById('viewer-caption');

    let scale = 1;
    let translateX = 0, translateY = 0;
    let pointerDown = false;
    let pointerStart = { x: 0, y: 0 };
    let isPanning = false;
    let lastTouchDist = null;
    let lastTap = 0;
    let startX = 0, startY = 0;

    function applyTransform() {
      if (viewerImg) viewerImg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function setScale(newScale) {
      newScale = Math.max(1, Math.min(3, newScale));
      scale = newScale;
      if (zoomRange) zoomRange.value = scale;
      if (scale === 1) { translateX = 0; translateY = 0; }
      applyTransform();
    }

    function openViewer(src, alt) {
      viewerImg.src = src;
      viewerImg.alt = alt || '';
      viewerCaption.textContent = alt || '';
      viewer.setAttribute('aria-hidden', 'false');
      viewer.classList.add('open');

      scale = 1; translateX = 0; translateY = 0;
      if (zoomRange) zoomRange.value = 1;
      applyTransform();

      const filename = (new URL(src, location.href)).pathname.split('/').pop() || 'infographic.png';
      if (downloadBtn) {
        downloadBtn.href = src;
        downloadBtn.setAttribute('download', filename);
      }

      setTimeout(() => viewerBody?.focus(), 100);
    }

    function closeViewer() {
      viewer.classList.remove('open');
      viewer.setAttribute('aria-hidden', 'true');
      viewerImg.src = '';
      scale = 1; translateX = 0; translateY = 0;
    }

    viewerBody?.addEventListener('wheel', (e) => {
      if (!viewer.classList.contains('open')) return;
      e.preventDefault();
      const delta = -e.deltaY;
      const zoomAmount = delta > 0 ? 0.06 : -0.06;
      setScale(scale + zoomAmount);
    }, { passive: false });

    zoomRange?.addEventListener('input', (e) => setScale(parseFloat(e.target.value)));

    viewerBody?.addEventListener('pointerdown', (e) => {
      if (scale <= 1) return;
      pointerDown = true;
      viewerBody.setPointerCapture?.(e.pointerId);
      pointerStart.x = e.clientX - translateX;
      pointerStart.y = e.clientY - translateY;
    });

    viewerBody?.addEventListener('pointermove', (e) => {
      if (!pointerDown) return;
      translateX = e.clientX - pointerStart.x;
      translateY = e.clientY - pointerStart.y;
      applyTransform();
    });

    viewerBody?.addEventListener('pointerup', (e) => {
      pointerDown = false;
      try { viewerBody.releasePointerCapture?.(e.pointerId); } catch {}
    });
    viewerBody?.addEventListener('pointercancel', () => pointerDown = false);

    viewerBody?.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastTouchDist = getDistance(e.touches[0], e.touches[1]);
        isPanning = false;
      } else if (e.touches.length === 1 && scale > 1) {
        isPanning = true;
        startX = e.touches[0].clientX - translateX;
        startY = e.touches[0].clientY - translateY;
      }
    }, { passive: false });

    viewerBody?.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        if (lastTouchDist) {
          const diff = dist - lastTouchDist;
          const factor = diff / 200;
          setScale(scale + factor);
        }
        lastTouchDist = dist;
      } else if (e.touches.length === 1 && isPanning && scale > 1) {
        e.preventDefault();
        translateX = e.touches[0].clientX - startX;
        translateY = e.touches[0].clientY - startY;
        applyTransform();
      }
    }, { passive: false });

    viewerBody?.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) lastTouchDist = null;
      if (e.touches.length === 0) isPanning = false;

      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        if (scale === 1) setScale(2);
        else setScale(1);
      }
      lastTap = currentTime;
    });

    function getDistance(a, b) {
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      return Math.hypot(dx, dy);
    }

    viewerBody?.addEventListener('dblclick', () => {
      if (scale === 1) setScale(2);
      else setScale(1);
    });

    viewerImg?.addEventListener('dragstart', (e) => e.preventDefault());

    document.querySelectorAll('.infographic-img').forEach(img => {
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', () => openViewer(img.src, img.alt || ''));
    });

    viewerBack?.addEventListener('click', closeViewer);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && viewer.classList.contains('open')) closeViewer();
      if ((e.key === '+' || e.key === '=') && viewer.classList.contains('open')) setScale(scale + 0.1);
      if (e.key === '-' && viewer.classList.contains('open')) setScale(scale - 0.1);
    });

    viewer.addEventListener('click', (e) => {
      if (e.target === viewer || e.target === viewerCaption) closeViewer();
    });

  })(); // end imageViewerModule


  /* ===========================
     QUIZ MODULE (merged from quiz.js)
     =========================== */
  (function quizModule() {
    // Questions & scoring
    const questions = [
      { q: 'How much time do you spend on social media daily?', opts: ['Less than 1 hour','1–2 hours','3–4 hours','5 hours or more'], scores: [0,1,2,3] },
      { q: 'How often do you interact with sponsored content (ads, promos, influencer posts)?', opts: ['Never','Rarely','Sometimes','Often/Always'], scores: [0,1,2,3] },
      { q: 'Which platform most influences your browsing and purchases?', opts: ['None / Others','Facebook','Instagram','TikTok'], scores: [0,1,2,3] },
      { q: 'After repeatedly seeing a product on your feed, how likely are you to check it?', opts: ['Not likely','Sometimes','Usually I check','Almost always'], scores:[0,1,2,3] },
      { q: 'Do you tend to buy items after interacting (clicking, sharing) with brand posts?', opts:['Never','Rarely','Sometimes','Often'], scores:[0,1,2,3] },
      { q: 'How often do you purchase items you did not plan to buy after seeing them on social media?', opts:['Never','Rarely','Sometimes','Very often'], scores:[0,1,2,3] },
      { q: 'How much has social media increased your spending on online shopping?', opts:['Not at all','A little','Moderately','A lot/Significantly'], scores:[0,1,2,3] },
      { q: 'Which product type do you most often buy because of social media?', opts:['I do not buy because of social media','Food/beverages','Clothing/fashion','Gadgets/accessories'], scores:[0,1,2,3] },
      { q: 'How often do reviews, ratings, or influencer recommendations affect your decision?', opts:['Never','Rarely','Sometimes','Very often'], scores:[0,1,2,3] },
      { q: 'When stressed or bored, how often do you browse social media/shops which leads to shopping?', opts:['Never','Rarely','Sometimes','Very often'], scores:[0,1,2,3] }
    ];

    // State
    let current = 0;
    const answers = Array(questions.length).fill(null);

    // Elements (guard)
    const startQuizBtn = document.getElementById('startQuizBtn');
    const quizModal = document.getElementById('quizModal');
    const quizOverlay = document.getElementById('quizOverlay');
    const closeQuizBtn = document.getElementById('closeQuizBtn');

    const qNumber = document.getElementById('qNumber');
    const qText = document.getElementById('qText');
    const optionsEl = document.getElementById('options');
    const hintEl = document.getElementById('hint');
    const progressBar = document.getElementById('progressBar');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    const resetBtn = document.getElementById('resetBtn');
    const quizCard = document.getElementById('quizCard');
    const resultPanel = document.getElementById('resultPanel');
    const scoreVal = document.getElementById('scoreVal');
    const levelBadge = document.getElementById('levelBadge');
    const meaningEl = document.getElementById('meaning');
    const recsEl = document.getElementById('recommendations');
    const retakeBtn = document.getElementById('retakeBtn');
    const closeResultBtn = document.getElementById('closeResultBtn');

    if (!quizModal || !optionsEl) {
      // Quiz UI not present on this page
      // But we still attach delegated listener so clicking '#startQuizBtn' (if present) will attempt to open the modal when DOM exists.
      // Return since nothing else to initialize.
      document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('#startQuizBtn');
        if (btn) {
          // Try to find modal again (in case DOM was modified)
          const modalCheck = document.getElementById('quizModal');
          if (modalCheck) {
            // If modal exists now, reload page to get full initialization (simple fallback)
            console.warn('Quiz modal found late — please reload or ensure script is included after quiz markup.');
            modalCheck.style.display = 'flex';
            modalCheck.hidden = false;
          } else {
            console.warn('Quiz: quiz modal not present in DOM.');
          }
        }
      });
      return;
    }

    function anyAnswered() {
      return answers.some(a => a !== null);
    }

    function renderQuestion(i) {
      const item = questions[i];
      if (qNumber) qNumber.textContent = `Question ${i+1} of ${questions.length}`;
      if (qText) qText.textContent = item.q;
      if (hintEl) hintEl.textContent = item.hint || '';

      // options
      optionsEl.innerHTML = '';
      item.opts.forEach((optText, idx) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'option-btn';
        btn.setAttribute('role', 'button');
        btn.setAttribute('aria-pressed', answers[i] === idx ? 'true' : 'false');
        btn.textContent = optText;

        if (answers[i] === idx) btn.classList.add('selected');

        btn.addEventListener('click', () => {
          answers[i] = idx;
          Array.from(optionsEl.children).forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
          });
          btn.classList.add('selected');
          btn.setAttribute('aria-pressed', 'true');

          if (nextBtn) nextBtn.disabled = (i === questions.length - 1);
          if (submitBtn) submitBtn.disabled = false;

          if (i < questions.length - 1) {
            setTimeout(() => {
              current = i + 1;
              renderQuestion(current);
              const firstOpt = document.querySelector('#options button');
              if (firstOpt) firstOpt.focus();
            }, 420);
          } else {
            setTimeout(() => submitQuiz(), 600);
          }
        });

        optionsEl.appendChild(btn);
      });

      const pct = Math.round(((i) / (questions.length - 1)) * 100);
      if (progressBar) progressBar.style.width = pct + '%';

      if (prevBtn) prevBtn.disabled = i === 0;
      if (nextBtn) nextBtn.disabled = true;
      if (submitBtn) submitBtn.disabled = (answers[i] === null);

      qText?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }

    function computeScore() {
      let total = 0;
      for (let i = 0; i < questions.length; i++) {
        const a = answers[i];
        if (a === null) continue;
        total += questions[i].scores[a];
      }
      return total;
    }

    function levelFromScore(total) {
      if (total <= 10) return 'low';
      if (total <= 20) return 'moderate';
      return 'high';
    }

    function submitQuiz() {
      const any = anyAnswered();
      if (!any) {
        if (!confirm('You have not answered any questions. Submit anyway?')) return;
      }

      const total = computeScore();
      if (scoreVal) scoreVal.textContent = total;

      const level = levelFromScore(total);
      if (levelBadge) {
        levelBadge.className = 'level ' + (level === 'low' ? 'level-low' : level === 'moderate' ? 'level-mod' : 'level-high');
        levelBadge.textContent = level === 'low' ? 'Low Influence' : level === 'moderate' ? 'Moderate Influence' : 'High Influence';
      }

      let meaning = '';
      let recs = [];
      if (level === 'low') {
        meaning = 'You show low susceptibility to algorithm-driven persuasion. You browse but rarely make impulsive purchases due to social media.';
        recs = [
          'Keep checking reviews & compare prices before buying.',
          'Maintain awareness of emotional triggers that can lead to impulse buys.',
          'Consider setting small budgets for discretionary online spending.'
        ];
      } else if (level === 'moderate') {
        meaning = 'You are moderately influenced by social media algorithms and trends. You sometimes make purchases after exposure to ads or influencer posts.';
        recs = [
          'Wait 24 hours before buying viral items to avoid impulse purchases.',
          'Follow creators who provide objective, evidence-based reviews.',
          'Use a wishlist-first approach — move to cart only after reflection.'
        ];
      } else {
        meaning = 'You are highly influenced by algorithmic content — frequent exposure correlates with higher purchasing behavior.';
        recs = [
          'Turn off ad personalization or limit ad tracking in your settings.',
          'Unfollow or mute accounts that trigger impulse buying.',
          'Set a weekly spending cap and use a wishlist-first, buy-later rule.',
          'Ask: "Did I find this, or did the algorithm find me?" before purchasing.'
        ];
      }

      if (meaningEl) meaningEl.textContent = meaning;
      if (recsEl) {
        recsEl.innerHTML = '';
        recs.forEach(r => {
          const li = document.createElement('li');
          li.textContent = r;
          recsEl.appendChild(li);
        });
      }

      if (quizCard) quizCard.style.display = 'none';
      if (resultPanel) resultPanel.style.display = 'block';
      resultPanel?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function openModal() {
      quizModal.hidden = false;
      quizModal.style.display = 'flex';
      setTimeout(() => quizModal.setAttribute('data-open', 'true'), 20);
      document.body.classList.add('modal-open');

      for (let i = 0; i < answers.length; i++) answers[i] = null;
      current = 0;
      if (quizCard) quizCard.style.display = 'block';
      if (resultPanel) resultPanel.style.display = 'none';
      if (submitBtn) submitBtn.disabled = true;
      renderQuestion(current);

      setTimeout(() => {
        const firstOpt = document.querySelector('#options button');
        if (firstOpt) firstOpt.focus();
      }, 250);
    }

    function closeModal(confirmClose = true) {
      const shouldConfirm = confirmClose && anyAnswered();
      const doClose = shouldConfirm ? confirm('Close the quiz? Your answers will be lost.') : true;
      if (!doClose) return;

      quizModal.setAttribute('data-open', 'false');
      document.body.classList.remove('modal-open');

      setTimeout(() => {
        quizModal.style.display = 'none';
        quizModal.hidden = true;
      }, 260);
    }

    // Robust start handler: delegated so clicks still work if button is covered/replaced
    document.addEventListener('click', (e) => {
      const btn = e.target.closest && e.target.closest('#startQuizBtn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        openModal();
      }
    });

    closeQuizBtn?.addEventListener('click', function (e) {
      e.preventDefault();
      closeModal(true);
    });

    quizOverlay?.addEventListener('click', function () {
      closeModal(true);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && quizModal && quizModal.style.display !== 'none') {
        closeModal(true);
      }
    });

    prevBtn?.addEventListener('click', function () {
      if (current === 0) return;
      current--;
      renderQuestion(current);
    });

    nextBtn?.addEventListener('click', function () {
      if (current >= questions.length - 1) return;
      current++;
      renderQuestion(current);
    });

    resetBtn?.addEventListener('click', function () {
      if (!confirm('Reset all answers?')) return;
      for (let i = 0; i < answers.length; i++) answers[i] = null;
      current = 0;
      renderQuestion(current);
      if (submitBtn) submitBtn.disabled = true;
      if (resultPanel) resultPanel.style.display = 'none';
      if (quizCard) quizCard.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    submitBtn?.addEventListener('click', function () {
      submitQuiz();
    });

    retakeBtn?.addEventListener('click', function () {
      if (!confirm('Retake quiz? This will reset your answers.')) return;
      for (let i = 0; i < answers.length; i++) answers[i] = null;
      current = 0;
      renderQuestion(current);
      if (resultPanel) resultPanel.style.display = 'none';
      if (quizCard) quizCard.style.display = 'block';
      if (submitBtn) submitBtn.disabled = true;
    });

    closeResultBtn?.addEventListener('click', function () {
      closeModal(false);
    });

    if (progressBar) progressBar.style.width = '0%';

  })(); // end quizModule

}); // end DOMContentLoaded