// src/ai.js

import { hasLineOfSight } from './utils/geometry.js';
import { SKILLS } from './data/skills.js';

// 기존 전투 AI들은 Behavior 모듈로 이동했습니다.
// CompositeAI는 PurifierAI와 같은 여러 행동 조합을 위해 남겨둡니다.
export class CompositeAI {
    constructor(...ais) {
        this.ais = ais.map(AIClass => new AIClass());
    }

    decideAction(self, context) {
        for (const ai of this.ais) {
            const action = ai.decideAction(self, context);
            if (action && action.type !== 'idle') return action;
        }
        return { type: 'idle' };
    }
}

// --- 아래는 빙의 AI와 상태이상 AI로, 구조가 달라 일단 유지합니다. ---
class AIArchetype {
    decideAction(self, context) {
        return { type: 'idle' };
    }
    _filterVisibleEnemies(self, enemies) {
        const range = self.stats?.get('visionRange') ?? self.visionRange;
        return (enemies || []).filter(e =>
            Math.hypot(e.x - self.x, e.y - self.y) < range);
    }
    _getWanderPosition(self, player, allies, mapManager) {
        // WanderBehavior로 이동했으므로 여기서는 간단한 플레이어 타겟팅으로 대체
        return player;
    }
}

// --- 정화 전용 AI ---
export class PurifierAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, mapManager } = context;
        const purifyId = SKILLS.purify?.id;
        const skill = SKILLS[purifyId];
        const ready =
            purifyId &&
            Array.isArray(self.skills) &&
            self.skills.includes(purifyId) &&
            self.mp >= skill.manaCost &&
            (self.skillCooldowns[purifyId] || 0) <= 0;

        const mbti = self.properties?.mbti || '';
        let candidates = allies.filter(a =>
            (a.effects || []).some(e => e.tags?.includes('status_ailment'))
        );
        if (candidates.length === 0) {
            if (self.isFriendly && !self.isPlayer && player) {
                const t = this._getWanderPosition(self, player, allies, mapManager);
                if (Math.hypot(t.x - self.x, t.y - self.y) > self.tileSize * 0.3) {
                    return { type: 'move', target: t };
                }
            }
            return { type: 'idle' };
        }

        let target = null;
        if (mbti.includes('I')) {
            target = candidates.find(c => c === self) || candidates[0];
        } else {
            target = candidates[0];
        }


        // Purifiers used to occasionally idle based on 'P' MBTI, which made
        // their behavior unpredictable during tests. That randomness has been
        // removed so that allies afflicted with a status ailment are always
        // cleansed when possible.

        const dist = Math.hypot(target.x - self.x, target.y - self.y);
        const hasLOS = hasLineOfSight(
            Math.floor(self.x / mapManager.tileSize),
            Math.floor(self.y / mapManager.tileSize),
            Math.floor(target.x / mapManager.tileSize),
            Math.floor(target.y / mapManager.tileSize),
            mapManager,
        );

        if (dist <= self.attackRange && hasLOS && ready) {
            return { type: 'skill', target, skillId: purifyId };
        }

        return { type: 'move', target };
    }
}

export class TankerGhostAI extends AIArchetype {
    decideAction(self, context) {
        const { player, possessedRanged } = context;

        if (this._filterVisibleEnemies(self, [player]).length === 0) {
            return { type: 'idle' };
        }

        const nearestEnemy = player; // 플레이어를 주 타겟으로 삼음

        // 1. 보호할 원딜 아군 찾기
        let myRangedAlly = null;
        if (possessedRanged.length > 0) {
            // 가장 가까운 원딜을 보호
            myRangedAlly = possessedRanged.sort(
                (a, b) =>
                    Math.hypot(a.x - self.x, a.y - self.y) -
                    Math.hypot(b.x - self.x, b.y - self.y)
            )[0];
        }

        // 2. 보호할 원딜이 있을 경우, 수호 위치로 이동
        if (myRangedAlly) {
            const dx = nearestEnemy.x - myRangedAlly.x;
            const dy = nearestEnemy.y - myRangedAlly.y;
            const dist = Math.hypot(dx, dy) || 1;

            // 수호 위치: 원딜과 적 사이 (원딜에게서 64픽셀 앞)
            const guardX = myRangedAlly.x + (dx / dist) * 64;
            const guardY = myRangedAlly.y + (dy / dist) * 64;
            const guardPosition = { x: guardX, y: guardY };

            // 수호 위치에서 너무 멀면 이동
            if (Math.hypot(guardX - self.x, guardY - self.y) > self.tileSize * 0.5) {
                return { type: 'move', target: guardPosition };
            }
        }

        // 3. 수호 위치에 있거나, 보호할 원딜이 없으면, 가까운 적을 공격
        if (Math.hypot(nearestEnemy.x - self.x, nearestEnemy.y - self.y) < self.attackRange) {
            return { type: 'attack', target: nearestEnemy };
        }

        // 4. 공격할 적이 사거리 밖에 있으면, (원딜이 없을 경우) 적에게 이동
        if (!myRangedAlly) {
            return { type: 'move', target: nearestEnemy };
        }

        return { type: 'idle' }; // 위치 사수
    }
}

