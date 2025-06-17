// src/fogManager.js

export const FOG_STATE = { UNSEEN: 0, SEEN: 1, VISIBLE: 2 };

export class FogManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        // 모든 타일을 '본 적 없는' 상태로 초기화
        this.fogMap = Array.from({ length: height }, () => Array(width).fill(FOG_STATE.UNSEEN));
    }

    // 플레이어 시야에 따라 안개 업데이트 (구멍만 파기)
    update(player, mapManager) {
        // 1. 모든 '현재 보이는' 타일을 '과거에 본' 상태로 바꿈
        // 2. 플레이어 주변 시야 범위 내의 타일을 '현재 보이는' 상태로 만듦
        // 3. 이때 시야선(LOS)을 확인하여 벽 뒤는 보이지 않게 처리
    }

    // 포그 오브 워를 그리는 함수
    render(ctx, tileSize) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                switch (this.fogMap[y][x]) {
                    case FOG_STATE.UNSEEN:
                        ctx.fillStyle = 'black';
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                        break;
                    case FOG_STATE.SEEN:
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                        ctx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
                        break;
                    case FOG_STATE.VISIBLE:
                        // 아무것도 그리지 않아 아래 레이어가 그대로 보임
                        break;
                }
            }
        }
    }
}
