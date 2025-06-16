// src/ai.js

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
        
        // 🔧 수정: 적군/아군에 따라 타겟 리스트 결정
        let targetList = [];
        if (self.isFriendly) {
            // 아군이면 enemies 배열을 타겟으로
            targetList = enemies || [];
        } else {
            // 적군이면 플레이어와 아군들을 타겟으로
            targetList = [player];
            if (allies && allies.length > 0) {
                targetList = targetList.concat(allies);
            }
        }

        // 🔧 수정: 기본값 설정 (값이 없을 경우 대비)
        const visionRange = self.visionRange || 300; // 기본 시야 범위
        const attackRange = self.attackRange || 50;   // 기본 공격 범위

        // 1. 가장 가까운 적 찾기
        let nearestTarget = null;
        let minDistance = Infinity;
        
        for (const target of targetList) {
            // 🔧 수정: 타겟이 유효한지 확인 (죽었거나 존재하지 않는 타겟 제외)
            if (!target || target.isDead || target.health <= 0) continue;
            
            const dx = target.x - self.x;
            const dy = target.y - self.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = target;
            }
        }

        // 2. 행동 결정
        if (nearestTarget && minDistance < visionRange) {
            // 적이 시야 안에 있을 경우
            if (minDistance < attackRange) {
                // 공격 범위 안에 있으면 공격
                return { type: 'attack', target: nearestTarget };
            } else {
                // 🔧 수정: 경로 찾기가 가능한지 체크
                if (mapManager && mapManager.isWallAt) {
                    // 타겟 방향으로 이동 가능한지 간단히 체크
                    const moveX = nearestTarget.x > self.x ? self.x + self.speed : 
                                  nearestTarget.x < self.x ? self.x - self.speed : self.x;
                    const moveY = nearestTarget.y > self.y ? self.y + self.speed : 
                                  nearestTarget.y < self.y ? self.y - self.speed : self.y;
                    
                    // 이동하려는 위치가 벽이 아니면 이동
                    if (!mapManager.isWallAt(moveX, moveY, self.width || 32, self.height || 32)) {
                        return { type: 'move', target: nearestTarget };
                    }
                }
                // 벽 체크 없이도 일단 추격 시도
                return { type: 'move', target: nearestTarget };
            }
        } 
        
        // 3. 🔧 수정: 아군의 경우 플레이어 추종 로직
        if (self.isFriendly && !self.isPlayer && player) {
            const playerDistance = Math.sqrt(Math.pow(player.x - self.x, 2) + Math.pow(player.y - self.y, 2));
            const followDistance = self.tileSize ? self.tileSize * 2 : 100; // 기본값 100
            
            if (playerDistance > followDistance) {
                return { type: 'move', target: player };
            }
        }
        
        // 4. 🔧 추가: 적군의 경우 순찰이나 대기 행동
        if (!self.isFriendly) {
            // 적이 없을 때 랜덤하게 조금씩 움직이거나 순찰
            if (Math.random() < 0.1) { // 10% 확률로 랜덤 이동
                const randomAngle = Math.random() * Math.PI * 2;
                const randomDistance = 50 + Math.random() * 50; // 50-100 픽셀 이동
                const randomTarget = {
                    x: self.x + Math.cos(randomAngle) * randomDistance,
                    y: self.y + Math.sin(randomAngle) * randomDistance
                };
                return { type: 'move', target: randomTarget };
            }
        }
        
        // 기본 상태는 대기
        return { type: 'idle' };
    }
}

// --- 🔧 추가: 디버깅을 위한 AI 상태 확인 함수 ---
export function debugAI(entity, action, context) {
    if (window.DEBUG_AI) {
        console.log(`[AI Debug] ${entity.name || 'Entity'} (${entity.isFriendly ? 'Ally' : 'Enemy'}):`, {
            action: action,
            position: {x: entity.x, y: entity.y},
            visionRange: entity.visionRange,
            attackRange: entity.attackRange,
            targetsAvailable: entity.isFriendly ? context.enemies?.length : (context.allies?.length + 1)
        });
    }
}

// --- 향후 구현할 AI 유형들 ---
export class HealerAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, enemies } = context;
        
        // 간단한 힐러 로직 예시
        let targetList = self.isFriendly ? [player, ...allies] : enemies;
        let mostWoundedTarget = null;
        let lowestHealthRatio = 1;
        
        for (const target of targetList) {
            if (!target || target.isDead) continue;
            const healthRatio = target.health / target.maxHealth;
            if (healthRatio < lowestHealthRatio && healthRatio < 0.7) { // 70% 미만일 때 힐
                lowestHealthRatio = healthRatio;
                mostWoundedTarget = target;
            }
        }
        
        if (mostWoundedTarget) {
            const distance = Math.sqrt(Math.pow(mostWoundedTarget.x - self.x, 2) + Math.pow(mostWoundedTarget.y - self.y, 2));
            const healRange = self.healRange || 100;
            
            if (distance < healRange) {
                return { type: 'heal', target: mostWoundedTarget };
            } else {
                return { type: 'move', target: mostWoundedTarget };
            }
        }
        
        // 힐할 대상이 없으면 MeleeAI처럼 행동
        return new MeleeAI().decideAction(self, context);
    }
}

export class RangedAI extends AIArchetype {
    decideAction(self, context) {
        const { player, allies, enemies } = context;
        
        // 원거리 공격자 로직
        let targetList = self.isFriendly ? enemies : [player, ...allies];
        let nearestTarget = null;
        let minDistance = Infinity;
        
        for (const target of targetList) {
            if (!target || target.isDead) continue;
            const distance = Math.sqrt(Math.pow(target.x - self.x, 2) + Math.pow(target.y - self.y, 2));
            if (distance < minDistance) {
                minDistance = distance;
                nearestTarget = target;
            }
        }
        
        if (nearestTarget) {
            const visionRange = self.visionRange || 400; // 원거리는 시야가 더 넓음
            const attackRange = self.attackRange || 200;  // 원거리 공격 범위
            const safeDistance = 100; // 안전 거리
            
            if (minDistance < visionRange) {
                if (minDistance > safeDistance && minDistance < attackRange) {
                    // 적당한 거리에서 공격
                    return { type: 'ranged_attack', target: nearestTarget };
                } else if (minDistance < safeDistance) {
                    // 너무 가까우면 도망
                    const fleeX = self.x - (nearestTarget.x - self.x);
                    const fleeY = self.y - (nearestTarget.y - self.y);
                    return { type: 'move', target: { x: fleeX, y: fleeY } };
                } else {
                    // 사거리 밖이면 접근
                    return { type: 'move', target: nearestTarget };
                }
            }
        }
        
        return { type: 'idle' };
    }
}
