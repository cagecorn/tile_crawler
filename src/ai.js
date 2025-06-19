// src/ai.js

import { hasLineOfSight } from './utils/geometry.js';
import { SKILLS } from './data/skills.js';

// --- AI 유형(Archetype)의 기반이 될 부모 클래스 ---
class AIArchetype {
    // action은 { type: 'move', target: {x, y} } 또는 { type: 'attack', target: entity } 같은 객체
    decideAction(self, context) {
        // 기본적으로는 아무것도 하지 않음 (자식 클래스에서 재정의)
        return { type: 'idle' };
    }

    // 플레이어 주변을 랜덤하게 배회하도록 목표 위치를 계산
    _getWanderPosition(self, player, allies, mapManager) {
        const reached = self.wanderTarget &&
            Math.hypot(self.wanderTarget.x - self.x, self.wanderTarget.y - self.y) < self.tileSize * 0.3;
        if (!self.wanderTarget || reached || self.wanderCooldown <= 0) {
            const base = mapManager ? mapManager.tileSize : self.tileSize;
            const angle = Math.random() * Math.PI * 2;
            const dist = base * (1 + Math.random() * 1.5);
            let x = player.x + Math.cos(angle) * dist;
            let y = player.y + Math.sin(angle) * dist;

            // 동료와 너무 가까우면 살짝 밀어내기
            for (const ally of allies) {
                if (ally === self) continue;
                const dx = x - ally.x;
                const dy = y - ally.y;
                const d = Math.hypot(dx, dy);
                if (d > 0 && d < base) {
                    x += (dx / d) * base;
                    y += (dy / d) * base;
                }
            }

            if (mapManager && mapManager.isWallAt(x, y, self.width, self.height)) {
                x = player.x;
                y = player.y;
            }

            self.wanderTarget = { x, y };
            self.wanderCooldown = 60 + Math.floor(Math.random() * 60);
        } else {
            self.wanderCooldown--;
        }

        return self.wanderTarget || player;
    }
}

// --- 전사형 AI ---
export class MeleeAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, enemies, mapManager } = context;
        const targetList = enemies;

        // 1. 가장 가까운 적 찾기
        let nearestTarget = null;
        let minDistance = Infinity;
        for (const target of targetList) {
            const dx = target.x - self.x;
            const dy = target.y - self.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = target;
            }
        }

        // 2. 행동 결정
        if (nearestTarget && minDistance < self.visionRange) {
            const hasLOS = hasLineOfSight(
                Math.floor(self.x / mapManager.tileSize),
                Math.floor(self.y / mapManager.tileSize),
                Math.floor(nearestTarget.x / mapManager.tileSize),
                Math.floor(nearestTarget.y / mapManager.tileSize),
                mapManager
            );

            if (!hasLOS && self.isFriendly && !self.isPlayer) {
                const playerDistance = Math.sqrt(Math.pow(player.x - self.x, 2) + Math.pow(player.y - self.y, 2));
                if (playerDistance > self.tileSize) {
                    return { type: 'move', target: player };
                }
            }
            const chargeSkill = Array.isArray(self.skills)
                ? self.skills.map(id => SKILLS[id]).find(s => s && s.tags && s.tags.includes('charge'))
                : null;

            if (
                !self.isPlayer &&
                chargeSkill &&
                minDistance > self.attackRange &&
                minDistance <= chargeSkill.chargeRange &&
                self.mp >= chargeSkill.manaCost &&
                (self.skillCooldowns[chargeSkill.id] || 0) <= 0
            ) {
                return { type: 'charge_attack', target: nearestTarget, skill: chargeSkill };
            }

            if (hasLOS && minDistance < self.attackRange) {
                // 사용할 수 있는 스킬이 있다면 스킬 사용
                const skillId = self.skills && self.skills[0];
                const skill = SKILLS[skillId];
                if (
                    skill &&
                    self.mp >= skill.manaCost &&
                    (self.skillCooldowns[skillId] || 0) <= 0
                ) {
                    return { type: 'skill', target: nearestTarget, skillId };
                }

                // 공격 범위 안에 있으면 기본 공격
                return { type: 'attack', target: nearestTarget };
            }

            if (hasLOS && minDistance <= self.speed) {
                // 너무 가까우면 더 이상 다가가지 않음
                return { type: 'idle' };
            }

            // 목표 지점을 향해 이동 (시야가 가려져 있어도 탐색)
            return { type: 'move', target: nearestTarget };
        } else if (self.isFriendly && !self.isPlayer) {
            const target = this._getWanderPosition(self, player, allies, mapManager);
            if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
                return { type: 'move', target };
            }
        }
        
        // 기본 상태는 대기
        return { type: 'idle' };
    }
}

