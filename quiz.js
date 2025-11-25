/* quiz.js
   Robust modal show/hide, quiz rendering, auto-advance, auto-submit, and result panel.
*/
document.addEventListener('DOMContentLoaded', function () {
  /* Questions & scoring */
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

  // Elements (guard for missing DOM)
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

  // stop if essential elements missing
  if (!startQuizBtn || !quizModal || !optionsEl) {
    console.warn('Quiz: essential DOM elements missing; quiz will not initialize.');
    return;
  }

  /* helper to check whether any answer exists */
  function anyAnswered() {
    return answers.some(a => a !== null);
  }

  /* Render a question */
  function renderQuestion(i) {
    const item = questions[i];
    qNumber.textContent = `Question ${i+1} of ${questions.length}`;
    qText.textContent = item.q;
    hintEl.textContent = item.hint || '';

    // options
    optionsEl.innerHTML = '';
    item.opts.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option-btn';
      btn.setAttribute('role', 'button');
      btn.setAttribute('aria-pressed', answers[i] === idx ? 'true' : 'false');
      btn.textContent = optText;

      if (answers[i] === idx) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => {
        // set answer
        answers[i] = idx;
        // visual update
        Array.from(optionsEl.children).forEach(c => {
          c.classList.remove('selected');
          c.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('selected');
        btn.setAttribute('aria-pressed', 'true');

        // enable next/submission controls
        nextBtn.disabled = (i === questions.length - 1);
        submitBtn.disabled = false;

        // Auto-advance for non-last question
        if (i < questions.length - 1) {
          setTimeout(() => {
            current = i + 1;
            renderQuestion(current);
            const firstOpt = document.querySelector('#options button');
            if (firstOpt) firstOpt.focus();
          }, 420);
        } else {
          // auto-submit on last selection
          setTimeout(() => {
            submitQuiz();
          }, 600);
        }
      });

      optionsEl.appendChild(btn);
    });

    // progress bar: percent of how many questions completed (index)
    const pct = Math.round(((i) / (questions.length - 1)) * 100);
    if (progressBar) progressBar.style.width = pct + '%';

    // prev/next state
    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = true;
    if (submitBtn) submitBtn.disabled = (answers[i] === null);

    // ensure modal content in view
    qText.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  }

  /* Compute score */
  function computeScore() {
    let total = 0;
    for (let i = 0; i < questions.length; i++) {
      const a = answers[i];
      if (a === null) continue;
      total += questions[i].scores[a];
    }
    return total;
  }

  /* Level from score */
  function levelFromScore(total) {
    if (total <= 10) return 'low';
    if (total <= 20) return 'moderate';
    return 'high';
  }

  /* Submit quiz */
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

    // Meaning & recommendations
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

    // show results (hide quiz card)
    if (quizCard) quizCard.style.display = 'none';
    if (resultPanel) resultPanel.style.display = 'block';
    if (resultPanel) resultPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* Modal open/close helpers */
  function openModal() {
    // show the modal explicitly
    quizModal.hidden = false;
    quizModal.style.display = 'flex';        // important: ensure visible even if hidden attribute persisted
    // small delay so CSS transition can run
    setTimeout(() => {
      quizModal.setAttribute('data-open', 'true');
    }, 20);

    document.body.classList.add('modal-open');

    // reset state & render first question
    for (let i = 0; i < answers.length; i++) answers[i] = null;
    current = 0;
    if (quizCard) quizCard.style.display = 'block';
    if (resultPanel) resultPanel.style.display = 'none';
    if (submitBtn) submitBtn.disabled = true;
    renderQuestion(current);

    // set focus to first option after short delay
    setTimeout(() => {
      const firstOpt = document.querySelector('#options button');
      if (firstOpt) firstOpt.focus();
    }, 250);
  }

  function closeModal(confirmClose = true) {
    // prompt only when there is data to lose (answers answered)
    const shouldConfirm = confirmClose && anyAnswered();
    const doClose = shouldConfirm ? confirm('Close the quiz? Your answers will be lost.') : true;
    if (!doClose) return;

    // start hide transition
    quizModal.setAttribute('data-open', 'false');
    document.body.classList.remove('modal-open');

    // after transition remove from flow and set hidden
    setTimeout(() => {
      quizModal.style.display = 'none';
      quizModal.hidden = true;
    }, 260);
  }

  /* Event listeners */
  startQuizBtn.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    openModal();
  });

  if (closeQuizBtn) {
    closeQuizBtn.addEventListener('click', function (e) {
      e.preventDefault();
      closeModal(true);
    });
  }

  if (quizOverlay) {
    quizOverlay.addEventListener('click', function (e) {
      closeModal(true);
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && quizModal && quizModal.style.display !== 'none') {
      closeModal(true);
    }
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      if (current === 0) return;
      current--;
      renderQuestion(current);
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      if (current >= questions.length - 1) return;
      current++;
      renderQuestion(current);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', function () {
      if (!confirm('Reset all answers?')) return;
      for (let i = 0; i < answers.length; i++) answers[i] = null;
      current = 0;
      renderQuestion(current);
      if (submitBtn) submitBtn.disabled = true;
      if (resultPanel) resultPanel.style.display = 'none';
      if (quizCard) quizCard.style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', function () {
      submitQuiz();
    });
  }

  if (retakeBtn) {
    retakeBtn.addEventListener('click', function () {
      if (!confirm('Retake quiz? This will reset your answers.')) return;
      for (let i = 0; i < answers.length; i++) answers[i] = null;
      current = 0;
      renderQuestion(current);
      if (resultPanel) resultPanel.style.display = 'none';
      if (quizCard) quizCard.style.display = 'block';
      if (submitBtn) submitBtn.disabled = true;
    });
  }

  if (closeResultBtn) {
    closeResultBtn.addEventListener('click', function () {
      // close modal without extra confirm (results will be lost unless user retakes)
      closeModal(false);
    });
  }

  // Initialize progress to zero width (visual)
  if (progressBar) progressBar.style.width = '0%';
});
