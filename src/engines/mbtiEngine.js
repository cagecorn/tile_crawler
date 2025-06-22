import { debugLog } from '../utils/logger.js';

export class MBTIEngine {
    constructor() {
        console.log('[MBTIEngine] Initialized');
        debugLog('[MBTIEngine] Initialized');
    }

    /**
     * AI의 기본 결정을 MBTI 성향에 따라 수정하고, 어떤 특성이 발동했는지 반환합니다.
     * @param {object} action - AI의 기본 행동 결정
     * @param {object} self - 행동 주체
     * @param {object} context - 게임 월드 컨텍스트
     * @returns {{finalAction: object, triggeredTraits: string[]}} - 수정된 행동과 발동된 특성
     */
    refineAction(action, self, context) {
        const mbti = self.properties?.mbti || '';
        if (!mbti || action.type === 'idle') {
            return { finalAction: action, triggeredTraits: [] };
        }

        let finalAction = { ...action };
        let triggeredTraits = [];

        // 힐/버프 스킬 사용 시 S/N, E/I 결정
        if (action.type === 'skill') {
            if (mbti.includes('S')) triggeredTraits.push('S');
            else if (mbti.includes('N')) triggeredTraits.push('N');
            if (mbti.includes('E')) triggeredTraits.push('E');
            else if (mbti.includes('I')) triggeredTraits.push('I');
        }

        // 전투 행동 시 T/F, J/P 결정
        if (action.type === 'move' || action.type === 'attack') {
            const { enemies } = context;
            let potentialTargets = enemies.filter(e => Math.hypot(e.x - self.x, e.y - self.y) < self.visionRange);

            if (mbti.includes('T')) {
                potentialTargets.sort((a, b) => a.hp - b.hp);
                triggeredTraits.push('T');
            } else if (mbti.includes('F')) {
                const allyTargets = new Set(context.allies.map(a => a.currentTarget?.id).filter(Boolean));
                const focusedTarget = potentialTargets.find(t => allyTargets.has(t.id));
                if (focusedTarget) potentialTargets = [focusedTarget];
                triggeredTraits.push('F');
            }
            
            if (potentialTargets.length > 0) {
                finalAction.target = potentialTargets[0];
            }

            if (mbti.includes('J')) triggeredTraits.push('J');
            if (mbti.includes('P')) triggeredTraits.push('P');
        }
        
        return { finalAction, triggeredTraits };
    }
}
