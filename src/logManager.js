// src/logManager.js

// === LogManager를 CombatLogManager로 이름 변경 ===
export class CombatLogManager {
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

// === SystemLogManager 클래스 새로 추가 ===
export class SystemLogManager {
    constructor(eventManager) {
        this.logElement = document.getElementById('system-log-content');
        this.logs = [];
        // 'debug' 채널의 이벤트만 구독
        eventManager.subscribe('debug', (data) => {
            this.add(data.tag, data.message);
        });
    }
    add(tag, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.logs.push(`[${timestamp}] [${tag}] ${message}`);
        if (this.logs.length > 50) this.logs.shift();
        this.render();
    }
    render() {
        if (this.logElement) {
            this.logElement.innerText = this.logs.join('\n');
            this.logElement.scrollTop = this.logElement.scrollHeight;
        }
    }
}