// --- 힐러형 AI ---
export class HealerAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, mapManager } = context;
        const healId = SKILLS.heal?.id;
        const healSkill = SKILLS[healId];

        const skillReady =
            healId &&
            Array.isArray(self.skills) &&
            self.skills.includes(healId) &&
            self.mp >= healSkill.manaCost &&
            (self.skillCooldowns[healId] || 0) <= 0;

        const mbti = self.properties?.mbti || '';
        // 성향에 따라 치유 시점 결정
        let healThreshold = 0.7;
        if (mbti.includes('S')) healThreshold = 0.9;
        else if (mbti.includes('N')) healThreshold = 0.5;

        // 체력이 일정 비율 이하로 떨어진 아군만 후보로 선정
        const candidates = allies.filter(
            a => a.hp < a.maxHp && a.hp / a.maxHp <= healThreshold
        );
        if (candidates.length === 0) {
            if (self.isFriendly && !self.isPlayer && player) {
                const target = this._getWanderPosition(self, player, allies, mapManager);
                if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
                    return { type: 'move', target };
                }
            }
            return { type: 'idle' };
        }

        // MBTI 성향에 따른 대상 선택
        let target = null;
        if (mbti.includes('I')) {
            target = candidates.find(c => c === self) || candidates[0];
        } else if (mbti.includes('E')) {
            target = candidates.reduce((lowest, cur) =>
                cur.hp / cur.maxHp < lowest.hp / lowest.maxHp ? cur : lowest,
            candidates[0]);
        } else {
            target = candidates[0];
        }

        const distance = Math.hypot(target.x - self.x, target.y - self.y);
        const hasLOS = hasLineOfSight(
            Math.floor(self.x / mapManager.tileSize),
            Math.floor(self.y / mapManager.tileSize),
            Math.floor(target.x / mapManager.tileSize),
            Math.floor(target.y / mapManager.tileSize),
            mapManager,
        );

        if (distance <= self.attackRange && hasLOS && skillReady) {
            return { type: 'skill', target, skillId: healId };
        }

        return { type: 'move', target };
    }
}

// --- 원거리형 AI ---
export class RangedAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, enemies, mapManager } = context;
        const targetList = enemies;

        let nearestTarget = null;
        let minDistance = Infinity;
        for (const target of targetList) {
            const dx = target.x - self.x;
            const dy = target.y - self.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = target;
            }
        }

        if (nearestTarget && minDistance < self.visionRange) {
            const hasLOS = hasLineOfSight(
                Math.floor(self.x / mapManager.tileSize),
                Math.floor(self.y / mapManager.tileSize),
                Math.floor(nearestTarget.x / mapManager.tileSize),
                Math.floor(nearestTarget.y / mapManager.tileSize),
                mapManager
            );
            if (!hasLOS && self.isFriendly && !self.isPlayer) {
                const target = this._getWanderPosition(self, player, allies, mapManager);
                if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
                    return { type: 'move', target };
                }
            }

            if (hasLOS) {
                if (minDistance <= self.attackRange && minDistance > self.attackRange * 0.5) {
                    const skillId = self.skills && self.skills[0];
                    const skill = SKILLS[skillId];
                    if (
                        skill &&
                        self.mp >= skill.manaCost &&
                        (self.skillCooldowns[skillId] || 0) <= 0
                    ) {
                        return { type: 'skill', target: nearestTarget, skillId };
                    }
                    return { type: 'attack', target: nearestTarget };
                }

                if (minDistance <= self.attackRange * 0.5) {
                    const dx = nearestTarget.x - self.x;
                    const dy = nearestTarget.y - self.y;
                    return { type: 'move', target: { x: self.x - dx, y: self.y - dy } };
                }
            }

            return { type: 'move', target: nearestTarget };
        } else if (self.isFriendly && !self.isPlayer) {
            const target = this._getWanderPosition(self, player, allies, mapManager);
            if (Math.hypot(target.x - self.x, target.y - self.y) > self.tileSize * 0.3) {
                return { type: 'move', target };
            }
        }

        return { type: 'idle' };
    }
}

// --- 마법사형 AI (현재는 RangedAI와 동일하게 동작)
export class WizardAI extends RangedAI {
    // 추가적인 마법사 전용 로직이 들어갈 수 있습니다
}
