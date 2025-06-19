# 개발 일지

## 세션 1
- `codex's room` 디렉터리 생성.
- `README.md`, `plans.md`, `dev-log.md` 초기화.
- 앞으로 이곳에 매 세션 작업 내용을 기록할 것.

## 세션 2
- 힐러 직업과 `HealerAI` 구현.
- 고유 스킬 `heal`을 사용해 아군을 회복하도록 테스트 추가.
- `CharacterFactory`가 `jobId: 'healer'`를 처리하도록 수정.

## 세션 3
- MBTI 데이터 테이블 추가.
- `CharacterFactory`가 무작위 MBTI를 부여하도록 수정.
- 해당 기능을 검증하는 테스트 `mbti.test.js` 작성.

## 세션 4
- 파일 전투 로그 매니저(`FileLogManager`) 구현.
- 'log' 이벤트를 파일로 기록하도록 추가.
- `fileLogManager.test.js` 테스트로 동작 확인.

## 세션 5
- 맵 매니저에 `LAVA` 타일 타입을 추가하고 랜덤 풀 생성 기능 구현.
- 새 지형이 렌더링되도록 이미지 로직 보강.
- `countTiles` 헬퍼와 연결성 테스트 업데이트, 용암 생성 테스트 추가.

## 세션 6
- `HealerAI`가 MBTI 성향에 따라 치유 시점을 다르게 판단하도록 개선.
- `ai.test.js`에 감각형/직관형 행동 테스트 두 가지를 추가.

## 세션 7
- `PathfindingManager.findPath`가 시작과 끝이 같을 때 바로 빈 배열을 반환하도록 수정.
- `pathfindingManager.test.js`에 해당 케이스 테스트 추가.

## 세션 8
- 수족관 맵에서 환경 효과를 테스트하기 위해 `bubble` 피처 타입을 추가.
- `AquariumManager`가 `bubble` 타입을 처리하여 VFX 이미터를 배치하도록 수정.
- `aquarium.test.js`에 거품 이미터 생성 여부 테스트 추가.
