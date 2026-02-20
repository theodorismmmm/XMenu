(() => {
  "use strict";

  // ── Helpers ──────────────────────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── Retrieve & validate redirect URL ─────────────────────────────────────
  function getRedirectURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("returnTo") || params.get("redirect") || params.get("url") || document.referrer || "";
    if (!raw) return null;
    try {
      const url = new URL(raw);
      // Only allow http / https redirects
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      // Prevent redirect loops - don't redirect back to security.xmenu.dev
      if (url.hostname === "security.xmenu.dev") return null;
      return url.href;
    } catch {
      return null;
    }
  }

  const REDIRECT_URL = getRedirectURL();

  // ── Math challenge data ───────────────────────────────────────────────────
  function makeMathChallenge() {
    const ops = ["+", "-", "×"];
    const op = ops[rand(0, 2)];
    let a, b, answer;
    if (op === "+") { a = rand(5, 50); b = rand(5, 50); answer = a + b; }
    else if (op === "-") { a = rand(15, 60); b = rand(1, a - 1); answer = a - b; }
    else { a = rand(2, 12); b = rand(2, 12); answer = a * b; }
    return { question: `${a} ${op} ${b} = ?`, answer: String(answer) };
  }

  // ── Reading challenge data ────────────────────────────────────────────────
  const READING_POOL = [
    {
      passage: `<strong>Internet security</strong> is the practice of protecting computers,
        networks, and data from digital attacks. Security systems use <strong>verification
        checks</strong> to confirm that visitors are real people and not automated programs
        called bots. Bots can overload servers, steal data, and spread misinformation.`,
      question: "What is the main purpose of verification checks?",
      choices: [
        "To speed up page loading",
        "To confirm visitors are real people, not bots",
        "To store user passwords securely",
        "To block all international traffic",
      ],
      correct: 1,
    },
    {
      passage: `<strong>CAPTCHA</strong> stands for "Completely Automated Public Turing
        test to tell Computers and Humans Apart." It was invented to protect websites from
        automated abuse. Modern CAPTCHAs analyze behavior, solve puzzles, or ask questions
        that are <strong>easy for humans but hard for machines</strong>.`,
      question: "What makes modern CAPTCHAs effective?",
      choices: [
        "They require a paid subscription",
        "They only work in specific browsers",
        "They are easy for humans but hard for machines",
        "They permanently block suspicious IP addresses",
      ],
      correct: 2,
    },
    {
      passage: `A <strong>DDoS attack</strong> (Distributed Denial of Service) floods a
        website with enormous amounts of traffic from thousands of infected devices,
        making the site unavailable to legitimate users. Security gateways filter this
        traffic and ensure that only <strong>genuine human visitors</strong> can access
        protected resources.`,
      question: "How does a DDoS attack affect a website?",
      choices: [
        "It improves the website's response time",
        "It permanently deletes website data",
        "It floods the site with traffic making it unavailable",
        "It changes the website's domain name",
      ],
      correct: 2,
    },
  ];

  // ── Puzzle challenge data ─────────────────────────────────────────────────
  function makePuzzleChallenge() {
    // Pick an ascending sequence, shuffle tiles; user must click them in order
    const sequences = [
      { values: [1, 2, 3, 4, 5], label: "1 → 5 in ascending order" },
      { values: [2, 4, 6, 8, 10], label: "even numbers in ascending order" },
      { values: [5, 10, 15, 20, 25], label: "multiples of 5 in ascending order" },
    ];
    const seq = sequences[rand(0, sequences.length - 1)];
    return { values: seq.values, label: seq.label, shuffled: shuffle(seq.values) };
  }

  // ── State ─────────────────────────────────────────────────────────────────
  let currentStep = 0; // 0 = math, 1 = reading, 2 = puzzle
  const TOTAL_STEPS = 3;
  let mathAnswer = "";
  let readingData = null;
  let puzzleData = null;
  let puzzleSelected = [];

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const loadingEl    = $("#loading");
  const challengesEl = $("#challenges");
  const successEl    = $("#success-screen");
  const progressFill = $(".progress-bar-fill");
  const progressLbl  = $(".progress-current");
  const stepDots     = $$(".step-dot");

  // ── Bypass ────────────────────────────────────────────────────────────────
  const BYPASS_CODE = "9128";

  function setupBypass() {
    const bypassBtn = $("#bypass-btn");
    const bypassInputArea = $("#bypass-input-area");
    const bypassCodeInput = $("#bypass-code-input");
    const bypassSubmit = $("#bypass-submit");
    const bypassError = $("#bypass-error");

    bypassBtn.addEventListener("click", () => {
      bypassInputArea.style.display = bypassInputArea.style.display === "none" ? "block" : "none";
      bypassCodeInput.value = "";
      bypassError.textContent = "";
    });

    function checkBypassCode() {
      const code = bypassCodeInput.value.trim();
      if (code === BYPASS_CODE) {
        bypassError.style.color = "var(--success)";
        bypassError.textContent = "✓ Code accepted! Redirecting...";
        setTimeout(() => {
          if (REDIRECT_URL) {
            window.location.href = REDIRECT_URL;
          } else {
            bypassError.style.color = "var(--error)";
            bypassError.textContent = "No redirect URL provided.";
          }
        }, 1000);
      } else {
        bypassError.style.color = "var(--error)";
        bypassError.textContent = "✗ Incorrect code. Try again.";
        bypassCodeInput.value = "";
      }
    }

    bypassSubmit.addEventListener("click", checkBypassCode);
    bypassCodeInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") checkBypassCode();
    });
  }

  // ── Session verification ──────────────────────────────────────────────────
  function checkExistingVerification() {
    const verified = sessionStorage.getItem("xmenu_security_verified");
    const expiry = sessionStorage.getItem("xmenu_security_expiry");

    if (verified === "true" && expiry && Date.now() < parseInt(expiry)) {
      if (REDIRECT_URL) {
        window.location.href = REDIRECT_URL;
        return true;
      }
    }
    return false;
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  function showCountdown() {
    return new Promise(resolve => {
      const loadingText = $("#loading-text");
      const countdownDisplay = $("#countdown-display");
      const countdownNumber = $("#countdown-number");
      const spinner = $(".spinner");

      spinner.style.display = "none";
      loadingText.style.display = "none";
      countdownDisplay.style.display = "block";

      let count = 10;
      countdownNumber.textContent = count;
      const interval = setInterval(() => {
        count--;
        countdownNumber.textContent = count;

        if (count <= 0) {
          clearInterval(interval);
          resolve();
        }
      }, 1000);
    });
  }

  // ── Initialise ────────────────────────────────────────────────────────────
  function init() {
    if (checkExistingVerification()) return;
    setupBypass();
    showCountdown().then(() => {
      loadingEl.style.display = "none";
      challengesEl.style.display = "block";
      buildMathChallenge();
      buildReadingChallenge();
      buildPuzzleChallenge();
      showStep(0);
    });
  }

  // ── Step management ───────────────────────────────────────────────────────
  function showStep(n) {
    currentStep = n;
    $$(".challenge").forEach((el, i) => {
      el.classList.toggle("active", i === n);
    });
    stepDots.forEach((dot, i) => {
      dot.classList.remove("active", "done");
      if (i < n)  dot.classList.add("done");
      if (i === n) dot.classList.add("active");
    });
    const pct = Math.round((n / TOTAL_STEPS) * 100);
    progressFill.style.width = pct + "%";
    progressLbl.textContent = n;
  }

  function completeStep() {
    const next = currentStep + 1;
    if (next >= TOTAL_STEPS) {
      showSuccess();
    } else {
      showStep(next);
    }
  }

  // ── Math challenge ────────────────────────────────────────────────────────
  function buildMathChallenge() {
    const data = makeMathChallenge();
    mathAnswer = data.answer;

    const panel = $("#challenge-math");
    $(".math-question", panel).textContent = data.question;

    const input    = $(".math-input", panel);
    const feedback = $(".math-feedback", panel);
    const submitBtn = $(".math-submit", panel);

    function attempt() {
      const val = input.value.trim();
      if (!val) return;
      if (val === mathAnswer) {
        feedback.textContent = "Correct!";
        feedback.className = "feedback ok";
        input.disabled = true;
        submitBtn.disabled = true;
        setTimeout(completeStep, 700);
      } else {
        feedback.textContent = "Incorrect — try again.";
        feedback.className = "feedback err";
        input.classList.add("error");
        setTimeout(() => input.classList.remove("error"), 600);
        input.value = "";
        input.focus();
      }
    }

    submitBtn.addEventListener("click", attempt);
    input.addEventListener("keydown", e => { if (e.key === "Enter") attempt(); });
  }

  // ── Reading challenge ─────────────────────────────────────────────────────
  function buildReadingChallenge() {
    readingData = READING_POOL[rand(0, READING_POOL.length - 1)];
    const panel = $("#challenge-reading");

    $(".reading-passage", panel).innerHTML = readingData.passage;
    $(".reading-question", panel).textContent = readingData.question;

    const choicesEl = $(".choices", panel);
    readingData.choices.forEach((text, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = text;
      btn.addEventListener("click", () => {
        if (btn.dataset.answered) return;
        if (idx === readingData.correct) {
          btn.classList.add("correct");
          $$(".choice-btn", panel).forEach(b => b.dataset.answered = "1");
          setTimeout(completeStep, 700);
        } else {
          btn.classList.add("wrong");
          setTimeout(() => btn.classList.remove("wrong"), 600);
        }
      });
      choicesEl.appendChild(btn);
    });
  }

  // ── Puzzle challenge ──────────────────────────────────────────────────────
  function buildPuzzleChallenge() {
    puzzleData = makePuzzleChallenge();
    puzzleSelected = [];

    const panel = $("#challenge-puzzle");
    $(".puzzle-desc", panel).textContent =
      `Click the tiles in the correct order: ${puzzleData.label}.`;

    // Sequence display slots
    const seqDisplay = $(".sequence-display", panel);
    seqDisplay.innerHTML = "";
    puzzleData.values.forEach((_, i) => {
      const slot = document.createElement("div");
      slot.className = "seq-slot";
      slot.id = `seq-slot-${i}`;
      slot.textContent = "–";
      seqDisplay.appendChild(slot);
    });

    // Tiles
    const grid = $(".puzzle-grid", panel);
    grid.innerHTML = "";
    puzzleData.shuffled.forEach(val => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = val;
      tile.dataset.value = String(val);
      tile.addEventListener("click", () => onTileClick(tile, panel));
      grid.appendChild(tile);
    });

    const feedback = $(".puzzle-feedback", panel);
    feedback.textContent = "";
  }

  function onTileClick(tile, panel) {
    if (tile.classList.contains("correct-tile") || tile.classList.contains("selected")) return;

    const val = Number(tile.dataset.value);
    const expected = puzzleData.values[puzzleSelected.length];

    if (val === expected) {
      tile.classList.add("correct-tile");
      tile.classList.remove("selected");
      puzzleSelected.push(val);

      const slot = $(`#seq-slot-${puzzleSelected.length - 1}`, panel);
      if (slot) { slot.textContent = val; slot.classList.add("filled"); }

      if (puzzleSelected.length === puzzleData.values.length) {
        $(".puzzle-feedback", panel).textContent = "Puzzle solved!";
        $(".puzzle-feedback", panel).className = "feedback ok";
        setTimeout(completeStep, 700);
      }
    } else {
      tile.classList.add("wrong-tile");
      setTimeout(() => tile.classList.remove("wrong-tile"), 500);

      // Reset selected state and display
      puzzleSelected = [];
      $$(".tile", panel).forEach(t => t.classList.remove("selected"));
      $$(".seq-slot", panel).forEach((slot, i) => {
        slot.textContent = "–";
        slot.classList.remove("filled");
      });
      $(".puzzle-feedback", panel).textContent = "Wrong order — start over.";
      $(".puzzle-feedback", panel).className = "feedback err";
    }
  }

  // ── Success / redirect ────────────────────────────────────────────────────
  function showSuccess() {
    stepDots.forEach(dot => { dot.classList.remove("active"); dot.classList.add("done"); });
    progressFill.style.width = "100%";
    progressLbl.textContent = TOTAL_STEPS;

    challengesEl.style.display = "none";
    successEl.style.display = "block";

    // Store verification for 1 hour
    sessionStorage.setItem("xmenu_security_verified", "true");
    sessionStorage.setItem("xmenu_security_expiry", (Date.now() + 3600000).toString());

    if (!REDIRECT_URL) {
      $(".redirect-note").textContent = "No redirect URL was provided.";
      return;
    }

    // Show destination domain
    try {
      const host = new URL(REDIRECT_URL).hostname;
      $(".redirect-destination").textContent = host;
    } catch {
      $(".redirect-destination").textContent = REDIRECT_URL;
    }

    // Animated progress bar then redirect
    const bar    = $(".redirect-bar-fill");
    const note   = $(".redirect-note");
    const DELAY  = 3000;
    const TICK   = 50;
    let elapsed  = 0;

    const iv = setInterval(() => {
      elapsed += TICK;
      bar.style.width = Math.min((elapsed / DELAY) * 100, 100) + "%";
      const remaining = Math.ceil((DELAY - elapsed) / 1000);
      note.textContent = `Redirecting in ${remaining}s…`;
      if (elapsed >= DELAY) {
        clearInterval(iv);
        window.location.href = REDIRECT_URL;
      }
    }, TICK);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  init();
})();
