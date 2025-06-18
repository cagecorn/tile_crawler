import { Projectile } from "../entities.js";

export class ProjectileManager {
    constructor(eventManager, assets, vfxManager = null) {
        this.projectiles = [];
        this.eventManager = eventManager;
        this.assets = assets;
        this.vfxManager = vfxManager;
        console.log("[ProjectileManager] Initialized");
    }

    create(caster, target, skill) {
        const keyMap = {
            fireball: 'fire-ball',
            iceball: 'ice-ball'
        };
        const imageKey = keyMap[skill.projectile] || skill.projectile;

        const config = {
            x: caster.x,
            y: caster.y,
            target: target,
            caster: caster,
            damage: skill.damage,
            image: this.assets[imageKey],
            width: 64,
            height: 64,
            // 파이어볼 및 아이스볼 투사체는 스크린 블렌드 모드로 표현
            blendMode: 'screen',
            enableGlow: true,
            vfxManager: this.vfxManager,
        };
        this.projectiles.push(new Projectile(config));
    }

    update() {
        this.projectiles.forEach((proj, index) => {
            const result = proj.update();
            if (result.collided) {
                this.eventManager.publish('entity_attack', {
                    attacker: proj.caster,
                    defender: result.target,
                    damage: proj.damage,
                });
                this.projectiles.splice(index, 1);
            }
        });
    }

    render(ctx) {
        for (const proj of this.projectiles) {
            proj.render(ctx);
        }
    }
}
