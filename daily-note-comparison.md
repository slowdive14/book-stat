# Daily Note Comparison

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
const hasDateField = frontmatter.date && typeof frontmatter.date === 'string';
const hasCreatedField = frontmatter.created && typeof frontmatter.created === 'string';

if (typeof targetDate !== 'undefined') {
    // 방법 1: 코드에서 직접 지정한 날짜 사용
    today = targetDate;
    dateSource = "코드에서 지정";
    debugInfo = `코드: ${targetDate.format('YYYY-MM-DD')}`;
} else if (hasDateField) {
    // 방법 2: 프론트매터에서 date 필드 읽기 (문자열로 명시된 경우만)
    today = moment(frontmatter.date);
    dateSource = "프론트매터 (date)";
    debugInfo = `프론트매터 date: ${frontmatter.date}`;
} else if (hasCreatedField) {
    // 대안: created 필드 시도 (문자열로 명시된 경우만)
    today = moment(frontmatter.created);
    dateSource = "프론트매터 (created)";
    debugInfo = `프론트매터 created: ${frontmatter.created}`;
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

// 각 연도별로 노트 표시
for (const year of years) {
    const result = findDailyNote(year);

    // 섹션 헤더
    dv.header(3, `📅 ${year}년 ${monthNoZero}월 ${dayNoZero}일 (${result.dayOfWeek})`);

    if (result.path) {
        // 노트 내용 임베드
        dv.paragraph(`![[${result.path}]]`);
    } else {
        dv.paragraph(`> 이 날짜의 일간노트가 없습니다.`);
    }

    dv.paragraph("---");
}
```
