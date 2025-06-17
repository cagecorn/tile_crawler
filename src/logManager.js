// src/logManager.js
export class LogManager {
    constructor(eventManager) {
        this.logElement = document.getElementById('combat-log-content');
        this.logs = [];

        eventManager.subscribe('log', (data) => this.add(data.message));

        eventManager.subscribe('entity_attack', (data) => {
            const { attacker, defender, damage } = data;
            this.add(`${attacker.constructor.name} (이)가 ${defender.constructor.name} (을)를 공격하여 ${damage}의 피해를 입혔습니다.`);
        });

        eventManager.subscribe('entity_death', (data) => {
            const { victim } = data;
            this.add(`%c${victim.constructor.name} (이)가 쓰러졌습니다.`, 'red');
        });

        eventManager.subscribe('exp_gained', (data) => {
            this.add(`%c${data.exp}의 경험치를 획득했습니다.`, 'yellow');
        });

        eventManager.subscribe('level_up', (data) => {
            this.add(`%c레벨 업! LV ${data.level} 달성!`, 'cyan');
        });
    }

    add(message, color = 'white') {
        this.logs.push({ message, color });
        if (this.logs.length > 20) this.logs.shift();
        this.render();
    }

    render() {
        this.logElement.innerHTML = this.logs.map(log =>
            `<span style="color: ${log.color};">${log.message}</span>`
        ).join('<br>');
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }
}
