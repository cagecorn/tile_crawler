// window.onload는 웹페이지의 모든 요소(이미지, 스타일시트 등)가
// 완전히 로드된 후에 안의 코드를 실행하도록 보장해 줍니다.
import { generateMap, MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, TILE_TYPES } from './src/map.js';

window.onload = function() {
    // 1. 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // 캔버스 크기를 맵 크기에 맞게 설정
    canvas.width = MAP_WIDTH * TILE_SIZE;
    canvas.height = MAP_HEIGHT * TILE_SIZE;

    // 2. 게임 상태(Game State) 정의
    const gameState = {
        player: {
            // 플레이어를 맵의 두 번째 타일 위치에 생성합니다.
            x: TILE_SIZE, 
            y: TILE_SIZE, 
            width: TILE_SIZE / 2, // 플레이어 크기를 타일의 절반으로
            height: TILE_SIZE / 2,
            color: 'blue',
            speed: 5
        },
        // generateMap 함수를 호출하여 생성된 맵을 저장합니다.
        map: generateMap() 
    };

    // 3. 렌더링 함수 정의
    function render() {
        // 캔버스를 깨끗하게 지웁니다.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 맵 그리기
        const map = gameState.map;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                // 타일 종류에 따라 색상을 다르게 설정합니다.
                ctx.fillStyle = (map[y][x] === TILE_TYPES.WALL) ? 'grey' : 'black';
                // 타일 위치에 사각형을 그립니다.
                ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            }
        }

        // 플레이어 그리기
        const player = gameState.player;
        ctx.fillStyle = player.color;
        // 플레이어를 타일 중앙에 예쁘게 위치시키기 위해 약간의 오프셋을 줍니다.
        ctx.fillRect(player.x + player.width / 2, player.y + player.height / 2, player.width, player.height);
    }

    // 4. 키보드 입력 처리
    const keysPressed = {};
    document.addEventListener('keydown', function(event) { keysPressed[event.key] = true; });
    document.addEventListener('keyup', function(event) { delete keysPressed[event.key]; });

    // 5. 게임 상태 업데이트 함수 정의 (충돌 처리 로직 추가)
    function update() {
        const player = gameState.player;
        const map = gameState.map;
        
        // 이동할 새로운 위치를 먼저 계산합니다.
        let newX = player.x;
        let newY = player.y;

        if ('ArrowUp' in keysPressed) newY -= player.speed;
        if ('ArrowDown' in keysPressed) newY += player.speed;
        if ('ArrowLeft' in keysPressed) newX -= player.speed;
        if ('ArrowRight' in keysPressed) newX += player.speed;

        // 충돌 감지: 플레이어의 네 모서리가 이동할 위치에서 벽과 겹치는지 확인
        
        // 맵 좌표로 변환
        const nextGridX1 = Math.floor(newX / TILE_SIZE);
        const nextGridY1 = Math.floor(newY / TILE_SIZE);
        const nextGridX2 = Math.floor((newX + player.width) / TILE_SIZE);
        const nextGridY2 = Math.floor((newY + player.height) / TILE_SIZE);

        // 이동할 위치가 벽이 아닐 경우에만 플레이어의 실제 좌표를 업데이트합니다.
        if (map[nextGridY1] && map[nextGridY1][nextGridX1] === TILE_TYPES.FLOOR &&
            map[nextGridY1] && map[nextGridY1][nextGridX2] === TILE_TYPES.FLOOR &&
            map[nextGridY2] && map[nextGridY2][nextGridX1] === TILE_TYPES.FLOOR &&
            map[nextGridY2] && map[nextGridY2][nextGridX2] === TILE_TYPES.FLOOR) {
            
            player.x = newX;
            player.y = newY;
        }
    }

    // 6. 게임 루프(Game Loop) 정의
    function gameLoop() {
        update();
        render();
        requestAnimationFrame(gameLoop);
    }

    // 7. 게임 시작
    console.log("맵 생성 완료! 플레이어가 벽을 통과하는지 확인해보세요.");
    gameLoop();
};
