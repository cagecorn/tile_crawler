import { Projectile } from "../entities.js";

export class ProjectileManager {
    constructor(eventManager, assets) {
        this.projectiles = [];
        this.eventManager = eventManager;
        this.assets = assets;
        console.log("[ProjectileManager] Initialized");
    }

    create(caster, target, skill) {
        const config = {
            x: caster.x,
            y: caster.y,
            target: target,
            caster: caster,
            damage: skill.damage,
            image: this.assets['fire-ball'],
            width: 64,
            height: 64,
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
