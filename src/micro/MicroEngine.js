import { MicroTurnManager } from './MicroTurnManager.js';

export class MicroEngine {
    constructor(allEntities = [], allItems = []) {
        this.turnManager = new MicroTurnManager();
        this.allEntities = allEntities;
        this.allItems = allItems;
    }

    update() {
        this.turnManager.update(this.allItems);
    }
}
