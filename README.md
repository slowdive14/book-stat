# Daily Note Comparison for Obsidian

옵시디언에서 같은 날짜의 다른 연도 Daily Note들을 한 눈에 비교할 수 있는 Dataview 템플릿입니다.

## 특징

- 오늘 날짜 기준으로 2023년, 2024년, 2025년의 같은 날짜 노트를 자동으로 찾아 표시
- 각 연도의 노트 내용을 전체 임베드로 표시
- 여러 가지 Daily Note 폴더 구조 자동 지원
- 플러그인 설치 없이 Dataview만으로 작동

## 사전 요구사항

Obsidian에 **Dataview** 플러그인이 설치되어 있어야 합니다.

1. 설정 > 커뮤니티 플러그인
2. "Dataview" 검색 후 설치
3. Dataview 플러그인 활성화
4. Dataview 설정에서 "Enable JavaScript Queries" 옵션 켜기

## 사용 방법

### 방법 1: 노트 파일 사용

1. `daily-note-comparison.md` 파일을 당신의 Vault에 복사
2. 해당 파일을 열면 자동으로 오늘 날짜의 3개년 노트가 표시됨

### 방법 2: 다른 노트에 삽입

`daily-note-comparison.md` 파일의 전체 내용을 복사하여 원하는 노트에 붙여넣으면 됩니다.

## 지원하는 Daily Note 폴더 및 파일명 구조

이 템플릿은 다음과 같은 불규칙한 패턴을 모두 지원합니다:

### 폴더 구조:
- `일간노트/2023년/11월/`
- `일간노트/2024년/1월/` (0 없이)
- `일간노트/2024년/01월/` (0 포함)
- `일간노트/2025년/2025년 1월/` (연도 중복)
- `일간노트/2024년/` (월 폴더 없이)

### 파일명 패턴:
- `20231124.md` (YYYYMMDD)
- `20240313수.md` (YYYYMMDD + 요일)
- `2024-01-20.md` (YYYY-MM-DD)
- `2024-01-20월.md` (YYYY-MM-DD + 요일)

모든 조합을 자동으로 시도하므로 위 패턴 중 어떤 것이든 찾아냅니다.

## 커스터마이징

### 비교할 연도 변경

`years` 배열을 수정:

```javascript
const years = [2025, 2024, 2023, 2022]; // 4개년 비교
```

### 특정 날짜로 고정

오늘 날짜 대신 특정 날짜를 보고 싶다면:

```javascript
// const today = moment(); 를 주석처리하고
const today = moment('2024-01-15'); // 원하는 날짜
```

### 기본 폴더명 변경

"일간노트" 대신 다른 폴더명을 사용한다면:

```javascript
const baseFolder = "일간노트";  // 이 부분을 수정
// 예: const baseFolder = "Daily Notes";
```

### 폴더/파일 패턴 추가

당신의 구조가 현재 패턴과 다르다면 `folderPatterns`나 `filePatterns`에 추가:

```javascript
const folderPatterns = [
    // ... 기존 패턴들
    `${baseFolder}/${year}년/${month}월/${day}일`,  // 추가 예시
];

const filePatterns = [
    // ... 기존 패턴들
    `${year}_${month}_${day}.md`,  // 추가 예시
];
```

## 문제 해결

### 노트가 표시되지 않는 경우

1. Dataview의 "Enable JavaScript Queries" 옵션이 켜져 있는지 확인
2. Daily Note 파일 경로가 `patterns`에 포함되어 있는지 확인
3. 파일 이름이 `YYYY-MM-DD` 형식인지 확인 (예: `2023-01-15.md`)

### 내용이 너무 길어서 보기 불편한 경우

노트 내용이 길다면 임베드 대신 링크만 표시하도록 변경:

```javascript
// 임베드 대신
dv.paragraph(`![[${notePath}]]`);

// 링크만 표시
dv.paragraph(`[[${notePath}|노트 보기]]`);
```

## 라이선스

MIT
