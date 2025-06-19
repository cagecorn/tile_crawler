export class ParticleDecoratorManager {
    constructor(eventManager = null, assets = null, factory = null) {
        this.vfxManager = null;
        this.mapManager = null;
        this.emitters = [];
        this.initialized = false;
        console.log('[ParticleDecoratorManager] Initialized');
    }

    setManagers(vfxManager, mapManager) {
        this.vfxManager = vfxManager;
        this.mapManager = mapManager;
    }

    init() {
        if (this.initialized) return;
        if (!this.vfxManager || !this.mapManager) return;
        for (const room of this.mapManager.rooms) {
            const centerX = (room.x + room.width / 2) * this.mapManager.tileSize;
            const centerY = (room.y + room.height / 2) * this.mapManager.tileSize;
            const emitter = this.vfxManager.addEmitter(centerX, centerY, {
                spawnRate: 1,
                duration: -1,
                particleOptions: { color: 'rgba(255,255,255,0.3)', speed: 0.5, gravity: 0 }
            });
            this.emitters.push(emitter);
        }
        this.initialized = true;
    }

    clear() {
        for (const emitter of this.emitters) {
            this.vfxManager.removeEmitter(emitter);
        }
        this.emitters = [];
        this.initialized = false;
    }
}
