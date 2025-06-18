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
            if (hasLOS && minDistance < self.attackRange) {
                // 사용할 수 있는 스킬이 있다면 스킬 사용
                const skillId = 'power_strike';
                const skill = SKILLS[skillId];
                if (
                    self.skills && self.skills.includes(skillId) &&
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
            // 아군이고, 적이 없으면 플레이어를 따라다님
            const playerDistance = Math.sqrt(Math.pow(player.x - self.x, 2) + Math.pow(player.y - self.y, 2));
            // 플레이어와 일정 거리 이상 벌어지면 따라간다 (한 타일 이상)
            if (playerDistance > self.tileSize) {
                return { type: 'move', target: player };
            }
        }
        
        // 기본 상태는 대기
        return { type: 'idle' };
    }
}

// --- 앞으로 만들 AI 유형들을 위한 [여백 구멍] ---
export class HealerAI extends AIArchetype { /* 나중에 구현 */ }
export class RangedAI extends AIArchetype { /* 나중에 구현 */ }
