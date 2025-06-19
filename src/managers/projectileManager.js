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
            iceball: 'ice-ball',
            arrow: 'arrow'
        };
        const imageKey = keyMap[skill.projectile] || skill.projectile;

        const isArrow = skill.projectile === 'arrow';

        const config = {
            x: caster.x + caster.width / 2,
            y: caster.y + caster.height / 2,
            target: target,
            caster: caster,
            damage: skill.damage,
            image: this.assets[imageKey],
            width: isArrow ? 32 : 64,
            height: isArrow ? 32 : 64,
            blendMode: isArrow ? null : 'screen',
            enableGlow: !isArrow,
            vfxManager: this.vfxManager,
        };
        const projectile = new Projectile(config);
        this.projectiles.push(projectile);
        if (isArrow && this.vfxManager) {
            this.vfxManager.addArrowTrail(projectile);
        }
    }

    throwItem(caster, target, item) {
        const config = {
            x: caster.x + caster.width / 2,
            y: caster.y + caster.height / 2,
            target,
            caster,
            damage: 0,
            image: item.image,
            width: item.width,
            height: item.height,
            blendMode: null,
            enableGlow: false,
            vfxManager: this.vfxManager,
        };
        const projectile = new Projectile(config);
        this.projectiles.push(projectile);
    }

    update() {
        this.projectiles.forEach((proj, index) => {
            if (!proj.target || proj.target.hp <= 0 || proj.target.isDying) {
                proj.isDead = true;
                this.projectiles.splice(index, 1);
                return;
            }

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
