
const game = document.getElementById("game");
const menu = document.getElementById("menu");
const startBtn = document.getElementById("startBtn");
const scoreText = document.getElementById("score");
const message = document.getElementById("message");

if (typeof THREE === "undefined") {
    message.textContent = "Internet connect karo aur page refresh karo.";
    throw new Error("Three.js load nahi hui.");
}

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, 35, 120);

const camera = new THREE.PerspectiveCamera(
    60, window.innerWidth / window.innerHeight, 0.1, 200
);
camera.position.set(0, 7, 13);
camera.lookAt(0, 0, -5);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
game.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x47613a, 2));

const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(-5, 12, 8);
sun.castShadow = true;
scene.add(sun);

// Grass
const grass = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.MeshStandardMaterial({ color: 0x3b9b45 })
);
grass.rotation.x = -Math.PI / 2;
grass.position.y = -0.12;
grass.position.z = -35;
scene.add(grass);

// Road
const road = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 160),
    new THREE.MeshStandardMaterial({ color: 0x333333 })
);
road.rotation.x = -Math.PI / 2;
road.position.z = -30;
road.position.y = 0;
scene.add(road);

// Road edges
for (const x of [-6, 6]) {
    const edge = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.08, 160),
        new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    edge.position.set(x, 0.06, -30);
    scene.add(edge);
}

// Dashed road markings
const roadLines = [];
for (const x of [-2, 2]) {
    for (let z = 35; z >= -105; z -= 8) {
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(0.12, 0.04, 3),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        line.position.set(x, 0.04, z);
        scene.add(line);
        roadLines.push(line);
    }
}

// Build a simple 3D car
function createCar(color) {
    const car = new THREE.Group();

    const body = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.55, 2.6),
        new THREE.MeshStandardMaterial({ color })
    );
    body.position.y = 0.55;
    body.castShadow = true;
    car.add(body);

    const cabin = new THREE.Mesh(
        new THREE.BoxGeometry(1.05, 0.6, 1.25),
        new THREE.MeshStandardMaterial({
            color: 0x172b3b,
            metalness: 0.25,
            roughness: 0.3
        })
    );
    cabin.position.set(0, 1.08, -0.15);
    car.add(cabin);

    for (const x of [-0.82, 0.82]) {
        for (const z of [-0.8, 0.8]) {
            const wheel = new THREE.Mesh(
                new THREE.BoxGeometry(0.25, 0.4, 0.55),
                new THREE.MeshStandardMaterial({ color: 0x111111 })
            );
            wheel.position.set(x, 0.3, z);
            car.add(wheel);
        }
    }

    return car;
}

const player = createCar(0xff2020);
player.position.set(0, 0, 5);
scene.add(player);

// Enemy cars
const enemies = [];
const enemyColors = [0x1769ff, 0xffd000, 0xffffff];

for (let i = 0; i < 3; i++) {
    const enemy = createCar(enemyColors[i]);
    enemy.position.set([-4, 0, 4][i], 0, -25 - i * 28);
    scene.add(enemy);
    enemies.push(enemy);
}

let running = false;
let score = 0;
let speed = 0.35;
let lastTime = 0;
const keys = {};

function resetGame() {
    score = 0;
    speed = 0.35;
    player.position.x = 0;

    enemies.forEach((enemy, i) => {
        enemy.position.x = [-4, 0, 4][i];
        enemy.position.z = -25 - i * 28;
    });

    scoreText.textContent = "Score: 0";
    message.textContent = "Use LEFT / RIGHT arrow keys";
}

startBtn.addEventListener("click", () => {
    resetGame();
    running = true;
    menu.style.display = "none";
});

window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "ArrowRight", " "].includes(event.key)) {
        event.preventDefault();
    }
    keys[event.key] = true;
});

window.addEventListener("keyup", (event) => {
    keys[event.key] = false;
});

function endGame() {
    running = false;
    menu.style.display = "flex";
    startBtn.textContent = "PLAY AGAIN";
    document.querySelector("#menu h1").textContent = "GAME OVER";
    document.querySelector("#menu p").textContent =
        "Your Score: " + score;
}

function animate(time) {
    requestAnimationFrame(animate);

    const delta = lastTime
        ? Math.min((time - lastTime) / 16.67, 2)
        : 1;
    lastTime = time;

    if (running) {
        if (keys.ArrowLeft || keys.a || keys.A) {
            player.position.x -= 0.13 * delta;
        }

        if (keys.ArrowRight || keys.d || keys.D) {
            player.position.x += 0.13 * delta;
        }

        player.position.x = THREE.MathUtils.clamp(
            player.position.x, -4.8, 4.8
        );

        // Move road markings towards the player
        roadLines.forEach((line) => {
            line.position.z += speed * delta;
            if (line.position.z > 12) {
                line.position.z -= 144;
            }
        });

        // Move enemy cars
        enemies.forEach((enemy) => {
            enemy.position.z += speed * delta;

            if (enemy.position.z > 10) {
                enemy.position.z = -90;
                enemy.position.x =
                    [-4, 0, 4][Math.floor(Math.random() * 3)];
                score++;
                speed = Math.min(0.35 + score * 0.008, 0.85);
                scoreText.textContent = "Score: " + score;
            }

            const closeX =
                Math.abs(player.position.x - enemy.position.x) < 1.35;
            const closeZ =
                Math.abs(player.position.z - enemy.position.z) < 2.25;

            if (closeX && closeZ) {
                endGame();
            }
        });
    }

    renderer.render(scene, camera);
}

window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate(0);
