(function () {
    "use strict";

    /* ========================================
       Constants
       ======================================== */
    const EMOJIS = ["😺", "🦝", "🦊", "🐶", "🐵", "🦁", "🐰", "🐮", "🐻", "🐼"];

    const SIZES = {
        "4x4": { cols: 4, rows: 4, pairs: 8 },
        "4x3": { cols: 4, rows: 3, pairs: 6 },
        "5x4": { cols: 5, rows: 4, pairs: 10 },
    };

    const STAR_THRESHOLDS = [
        { maxMoves: 10, stars: 3 },
        { maxMoves: 16, stars: 2 },
        { maxMoves: Infinity, stars: 1 },
    ];

    const STORAGE_KEY = "memoryGameRecords";

    /* ========================================
       State
       ======================================== */
    let currentSize = "4x4";
    let openCards = [];
    let matchedPairs = 0;
    let totalPairs = 8;
    let moves = 0;
    let timerInterval = null;
    let seconds = 0;
    let gameStarted = false;
    let locked = false;

    /* ========================================
       Audio
       ======================================== */
    let audioCtx = null;
    let soundEnabled = true;

    function getAudioCtx() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioCtx;
    }

    function playTone(freq, duration, type, volume) {
        if (!soundEnabled) return;
        try {
            const ctx = getAudioCtx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = type || "sine";
            osc.frequency.value = freq;
            gain.gain.value = volume || 0.08;
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
        } catch (e) { /* silent */ }
    }

    function playFlipSound() { playTone(800, 0.1, "sine", 0.06); }
    function playMatchSound() { playTone(523, 0.15, "sine", 0.08); setTimeout(() => playTone(659, 0.15, "sine", 0.08), 100); setTimeout(() => playTone(784, 0.2, "sine", 0.08), 200); }
    function playMismatchSound() { playTone(200, 0.15, "square", 0.04); setTimeout(() => playTone(180, 0.2, "square", 0.04), 120); }
    function playWinSound() { [523, 587, 659, 698, 784, 880, 988, 1047].forEach((f, i) => setTimeout(() => playTone(f, 0.2, "sine", 0.06), i * 80)); }

    /* ========================================
       DOM References
       ======================================== */
    const gameEl = document.getElementById("game");
    const movesEl = document.getElementById("moves");
    const timerEl = document.getElementById("timer");
    const pairsEl = document.getElementById("pairs");
    const resetBtn = document.getElementById("reset-btn");
    const modalOverlay = document.getElementById("modal-overlay");
    const finalMovesEl = document.getElementById("final-moves");
    const finalTimeEl = document.getElementById("final-time");
    const modalStarsEl = document.getElementById("modal-stars");
    const modalRecordEl = document.getElementById("modal-record");
    const playAgainBtn = document.getElementById("play-again-btn");
    const shareBtn = document.getElementById("share-btn");
    const difficultyBtns = document.querySelectorAll(".difficulty-btn");
    const difficultySlider = document.getElementById("difficulty-slider");
    const difficultyOptions = document.getElementById("difficulty-options");
    const progressFill = document.getElementById("progress-fill");
    const progressPct = document.getElementById("progress-pct");
    const confettiContainer = document.getElementById("confetti-container");
    const toastEl = document.getElementById("toast");

    /* ========================================
       Utils
       ======================================== */
    function shuffleFisherYates(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    function formatTime(totalSeconds) {
        const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
        const s = String(totalSeconds % 60).padStart(2, "0");
        return `${m}:${s}`;
    }

    function tickAnimate(el) {
        el.classList.remove("tick");
        void el.offsetWidth;
        el.classList.add("tick");
    }

    /* ========================================
       Timer
       ======================================== */
    function startTimer() {
        if (timerInterval) return;
        timerInterval = setInterval(function () {
            seconds++;
            timerEl.textContent = formatTime(seconds);
            updateTimerPill();
        }, 1000);
    }

    function stopTimer() {
        clearInterval(timerInterval);
        timerInterval = null;
    }

    function resetTimer() {
        stopTimer();
        seconds = 0;
        timerEl.textContent = "00:00";
        updateTimerPill();
    }

    function updateTimerPill() {
        const timerStat = timerEl.closest(".stat--timer");
        timerStat.classList.remove("warning", "danger");
        if (seconds >= 60) {
            timerStat.classList.add("danger");
        } else if (seconds >= 30) {
            timerStat.classList.add("warning");
        }
    }

    /* ========================================
       Stats & Progress
       ======================================== */
    function updateStats() {
        tickAnimate(movesEl);
        movesEl.textContent = moves;
        pairsEl.textContent = `${matchedPairs}/${totalPairs}`;
        updateProgress();
    }

    function updateProgress() {
        const pct = totalPairs > 0 ? Math.round((matchedPairs / totalPairs) * 100) : 0;
        progressFill.style.width = pct + "%";
        progressFill.dataset.progress = pct;
        progressPct.textContent = pct + "%";
        if (pct > 0 && pct < 100) {
            progressFill.classList.add("animating");
        } else {
            progressFill.classList.remove("animating");
        }
    }

    function calculateStars() {
        for (const threshold of STAR_THRESHOLDS) {
            if (moves <= threshold.maxMoves) {
                return threshold.stars;
            }
        }
        return 1;
    }

    function renderStars(count) {
        modalStarsEl.innerHTML = "";
        for (let i = 0; i < 3; i++) {
            const span = document.createElement("span");
            span.className = "modal-star" + (i < count ? " earned" : "");
            span.textContent = "⭐";
            span.setAttribute("aria-hidden", "true");
            modalStarsEl.appendChild(span);
        }
    }

    /* ========================================
       Records (localStorage)
       ======================================== */
    function getRecords() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        } catch {
            return {};
        }
    }

    function saveRecord(size, time, movesCount) {
        const records = getRecords();
        const key = size;
        const prev = records[key];
        let isNew = false;
        if (!prev || movesCount < prev.moves || (movesCount === prev.moves && time < prev.time)) {
            records[key] = { time, moves: movesCount };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
            isNew = true;
        }
        return isNew;
    }

    /* ========================================
       Confetti
       ======================================== */
    function launchConfetti() {
        confettiContainer.innerHTML = "";
        for (let i = 0; i < 50; i++) {
            const piece = document.createElement("div");
            piece.className = "confetti";
            piece.style.left = Math.random() * 100 + "%";
            piece.style.animationDuration = (2 + Math.random() * 2) + "s";
            piece.style.animationDelay = Math.random() * 0.8 + "s";
            piece.style.width = (6 + Math.random() * 8) + "px";
            piece.style.height = (6 + Math.random() * 8) + "px";
            confettiContainer.appendChild(piece);
        }
        setTimeout(function () {
            confettiContainer.innerHTML = "";
        }, 5000);
    }

    function clearConfetti() {
        confettiContainer.innerHTML = "";
    }

    /* ========================================
       Toast
       ======================================== */
    let toastTimeout = null;
    function showToast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.add("visible");
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(function () {
            toastEl.classList.remove("visible");
        }, 2500);
    }

    /* ========================================
       Modal
       ======================================== */
    function showModal() {
        stopTimer();
        finalMovesEl.textContent = moves;
        finalTimeEl.textContent = formatTime(seconds);
        renderStars(calculateStars());

        const isNewRecord = saveRecord(currentSize, seconds, moves);
        if (isNewRecord) {
            modalRecordEl.classList.add("visible");
        } else {
            modalRecordEl.classList.remove("visible");
        }

        modalOverlay.hidden = false;
        requestAnimationFrame(function () {
            modalOverlay.classList.add("visible");
        });
        playWinSound();
        launchConfetti();
        playAgainBtn.focus();
    }

    function hideModal() {
        modalOverlay.classList.remove("visible");
        clearConfetti();
        setTimeout(function () {
            modalOverlay.hidden = true;
        }, 350);
    }

    /* ========================================
       Share
       ======================================== */
    function shareResult() {
        const stars = calculateStars();
        const starText = "⭐".repeat(stars) + "☆".repeat(3 - stars);
        const text = `🃏 Jogo da Memória\n${starText}\n🎯 ${moves} jogadas | ⏱️ ${formatTime(seconds)}\n📊 Dificuldade: ${currentSize}`;

        if (navigator.share) {
            navigator.share({ title: "Jogo da Memória", text: text }).catch(function () {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () {
                showToast("Resultado copiado!");
            }).catch(function () {
                showToast("Não foi possível copiar");
            });
        } else {
            showToast("Compartilhamento não disponível");
        }
    }

    /* ========================================
       Ripple Effect
       ======================================== */
    function createRipple(e, el) {
        const rect = el.getBoundingClientRect();
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + "px";
        ripple.style.left = (e.clientX - rect.left - size / 2) + "px";
        ripple.style.top = (e.clientY - rect.top - size / 2) + "px";
        el.appendChild(ripple);
        setTimeout(function () { ripple.remove(); }, 600);
    }

    /* ========================================
       Tilt 3D Effect
       ======================================== */
    function initTilt(card) {
        card.addEventListener("mousemove", function (e) {
            if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -12;
            const rotateY = ((x - centerX) / centerX) * 12;
            card.querySelector(".card-inner").style.transform =
                `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener("mouseleave", function () {
            if (card.classList.contains("flipped") || card.classList.contains("matched")) return;
            card.querySelector(".card-inner").style.transform = "";
        });
    }

    /* ========================================
       Card Logic
       ======================================== */
    function createCard(emoji, index) {
        const card = document.createElement("div");
        card.className = "card";
        card.setAttribute("role", "gridcell");
        card.setAttribute("tabindex", "0");
        card.setAttribute("aria-label", `Carta ${index + 1}, oculta`);
        card.dataset.emoji = emoji;

        const inner = document.createElement("div");
        inner.className = "card-inner";

        const back = document.createElement("div");
        back.className = "card-back";

        const front = document.createElement("div");
        front.className = "card-front";

        const emojiSpan = document.createElement("span");
        emojiSpan.className = "card-emoji";
        emojiSpan.textContent = emoji;
        front.appendChild(emojiSpan);

        inner.appendChild(back);
        inner.appendChild(front);
        card.appendChild(inner);

        card.addEventListener("click", function (e) {
            createRipple(e, card);
            handleCardClick(card);
        });

        card.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(card);
            }
        });

        initTilt(card);

        return card;
    }

    function handleCardClick(card) {
        if (locked) return;
        if (card.classList.contains("flipped")) return;
        if (card.classList.contains("matched")) return;

        if (!gameStarted) {
            gameStarted = true;
            startTimer();
        }

        playFlipSound();
        card.querySelector(".card-inner").style.transform = "";
        card.classList.add("flipped");
        card.setAttribute("aria-label", `Carta, ${card.dataset.emoji}`);
        openCards.push(card);

        if (openCards.length === 2) {
            moves++;
            updateStats();
            checkMatch();
        }
    }

    function checkMatch() {
        locked = true;
        const [card1, card2] = openCards;

        if (card1.dataset.emoji === card2.dataset.emoji) {
            setTimeout(function () {
                playMatchSound();
                card1.classList.add("matched");
                card2.classList.add("matched");
                card1.setAttribute("aria-label", `Carta, ${card1.dataset.emoji}, encontrada`);
                card2.setAttribute("aria-label", `Carta, ${card2.dataset.emoji}, encontrada`);
                matchedPairs++;
                updateStats();
                openCards = [];
                locked = false;

                if (matchedPairs === totalPairs) {
                    setTimeout(showModal, 600);
                }
            }, 300);
        } else {
            setTimeout(function () {
                playMismatchSound();
                card1.classList.add("shake");
                card2.classList.add("shake");

                setTimeout(function () {
                    card1.classList.remove("flipped", "shake");
                    card2.classList.remove("flipped", "shake");
                    card1.querySelector(".card-inner").style.transform = "";
                    card2.querySelector(".card-inner").style.transform = "";
                    card1.setAttribute("aria-label", "Carta, oculta");
                    card2.setAttribute("aria-label", "Carta, oculta");
                    openCards = [];
                    locked = false;
                }, 400);
            }, 700);
        }
    }

    /* ========================================
       Difficulty Slider
       ======================================== */
    function updateSlider() {
        const activeBtn = document.querySelector(".difficulty-btn.active");
        if (!activeBtn || !difficultyOptions) return;
        const btnRect = activeBtn.getBoundingClientRect();
        const parentRect = difficultyOptions.getBoundingClientRect();
        difficultySlider.style.width = btnRect.width + "px";
        difficultySlider.style.left = (btnRect.left - parentRect.left) + "px";
    }

    /* ========================================
       Board
       ======================================== */
    function buildBoard() {
        const config = SIZES[currentSize];
        totalPairs = config.pairs;
        matchedPairs = 0;
        moves = 0;
        openCards = [];
        gameStarted = false;
        locked = false;
        resetTimer();
        updateStats();

        gameEl.classList.add("transitioning");

        setTimeout(function () {
            gameEl.innerHTML = "";
            gameEl.dataset.size = currentSize;

            const selectedEmojis = EMOJIS.slice(0, totalPairs);
            const deck = shuffleFisherYates([...selectedEmojis, ...selectedEmojis]);
            const fragment = document.createDocumentFragment();

            deck.forEach(function (emoji, i) {
                fragment.appendChild(createCard(emoji, i));
            });

            gameEl.appendChild(fragment);
            gameEl.classList.remove("transitioning");
        }, 300);
    }

    /* ========================================
       Event Listeners
       ======================================== */
    resetBtn.addEventListener("click", function (e) {
        createRipple(e, resetBtn);
        buildBoard();
    });

    playAgainBtn.addEventListener("click", function (e) {
        createRipple(e, playAgainBtn);
        hideModal();
        setTimeout(buildBoard, 350);
    });

    shareBtn.addEventListener("click", function (e) {
        createRipple(e, shareBtn);
        shareResult();
    });

    modalOverlay.addEventListener("click", function (e) {
        if (e.target === modalOverlay) {
            hideModal();
            setTimeout(buildBoard, 350);
        }
    });

    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && !modalOverlay.hidden) {
            hideModal();
            setTimeout(buildBoard, 350);
        }
    });

    difficultyBtns.forEach(function (btn) {
        btn.addEventListener("click", function (e) {
            createRipple(e, btn);
            if (btn.classList.contains("active")) return;

            difficultyBtns.forEach(function (b) {
                b.classList.remove("active");
                b.setAttribute("aria-pressed", "false");
            });

            btn.classList.add("active");
            btn.setAttribute("aria-pressed", "true");
            currentSize = btn.dataset.size;
            updateSlider();
            buildBoard();
        });
    });

    window.addEventListener("resize", updateSlider);

    /* ========================================
       Init
       ======================================== */
    updateSlider();
    buildBoard();
})();
