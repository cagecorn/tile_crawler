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
            if (Math.random() < 0.25) {
                size = {w: 2, h: 2};
            }
            
            let pos;
            if (size.w > 1) {
                if (this.mapManager.rooms.length > 0) {
                    const room = this.mapManager.rooms[Math.floor(Math.random() * this.mapManager.rooms.length)];
                    pos = {
                        x: room.x * this.mapManager.tileSize,
                        y: room.y * this.mapManager.tileSize
                    };
                }
            } 
            else {
                pos = this.mapManager.getRandomFloorPosition(size);
            }
            
            if (pos) {
                this.monsters.push(new Monster(pos.x, pos.y, this.mapManager.tileSize, size));
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

export class VisualEffectManager {
    render(ctx, player, monsters) {
        this._drawHpBar(ctx, player);
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
    }

    _drawHpBar(ctx, entity) {
        if (entity.hp <= 0 || entity.hp === entity.maxHp) {
            return;
        }
        const barWidth = entity.width;
        const barHeight = 5;
        const x = entity.x;
        const y = entity.y - 10;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x, y, barWidth, barHeight);
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
    }
}
