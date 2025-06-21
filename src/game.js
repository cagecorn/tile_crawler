import { AssetLoader } from './assetLoader.js';
import { ASSET_LIST } from './setup/assetConfig.js';
import { Engine } from './engine.js';

export class Game {
    constructor() {
        this.loader = new AssetLoader();
        this.engine = null;
    }

    start() {
        ASSET_LIST.images.forEach(([key, src]) => this.loader.loadImage(key, src));
        ASSET_LIST.weapons.forEach(([key, src]) => this.loader.loadImage(key, src));
        ASSET_LIST.emblems.forEach(([key, src]) => this.loader.loadImage(key, src));

        this.loader.onReady(assets => {
            this.engine = new Engine(assets);
            this.engine.start();
        });
    }
}