export class RangedGhostAI extends AIArchetype {
    decideAction(self, context) {
        const { player, possessedTankers, possessedSupporters } = context;
        if (this._filterVisibleEnemies(self, [player]).length === 0) {
            return { type: 'idle' };
        }
        const nearestEnemy = player;

        // 1. 의지할 탱커 아군 찾기
        let myTanker = null;
        if (possessedTankers.length > 0) {
            myTanker = possessedTankers.sort(
                (a, b) =>
                    Math.hypot(a.x - self.x, a.y - self.y) -
                    Math.hypot(b.x - self.x, b.y - self.y)
            )[0];
        }

        // Supporter는 탱커가 없을 때 후퇴 지점으로 사용
        let mySupport = null;
        if (!myTanker && possessedSupporters.length > 0) {
            mySupport = possessedSupporters.sort(
                (a, b) =>
                    Math.hypot(a.x - self.x, a.y - self.y) -
                    Math.hypot(b.x - self.x, b.y - self.y)
            )[0];
        }

        // 2. 탱커도 서포터도 없으면 도망
        if (!myTanker && !mySupport) {
            const fleeDx = self.x - nearestEnemy.x;
            const fleeDy = self.y - nearestEnemy.y;
            const fleeTarget = { x: self.x + fleeDx, y: self.y + fleeDy };
            return { type: 'move', target: fleeTarget };
        }

        const anchor = myTanker || mySupport;

        // 3. 탱커(또는 서포터) 뒤 안전한 위치 계산
        const safeDx = anchor.x - nearestEnemy.x;
        const safeDy = anchor.y - nearestEnemy.y;
        const safeDist = Math.hypot(safeDx, safeDy) || 1;
        const safePosition = {
            x: anchor.x + (safeDx / safeDist) * 96,
            y: anchor.y + (safeDy / safeDist) * 96
        };

        // 4. 안전 위치와 멀면 이동
        if (Math.hypot(safePosition.x - self.x, safePosition.y - self.y) > self.tileSize) {
            return { type: 'move', target: safePosition };
        }

        // 5. 안전하고, 적이 사거리 내에 있으면 공격
        const distToEnemy = Math.hypot(nearestEnemy.x - self.x, nearestEnemy.y - self.y);
        if (distToEnemy < self.attackRange) {
            // 적이 너무 가까우면 살짝 뒤로 빠짐 (카이팅)
            if (distToEnemy < self.attackRange * 0.4) {
                const kiteDx = self.x - nearestEnemy.x;
                const kiteDy = self.y - nearestEnemy.y;
                return { type: 'move', target: { x: self.x + kiteDx, y: self.y + kiteDy } };
            }
            return { type: 'attack', target: nearestEnemy };
        }

        return { type: 'idle' };
    }
}

