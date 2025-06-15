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
            // 20% 확률로 에픽 몬스터 생성
            if (Math.random() < 0.2) {
                size = {w: 2, h: 2};
            }

            const pos = this.mapManager.getRandomFloorPosition(size);
            if (pos) {
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, size));
            }
        }
    }

    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            console.log(`몬스터(ID: ${monster.id}) HP: ${monster.hp}/${monster.maxHp}`);
            if (monster.hp <= 0) {
                this.monsters = this.monsters.filter(m => m.id !== monsterId);
            }
        }
    }

    // 지정된 좌표에 있는 몬스터를 찾는 함수 (다중 타일 지원)
    getMonsterAt(x, y) {
        for (const monster of this.monsters) {
            if (x >= monster.x && x < monster.x + monster.width &&
                y >= monster.y && y < monster.y + monster.height) {
                return monster;
            }
        }
        return null;
    }

    update(player, onPlayerAttack) {
        for (const monster of this.monsters) {
            monster.update(player, this.mapManager, onPlayerAttack);
        }
    }

    render(ctx) {
        for (const monster of this.monsters) {
            monster.render(ctx);
        }
    }
}

// === 아래 클래스를 새로 추가 ===
export class VisualEffectManager {
    render(ctx, player, monsters) {
        // 플레이어 HP 바 그리기
        this._drawHpBar(ctx, player);

        // 모든 몬스터의 HP 바 그리기
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
    }

    // HP 바를 그리는 내부 메서드
    _drawHpBar(ctx, entity) {
        if (entity.hp <= 0 || entity.hp === entity.maxHp) {
            return; // HP가 꽉 찼거나 없으면 그리지 않음
        }

        const barWidth = entity.width;
        const barHeight = 5;
        const x = entity.x;
        const y = entity.y - 10; // 유닛 머리 위 10픽셀 위치에

        // HP 바 배경 (붉은색)
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, barWidth, barHeight);

        // 현재 HP (녹색)
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
    }
}
