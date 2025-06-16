export class LogManager {
    constructor() {
        this.logElement = document.getElementById('combat-log-content');
        this.logs = [];
    }
    add(message) {
        this.logs.push(message);
        if (this.logs.length > 20) {
            this.logs.shift();
        }
        this.render();
    }
    render() {
        this.logElement.innerHTML = this.logs.join('<br>');
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }
}