export class SupporterGhostAI extends AIArchetype {
    decideAction(self, context) {
        const { player, possessedRanged, possessedTankers } = context;
        if (this._filterVisibleEnemies(self, [player]).length === 0) {
            return { type: 'idle' };
        }
        const nearestEnemy = player;

        // 1. 지원할 원딜 찾기
        let myRangedAlly = null;
        if (possessedRanged.length > 0) {
            myRangedAlly = possessedRanged.sort(
                (a, b) => a.hp / a.maxHp - b.hp / b.maxHp
            )[0]; // 가장 체력이 낮은 원딜 우선
        }

        // 원딜이 없으면 체력이 가장 낮은 탱커 지원
        let myTankerAlly = null;
        if (!myRangedAlly && possessedTankers.length > 0) {
            myTankerAlly = possessedTankers.sort(
                (a, b) => a.hp / a.maxHp - b.hp / b.maxHp
            )[0];
        }

        if (!myRangedAlly && !myTankerAlly) {
            // 특별히 도울 대상이 없으면 플레이어 주변을 배회
            return this._getWanderPosition
                ? {
                      type: 'move',
                      target: this._getWanderPosition(
                          self,
                          player,
                          context.allies,
                          context.mapManager
                      )
                  }
                : { type: 'idle' };
        }

        // 2. 원딜 체력이 낮으면 힐 시도
        const healSkill = self.skills.map(id => SKILLS[id]).find(s => s?.tags.includes('healing'));
        const priorityTarget = myRangedAlly || myTankerAlly;
        if (
            priorityTarget &&
            priorityTarget.hp / priorityTarget.maxHp < 0.7 &&
            healSkill &&
            self.mp >= healSkill.manaCost &&
            (self.skillCooldowns[healSkill.id] || 0) <= 0
        ) {
            if (Math.hypot(priorityTarget.x - self.x, priorityTarget.y - self.y) < self.attackRange) {
                return { type: 'skill', skillId: healSkill.id, target: priorityTarget };
            } else {
                return { type: 'move', target: priorityTarget };
            }
        }

        const protectTarget = myRangedAlly || myTankerAlly;
        // 3. 적이 아군에게 너무 가까우면 몸으로 막기 (가로채기)
        if (protectTarget && Math.hypot(nearestEnemy.x - protectTarget.x, nearestEnemy.y - protectTarget.y) < 128) {
            const interceptX = protectTarget.x + (nearestEnemy.x - protectTarget.x) / 2;
            const interceptY = protectTarget.y + (nearestEnemy.y - protectTarget.y) / 2;
            return { type: 'move', target: { x: interceptX, y: interceptY } };
        }

        // 4. 평소에는 대상 바로 뒤를 따라다님
        const followTarget = protectTarget || player;
        const followPosition = { x: followTarget.x - 64, y: followTarget.y };
        if (Math.hypot(followPosition.x - self.x, followPosition.y - self.y) > self.tileSize * 0.5) {
            return { type: 'move', target: followPosition };
        }

        return { type: 'idle' };
    }
}

