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
