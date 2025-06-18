# VFX 시스템 가이드

이 문서는 게임 내 시각 효과(VFX)를 어떻게 다루는지 간략하게 설명합니다.

## VFXManager 역할
- `VFXManager`는 파티클과 스프라이트 효과를 관리합니다.
- `addGlow(x, y, options)` : 이동하는 투사체의 잔광 등을 만듭니다.
- `addSpriteEffect(image, x, y, options)` : 특정 위치에 잠깐 표시되는 이미지 효과를 추가합니다.

## 기본 공격 스트라이크 이펙트
- 파일: `assets/images/strike-effect.png`
- `entity_attack` 이벤트가 발생할 때 스킬에 투사체가 없다면 해당 이펙트를 대상 위에 덮어씌웁니다.
- 밝은 합성(`lighter`)으로 그려지며 짧은 시간 후 사라집니다.

## 아이스볼 투사체
- 파일: `assets/images/ice-ball-effect.png`
- `iceball` 스킬의 투사체 이미지로 사용됩니다.
- 파이어볼과 동일하게 이동 중 파티클 잔광이 생성됩니다.
