// HTML 문서가 모두 로드되면 이 코드를 실행합니다.
window.onload = function() {
    // 1. HTML에서 canvas 요소를 찾습니다.
    const canvas = document.getElementById('game-canvas');
    
    // 2. 2D 그림을 그릴 수 있는 context를 가져옵니다.
    const ctx = canvas.getContext('2d');

    // 3. 캔버스 크기를 브라우저 창 크기에 맞게 설정합니다.
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // 4. 테스트용 사각형 그리기
    // 붉은색으로 채우기 스타일을 설정합니다.
    ctx.fillStyle = 'red'; 
    // (x: 50, y: 50) 위치에 가로 100, 세로 100 크기의 사각형을 그립니다.
    ctx.fillRect(50, 50, 100, 100);

    console.log("프로젝트 설정 완료! 캔버스에 붉은 사각형이 보이면 성공입니다.");
};
