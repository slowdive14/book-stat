# Daily Note Comparison

```dataviewjs
// 오늘 날짜 가져오기
const today = moment();
const year = today.format('YYYY');
const month = today.format('MM');
const monthNoZero = today.format('M');
const day = today.format('DD');
const dayNoZero = today.format('D');
const dayOfWeek = today.format('ddd'); // 요일 (월, 화, 수, 목, 금, 토, 일)

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
                return path;
            }
        }
    }

    return null;
}

// 각 연도별로 노트 표시
for (const year of years) {
    const notePath = findDailyNote(year);

    // 섹션 헤더
    dv.header(3, `📅 ${year}년 ${monthNoZero}월 ${dayNoZero}일 (${weekDays[dayOfWeek]})`);

    if (notePath) {
        // 노트 내용 임베드
        dv.paragraph(`![[${notePath}]]`);
    } else {
        dv.paragraph(`> 이 날짜의 일간노트가 없습니다.`);
    }

    dv.paragraph("---");
}
```
