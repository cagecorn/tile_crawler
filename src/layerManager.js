export class LayerManager {
    constructor() {
        this.layers = {
            map: document.getElementById('map-canvas'),
            entity: document.getElementById('entity-canvas'),
            fx: document.getElementById('fx-canvas'),
        };
        this.contexts = {
            map: this.layers.map.getContext('2d'),
            entity: this.layers.entity.getContext('2d'),
            fx: this.layers.fx.getContext('2d'),
        };

        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    resize() {
        for (const key in this.layers) {
            this.layers[key].width = window.innerWidth;
            this.layers[key].height = window.innerHeight;
        }
    }

    // 모든 레이어를 깨끗이 지우는 함수
    clearAll() {
        for (const key in this.contexts) {
            this.contexts[key].clearRect(0, 0, this.layers[key].width, this.layers[key].height);
        }
    }
}
