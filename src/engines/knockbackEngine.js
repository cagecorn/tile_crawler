import { debugLog } from '../utils/logger.js';

export class KnockbackEngine {
    constructor(eventManager, mapManager, vfxManager) {
        this.eventManager = eventManager;
        this.mapManager = mapManager;
        this.vfxManager = vfxManager;
        this.activeKnockbacks = []; // 현재 처리 중인 넉백 작업 목록

        if (this.eventManager) {
            this.eventManager.subscribe('knockback_request', data => {
                const { defender, attacker, distance, duration } = data;
                this.requestKnockback(defender, attacker, distance, duration);
            });
        }

        console.log('[KnockbackEngine] Initialized');
        debugLog('[KnockbackEngine] Initialized');
    }

    /**
     * 넉백을 요청받아 작업 큐에 추가합니다.
     * @param {object} defender - 넉백될 대상
     * @param {object} attacker - 넉백 유발자
     * @param {number} distance - 넉백 거리 (픽셀)
     * @param {number} duration - 넉백 지속 시간 (프레임)
     */
    requestKnockback(defender, attacker, distance, duration = 15) {
        const resistance = defender.stats.get('movementResist') || 0;
        if (Math.random() < resistance) {
            this.eventManager.publish('log', { message: `\uD83D\uDEE1\uFE0F ${defender.constructor.name}\uC774(\uAC00) \uB108\uD06C\uBC31\uC5D0 \uC800\uD56D\uD588\uC2B5\uB2C8\uB2E4!`, color: 'cyan' });
            return;
        }

        const fromPos = { x: defender.x, y: defender.y };
        const angle = Math.atan2(defender.y - attacker.y, defender.x - attacker.x);
        let toPos = {
            x: defender.x + Math.cos(angle) * distance,
            y: defender.y + Math.sin(angle) * distance
        };
        let hitWall = false;

        if (this.mapManager.isWallAt(toPos.x, toPos.y, defender.width, defender.height)) {
            hitWall = true;
            toPos = {
                x: defender.x + Math.cos(angle) * (distance / 2),
                y: defender.y + Math.sin(angle) * (distance / 2)
            };
        }

        this.activeKnockbacks.push({
            defender,
            fromPos,
            toPos,
            duration,
            life: duration,
            hitWall,
            attacker,
        });

        this.eventManager.publish('log', { message: `\uD83D\uDCA8 ${defender.constructor.name}\uC774(\uAC00) \uB108\uD06C\uBC31\uB429\uB2C8\uB2E4!`, color: 'lightblue' });
    }

    /**
     * 매 \uD504\uB808\uC784 \uC2E4\uD589\uB418\uBA70 \uBAA8\uB4E0 \uB108\uD06C\uBC31 \uC0C1\uD0DC\uB97C \uC5C5\uB370\uC774\uD2B8\uD569\uB2C8\uB2E4.
     */
    update() {
        if (this.activeKnockbacks.length === 0) return;

        for (let i = this.activeKnockbacks.length - 1; i >= 0; i--) {
            const job = this.activeKnockbacks[i];
            job.life--;

            const progress = 1 - (job.life / job.duration);

            job.defender.x = job.fromPos.x + (job.toPos.x - job.fromPos.x) * progress;
            job.defender.y = job.fromPos.y + (job.toPos.y - job.fromPos.y) * progress;

            if (this.vfxManager && job.life % 2 === 0) {
                this.vfxManager.addSpriteEffect(job.defender.image, job.defender.x, job.defender.y, {
                    width: job.defender.width,
                    height: job.defender.height,
                    duration: 8, alpha: 0.4, fade: 0.05, blendMode: 'lighter'
                });
            }

            if (job.life <= 0) {
                job.defender.x = job.toPos.x;
                job.defender.y = job.toPos.y;

                if (job.hitWall) {
                    this.eventManager.publish('knockback_wall_impact', { defender: job.defender, attacker: job.attacker });
                }

                this.activeKnockbacks.splice(i, 1);
            }
        }
    }
}
