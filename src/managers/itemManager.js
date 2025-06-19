export class ItemManager {
    constructor() {
        // 게임 맵에 존재하는 모든 아이템을 저장
        this.items = [];
        console.log("[ItemManager] Initialized");
    }

    addItem(item) {
        this.items.push(item);
    }

    removeItem(item) {
        const idx = this.items.indexOf(item);
        if (idx !== -1) {
            this.items.splice(idx, 1);
        }
    }

    update() {
        for (const item of this.items) {
            if (typeof item.update === 'function') {
                item.update();
            }
        }
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }
    }
}
