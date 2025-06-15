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
            color: 'blue' // 플레이어 사각형의 색상
        }
        // 앞으로 몬스터, 아이템 등의 정보도 이곳에 추가될 예정입니다.
    };

    // 3. 렌더링 함수 정의
    // 화면에 게임 요소를 그리는 모든 코드는 이곳에 들어갑니다.
    function render() {
        // 매 프레임마다 캔버스를 깨끗하게 지웁니다.
        // (0, 0) 위치에서 캔버스 전체 너비와 높이만큼 지웁니다.
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // gameState에서 플레이어 정보를 가져와 사각형을 그립니다.
        const player = gameState.player;
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }

    // 4. 게임 루프(Game Loop) 정의
    // 게임의 심장과 같은 부분입니다.
    function gameLoop() {
        // 렌더링 함수를 호출하여 화면을 그립니다.
        render();

        // 브라우저에게 다음 프레임에 gameLoop 함수를 다시 실행해달라고 요청합니다.
        // 이것이 반복되면서 부드러운 애니메이션이 만들어집니다.
        requestAnimationFrame(gameLoop);
    }

    // 5. 게임 시작
    console.log("게임 루프를 시작합니다!");
    gameLoop(); // 최초의 게임 루프를 실행하여 시작합니다.
};
