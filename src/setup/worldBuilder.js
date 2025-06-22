import { STRATEGY } from '../engines/aiEngine.js';
import { SKILLS } from '../data/skills.js';
import { EMBLEMS } from '../data/emblems.js';

export function buildInitialWorld(managers, assets) {
    const { factory, mapManager, itemManager, aiEngine, mercenaryManager, monsterManager, equipmentManager, saveLoadManager } = managers;

    // 그룹 생성
    const playerGroup = aiEngine.createGroup('player_party', STRATEGY.AGGRESSIVE);
    const monsterGroup = aiEngine.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

    // 플레이어 생성
    const startPos = mapManager.getRandomFloorPosition() || { x: mapManager.tileSize, y: mapManager.tileSize };
    const player = factory.create('player', {
        x: startPos.x,
        y: startPos.y,
        tileSize: mapManager.tileSize,
        groupId: playerGroup.id,
        image: assets.player,
        baseStats: { strength: 5, agility: 5, endurance: 15, movement: 4 },
    });
    if (managers.equipmentRenderManager) {
        player.equipmentRenderManager = managers.equipmentRenderManager;
    }
    player.ai = null;
    playerGroup.addMember(player);
    aiEngine.addMember(playerGroup.id, player);

    const gameState = {
        player,
        inventory: [],
        gold: 1000,
        iron: 100,
        bone: 100,
        statPoints: 5,
        camera: { x: 0, y: 0 },
        isGameOver: false,
        isPaused: false,
        zoomLevel: 1,
    };

    // 초기 아이템 배치
    const itemFactory = factory.itemFactory;
    const itemsToCreate = [
        'potion',
        'short_sword',
        'long_bow',
        'violin_bow',
        'plate_armor',
        'pet_fox',
        'fox_charm',
        'emblem_guardian',
        'emblem_destroyer',
        'emblem_devotion',
        'emblem_conductor',
    ];
    // Spawn all starter items close to the player so they are easy to spot.
    itemsToCreate.forEach((id, i) => {
        const offsetX = (i - Math.floor(itemsToCreate.length / 2)) * mapManager.tileSize;
        const itemPos = { x: player.x + offsetX, y: player.y + mapManager.tileSize };
        const item = itemFactory.create(id, itemPos.x, itemPos.y, mapManager.tileSize);
        if (item) itemManager.addItem(item);
    });

    // 몬스터 생성
    // Increase monster count for a livelier dungeon
    for (let i = 0; i < 50; i++) {
        const mPos = mapManager.getRandomFloorPosition();
        if (mPos) {
            const monster = factory.create('monster', {
                x: mPos.x,
                y: mPos.y,
                tileSize: mapManager.tileSize,
                groupId: monsterGroup.id,
                image: assets.monster,
            });
            if (managers.equipmentRenderManager) {
                monster.equipmentRenderManager = managers.equipmentRenderManager;
            }
            monsterGroup.addMember(monster);
            aiEngine.addMember(monsterGroup.id, monster);
            monsterManager.monsters.push(monster);
        }
    }

    // 용병 고용 버튼 이벤트 연결
    const hireButtons = {
        'hire-mercenary': 'warrior',
        'hire-archer': 'archer',
        'hire-healer': 'healer',
        'hire-wizard': 'wizard',
        'hire-bard': 'bard',
        'hire-summoner': 'summoner',
    };
    for (const [id, job] of Object.entries(hireButtons)) {
        const btn = document.getElementById(id);
        if (btn) btn.onclick = () => hire(job);
    }

    const saveBtn = document.getElementById('save-game-btn');
    if (saveBtn) {
        saveBtn.onclick = () => {
            if (!saveLoadManager) {
                console.error('SaveLoadManager is not available.');
                return;
            }
            try {
                const saveData = saveLoadManager.gatherSaveData(gameState, monsterManager, mercenaryManager);
                localStorage.setItem('tileCrawlerSaveData', JSON.stringify(saveData));
                managers.eventManager.publish('log', { message: '✅ 게임 상태가 저장되었습니다.', color: 'lightgreen' });
            } catch (error) {
                console.error('Failed to save game state:', error);
                managers.eventManager.publish('log', { message: '❌ 게임 저장에 실패했습니다.', color: 'red' });
            }
        };
    }

    function hire(jobId) {
        if (gameState.gold >= 50) {
            gameState.gold -= 50;
            const newMerc = mercenaryManager.hireMercenary(jobId, player.x, player.y, mapManager.tileSize, playerGroup.id);
            if (newMerc) {
                playerGroup.addMember(newMerc);
                aiEngine.addMember(playerGroup.id, newMerc);
                managers.eventManager.publish('log', { message: `${newMerc.constructor.name} 용병을 고용했습니다.` });
            }
        } else {
            managers.eventManager.publish('log', { message: `골드가 부족합니다.` });
        }
    }

    return gameState;
}
