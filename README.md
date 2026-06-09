# FinanceTracker

Tracker for finance.

FinanceTracker е статично HTML/CSS/JavaScript приложение за личен бюджет. Проектът покрива заданията от архива за Family Budget App: semantic HTML структура, responsive layout, разходи, приходи, баланс, статистика, dark mode, validation, localStorage и refactoring на JavaScript логиката.

## Реализирани компоненти

- Header с основна навигация и dark mode бутон.
- Total Balance секция с баланс, приходи, разходи и най-голям разход.
- Expense Form с име, категория, сума, дата и описание.
- Expense List с търсене, филтър по категория и delete бутон.
- Income секция с добавяне, списък и delete бутон за приходи.
- Statistics Section с брой разходи, среден разход, активни категории и барове по категории.
- Monthly Summary собствен компонент за текущия месец.
- Budget Goal секция с progress bar.
- Notes секция с localStorage запис.
- Footer с име на проекта, година и авторска информация.

## Анализ на първоначалния код

1. Част от текста беше повреден като mojibake и интерфейсът не беше четим.
2. Приложението беше фокусирано основно върху разходи и бюджет, без пълна Income секция.
3. Балансът не беше реален финансов баланс, а бюджет минус разходи.
4. localStorage не пазеше приходи и изчислен баланс.
5. Началният екран беше по-скоро hero/landing секция, вместо работен dashboard.
6. Нямаше отделен списък с приходи и delete логика за него.
7. Част от UI класовете и layout-ът можеха да бъдат по-ясно групирани около реалните компоненти.

## Prompt, използван за подобрение

Създай статично Family Budget App приложение с HTML, CSS и JavaScript. Използвай semantic HTML елементи: header, main, section, article и footer. Добави форма за разходи с име, категория, сума, дата и описание; списък с разходи; форма и списък за приходи; delete функционалност; статистика; total balance секция; dark mode; responsive layout; validation за празни и невалидни стойности; localStorage за expenses, incomes, balance, budget и notes. JavaScript кодът трябва да бъде refactored с ясни имена на функции, отделени render функции и без дублирана логика.

## Сравнение на два prompt-а

Prompt A: "Направи приложение за разходи с форма и списък."

Prompt B: "Създай Family Budget App със semantic HTML, responsive dashboard layout, Expense Form, Expense List, Income секция, Total Balance, Statistics, validation, delete функционалност, dark mode, localStorage и refactored JavaScript."

По-добър е Prompt B, защото е по-конкретен. Той описва компонентите, технологията, нужната логика и качествените изисквания. Prompt A би генерирал по-непълен резултат, най-вероятно само форма и списък без баланс, приходи, validation, storage и responsive архитектура.

## Application Flow

1. Потребителят въвежда данни във форма за разход или приход.
2. Submit събитието извиква съответната handler функция.
3. Данните се валидират за празни полета, невалидно число и отрицателна стойност.
4. Валидният запис се добавя в масив `expenses` или `incomes`.
5. Масивите и изчисленият balance се записват в localStorage.
6. Render функциите обновяват списъците, статистиката, баланса, бюджета и месечното обобщение.
7. При delete записът се премахва от масива, localStorage се обновява и интерфейсът се презарежда.

## JavaScript code review

- `expenses` пази разходите, а `incomes` пази приходите.
- `handleExpenseSubmit()` добавя нов разход.
- `handleIncomeSubmit()` добавя нов приход.
- `renderExpenseList()` и `renderIncomeList()` обновяват списъците.
- `calculateTotals()` изчислява общи приходи, общи разходи, баланс, категории и най-голям разход.
- `renderSummary()`, `renderBudget()` и `renderMonthlySummary()` обновяват обобщенията.
- `saveLedger()` записва expenses, incomes и balance в localStorage.
- `logDebugState()` логва масивите и totals в Console при добавяне или изтриване.

## Debugging workflow

1. Проверка за syntax errors с `node --check script.js`.
2. Тестване на validation с празни полета, текст вместо сума и отрицателни стойности.
3. Добавяне на разходи и приходи с различни стойности.
4. Проверка на total expenses, total income и balance.
5. Изтриване на записи и повторна проверка на totals.
6. Презареждане на страницата и проверка на localStorage.
7. Responsive проверка на 1200 px, 768 px и 480 px.

## Responsive testing

Проверено локално през browser automation на `http://127.0.0.1:8787/`.

- 1200 px: няма хоризонтален overflow, dashboard картите са в 4 колони.
- 768 px: няма хоризонтален overflow, dashboard картите са в 2 колони.
- 480 px: няма хоризонтален overflow, формите и картите са в 1 колона.
- Console errors: няма.
- Feature testing: добавяне на разход, добавяне на приход, delete, reload persistence, validation, balance и dark mode работят.
