---
date: 2024-03-15
---

# 특정 날짜 비교 예제

이 노트는 프론트매터의 `date` 필드를 사용하여 2024년 3월 15일의 일간노트들을 비교합니다.

```dataviewjs
// === 날짜 설정 ===
// 방법 1: 특정 날짜를 보려면 아래 줄의 주석을 제거하고 날짜를 수정하세요
// const targetDate = moment('2024-01-15'); // YYYY-MM-DD 형식

// 방법 2: 프론트매터에 date: 2024-01-15 형식으로 지정
// 방법 3: 아무것도 안 하면 오늘 날짜 사용

let today;
let dateSource = "오늘";
let debugInfo = "";

// 프론트매터에서 명시적으로 작성된 필드만 읽기
const frontmatter = dv.current();

// Dataview는 날짜를 자동으로 파싱할 수 있으므로 moment 객체인지도 확인
const hasDateField = frontmatter.date && (
    typeof frontmatter.date === 'string' ||
    frontmatter.date.constructor.name === 'DateTime' ||
    moment.isMoment(frontmatter.date)
);

const hasCreatedField = frontmatter.created && (
    typeof frontmatter.created === 'string' ||
    frontmatter.created.constructor.name === 'DateTime' ||
    moment.isMoment(frontmatter.created)
);

if (typeof targetDate !== 'undefined') {
    // 방법 1: 코드에서 직접 지정한 날짜 사용
    today = targetDate;
    dateSource = "코드에서 지정";
    debugInfo = `코드: ${targetDate.format('YYYY-MM-DD')}`;
} else if (hasDateField) {
    // 방법 2: 프론트매터에서 date 필드 읽기
    // DateTime 객체인 경우 문자열로 변환
    let dateValue = frontmatter.date;
    if (typeof dateValue === 'object' && dateValue.toString) {
        dateValue = dateValue.toString().split('T')[0]; // ISO 형식에서 날짜 부분만 추출
    }
    today = moment(dateValue);
    dateSource = "프론트매터 (date)";
    debugInfo = `프론트매터 date: ${dateValue} (원본: ${frontmatter.date})`;
} else if (hasCreatedField) {
    // 대안: created 필드 시도
    let createdValue = frontmatter.created;
    if (typeof createdValue === 'object' && createdValue.toString) {
        createdValue = createdValue.toString().split('T')[0];
    }
    today = moment(createdValue);
    dateSource = "프론트매터 (created)";
    debugInfo = `프론트매터 created: ${createdValue} (원본: ${frontmatter.created})`;
} else {
    // 방법 3: 오늘 날짜 사용
    today = moment();
    dateSource = "오늘";
    debugInfo = "프론트매터 없음, 오늘 날짜 사용";
}

// 디버깅: 사용 중인 날짜와 상세 정보 표시
dv.paragraph(`🔍 **비교 날짜**: ${today.format('YYYY년 MM월 DD일')} (${dateSource})`);
dv.paragraph(`<small style="color: var(--text-muted);">디버그: ${debugInfo}</small>`);
dv.paragraph("---");

const month = today.format('MM');
const monthNoZero = today.format('M');
const day = today.format('DD');
const dayNoZero = today.format('D');

// 비교할 연도들
const years = [2025, 2024, 2023];

// 요일 매핑 (영어 -> 한글)
const weekDays = {
    'Mon': '월', 'Tue': '화', 'Wed': '수',
    'Thu': '목', 'Fri': '금', 'Sat': '토', 'Sun': '일'
};

// 각 연도별로 노트 찾기 함수
function findDailyNote(year) {
    const baseFolder = "일간노트";

    // 해당 연도의 같은 날짜로 moment 객체 생성 (요일 계산을 위해)
    const targetDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    const dayOfWeek = targetDate.format('ddd');

    // 가능한 폴더 패턴들
    const folderPatterns = [
        `${baseFolder}/${year}년/${monthNoZero}월`,    // 일간노트/2024년/1월
        `${baseFolder}/${year}년/${month}월`,           // 일간노트/2024년/01월
        `${baseFolder}/${year}년/${year}년 ${monthNoZero}월`, // 일간노트/2025년/2025년 1월
        `${baseFolder}/${year}년`,                      // 일간노트/2024년
    ];

    // 가능한 파일명 패턴들
    const filePatterns = [
        `${year}${month}${day}.md`,                     // 20240120.md
        `${year}${month}${day}${weekDays[dayOfWeek]}.md`, // 20240120월.md
        `${year}-${month}-${day}.md`,                   // 2024-01-20.md
        `${year}-${month}-${day}${weekDays[dayOfWeek]}.md`, // 2024-01-20월.md
    ];

    // 모든 조합 시도
    for (const folder of folderPatterns) {
        for (const fileName of filePatterns) {
            const path = `${folder}/${fileName}`;
            const file = app.vault.getAbstractFileByPath(path);
            if (file) {
                return { path, dayOfWeek: weekDays[dayOfWeek] };
            }
        }
    }

    return { path: null, dayOfWeek: weekDays[dayOfWeek] };
}

// 3열 그리드 레이아웃 시작
dv.paragraph(`
<style>
.daily-comparison-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 15px;
    margin-top: 20px;
}

.daily-comparison-column {
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 15px;
    background: var(--background-secondary);
    overflow-y: auto;
    max-height: 80vh;
}

.daily-comparison-header {
    font-size: 1.1em;
    font-weight: 600;
    color: var(--text-accent);
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid var(--background-modifier-border);
    position: sticky;
    top: 0;
    background: var(--background-secondary);
    z-index: 10;
}

.daily-comparison-no-note {
    color: var(--text-muted);
    font-style: italic;
    text-align: center;
    padding: 20px;
}

@media (max-width: 1200px) {
    .daily-comparison-grid {
        grid-template-columns: 1fr;
    }
}
</style>

<div class="daily-comparison-grid">
`);

// 각 연도별로 열 생성
for (const year of years) {
    const result = findDailyNote(year);

    dv.paragraph(`<div class="daily-comparison-column">`);
    dv.paragraph(`<div class="daily-comparison-header">📅 ${year}년 ${monthNoZero}월 ${dayNoZero}일 (${result.dayOfWeek})</div>`);

    if (result.path) {
        dv.paragraph(`![[${result.path}]]`);
    } else {
        dv.paragraph(`<div class="daily-comparison-no-note">이 날짜의 일간노트가 없습니다.</div>`);
    }

    dv.paragraph(`</div>`);
}

dv.paragraph(`</div>`);
```

## 날짜 변경하는 방법

### 방법 1: 프론트매터 수정 (추천)
노트 상단의 YAML 프론트매터에서 date 값을 변경:
```yaml
---
date: 2024-12-25
---
```

### 방법 2: 코드 직접 수정
위의 코드 블록에서 6번째 줄 주석을 제거하고 날짜 수정:
```javascript
const targetDate = moment('2024-12-25');
```
