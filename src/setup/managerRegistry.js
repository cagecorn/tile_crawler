import * as Managers from '../managers/index.js';
import { TagManager } from '../managers/tagManager.js';
import { CombatCalculator } from '../combat.js';
import { KnockbackEngine } from '../engines/knockbackEngine.js';
import { AIEngine } from '../engines/aiEngine.js';
import { MBTIEngine } from '../engines/mbtiEngine.js';
import { VFXEngine } from '../engines/vfxEngine.js';
import { EffectEngine } from '../engines/effectEngine.js';
import { SpriteEngine } from '../engines/spriteEngine.js';
import { EventEngine } from '../engines/eventEngine.js';
import { PathfindingManager } from '../managers/pathfindingManager.js';
import { MovementManager } from '../managers/movementManager.js';
import { FogManager } from '../managers/fogManager.js';
import { MicroEngine } from '../micro/MicroEngine.js';
import { MicroTurnEngine } from '../engines/microTurnEngine.js';
import { MicroCombatManager } from '../micro/MicroCombatManager.js';
import { CombatEngine } from '../engines/combatEngine.js';
import { StatEngine } from '../engines/statEngine.js';
import { TurnEngine } from '../engines/turnEngine.js';
import { ProjectileEngine } from '../engines/projectileEngine.js';
import { SkillEngine } from '../engines/skillEngine.js';
import { MovementEngine } from '../engines/movementEngine.js';

export function createManagers(eventManager, assets, factory, mapManager) {
    const managers = {};

    // 외부에서 전달된 기본 도구 보존
    managers.eventManager = eventManager;
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
    managers.itemManager = new Managers.ItemManager(eventManager, mapManager, assets);
    managers.monsterManager = new Managers.MonsterManager(eventManager, mapManager, assets, factory);
    managers.mercenaryManager = new Managers.MercenaryManager(eventManager, assets, factory);
    managers.equipmentRenderManager = new Managers.EquipmentRenderManager(eventManager, assets, factory);
    managers.equipmentManager = new Managers.EquipmentManager(eventManager);
    managers.equipmentManager.setTagManager(managers.tagManager);
    managers.traitManager = new Managers.TraitManager(eventManager, assets, factory);
    managers.mercenaryManager.setTraitManager(managers.traitManager);
    managers.monsterManager.setTraitManager(managers.traitManager);
    managers.mercenaryManager.equipmentRenderManager = managers.equipmentRenderManager;
    managers.monsterManager.equipmentRenderManager = managers.equipmentRenderManager;

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
    managers.projectileEngine = new ProjectileEngine(eventManager, managers.projectileManager);
    managers.skillEngine = new SkillEngine(eventManager, managers.skillManager);
    managers.movementEngine = new MovementEngine(eventManager, managers.movementManager);
    managers.auraManager = new Managers.AuraManager(managers.effectManager, eventManager, managers.vfxManager);
    managers.synergyManager = new Managers.SynergyManager(eventManager);
    managers.speechBubbleManager = new Managers.SpeechBubbleManager(eventManager);
    managers.petManager = new Managers.PetManager(eventManager, factory, managers.aiEngine, managers.auraManager, managers.vfxManager);

    // 시각 효과 처리를 담당하는 VFXEngine을 초기화합니다.
    managers.vfxEngine = new VFXEngine(eventManager, managers.vfxManager, assets);
    managers.spriteEngine = new SpriteEngine(eventManager, managers.vfxManager);
    managers.effectEngine = new EffectEngine(eventManager, managers.effectManager);

    // 마이크로 월드
    managers.microTurnEngine = new MicroTurnEngine();
    managers.microEngine = new MicroEngine(eventManager, managers.microTurnEngine);
    managers.microCombatManager = new MicroCombatManager(eventManager);
    managers.microItemAIManager = new Managers.MicroItemAIManager();

    // 전투 처리를 담당하는 CombatEngine을 도입합니다.
    managers.combatEngine = new CombatEngine(eventManager, managers, assets);
    managers.statEngine = new StatEngine(eventManager);
    managers.turnEngine = new TurnEngine(eventManager);
    managers.eventEngine = new EventEngine(eventManager);

    // --- 여기에 로그 매니저 생성 코드를 추가합니다. ---
    managers.combatLogManager = new Managers.CombatLogManager(eventManager);
    managers.systemLogManager = new Managers.SystemLogManager(eventManager);
    // --- 여기까지 추가 ---

    // UI Manager는 콜백 등으로 인해 별도 처리될 수 있으므로 마지막에 추가
    managers.uiManager = new Managers.UIManager();
    managers.uiManager.mercenaryManager = managers.mercenaryManager;

    return managers;
}
