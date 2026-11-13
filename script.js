
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const welcomeScreen = document.getElementById("welcomeScreen");
const gameScreen = document.getElementById("gameScreen");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const resumeBtn = document.getElementById("resumeBtn");
const restartBtn = document.getElementById("restartBtn");
const playAgainBtn = document.getElementById("playAgainBtn");

const pauseScreen = document.getElementById("pauseScreen");
const gameOverScreen = document.getElementById("gameOverScreen");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const livesDisplay = document.getElementById("lives");
const finalScore = document.getElementById("finalScore");
const newRecord = document.getElementById("newRecord");
const welcomeBest = document.getElementById("welcomeBest");

const characterImage = new Image();
characterImage.src = "assets/character.png";

const backgroundImage = new Image();
backgroundImage.src = "assets/space-background.png";

let score = 0;
let lives = 3;
let timeLeft = 45;
let bestScore = Number(localStorage.getItem("starBest")) || 0;

let player = { x: 450, y: 0, width: 76, height: 76 };
let objects = [];
let particles = [];

let keys = {};
let running = false;
let paused = false;
let lastTime = 0;
let spawnTimer = 0;
let elapsed = 0;
let animationId;

const W = 900;
const H = 495;

welcomeBest.textContent = bestScore.toString().padStart(3, "0");

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const dpr = Math.min(
        window.devicePixelRatio || 1,
        window.innerWidth < 600 ? 1.25 : 2
    );

    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);

    ctx.setTransform(
        canvas.width / W,
        0,
        0,
        canvas.height / H,
        0,
        0
    );
}

window.addEventListener("resize", resizeCanvas);

function startGame() {
    cancelAnimationFrame(animationId);

    score = 0;
    lives = 3;
    timeLeft = 45;
    objects = [];
    particles = [];
    spawnTimer = 0;
    elapsed = 0;

    player.x = W / 2;
    player.y = H - 100;

    running = true;
    paused = false;

    welcomeScreen.classList.add("hidden");
    gameOverScreen.classList.add("hidden");
    pauseScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");

    resizeCanvas();
    updateHUD();

    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

function updateHUD() {
    scoreDisplay.textContent = score.toString().padStart(3, "0");
    timerDisplay.textContent = Math.ceil(timeLeft);
    livesDisplay.textContent = "♥ ".repeat(lives).trim();
}

function spawnObject() {
    const roll = Math.random();

    let type = "star";

    if (roll < 0.23) {
        type = "rock";
    } else if (roll > 0.88) {
        type = "special";
    }

    objects.push({
        x: 35 + Math.random() * (W - 70),
        y: -35,
        size: type === "rock" ? 29 : 25,
        speed: 150 + Math.random() * 100 + (45 - timeLeft) * 2,
        type: type,
        rotation: Math.random() * 6
    });
}

function drawBackground() {
    if (backgroundImage.complete && backgroundImage.naturalWidth > 0) {
        const scale = Math.max(
            W / backgroundImage.naturalWidth,
            H / backgroundImage.naturalHeight
        );

        const width = backgroundImage.naturalWidth * scale;
        const height = backgroundImage.naturalHeight * scale;

        ctx.drawImage(
            backgroundImage,
            (W - width) / 2,
            (H - height) / 2,
            width,
            height
        );
    } else {
        ctx.fillStyle = "#111632";
        ctx.fillRect(0, 0, W, H);
    }
}

function drawObjects() {
    objects.forEach(obj => {
        ctx.save();
        ctx.translate(obj.x, obj.y);
        ctx.rotate(obj.rotation);

        if (obj.type === "rock") {
            ctx.font = "30px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🪨", 0, 0);
        } else if (obj.type === "special") {
            ctx.shadowColor = "#ffe69a";
            ctx.shadowBlur = 20;
            ctx.font = "34px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("🌟", 0, 0);
        } else {
            ctx.shadowColor = "#fff0a6";
            ctx.shadowBlur = 14;
            ctx.font = "29px serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("⭐", 0, 0);
        }

        ctx.restore();
    });
}

