// window.onload는 웹페이지의 모든 요소(이미지, 스타일시트 등)가
// 완전히 로드된 후에 안의 코드를 실행하도록 보장해 줍니다.
window.onload = function() {
    // 1. 캔버스 설정
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    // 브라우저 창 크기가 변경될 때마다 캔버스 크기를 다시 맞추는 함수
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    // 페이지 로드 시, 그리고 창 크기가 바뀔 때마다 캔버스 크기 조정
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 첫 로드 시에도 크기 맞춰주기

    // 2. 게임 상태(Game State) 정의
    // 게임의 모든 데이터를 이 객체 안에서 관리하게 됩니다.
    const gameState = {
        player: {
            x: 100, // 플레이어의 x 좌표
            y: 100, // 플레이어의 y 좌표
            width: 50, // 플레이어 사각형의 너비
            height: 50, // 플레이어 사각형의 높이
            color: 'blue', // 플레이어 사각형의 색상
            speed: 5 // 플레이어의 이동 속도
        }
    };

    // 3. 렌더링 함수 정의
    // 화면에 게임 요소를 그리는 모든 코드는 이곳에 들어갑니다.
    function render() {
        // 매 프레임마다 캔버스를 깨끗하게 지웁니다.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // gameState에서 플레이어 정보를 가져와 사각형을 그립니다.
        const player = gameState.player;
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // 4. 키보드 입력 처리
    // 어떤 키가 눌렸는지 상태를 저장하는 객체
    const keysPressed = {};

    // 키를 누르면 keysPressed 객체에 해당 키의 상태를 true로 설정
    document.addEventListener('keydown', function(event) {
        keysPressed[event.key] = true;
    });

    // 키에서 손을 떼면 keysPressed 객체에서 해당 키를 삭제
    document.addEventListener('keyup', function(event) {
        delete keysPressed[event.key];
    });

    // 5. 게임 상태 업데이트 함수 정의
    // 모든 계산 및 로직 처리는 이곳에서 이루어집니다.
    function update() {
        const player = gameState.player;
        
        // 눌린 키에 따라 플레이어의 좌표를 변경합니다.
        if ('ArrowUp' in keysPressed) {
            player.y -= player.speed;
        }
        if ('ArrowDown' in keysPressed) {
            player.y += player.speed;
        }
        if ('ArrowLeft' in keysPressed) {
            player.x -= player.speed;
        }
        if ('ArrowRight' in keysPressed) {
            player.x += player.speed;
        }
    }

    // 6. 게임 루프(Game Loop) 정의
    // 게임의 심장과 같은 부분입니다.
    function gameLoop() {
        // 로직 업데이트
        update();
        // 화면 그리기
        render();

        // 브라우저에게 다음 프레임에 gameLoop 함수를 다시 실행해달라고 요청합니다.
        requestAnimationFrame(gameLoop);
    }

    // 7. 게임 시작
    console.log("게임 시작! 방향키로 파란색 사각형을 움직여보세요.");
    gameLoop();
};
