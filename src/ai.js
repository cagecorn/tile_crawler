// src/ai.js

// --- 몬스터의 행동 상태들 ---

// '가만히 있는' 상태
export class IdleState {
    update(monster, player) {
        // 플레이어가 몬스터의 시야 안에 들어오면
        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < monster.visionRange) {
            // 몬스터의 상태를 '추격' 상태로 변경
            monster.state = new ChasingState();
        }
    }
}

// '추격하는' 상태
export class ChasingState {
    update(monster, player, mapManager, onPlayerAttack) {
        // 공격 쿨다운 감소
        if (monster.attackCooldown > 0) {
            monster.attackCooldown--;
        }

        const dx = player.x - monster.x;
        const dy = player.y - monster.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 공격 범위 안에 있으면 공격
        if (distance < monster.attackRange) {
            if (monster.attackCooldown === 0) {
                onPlayerAttack(monster.attackPower);
                monster.attackCooldown = 60; // 1초 쿨다운
            }
        } 
        // 그렇지 않으면 추격
        else {
            let moveX = (dx / distance) * monster.speed;
            let moveY = (dy / distance) * monster.speed;
            const newX = monster.x + moveX;
            const newY = monster.y + moveY;

            if (!mapManager.isWallAt(newX, newY, monster.width, monster.height)) {
                monster.x = newX;
                monster.y = newY;
            }
        }
    }
}