export class CCGhostAI extends AIArchetype {
    decideAction(self, context) {
        const { player, possessedTankers } = context;
        if (this._filterVisibleEnemies(self, [player]).length === 0) {
            return { type: 'idle' };
        }
        let nearestEnemy = player;

        // 1. 협력할 탱커 찾기
        let myTanker = null;
        if (possessedTankers.length > 0) {
            myTanker = possessedTankers[0];
        }

        // 2. 탱커가 있으면 그 주변에 위치
        if (myTanker) {
            const flankPosition = { x: myTanker.x, y: myTanker.y + 96 };
            if (Math.hypot(flankPosition.x - self.x, flankPosition.y - self.y) > self.tileSize) {
                return { type: 'move', target: flankPosition };
            }
            // 탱커 주변의 가장 가까운 적을 타겟으로 재설정
            const enemiesNearTanker = context.enemies.filter(
                e => Math.hypot(e.x - myTanker.x, e.y - myTanker.y) < 256
            );
            if (enemiesNearTanker.length > 0) {
                nearestEnemy = enemiesNearTanker.sort(
                    (a, b) =>
                        Math.hypot(a.x - self.x, a.y - self.y) -
                        Math.hypot(b.x - self.x, b.y - self.y)
                )[0];
            }
        }

        // 3. CC 스킬 사용 시도
        const ccSkill = self.skills
            .map(id => SKILLS[id])
            .find(s => s?.tags.includes('debuff') || s?.tags.includes('cc'));
        if (
            ccSkill &&
            self.mp >= ccSkill.manaCost &&
            (self.skillCooldowns[ccSkill.id] || 0) <= 0
        ) {
            const distToNearest = Math.hypot(nearestEnemy.x - self.x, nearestEnemy.y - self.y);
            if (distToNearest < self.attackRange) {
                const mainAngle = Math.atan2(nearestEnemy.y - self.y, nearestEnemy.x - self.x);
                const cone = Math.PI / 6; // 30도 범위
                const othersInCone = context.enemies.filter(e => {
                    if (e === nearestEnemy) return false;
                    const dx = e.x - self.x;
                    const dy = e.y - self.y;
                    const d = Math.hypot(dx, dy);
                    if (d > self.attackRange) return false;
                    const angle = Math.atan2(dy, dx);
                    const diff = Math.atan2(Math.sin(angle - mainAngle), Math.cos(angle - mainAngle));
                    return Math.abs(diff) <= cone;
                });
                if (othersInCone.length > 0) {
                    return { type: 'skill', skillId: ccSkill.id, target: nearestEnemy };
                }
            }
        }

        const visible = this._filterVisibleEnemies(self, context.enemies);
        if (visible.length > 0) {
            let potential = [...visible];
            let targetCandidate = null;
            const mbti = self.properties?.mbti || '';
            if (mbti.includes('T')) {
                targetCandidate = potential.reduce((low, cur) => cur.hp < low.hp ? cur : low, potential[0]);
            } else if (mbti.includes('F')) {
                const allyTargets = new Set();
                context.allies.forEach(a => {
                    if (a.currentTarget) allyTargets.add(a.currentTarget.id);
                });
                const focused = potential.find(t => allyTargets.has(t.id));
                if (focused) {
                    targetCandidate = focused;
                }
            }
            const nearest = targetCandidate || potential.reduce(
                (closest, cur) =>
                    Math.hypot(cur.x - self.x, cur.y - self.y) < Math.hypot(closest.x - self.x, closest.y - self.y)
                        ? cur
                        : closest,
                potential[0]
            );
            const dist = Math.hypot(nearest.x - self.x, nearest.y - self.y);
            const hasLOS = hasLineOfSight(
                Math.floor(self.x / context.mapManager.tileSize),
                Math.floor(self.y / context.mapManager.tileSize),
                Math.floor(nearest.x / context.mapManager.tileSize),
                Math.floor(nearest.y / context.mapManager.tileSize),
                context.mapManager,
            );
            self.currentTarget = nearest;
            if (hasLOS && dist <= self.attackRange) {
                return { type: 'attack', target: nearest };
            }
            return { type: 'move', target: nearest };
        }

        if (self.isFriendly && !self.isPlayer) {
            const target = this._getWanderPosition(self, player, context.allies, context.mapManager);
            if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
                return { type: 'move', target };
            }
        }

        return { type: 'idle' };
    }
}

// --- 상태이상 전용 AI들 ---
export class FearAI extends AIArchetype {
    decideAction(self, context) {
        const nearestEnemy = context.enemies.sort(
            (a, b) =>
                Math.hypot(a.x - self.x, a.y - self.y) -
                Math.hypot(b.x - self.x, b.y - self.y)
        )[0];
        if (!nearestEnemy) return { type: 'idle' };

        const fleeTarget = {
            x: self.x + (self.x - nearestEnemy.x),
            y: self.y + (self.y - nearestEnemy.y)
        };
        return { type: 'move', target: fleeTarget };
    }
}

export class ConfusionAI extends AIArchetype {
    decideAction(self, context) {
        const nearestAlly = context.allies
            .filter(a => a !== self)
            .sort(
                (a, b) =>
                    Math.hypot(a.x - self.x, a.y - self.y) -
                    Math.hypot(b.x - self.x, b.y - self.y)
            )[0];
        if (!nearestAlly) return { type: 'idle' };

        if (Math.hypot(nearestAlly.x - self.x, nearestAlly.y - self.y) < self.attackRange) {
            return { type: 'attack', target: nearestAlly };
        }
        return { type: 'move', target: nearestAlly };
    }
}

export class BerserkAI extends AIArchetype {
    decideAction(self, context) {
        const allUnits = [...context.allies, ...context.enemies].filter(u => u !== self);
        const nearest = allUnits.sort(
            (a, b) =>
                Math.hypot(a.x - self.x, a.y - self.y) -
                Math.hypot(b.x - self.x, b.y - self.y)
        )[0];
        if (!nearest) return { type: 'idle' };

        if (Math.hypot(nearest.x - self.x, nearest.y - self.y) < self.attackRange) {
            return { type: 'attack', target: nearest };
        }
        return { type: 'move', target: nearest };
    }
}

export class CharmAI extends AIArchetype {
    decideAction(self, context) {
        const charmEffect = self.effects.find(e => e.id === 'charm');
        const caster = charmEffect?.caster;
        if (!caster) return { type: 'idle' };
        return { type: 'move', target: caster };
    }
}
