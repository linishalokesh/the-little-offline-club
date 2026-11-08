
const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen = document.getElementById("gameScreen");
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");


const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");

const pauseOverlay = document.getElementById("pauseOverlay");
const gameOverOverlay = document.getElementById("gameOverOverlay");

const scoreDisplay = document.getElementById("score");
const livesDisplay = document.getElementById("lives");
const timerDisplay = document.getElementById("timer");
const finalScore = document.getElementById("finalScore");
const bestScoreDisplay = document.getElementById("bestScore");
const resultMessage = document.getElementById("resultMessage");

const W = canvas.width;
const H = canvas.height;

let player;
let objects = [];
let score = 0;
let lives = 3;
let timeLeft = 45;
let running = false;
let paused = false;
let lastTime = 0;
let spawnTimer = 0;
let elapsed = 0;
let animationId = null;

let keys = {};
let bestScore = Number(localStorage.getItem("littleClubBest") || 0);

function createPlayer() {
    return {
        x: W / 2,
        y: H - 65,
        width: 55,
        height: 55,
        speed: 360
    };
}

function startGame() {
    cancelAnimationFrame(animationId);

    welcomeScreen.hidden = true;
    gameScreen.hidden = false;
    pauseOverlay.hidden = true;
    gameOverOverlay.hidden = true;

    score = 0;
    lives = 3;
    timeLeft = 45;
    elapsed = 0;
    spawnTimer = 0;
    objects = [];
    keys = {};

    player = createPlayer();

    running = true;
    paused = false;

    updateStats();

    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function updateStats() {
    scoreDisplay.textContent = score;
    livesDisplay.textContent = "♡".repeat(lives) || "0";
    timerDisplay.textContent = Math.ceil(timeLeft);
    bestScoreDisplay.textContent = bestScore;
}

function spawnObject() {
    const isCloud = Math.random() < 0.25;

    objects.push({
        x: 35 + Math.random() * (W - 70),
        y: -35,
        radius: isCloud ? 23 : 16,
        speed: 150 + Math.random() * 100 + (45 - timeLeft) * 2,
        type: isCloud ? "cloud" : "star",
        rotation: Math.random() * Math.PI
    });
}

function drawBackground() {
    const gradient = ctx.createLinearGradient(0, 0, 0, H);
    gradient.addColorStop(0, "#dfe7ff");
    gradient.addColorStop(1, "#fce5f2");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#ffffff88";

    for (let i = 0; i < 18; i++) {
        const x = (i * 113 + 37) % W;
        const y = (i * 79 + 25) % H;

        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.font = "35px Arial";
    ctx.fillText("☁", 70, 100);
    ctx.fillText("☁", 660, 160);
    ctx.fillText("☾", 690, 70);
}

function drawPlayer() {
    ctx.font = "53px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", player.x, player.y);
}

function drawObjects() {
    objects.forEach(obj => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);

        ctx.font = obj.type === "star" ? "32px Arial" : "39px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.fillText(
            obj.type === "star" ? "⭐" : "☁️",
            0,
            0
        );

        ctx.restore();
    });
}

function update(delta) {
    if (keys["ArrowLeft"] || keys["a"] || keys["A"]) {
        player.x -= player.speed * delta;
    }

    if (keys["ArrowRight"] || keys["d"] || keys["D"]) {
        player.x += player.speed * delta;
    }

    player.x = Math.max(30, Math.min(W - 30, player.x));

    spawnTimer += delta;

    const spawnInterval = Math.max(0.35, 0.8 - (45 - timeLeft) * 0.007);

    if (spawnTimer >= spawnInterval) {
        spawnObject();
        spawnTimer = 0;
    }

    objects.forEach(obj => {
        obj.y += obj.speed * delta;
        obj.rotation += delta * 0.5;
    });

    objects = objects.filter(obj => {
        const dx = obj.x - player.x;
        const dy = obj.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < obj.radius + 22) {
            if (obj.type === "star") {
                score += 10;
            } else {
                lives--;
            }

            updateStats();
            return false;
        }

        return obj.y < H + 40;
    });

    timeLeft -= delta;

    if (timeLeft <= 0 || lives <= 0) {
        endGame();
    }

    updateStats();
}

function draw() {
    drawBackground();
    drawObjects();
    drawPlayer();
}

function gameLoop(timestamp) {
    if (!running || paused) return;

    const delta = Math.min((timestamp - lastTime) / 1000, 0.05);
    lastTime = timestamp;

    elapsed += delta;
    update(delta);
    draw();

    if (running && !paused) {
        animationId = requestAnimationFrame(gameLoop);
    }
}

function endGame() {
    running = false;
    paused = false;

    cancelAnimationFrame(animationId);

    const isNewRecord = score > bestScore;

    if (isNewRecord) {
        bestScore = score;
        localStorage.setItem("littleClubBest", bestScore);
    }
    bestScoreDisplay.textContent = bestScore;

    finalScore.textContent = score;

    resultMessage.textContent = isNewRecord
        ? "🌟 A new personal best! You're magical!"
        : score >= 100
        ? "You're a little star-catching superstar!"
        : "Every little star counts. Try again!";

    gameOverOverlay.hidden = false;
}

function pauseGame() {
    if (!running || paused) return;

    paused = true;
    pauseOverlay.hidden = false;
    cancelAnimationFrame(animationId);
}

function resumeGame() {
    if (!running || !paused) return;

    paused = false;
    pauseOverlay.hidden = true;
    lastTime = performance.now();

    animationId = requestAnimationFrame(gameLoop);
}

function movePlayer(event) {
    if (!running || paused) return;

    const rect = canvas.getBoundingClientRect();
    const scale = W / rect.width;

    player.x = Math.max(
        30,
        Math.min(W - 30, (event.clientX - rect.left) * scale)
    );
}

startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", pauseGame);
resumeBtn.addEventListener("click", resumeGame);

window.addEventListener("keydown", event => {
    keys[event.key] = true;

    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
    }
});

window.addEventListener("keyup", event => {
    keys[event.key] = false;
});

canvas.addEventListener("pointerdown", event => {
    if (running && !paused) {
        canvas.setPointerCapture(event.pointerId);
        movePlayer(event);
    }
});

canvas.addEventListener("pointermove", event => {
    if (event.buttons > 0 && running && !paused) {
        movePlayer(event);
    }
});

window.addEventListener("blur", () => {
    keys = {};

    if (running && !paused) {
        pauseGame();
    }
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden && running && !paused) {
        pauseGame();
    }
});

drawBackground();

let installPrompt;

const installBtn = document.getElementById("installBtn");

window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    installBtn.hidden = false;
});

installBtn.addEventListener("click", async () => {
    if (!installPrompt) return;

    installPrompt.prompt();

    await installPrompt.userChoice;

    installPrompt = null;
    installBtn.hidden = true;
});

window.addEventListener("appinstalled", () => {
    installBtn.hidden = true;
});

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("./service-worker.js")
            .catch(error => {
                console.error("Offline setup failed:", error);
            });
    });
}
