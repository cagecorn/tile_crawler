import fs from 'fs';

export class FileLogManager {
    constructor(eventManager, filePath = 'combat.log') {
        this.filePath = filePath;
        if (eventManager) {
            eventManager.subscribe('log', data => {
                if (data && data.message) {
                    this.log(data.message);
                }
            });
        }
    }

    log(message) {
        const timestamp = new Date().toISOString();
        fs.appendFileSync(this.filePath, `[${timestamp}] ${message}\n`);
    }

    clear() {
        fs.writeFileSync(this.filePath, '');
    }
}
