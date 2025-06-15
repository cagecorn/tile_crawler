import { MapManager } from './src/map.js';

window.onload = function() {
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const mapManager = new MapManager();

    const gameState = {
        player: {
            x: mapManager.tileSize * 1.5,
            y: mapManager.tileSize * 1.5,
            width: mapManager.tileSize / 2,
            height: mapManager.tileSize / 2,
            color: 'blue',
            speed: 5
        },
        camera: { x: 0, y: 0 }
    };

    function render() {
        const camera = gameState.camera;
        const player = gameState.player;
        let targetCameraX = player.x - canvas.width / 2;
        let targetCameraY = player.y - canvas.height / 2;
        const mapPixelWidth = mapManager.width * mapManager.tileSize;
        const mapPixelHeight = mapManager.height * mapManager.tileSize;
        camera.x = Math.max(0, Math.min(targetCameraX, mapPixelWidth - canvas.width));
        camera.y = Math.max(0, Math.min(targetCameraY, mapPixelHeight - canvas.height));
        ctx.save();
        ctx.translate(-camera.x, -camera.y);
        mapManager.render(ctx);
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
        ctx.restore();
    }

    const keysPressed = {};
    document.addEventListener('keydown', (event) => { keysPressed[event.key] = true; });
    document.addEventListener('keyup', (event) => { delete keysPressed[event.key]; });

    function update() {
        const player = gameState.player;
        let moveX = 0;
        let moveY = 0;
        if ('ArrowUp' in keysPressed) moveY -= player.speed;
        if ('ArrowDown' in keysPressed) moveY += player.speed;
        if ('ArrowLeft' in keysPressed) moveX -= player.speed;
        if ('ArrowRight' in keysPressed) moveX += player.speed;

        if (moveX !== 0) {
            const newX = player.x + moveX;
            if (!isColliding(newX, player.y, player.width, player.height)) {
                player.x = newX;
            }
        }

        if (moveY !== 0) {
            const newY = player.y + moveY;
            if (!isColliding(player.x, newY, player.width, player.height)) {
                player.y = newY;
            }
        }
    }

    function isColliding(x, y, width, height) {
        if (mapManager.isWallAt(x, y) ||
            mapManager.isWallAt(x + width, y) ||
            mapManager.isWallAt(x, y + height) ||
            mapManager.isWallAt(x + width, y + height)) {
            return true;
        }

        for (const monster of mapManager.monsters) {
            if (x < monster.x + monster.width &&
                x + width > monster.x &&
                y < monster.y + monster.height &&
                y + height > monster.y) {
                return true;
            }
        }
        return false;
    }

    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    gameLoop();
};
