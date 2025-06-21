import * as Managers from '../managers/index.js';
import { TagManager } from '../managers/tagManager.js';
import { CombatCalculator } from '../combat.js';
import { KnockbackEngine } from '../engines/knockbackEngine.js';
import { AIEngine } from '../engines/aiEngine.js';
import { MBTIEngine } from '../engines/mbtiEngine.js';
import { PathfindingManager } from '../managers/pathfindingManager.js';
import { MovementManager } from '../managers/movementManager.js';
import { FogManager } from '../managers/fogManager.js';
import { MicroEngine } from '../micro/MicroEngine.js';
import { MicroCombatManager } from '../micro/MicroCombatManager.js';

export function createManagers(eventManager, assets, factory, mapManager) {
    const managers = {};

    // 외부에서 전달된 기본 도구 보존
    managers.factory = factory;
    managers.mapManager = mapManager;

    // 기본 관리자
    managers.vfxManager = new Managers.VFXManager(eventManager, null);

    // --- KnockbackEngine을 생성하고 CombatCalculator에 주입 ---
    managers.knockbackEngine = new KnockbackEngine(eventManager, mapManager, managers.vfxManager);
    managers.tagManager = new TagManager();
    managers.combatCalculator = new CombatCalculator(eventManager, managers.tagManager, managers.knockbackEngine);

    // 월드 관련
    managers.pathfindingManager = new PathfindingManager(mapManager);
    managers.motionManager = new Managers.MotionManager(mapManager, managers.pathfindingManager);
    managers.movementManager = new MovementManager(mapManager);
    managers.fogManager = new FogManager(mapManager.width, mapManager.height);

    // 엔티티 및 아이템
    managers.itemManager = new Managers.ItemManager(eventManager, assets, factory);
    managers.monsterManager = new Managers.MonsterManager(eventManager, assets, factory);
    managers.mercenaryManager = new Managers.MercenaryManager(eventManager, assets, factory);
    managers.equipmentManager = new Managers.EquipmentManager(eventManager);
    managers.equipmentManager.setTagManager(managers.tagManager);
    managers.traitManager = new Managers.TraitManager(eventManager, assets, factory);
    managers.mercenaryManager.setTraitManager(managers.traitManager);
    managers.monsterManager.setTraitManager(managers.traitManager);

    // 시각 및 효과
    managers.vfxManager = new Managers.VFXManager(eventManager, managers.itemManager);
    managers.vfxManager.itemManager = managers.itemManager;
    managers.effectManager = new Managers.EffectManager(eventManager, managers.vfxManager);
    managers.effectIconManager = new Managers.EffectIconManager(eventManager, assets);

    // AI 관련
    managers.mbtiEngine = new MBTIEngine();
    managers.aiEngine = new AIEngine(eventManager, managers.mbtiEngine);

    // 기타 주요 관리자들
    managers.skillManager = new Managers.SkillManager(eventManager);
    managers.skillManager.setManagers(managers.effectManager, factory, managers.aiEngine, managers.monsterManager);
    managers.projectileManager = new Managers.ProjectileManager(eventManager, assets, managers.vfxManager);
    managers.auraManager = new Managers.AuraManager(managers.effectManager, eventManager, managers.vfxManager);
    managers.synergyManager = new Managers.SynergyManager(eventManager);
    managers.speechBubbleManager = new Managers.SpeechBubbleManager(eventManager);
    managers.petManager = new Managers.PetManager(eventManager, factory, managers.aiEngine, managers.auraManager, managers.vfxManager);

    // 마이크로 월드
    managers.microEngine = new MicroEngine(eventManager);
    managers.microCombatManager = new MicroCombatManager(eventManager);
    managers.microItemAIManager = new Managers.MicroItemAIManager();

    // UI Manager는 콜백 등으로 인해 별도 처리될 수 있으므로 마지막에 추가
    managers.uiManager = new Managers.UIManager();
    managers.uiManager.mercenaryManager = managers.mercenaryManager;

    return managers;
}