function drawPlayer() {
    if (characterImage.complete && characterImage.naturalWidth > 0) {
        ctx.drawImage(
            characterImage,
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 9; i++) {
        particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            life: 0.6,
            color
        });
    }
}

function drawParticles(delta) {
    particles.forEach(p => {
        p.x += p.vx * delta;
        p.y += p.vy * delta;
        p.life -= delta;

        ctx.globalAlpha = Math.max(0, p.life / 0.6);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    });

    ctx.globalAlpha = 1;
    particles = particles.filter(p => p.life > 0);
}

function update(delta) {
    elapsed += delta;
    timeLeft -= delta;

    if (timeLeft <= 0) {
        timeLeft = 0;
        updateHUD();
        endGame();
        return;
    }

    const moveSpeed = 430;

    if (keys["ArrowLeft"] || keys["a"]) player.x -= moveSpeed * delta;
    if (keys["ArrowRight"] || keys["d"]) player.x += moveSpeed * delta;

    player.x = Math.max(45, Math.min(W - 45, player.x));

    spawnTimer += delta;

    const spawnRate = Math.max(0.38, 0.85 - elapsed * 0.008);

    if (spawnTimer >= spawnRate) {
        spawnObject();
        spawnTimer = 0;
    }

    objects.forEach(obj => {
        obj.y += obj.speed * delta;
        obj.rotation += delta * 0.7;

        const dx = obj.x - player.x;
        const dy = obj.y - player.y;

        if (Math.sqrt(dx * dx + dy * dy) < 48) {
            obj.collected = true;

            if (obj.type === "rock") {
                lives--;
                createParticles(obj.x, obj.y, "#ff9cae");

                if (lives <= 0) {
                    lives = 0;
                    updateHUD();
                    endGame();
                    return;
                }
            } else {
                score += obj.type === "special" ? 30 : 10;
                createParticles(obj.x, obj.y, "#ffe69a");
            }
        }
    });

    objects = objects.filter(obj => !obj.collected && obj.y < H + 50);

    updateHUD();
}

function draw() {
    drawBackground();
    drawObjects();
    drawPlayer();
    drawParticles(0);
}

function gameLoop(timestamp) {
    if (!running || paused) return;

    const delta = Math.min((timestamp - lastTime) / 1000, 0.04);
    lastTime = timestamp;

    update(delta);

    if (!running) return;

    draw();
    animationId = requestAnimationFrame(gameLoop);
}

function endGame() {
    running = false;
    cancelAnimationFrame(animationId);

    finalScore.textContent = score;

    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem("starBest", bestScore);
        welcomeBest.textContent = bestScore.toString().padStart(3, "0");
        newRecord.textContent = "✨ A NEW PERSONAL BEST! ✨";
    } else {
        newRecord.textContent = "Your personal best: " + bestScore;
    }

    gameOverScreen.classList.remove("hidden");
}

function togglePause() {
    if (!running) return;

    paused = !paused;

    if (paused) {
        pauseScreen.classList.remove("hidden");
        pauseBtn.textContent = "▶";
    } else {
        pauseScreen.classList.add("hidden");
        pauseBtn.textContent = "Ⅱ";
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

startBtn.addEventListener("click", startGame);
playAgainBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);
pauseBtn.addEventListener("click", togglePause);
resumeBtn.addEventListener("click", togglePause);

window.addEventListener("keydown", e => {
    keys[e.key] = true;

    if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", e => {
    keys[e.key] = false;
});

function movePlayer(e) {
    if (!running || paused) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;

    player.x = (e.clientX - rect.left) * scaleX;
    player.x = Math.max(45, Math.min(W - 45, player.x));
}

canvas.addEventListener("pointermove", movePlayer);

resizeCanvas();
draw();
