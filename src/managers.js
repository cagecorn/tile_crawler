// src/managers.js

import { Monster } from './entities.js';

export class MonsterManager {
    constructor(monsterCount, mapManager, assets) {
        this.monsters = [];
        this.mapManager = mapManager;
        this.assets = assets;
        this._spawnMonsters(monsterCount);
    }

    _spawnMonsters(count) {
        for (let i = 0; i < count; i++) {
            let size = { w: 1, h: 1 };
            let image = this.assets.monster;
            if (Math.random() < 0.25) {
                size = { w: 2, h: 2 };
                image = this.assets.epic_monster;
            }

            let pos;
            if (size.w > 1) {
                if (this.mapManager.rooms.length > 0) {
                    const room = this.mapManager.rooms[Math.floor(Math.random() * this.mapManager.rooms.length)];
                    pos = { x: room.x * this.mapManager.tileSize, y: room.y * this.mapManager.tileSize };
                }
            } else {
                pos = this.mapManager.getRandomFloorPosition(size);
            }

            if (pos) {
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, image, size));
            }
        }
    }

    handleAttackOnMonster(monsterId, damage) {
        const monster = this.monsters.find(m => m.id === monsterId);
        if (monster) {
            monster.takeDamage(damage);
            if (monster.hp <= 0) {
                this.monsters = this.monsters.filter(m => m.id !== monsterId);
            }
        }
    }

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

// === UIManager 클래스 전체 수정 ===
export class UIManager {
    constructor() {
        // UI의 각 부분을 미리 찾아 변수에 저장
        this.hpElement = document.getElementById('ui-player-hp');
        this.maxHpElement = document.getElementById('ui-player-maxHp');
        this.attackPowerElement = document.getElementById('ui-player-attackPower');
        this.hpBarFillElement = document.getElementById('ui-hp-bar-fill');
    }

    // 플레이어 정보창을 업데이트하는 메서드
    updatePlayerStats(player) {
        // 각 요소의 텍스트와 스타일을 직접 업데이트
        this.hpElement.textContent = player.hp;
        this.maxHpElement.textContent = player.maxHp;
        this.attackPowerElement.textContent = player.attackPower;

        const hpRatio = player.hp / player.maxHp;
        this.hpBarFillElement.style.width = `${hpRatio * 100}%`;
    }

    // HP 바를 그리는 메서드 (이전과 동일)
    renderHpBars(ctx, player, monsters) {
        // this._drawHpBar(ctx, player); // 플레이어 HP바는 이제 HTML UI로 옮겼으므로 주석 처리
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
    }

    _drawHpBar(ctx, entity) {
        if (entity.hp <= 0 || entity.hp === entity.maxHp) {
            return;
        }
        const barWidth = entity.width;
        const barHeight = 8;
        const x = entity.x;
        const y = entity.y - barHeight - 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
