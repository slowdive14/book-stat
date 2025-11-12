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

// === 디버깅: 프론트매터 전체 내용 출력 ===
dv.paragraph(`<details><summary>🔍 프론트매터 디버그 정보 (클릭해서 보기)</summary>`);
dv.paragraph(`<pre>${JSON.stringify({
    date: frontmatter.date,
    dateType: typeof frontmatter.date,
    created: frontmatter.created,
    createdType: typeof frontmatter.created,
    allKeys: Object.keys(frontmatter).filter(k => !k.startsWith('file'))
}, null, 2)}</pre>`);
dv.paragraph(`</details>`);
// === 디버깅 끝 ===

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
const years = [2025, 2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017];

// 요일 매핑 (영어 -> 한글)
const weekDays = {
    'Mon': '월', 'Tue': '화', 'Wed': '수',
    'Thu': '목', 'Fri': '금', 'Sat': '토', 'Sun': '일'
};

// 각 연도별로 노트 찾기 함수
async function findDailyNote(year) {
    const baseFolder = "일간노트";

    // 해당 연도의 같은 날짜로 moment 객체 생성 (요일 계산을 위해)
    const targetDate = moment(`${year}-${month}-${day}`, 'YYYY-MM-DD');
    const dayOfWeek = targetDate.format('ddd');

    // 2023년 이상: 마크다운 파일 찾기
    if (year >= 2023) {
        // 가능한 폴더 패턴들
        const folderPatterns = [
            `${baseFolder}/${year}년/${monthNoZero}월`,
            `${baseFolder}/${year}년/${month}월`,
            `${baseFolder}/${year}년/${year}년 ${monthNoZero}월`,
            `${baseFolder}/${year}년`,
        ];

        // 가능한 파일명 패턴들
        const filePatterns = [
            `${year}${month}${day}.md`,
            `${year}${month}${day}${weekDays[dayOfWeek]}.md`,
            `${year}-${month}-${day}.md`,
            `${year}-${month}-${day}${weekDays[dayOfWeek]}.md`,
        ];

        // 모든 조합 시도
        for (const folder of folderPatterns) {
            for (const fileName of filePatterns) {
                const path = `${folder}/${fileName}`;
                const file = app.vault.getAbstractFileByPath(path);
                if (file) {
                    return { path, text: null, dayOfWeek: weekDays[dayOfWeek] };
                }
            }
        }
    }
    // 2022년 이하: JSON 파일에서 찾기
    else {
        const jsonFilePath = `${baseFolder}/2022년 이전/${year}.md`;
        const file = app.vault.getAbstractFileByPath(jsonFilePath);

        if (file) {
            let content = await app.vault.read(file);

            console.log(`[${year}] 파일 읽기 성공, 길이: ${content.length}`);

            // 1단계: Frontmatter 제거 (--- 사이의 내용)
            content = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/m, '');

            // 2단계: 정규식으로 JSON 객체만 추출
            // {"created_at":...,"date_key":"...","text":"...","type":...} 패턴 찾기
            const jsonObjectPattern = /\{"created_at":\d+,"date_key":"[^"]+","text":"[^"]*(?:\\.[^"]*)*","type":\d+\}/g;
            const jsonObjects = content.match(jsonObjectPattern);

            if (!jsonObjects || jsonObjects.length === 0) {
                console.warn(`[${year}] JSON 객체를 찾을 수 없음`);
                return { path: null, text: null, dayOfWeek: weekDays[dayOfWeek] };
            }

            console.log(`[${year}] JSON 객체 수: ${jsonObjects.length}`);

            // 3단계: JSON 배열 생성
            const jsonArray = '[' + jsonObjects.join(',') + ']';

            console.log(`[${year}] JSON 배열 생성, 길이: ${jsonArray.length}`);

            try {
                const entries = JSON.parse(jsonArray);
                console.log(`[${year}] ✅ 파싱 성공! 엔트리 수: ${entries.length}`);

                const dateKey = `${year}${month}${day}`;

                const entry = entries.find(e => e.date_key === dateKey);

                if (entry) {
                    console.log(`[${year}] ✅ 날짜 ${dateKey} 찾음!`);
                    return {
                        path: null,
                        text: entry.text,
                        dayOfWeek: weekDays[dayOfWeek]
                    };
                } else {
                    console.log(`[${year}] ⚠️ 날짜 ${dateKey} 없음`);
                }
            } catch (e) {
                console.error(`[${year}] ❌ JSON 파싱 실패:`, e.message);
                console.error(`[${year}] 에러 위치 근처:`,
                    jsonArray.substring(Math.max(0, (e.message.match(/\d+/)?.[0] || 0) - 100),
                                       parseInt(e.message.match(/\d+/)?.[0] || 0) + 100));
            }
        } else {
            console.warn(`[${year}] ⚠️ 파일 없음: ${jsonFilePath}`);
        }
    }

    return { path: null, text: null, dayOfWeek: weekDays[dayOfWeek] };
}

// 3열 그리드 레이아웃 생성
const container = dv.container;

// 스타일 추가
const style = container.createEl('style');
style.textContent = `
.daily-comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 15px;
    margin-top: 20px;
    width: 100%;
}

.daily-comparison-column {
    border: 1px solid var(--background-modifier-border);
    border-radius: 8px;
    padding: 15px;
    background: var(--background-secondary);
    overflow-y: auto;
    max-height: 80vh;
    min-width: 0;
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
`;

// 디버깅: Grid 생성 확인
dv.paragraph(`<div style="background: #3a3a2e; color: #d4a574; padding: 5px; margin: 10px 0; border-left: 3px solid #8b7355;">🔍 디버그: 3열 그리드를 생성합니다...</div>`);

// 그리드 컨테이너 생성
const grid = container.createEl('div', { cls: 'daily-comparison-grid' });

// 각 연도별로 열 생성
for (const year of years) {
    const result = await findDailyNote(year);

    // 열 div 생성
    const column = grid.createEl('div', { cls: 'daily-comparison-column' });

    // 헤더 생성
    column.createEl('div', {
        cls: 'daily-comparison-header',
        text: `📅 ${year}년 ${monthNoZero}월 ${dayNoZero}일 (${result.dayOfWeek})`
    });

    // 내용 영역
    const contentDiv = column.createEl('div');

    if (result.path) {
        // 마크다운 파일 렌더링 (2023년 이상)
        const file = app.vault.getAbstractFileByPath(result.path);
        if (file) {
            const content = await app.vault.read(file);

            // 간단한 마크다운 -> HTML 변환
            let html = content
                .replace(/^# (.+)$/gm, '<h1>$1</h1>')
                .replace(/^## (.+)$/gm, '<h2>$1</h2>')
                .replace(/^### (.+)$/gm, '<h3>$1</h3>')
                .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/^- (.+)$/gm, '<li>$1</li>')
                .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                .replace(/\n\n/g, '</p><p>')
                .replace(/\n/g, '<br>');

            html = '<p>' + html + '</p>';

            // HTML 삽입
            contentDiv.innerHTML = html;
        }
    } else if (result.text) {
        // JSON 텍스트 렌더링 (2022년 이하)
        let html = result.text
            .replace(/==/g, '<mark>')  // ==텍스트== -> <mark>텍스트</mark> (첫 번째)
            .replace(/==/g, '</mark>') // 두 번째 == -> </mark>
            .replace(/\n/g, '<br>');

        contentDiv.innerHTML = '<p>' + html + '</p>';
    } else {
        contentDiv.createEl('div', {
            cls: 'daily-comparison-no-note',
            text: '이 날짜의 일간노트가 없습니다.'
        });
    }
}
```
