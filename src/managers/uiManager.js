export class UIManager {
    constructor() {
        this.levelElement = document.getElementById('ui-player-level');
        this.statPointsElement = document.getElementById('ui-player-statPoints');
        this.movementSpeedElement = document.getElementById('ui-player-movementSpeed');
        this.hpElement = document.getElementById('ui-player-hp');
        this.maxHpElement = document.getElementById('ui-player-maxHp');
        this.attackPowerElement = document.getElementById('ui-player-attackPower');
        this.goldElement = document.getElementById('ui-player-gold');
        this.hpBarFillElement = document.getElementById('ui-hp-bar-fill');
        this.mpElement = document.getElementById('ui-player-mp');
        this.maxMpElement = document.getElementById('ui-player-maxMp');
        this.mpBarFillElement = document.getElementById('ui-mp-bar-fill');
        this.expBarFillElement = document.getElementById('ui-exp-bar-fill');
        this.expTextElement = document.getElementById('ui-exp-text');
        this.inventorySlotsElement = document.getElementById('inventory-slots');
        this.statUpButtonsContainer = document.getElementById('player-stats-container');
        this.skillSlots = Array.from(document.querySelectorAll('#skill-bar .skill-slot'));
        // --- 용병 정보창 요소 추가 ---
        this.mercDetailPanel = document.getElementById('mercenary-detail-panel');
        this.mercDetailName = document.getElementById('merc-detail-name');
        this.mercStatsContainer = document.getElementById('merc-stats-container');
        this.closeMercDetailBtn = document.getElementById('close-merc-detail-btn');
        // 장착 대상 선택 패널 요소
        this.equipTargetPanel = document.getElementById('equipment-target-panel');
        this.equipTargetList = document.getElementById('equipment-target-list');
        // 인벤토리 패널 요소
        this.inventoryPanel = document.getElementById('inventory-panel');
        this.equippedItemsContainer = document.getElementById('equipped-items');
        this.inventoryListContainer = document.getElementById('inventory-list');
        this.characterSheetPanel = document.getElementById('character-sheet-panel');
        this.sheetCharacterName = document.getElementById('sheet-character-name');
        this.sheetEquipment = document.getElementById('sheet-equipment');
        this.sheetInventory = document.getElementById('sheet-inventory');
        this.callbacks = {};
        this._lastInventory = [];
        this._statUpCallback = null;
        this._isInitialized = false;
    }

    init(callbacks) {
        if (this._isInitialized) return;
        this.callbacks = callbacks || {};
        this._statUpCallback = this.callbacks.onStatUp;
        this.onEquipItem = this.callbacks.onEquipItem;
        if (this.statUpButtonsContainer) {
            this.statUpButtonsContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('stat-up-btn') || event.target.classList.contains('stat-plus')) {
                    let stat = event.target.dataset.stat;
                    if (!stat && event.target.id && event.target.id.startsWith('btn-plus-')) {
                        stat = event.target.id.replace('btn-plus-', '');
                    }
                    if (stat && this._statUpCallback) {
                        this._statUpCallback(stat);
                    }
                }
            });
        }
        // 닫기 버튼 이벤트
        if (this.closeMercDetailBtn) {
            this.closeMercDetailBtn.onclick = () => this.hideMercenaryDetail();
        }
        if (this.inventoryPanel) {
            const closeBtn = this.inventoryPanel.querySelector('.close-btn');
            if (closeBtn) closeBtn.onclick = () => this.hidePanel('inventory');
        }
        if (this.characterSheetPanel) {
            const closeBtn = this.characterSheetPanel.querySelector('.close-btn');
            if (closeBtn) closeBtn.onclick = () => this.hidePanel('character-sheet-panel');
            this.characterSheetPanel.querySelectorAll('.stat-tab-btn').forEach(btn => {
                btn.onclick = () => {
                    this.characterSheetPanel.querySelectorAll('.stat-tab-btn').forEach(b => b.classList.remove('active'));
                    this.characterSheetPanel.querySelectorAll('.stat-page').forEach(p => p.classList.remove('active'));
                    btn.classList.add('active');
                    const page = this.characterSheetPanel.querySelector(`#stat-page-${btn.dataset.tab}`);
                    if (page) page.classList.add('active');
                };
            });
        }
        this._isInitialized = true;
    }

    setStatUpCallback(cb) {
        this.init(cb);
    }

    // --- 아래 두 메서드를 새로 추가 ---
    showMercenaryDetail(mercenary) {
        if (!this.mercDetailPanel) return;

        this.mercDetailName.textContent = `${mercenary.constructor.name} (Lv.${mercenary.stats.get('level')})`;

        const statsToShow = ['hp', 'maxHp', 'attackPower', 'strength', 'agility', 'endurance', 'movementSpeed'];
        this.mercStatsContainer.innerHTML = '';

        // 레벨 및 경험치 표시
        const levelDiv = document.createElement('div');
        levelDiv.className = 'stat-line';
        levelDiv.textContent = `레벨: ${mercenary.stats.get('level')}`;
        this.mercStatsContainer.appendChild(levelDiv);

        const expDiv = document.createElement('div');
        expDiv.className = 'stat-line';
        expDiv.textContent = `EXP: ${mercenary.stats.get('exp')} / ${mercenary.stats.get('expNeeded')}`;
        this.mercStatsContainer.appendChild(expDiv);

        statsToShow.forEach(stat => {
            const statDiv = document.createElement('div');
            statDiv.className = 'stat-line';
            const statValue = typeof mercenary.stats.get(stat) === 'number'
                ? mercenary.stats.get(stat).toFixed(1)
                : mercenary.stats.get(stat);
            statDiv.textContent = `${stat}: ${statValue}`;
            this.mercStatsContainer.appendChild(statDiv);
        });

        this.mercDetailPanel.classList.remove('hidden');
    }

    hideMercenaryDetail() {
        if (this.mercDetailPanel) {
            this.mercDetailPanel.classList.add('hidden');
        }
    }

    showCharacterSheet(entity) {
        if (!this.characterSheetPanel) return;
        this.renderCharacterSheet(entity);
        this.showPanel('character-sheet-panel');
    }

    renderCharacterSheet(entity) {
        if (!this.characterSheetPanel) return;
        if (this.sheetCharacterName)
            this.sheetCharacterName.textContent = `${entity.constructor.name} (Lv.${entity.stats.get('level')})`;

        if (this.sheetEquipment) {
            this.sheetEquipment.querySelectorAll('.equip-slot').forEach(div => {
                const slot = div.dataset.slot;
                const baseLabel = div.querySelector('span') ? div.querySelector('span').textContent : slot;
                div.innerHTML = `<span>${baseLabel}</span> <span>${(entity.equipment && entity.equipment[slot]) ? entity.equipment[slot].name : '없음'}</span>`;
            });
        }

        if (this.sheetInventory) {
            this.sheetInventory.innerHTML = '';
            const inventory = entity.inventory || [];
            inventory.forEach(item => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'inventory-item-slot';
                if (item.image) {
                    const img = document.createElement('img');
                    img.src = item.image.src;
                    slotDiv.appendChild(img);
                } else {
                    slotDiv.textContent = item.name;
                }
                this.sheetInventory.appendChild(slotDiv);
            });
        }

        const page1 = this.characterSheetPanel.querySelector('#stat-page-1');
        if (page1) {
            page1.innerHTML = '';
            const statsToShow = ['strength','agility','endurance','focus','intelligence','movement','maxHp','maxMp','attackPower','movementSpeed'];
            statsToShow.forEach(stat => {
                const line = document.createElement('div');
                line.className = 'stat-line';
                line.innerHTML = `<span>${stat}:</span> <span>${entity.stats.get(stat)}</span>`;
                page1.appendChild(line);
            });
        }
    }

    showPanel(panelId) {
        if (panelId === 'inventory' && this.inventoryPanel) {
            this.inventoryPanel.classList.remove('hidden');
            if (this.gameState) this.renderInventory(this.gameState);
        } else if (panelId === 'character-sheet-panel' && this.characterSheetPanel) {
            this.characterSheetPanel.classList.remove('hidden');
        }
    }

    hidePanel(panelId) {
        if (panelId === 'inventory' && this.inventoryPanel) {
            this.inventoryPanel.classList.add('hidden');
        } else if (panelId === 'character-sheet-panel' && this.characterSheetPanel) {
            this.characterSheetPanel.classList.add('hidden');
        }
        if (this.gameState) this.gameState.isPaused = false;
    }

    renderInventory(gameState) {
        const player = gameState.player;
        this.equippedItemsContainer.innerHTML = '';
        for (const slot in player.equipment) {
            const item = player.equipment[slot];
            const slotDiv = document.createElement('div');
            slotDiv.className = 'equip-slot';
            slotDiv.dataset.slot = slot;
            slotDiv.textContent = `${slot}: ${item ? item.name : '없음'}`;
            this.equippedItemsContainer.appendChild(slotDiv);
        }

        this.inventoryListContainer.innerHTML = '';
        gameState.inventory.forEach((item, index) => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'inventory-item-slot';
            const img = document.createElement('img');
            img.src = item.image.src;
            slotDiv.appendChild(img);
            slotDiv.onclick = () => {
                if (this.callbacks.onItemUse) this.callbacks.onItemUse(index);
            };
            this.inventoryListContainer.appendChild(slotDiv);
        });
    }

    updateUI(gameState) {
        this.gameState = gameState;
        const player = gameState.player;
        const stats = player.stats;
        if (this.levelElement) this.levelElement.textContent = stats.get('level');
        if (this.statPointsElement) this.statPointsElement.textContent = gameState.statPoints;
        const primaryStats = ['strength', 'agility', 'endurance', 'focus', 'intelligence', 'movement'];
        primaryStats.forEach(stat => {
            const valueElement = document.getElementById(`ui-player-${stat}`);
            const buttonElement = valueElement ? valueElement.nextElementSibling : null;
            if (valueElement) valueElement.textContent = stats.get(stat);
            if (buttonElement) {
                buttonElement.style.display = gameState.statPoints > 0 ? 'inline-block' : 'none';
            }
        });
        if (this.hpElement) this.hpElement.textContent = Math.ceil(player.hp);
        if (this.maxHpElement) this.maxHpElement.textContent = stats.get('maxHp');
        if (this.mpElement) this.mpElement.textContent = Math.ceil(player.mp);
        if (this.maxMpElement) this.maxMpElement.textContent = stats.get('maxMp');
        if (this.attackPowerElement) this.attackPowerElement.textContent = stats.get('attackPower');
        if (this.movementSpeedElement) this.movementSpeedElement.textContent = stats.get('movementSpeed').toFixed(2);
        if (this.goldElement) this.goldElement.textContent = gameState.gold;
        const hpRatio = player.hp / player.maxHp;
        if (this.hpBarFillElement) this.hpBarFillElement.style.width = `${hpRatio * 100}%`;
        if (this.mpBarFillElement) {
            const mpRatio = player.mp / player.maxMp;
            this.mpBarFillElement.style.width = `${mpRatio * 100}%`;
        }
        const expRatio = stats.get('exp') / stats.get('expNeeded');
        if (this.expBarFillElement) this.expBarFillElement.style.width = `${expRatio * 100}%`;
        if (this.expTextElement) this.expTextElement.textContent = `${stats.get('exp')} / ${stats.get('expNeeded')}`;
        if (this.inventorySlotsElement && this._hasInventoryChanged(gameState.inventory)) {
            this.inventorySlotsElement.innerHTML = '';
            gameState.inventory.forEach((item, index) => {
                const slot = document.createElement('div');
                slot.className = 'inventory-slot';
                const img = document.createElement('img');
                img.src = item.image.src;
                img.alt = item.name;
                slot.onclick = () => {
                    if (this.callbacks.onItemUse) this.callbacks.onItemUse(index);
                };
                slot.appendChild(img);
                this.inventorySlotsElement.appendChild(slot);
            });
            this._lastInventory = [...gameState.inventory];
        }

        if (this.skillSlots) {
            this.skillSlots.forEach((slot, idx) => {
                const skillId = player.skills[idx];
                let overlay = slot.querySelector('.skill-cooldown');
                if (skillId) {
                    const skill = SKILLS[skillId];
                    if (skill && skill.icon) {
                        slot.style.backgroundImage = `url(${skill.icon})`;
                        slot.style.backgroundSize = 'cover';
                        slot.style.backgroundPosition = 'center';
                        slot.title = skill.name;
                    }
                    const cd = player.skillCooldowns[skillId] || 0;
                    if (cd > 0) {
                        if (!overlay) {
                            overlay = document.createElement('div');
                            overlay.className = 'skill-cooldown';
                            slot.appendChild(overlay);
                        }
                        overlay.textContent = Math.ceil(cd / 60);
                    } else if (overlay) {
                        overlay.remove();
                    }
                } else {
                    slot.style.backgroundImage = '';
                    slot.title = '';
                    if (overlay) overlay.remove();
                }
            });
        }
    }

    _hasInventoryChanged(current) {
        if (current.length !== this._lastInventory.length) return true;
        for (let i = 0; i < current.length; i++) {
            if (current[i] !== this._lastInventory[i]) return true;
        }
        return false;
    }

    useItem(itemIndex, gameState) {
        const item = gameState.inventory[itemIndex];
        if (!item) return;

        if (item.tags.includes('weapon') || item.tags.includes('armor') ||
            item.type === 'weapon' || item.type === 'armor') {
            this._showEquipTargetPanel(item, gameState);
        } else if (item.name === 'potion') {
            const player = gameState.player;
            player.hp = Math.min(player.maxHp, player.hp + 5);
            console.log(`포션을 사용했습니다! HP +5`);
            gameState.inventory.splice(itemIndex, 1);
            this.updateUI(gameState);
        }
    }

    _showEquipTargetPanel(item, gameState) {
        if (!this.equipTargetPanel) return;

        this.equipTargetList.innerHTML = '';
        const targets = [gameState.player, ...(this.mercenaryManager ? this.mercenaryManager.mercenaries : [])];

        targets.forEach((target, idx) => {
            const button = document.createElement('button');
            if (target.isPlayer) {
                button.textContent = '플레이어';
            } else {
                button.textContent = `용병 ${idx}`;
            }
            button.onclick = () => {
                if (this.onEquipItem) this.onEquipItem(target, item);
                this.hideEquipTargetPanel();
            };
            this.equipTargetList.appendChild(button);
        });

        this.equipTargetPanel.classList.remove('hidden');
    }

    hideEquipTargetPanel() {
        if (this.equipTargetPanel) {
            this.equipTargetPanel.classList.add('hidden');
        }
    }

    renderHpBars(ctx, player, monsters, mercenaries) {
        for (const monster of monsters) {
            this._drawHpBar(ctx, monster);
        }
        for (const merc of mercenaries) {
            this._drawHpBar(ctx, merc);
        }
    }

    _drawHpBar(ctx, entity) {
        if (entity.hp >= entity.maxHp || entity.hp <= 0) return;
        const barWidth = entity.width;
        const barHeight = 8;
        const x = entity.x;
        const y = entity.y - barHeight - 5;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, barWidth, barHeight);
        const hpRatio = entity.hp / entity.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? '#00ff00' : hpRatio > 0.2 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x, y, barWidth * hpRatio, barHeight);
        ctx.strokeStyle = 'white';
        ctx.strokeRect(x, y, barWidth, barHeight);
    }
}
