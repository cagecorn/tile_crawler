// src/managers.js

import { Monster } from './entities.js';

export class MonsterManager {
    constructor(monsterCount, mapManager) {
        this.monsters = [];
        this.mapManager = mapManager;
        this._spawnMonsters(monsterCount);
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            let size = {w: 1, h: 1};
            if (Math.random() < 0.25) { // 에픽 몬스터 생성 확률 25%로 조정
                size = {w: 2, h: 2};
            }
            
            let pos;
            // 에픽 몬스터는 방 안에만 생성
            if (size.w > 1) {
                if (this.mapManager.rooms.length > 0) {
                    const room = this.mapManager.rooms[Math.floor(Math.random() * this.mapManager.rooms.length)];
                    pos = {
                        x: room.x * this.mapManager.tileSize,
                        y: room.y * this.mapManager.tileSize
                    };
                }
            } 
            // 일반 몬스터는 아무 복도에나 생성
            else {
                pos = this.mapManager.getRandomFloorPosition(size);
            }
            
            if (pos) {
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, size));
            }
        }
    }
    
    // ... (나머지 handleAttackOnMonster, getMonsterAt, update, render 메서드는 변경 없음) ...
}

export class VisualEffectManager {
    // ... (VisualEffectManager 코드는 변경 없음) ...
}
