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
- 파일 전투 로그 매니저(`FileLogManager`)를 추가하여 'log' 이벤트를 파일로 남기도록 구현.
- 해당 기능을 검증하는 `fileLogManager.test.js` 테스트 작성.
