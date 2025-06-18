// src/turnManager.js
// 턴 기반의 상태 변화를 관리할 매니저 (구멍만 파기)
export class TurnManager {
    constructor() {
        this.turnCount = 0;
        this.framesPerTurn = 100; // 100프레임을 1턴으로 간주
        this.currentFrame = 0;
    }

    update(entities) {
        this.currentFrame++;
        if (this.currentFrame >= this.framesPerTurn) {
            this.currentFrame = 0;
            this.turnCount++;
            
            // 여기에 턴마다 발생하는 로직 추가
            // 예: 모든 유닛의 배부름 0.1 감소, 호감도 0.1 증가 등
            // entities.forEach(e => {
            //     e.hunger -= 0.1;
            //     e.affinity += 0.1;
            // });
        }
    }
}
