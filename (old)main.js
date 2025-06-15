// main.js

import { assetLoader, renderGame, updateTileSize, TILE_SIZE } from './canvasRenderer.js';
// 게임 로직과 UI 헬퍼를 초기화합니다.
import './src/mechanics.js';
import './src/ui.js';

const {
    gameState, startGame, processTurn, movePlayer,
    skill1Action, skill2Action, meleeAttackAction, rangedAction, healAction,
    recallMercenaries, pickUpAction,
    findPath, autoMoveStep,
    saveGame, loadGame,
    showMonsterDetails, showMercenaryDetails,
    updateStats, updateInventoryDisplay, updateMercenaryDisplay,
    updateSkillDisplay, updateMaterialsDisplay
} = window;

// --- UI 요소 가져오기 ---
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
// 이미지 스무딩(안티에일리어싱) 기능을 끕니다.
ctx.imageSmoothingEnabled = false;
let gameImages = {};

const modalOverlay = document.getElementById('modal-overlay');
const menuButtons = document.querySelectorAll('.menu-btn');
const closeButtons = document.querySelectorAll('.close-btn');

// --- [추가] 캔버스 크기 조절 함수 ---
function resizeCanvas() {
    // 게임의 내부 해상도를 고정합니다. 16:9 비율의 해상도를 추천합니다.
    const internalWidth = 480;
    const internalHeight = 270;

    // 캔버스의 실제 해상도를 이 값으로 고정합니다.
    canvas.width = internalWidth;
    canvas.height = internalHeight;

    // 이전에 적용했을 수 있는 모든 변환(transform)을 초기화합니다.
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // 이미지 스무딩은 계속 비활성화 상태를 유지합니다.
    ctx.imageSmoothingEnabled = false;

    // CSS가 캔버스를 화면에 맞게 확대/축소하므로, 타일 크기는 내부 해상도 기준으로 계산합니다.
    updateTileSize();

    // 리사이즈 후 즉시 다시 그려서 빈 화면이 보이지 않게 합니다.
    if (window.isGameReady) {
        renderGame(canvas, ctx, gameImages, gameState);
    }
}

// 브라우저 창 크기가 바뀔 때마다 캔버스 크기도 자동으로 조절합니다.
window.addEventListener('resize', resizeCanvas);


// --- 모달 제어 함수 ---
function hideAllModals() {
    modalOverlay.classList.add('hidden');
    document.querySelectorAll('.modal-panel').forEach(p => p.classList.remove('active'));
    gameState.gameRunning = true;
}

function showModal(panelId) {
    hideAllModals();
    gameState.gameRunning = false;
    
    // 각 패널에 맞는 UI 업데이트 함수 호출
    if(panelId === 'stats-panel') updateStats();
    if(panelId === 'inventory-panel') updateInventoryDisplay();
    if(panelId === 'mercenary-panel') updateMercenaryDisplay();
    if(panelId === 'skills-panel') updateSkillDisplay();
    if(panelId === 'materials-panel') updateMaterialsDisplay();

    modalOverlay.classList.remove('hidden');
    document.getElementById(panelId).classList.add('active');
}


// --- 이벤트 리스너 설정 ---
menuButtons.forEach(button => {
    button.addEventListener('click', () => {
        const panelId = button.dataset.panelId;
        showModal(panelId);
    });
});

closeButtons.forEach(button => {
    button.addEventListener('click', hideAllModals);
});

// `game-options-panel` 내부 버튼 이벤트 리스너들
document.getElementById('save-game').addEventListener('click', saveGame);
document.getElementById('load-game').addEventListener('click', () => {
    loadGame();
    hideAllModals();
});
document.getElementById('new-game').addEventListener('click', () => {
    if (confirm('새 게임을 시작하시겠습니까? 현재 진행상황은 사라집니다.')) {
        location.reload();
    }
});


// --- 메인 게임 루프 ---
function gameLoop() {
    renderGame(canvas, ctx, gameImages, gameState);
    requestAnimationFrame(gameLoop);
}


// --- [전체 교체] 게임 시작점 및 이벤트 리스너 설정 ---
window.isGameReady = false;
window.onload = () => {
    resizeCanvas();

    assetLoader.load((loadedImages) => {
        gameImages = loadedImages;
        console.log("모든 이미지 로딩 완료!");

        startGame();

        window.isGameReady = true;
        gameLoop();

        // --- 1. 키보드 입력 처리 ---
        document.addEventListener('keydown', (e) => {
            // 모달창이 열려 있을 때는 게임 입력을 받지 않습니다.
            if (!gameState.gameRunning) return;

            e.preventDefault(); // 페이지 스크롤 등 브라우저 기본 동작 방지
            switch (e.key.toLowerCase()) { // toLowerCase()로 대소문자 모두 처리
                // 이동
                case 'arrowup': movePlayer(0, -1); break;
                case 'arrowdown': movePlayer(0, 1); break;
                case 'arrowleft': movePlayer(-1, 0); break;
                case 'arrowright': movePlayer(1, 0); break;

                // 액션
                case 'f':
                case 'z':
                    meleeAttackAction();
                    break;
                case 'x':
                    skill1Action();
                    break;
                case 'c':
                    skill2Action();
                    break;
                case 'v':
                    rangedAction();
                    break;
                case 'a':
                    recallMercenaries();
                    break;
                case 'b':
                    pickUpAction();
                    break;
            }
        });

        // --- 2. 마우스 클릭 처리 ---
        canvas.addEventListener('click', (event) => {
            if (!gameState.gameRunning) return;

            // 2.1. 화면 좌표를 게임 맵 좌표로 변환
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            const mouseX = (event.clientX - rect.left) * scaleX;
            const mouseY = (event.clientY - rect.top) * scaleY;

            const startX = Math.floor(gameState.player.x - (canvas.width / TILE_SIZE / 2));
            const startY = Math.floor(gameState.player.y - (canvas.height / TILE_SIZE / 2));

            const mapX = Math.floor(mouseX / TILE_SIZE) + startX;
            const mapY = Math.floor(mouseY / TILE_SIZE) + startY;

            // 2.2. 클릭된 위치에 있는 유닛 확인
            const clickedMonster = gameState.monsters.find(m => m.x === mapX && m.y === mapY);
            if (clickedMonster) {
                showMonsterDetails(clickedMonster); // 몬스터 정보창 표시
                return;
            }

            const clickedMerc = gameState.activeMercenaries.find(m => m.x === mapX && m.y === mapY && m.alive);
            if (clickedMerc) {
                showMercenaryDetails(clickedMerc); // 용병 정보창 표시
                return;
            }

            // 2.3. 빈 공간 클릭 시 자동 이동
            const path = findPath(gameState.player.x, gameState.player.y, mapX, mapY);
            if (path && path.length > 1) {
                gameState.autoMovePath = path.slice(1);
                autoMoveStep();
            }
        });
    });
};
