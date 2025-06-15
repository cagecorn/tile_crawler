import { Monster } from './entities.js';

export class MonsterManager {
    constructor(monsterCount, mapManager) {
        this.monsters = [];
        this.mapManager = mapManager;
        this._spawnMonsters(monsterCount);
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            const pos = this.mapManager.getRandomFloorPosition();
            this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize));
        }
    }

    // 몬스터가 공격받았을 때 처리하는 함수
    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            if (monster.hp <= 0) {
                // 몬스터의 HP가 0 이하면 배열에서 제거
                this.monsters = this.monsters.filter(m => m.id !== monsterId);
            }
        }
    }

    render(ctx) {
        for (const monster of this.monsters) {
            monster.render(ctx);
        }
    }
}
