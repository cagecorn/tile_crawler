// src/managers/index.js
// 이 파일은 프로젝트의 모든 매니저를 한 곳에서 불러오고, 다시 내보내는 역할을 합니다.

import { MonsterManager } from './monsterManager.js';
import { MercenaryManager } from './mercenaryManager.js';
import { ItemManager } from './itemManager.js';
import { EquipmentManager } from './equipmentManager.js';
import { UIManager } from './uiManager.js';
import { VFXManager } from './vfxManager.js';
import { SkillManager } from './skillManager.js';
import { SoundManager } from './soundManager.js';
import { EffectManager } from './effectManager.js';
import { ProjectileManager } from './projectileManager.js';
import { MotionManager } from './motionManager.js';
import { MovementManager } from './movementManager.js';
import { EquipmentRenderManager } from './equipmentRenderManager.js';
// ... (나중에 다른 매니저가 생기면 여기에 추가)

export {
    MonsterManager,
    MercenaryManager,
    ItemManager,
    EquipmentManager,
    UIManager,
    VFXManager,
    SkillManager,
    SoundManager,
    EffectManager,
    ProjectileManager,
    MotionManager,
    MovementManager,
    EquipmentRenderManager,
};
