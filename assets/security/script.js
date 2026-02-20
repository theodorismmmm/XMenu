(() => {
  "use strict";

  // ── Helpers ──────────────────────────────────────────────────────────────
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  // ── Redirect URL ──────────────────────────────────────────────────────────
  function getRedirectURL() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("returnTo") || params.get("redirect") || params.get("url") || document.referrer || "";
    if (!raw) return null;
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") return null;
      // Prevent redirect loops back to this page
      if (url.hostname === window.location.hostname && url.pathname === window.location.pathname) return null;
      return url.href;
    } catch {
      return null;
    }
  }

  const REDIRECT_URL = getRedirectURL();

  // ── 10 German questions ───────────────────────────────────────────────────
  const QUESTIONS = [
    {
      text: "Was ist 7 + 8?",
      choices: ["13", "14", "15", "16"],
      correct: 2
    },
    {
      text: "Was ist die Hauptstadt von Deutschland?",
      choices: ["München", "Hamburg", "Frankfurt", "Berlin"],
      correct: 3
    },
    {
      text: "Wie viele Jahreszeiten hat ein Jahr?",
      choices: ["2", "3", "4", "5"],
      correct: 2
    },
    {
      text: "Was ist 6 × 7?",
      choices: ["36", "40", "42", "48"],
      correct: 2
    },
    {
      text: "Welcher Planet ist der größte in unserem Sonnensystem?",
      choices: ["Saturn", "Mars", "Jupiter", "Neptun"],
      correct: 2
    },
    {
      text: "Was ist 15 − 8?",
      choices: ["5", "6", "7", "9"],
      correct: 2
    },
    {
      text: "Wie viele Monate hat ein Jahr?",
      choices: ["10", "11", "12", "13"],
      correct: 2
    },
    {
      text: "Was ist 4 × 9?",
      choices: ["32", "34", "36", "38"],
      correct: 2
    },
    {
      text: "Wie viele Seiten hat ein Quadrat?",
      choices: ["3", "4", "5", "6"],
      correct: 1
    },
    {
      text: "Was ist 100 ÷ 4?",
      choices: ["20", "24", "25", "28"],
      correct: 2
    }
  ];

  const TOTAL     = QUESTIONS.length; // 10
  const MAX_WRONG = 3; // consistency threshold – reset after this many wrong answers

  // ── State ─────────────────────────────────────────────────────────────────
  let currentQuestion = 0;
  let wrongAnswers    = 0;

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const loadingEl        = $("#loading");
  const challengesEl     = $("#challenges");
  const successEl        = $("#success-screen");
  const progressFill     = $(".progress-bar-fill");
  const progressLbl      = $(".progress-current");
  const questionLabel    = $("#question-label");
  const questionText     = $("#question-text");
  const questionChoices  = $("#question-choices");
  const questionFeedback = $("#question-feedback");

  // ── Session verification ──────────────────────────────────────────────────
  function checkExistingVerification() {
    try {
      const verified = localStorage.getItem("xmenu_security_verified");
      const expiry   = parseInt(localStorage.getItem("xmenu_security_expiry") || "0");
      if (verified === "true" && Date.now() < expiry && REDIRECT_URL) {
        window.location.href = REDIRECT_URL;
        return true;
      }
    } catch (e) { /* storage unavailable */ }
    return false;
  }

  // ── Countdown ─────────────────────────────────────────────────────────────
  function showCountdown() {
    return new Promise(resolve => {
      const loadingText   = $("#loading-text");
      const countdownDisp = $("#countdown-display");
      const countdownNum  = $("#countdown-number");
      const spinner       = $(".spinner");

      spinner.style.display    = "none";
      loadingText.style.display = "none";
      countdownDisp.style.display = "block";

      let count = 10;
      countdownNum.textContent = count;

      const interval = setInterval(() => {
        count--;
        countdownNum.textContent = count;
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
    showCountdown().then(() => {
      loadingEl.style.display  = "none";
      challengesEl.style.display = "block";
      showQuestion(0);
    });
  }

  // ── Progress ──────────────────────────────────────────────────────────────
  function updateProgress(n) {
    const pct = Math.round((n / TOTAL) * 100);
    progressFill.style.width = pct + "%";
    progressLbl.textContent  = n;
  }

  // ── Show question ─────────────────────────────────────────────────────────
  function showQuestion(n) {
    currentQuestion = n;
    updateProgress(n);

    const q = QUESTIONS[n];
    questionLabel.textContent  = `Frage ${n + 1} von ${TOTAL}`;
    questionText.textContent   = q.text;
    questionFeedback.textContent = "";
    questionFeedback.className = "feedback";

    questionChoices.innerHTML = "";
    q.choices.forEach((choice, idx) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = choice;
      btn.addEventListener("click", () => onAnswer(idx, btn));
      questionChoices.appendChild(btn);
    });
  }

  // ── Answer handler ────────────────────────────────────────────────────────
  function onAnswer(idx, btn) {
    // Disable all buttons while processing
    $$(".choice-btn").forEach(b => { b.style.pointerEvents = "none"; });

    const q = QUESTIONS[currentQuestion];

    if (idx === q.correct) {
      btn.classList.add("correct");
      questionFeedback.textContent = "Richtig!";
      questionFeedback.className   = "feedback ok";
      setTimeout(() => {
        const next = currentQuestion + 1;
        if (next >= TOTAL) {
          showSuccess();
        } else {
          showQuestion(next);
        }
      }, 700);
    } else {
      btn.classList.add("wrong");
      wrongAnswers++;

      if (wrongAnswers >= MAX_WRONG) {
        questionFeedback.textContent = `Zu viele Fehler (${MAX_WRONG}) – Prüfung wird zurückgesetzt.`;
        questionFeedback.className   = "feedback err";
        setTimeout(() => {
          wrongAnswers = 0;
          showQuestion(0);
        }, 1200);
      } else {
        const remaining = MAX_WRONG - wrongAnswers;
        questionFeedback.textContent = `Falsch – versuche es erneut. (${remaining} Versuch${remaining === 1 ? "" : "e"} verbleibend)`;
        questionFeedback.className   = "feedback err";
        setTimeout(() => {
          // Re-enable buttons and clear wrong highlight so user can retry
          $$(".choice-btn").forEach(b => {
            b.style.pointerEvents = "";
            b.classList.remove("wrong");
          });
          questionFeedback.textContent = "";
          questionFeedback.className   = "feedback";
        }, 900);
      }
    }
  }

  // ── Success / redirect ────────────────────────────────────────────────────
  function showSuccess() {
    updateProgress(TOTAL);
    challengesEl.style.display = "none";
    successEl.style.display    = "block";

    // Store verification for 24 hours
    try {
      const expiry = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem("xmenu_security_verified", "true");
      localStorage.setItem("xmenu_security_expiry",   expiry.toString());
    } catch (e) { /* storage unavailable */ }

    if (!REDIRECT_URL) {
      $(".redirect-note").textContent = "Keine Weiterleitungs-URL angegeben.";
      return;
    }

    try {
      $(".redirect-destination").textContent = new URL(REDIRECT_URL).hostname;
    } catch {
      $(".redirect-destination").textContent = REDIRECT_URL;
    }

    const bar    = $(".redirect-bar-fill");
    const note   = $(".redirect-note");
    const DELAY  = 3000;
    const TICK   = 50;
    let elapsed  = 0;

    const iv = setInterval(() => {
      elapsed += TICK;
      bar.style.width = Math.min((elapsed / DELAY) * 100, 100) + "%";
      const remaining = Math.ceil((DELAY - elapsed) / 1000);
      note.textContent = `Weiterleitung in ${remaining}s…`;
      if (elapsed >= DELAY) {
        clearInterval(iv);
        window.location.href = REDIRECT_URL;
      }
    }, TICK);
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  init();
})();
