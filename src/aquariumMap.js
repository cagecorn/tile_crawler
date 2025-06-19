// src/aquariumMap.js
// Specialized map where new features can be placed and tested
import { MapManager } from './map.js';

export class AquariumMapManager extends MapManager {
    constructor(seed) {
        super(seed);
        this.name = 'aquarium';
    }

    _generateMaze() {
        // Aquarium map is a large open area for testing new features
        const map = Array.from({ length: this.height }, () => Array(this.width).fill(this.tileTypes.WALL));
        for (let y = 1; y < this.height - 1; y++) {
            for (let x = 1; x < this.width - 1; x++) {
                map[y][x] = this.tileTypes.FLOOR;
            }
        }
        return map;
    }
}
