import { STRATEGY } from '../managers/ai-managers.js';
import { SKILLS } from '../data/skills.js';
import { EMBLEMS } from '../data/emblems.js';

export function buildInitialWorld(managers, assets) {
    const { factory, mapManager, itemManager, metaAIManager, mercenaryManager, monsterManager, equipmentManager } = managers;

    // 그룹 생성
    const playerGroup = metaAIManager.createGroup('player_party', STRATEGY.AGGRESSIVE);
    const monsterGroup = metaAIManager.createGroup('dungeon_monsters', STRATEGY.AGGRESSIVE);

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
    player.ai = null;
    playerGroup.addMember(player);

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
    itemsToCreate.forEach((id, i) => {
        const itemPos = mapManager.getRandomFloorPosition() || { x: player.x + (i - 5) * 64, y: player.y + 64 };
        const item = itemFactory.create(id, itemPos.x, itemPos.y, mapManager.tileSize);
        if (item) itemManager.addItem(item);
    });

    // 몬스터 생성
    for (let i = 0; i < 20; i++) {
        const mPos = mapManager.getRandomFloorPosition();
        if (mPos) {
            const monster = factory.create('monster', {
                x: mPos.x,
                y: mPos.y,
                tileSize: mapManager.tileSize,
                groupId: monsterGroup.id,
                image: assets.monster,
            });
            monsterGroup.addMember(monster);
            monsterManager.monsters.push(monster);
        }
    }

    // 용병 고용 버튼 이벤트 연결
    document.getElementById('hire-mercenary').onclick = () => hire('warrior');
    document.getElementById('hire-archer').onclick = () => hire('archer');
    document.getElementById('hire-healer').onclick = () => hire('healer');
    document.getElementById('hire-wizard').onclick = () => hire('wizard');
    document.getElementById('hire-bard').onclick = () => hire('bard');
    document.getElementById('hire-summoner').onclick = () => hire('summoner');

    function hire(jobId) {
        if (gameState.gold >= 50) {
            gameState.gold -= 50;
            const newMerc = mercenaryManager.hireMercenary(jobId, player.x, player.y, mapManager.tileSize, playerGroup.id);
            if (newMerc) {
                playerGroup.addMember(newMerc);
                managers.eventManager.publish('log', { message: `${newMerc.constructor.name} 용병을 고용했습니다.` });
            }
        } else {
            managers.eventManager.publish('log', { message: `골드가 부족합니다.` });
        }
    }

    return gameState;
}
