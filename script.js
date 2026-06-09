(function () {
  const storageKeys = {
    expenses: 'financeTrackerExpensesV2',
    incomes: 'financeTrackerIncomesV1',
    budget: 'financeTrackerBudgetV2',
    balance: 'financeTrackerBalanceV1',
    notes: 'financeTrackerNotesV2',
    theme: 'financeTrackerThemeV2'
  };

  const legacyExpenseKey = 'financeTrackerExpensesV1';

  const defaultCategories = [
    'Food',
    'Transport',
    'Bills',
    'Entertainment',
    'Health',
    'Education',
    'Other'
  ];

  const elements = {
    themeButton: byId('themeButton'),
    expenseForm: byId('expenseForm'),
    expenseName: byId('expenseName'),
    expenseCategory: byId('expenseCategory'),
    expenseAmount: byId('expenseAmount'),
    expenseDate: byId('expenseDate'),
    expenseDescription: byId('expenseDescription'),
    expenseMessage: byId('expenseMessage'),
    incomeForm: byId('incomeForm'),
    incomeDescription: byId('incomeDescription'),
    incomeAmount: byId('incomeAmount'),
    incomeDate: byId('incomeDate'),
    incomeMessage: byId('incomeMessage'),
    balanceStat: byId('balanceStat'),
    incomeStat: byId('incomeStat'),
    incomeCountStat: byId('incomeCountStat'),
    expenseStat: byId('expenseStat'),
    expenseCountStat: byId('expenseCountStat'),
    largestExpenseStat: byId('largestExpenseStat'),
    largestExpenseMeta: byId('largestExpenseMeta'),
    expenseSearch: byId('expenseSearch'),
    categoryFilter: byId('categoryFilter'),
    expenseList: byId('expenseList'),
    incomeList: byId('incomeList'),
    expenseCountDetail: byId('expenseCountDetail'),
    averageExpenseStat: byId('averageExpenseStat'),
    categoryCountStat: byId('categoryCountStat'),
    categoryBars: byId('categoryBars'),
    monthlyIncomeStat: byId('monthlyIncomeStat'),
    monthlyExpenseStat: byId('monthlyExpenseStat'),
    monthlyBalanceStat: byId('monthlyBalanceStat'),
    monthlyEntryCount: byId('monthlyEntryCount'),
    budgetInput: byId('budgetInput'),
    saveBudgetButton: byId('saveBudgetButton'),
    budgetProgress: byId('budgetProgress'),
    budgetStatus: byId('budgetStatus'),
    notesArea: byId('notesArea'),
    saveNotesButton: byId('saveNotesButton'),
    clearNotesButton: byId('clearNotesButton'),
    notesStatus: byId('notesStatus')
  };

  let expenses = readCollection(storageKeys.expenses);
  if (!expenses.length) {
    expenses = readCollection(legacyExpenseKey);
  }

  let incomes = readCollection(storageKeys.incomes);
  let monthlyBudget = readNumber(storageKeys.budget);

  initialize();

  function initialize() {
    elements.expenseDate.value = today();
    elements.incomeDate.value = today();
    elements.budgetInput.value = monthlyBudget ? String(monthlyBudget) : '';
    elements.notesArea.value = localStorage.getItem(storageKeys.notes) || '';

    applySavedTheme();
    bindEvents();
    render();
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function readCollection(key) {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      console.warn(`Cannot read ${key} from localStorage`, error);
      return [];
    }
  }

  function readNumber(key) {
    const value = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(value) ? value : 0;
  }

  function saveLedger() {
    const totals = calculateTotals();

    localStorage.setItem(storageKeys.expenses, JSON.stringify(expenses));
    localStorage.setItem(storageKeys.incomes, JSON.stringify(incomes));
    localStorage.setItem(storageKeys.balance, String(totals.balance));
  }

  function bindEvents() {
    elements.expenseForm.addEventListener('submit', handleExpenseSubmit);
    elements.incomeForm.addEventListener('submit', handleIncomeSubmit);
    elements.expenseList.addEventListener('click', handleExpenseListClick);
    elements.incomeList.addEventListener('click', handleIncomeListClick);
    elements.expenseSearch.addEventListener('input', renderExpenseList);
    elements.categoryFilter.addEventListener('change', renderExpenseList);
    elements.saveBudgetButton.addEventListener('click', saveBudget);
    elements.notesArea.addEventListener('input', () => setNotesStatus('Има незапазени промени.'));
    elements.saveNotesButton.addEventListener('click', saveNotes);
    elements.clearNotesButton.addEventListener('click', clearNotes);
    elements.themeButton.addEventListener('click', toggleTheme);
  }

  function applySavedTheme() {
    const savedTheme = localStorage.getItem(storageKeys.theme);

    if (savedTheme === 'dark') {
      document.body.classList.add('dark');
    }

    updateThemeButton();
  }

  function toggleTheme() {
    document.body.classList.toggle('dark');
    localStorage.setItem(storageKeys.theme, document.body.classList.contains('dark') ? 'dark' : 'light');
    updateThemeButton();
  }

  function updateThemeButton() {
    const isDark = document.body.classList.contains('dark');
    elements.themeButton.textContent = isDark ? 'Светла тема' : 'Тъмна тема';
    elements.themeButton.setAttribute('aria-pressed', String(isDark));
  }

  function handleExpenseSubmit(event) {
    event.preventDefault();

    const name = elements.expenseName.value.trim();
    const amount = parseAmount(elements.expenseAmount.value);
    const error = validateExpense(name, amount);

    if (error) {
      showMessage(elements.expenseMessage, error, 'error');
      return;
    }

    const expense = {
      id: createId('expense'),
      name,
      category: elements.expenseCategory.value,
      amount,
      date: elements.expenseDate.value || today(),
      description: elements.expenseDescription.value.trim()
    };

    expenses.push(expense);
    saveLedger();
    logDebugState('Added expense', expense);

    elements.expenseForm.reset();
    elements.expenseDate.value = today();
    showMessage(elements.expenseMessage, 'Разходът е добавен успешно.', 'success');
    render();
  }

  function handleIncomeSubmit(event) {
    event.preventDefault();

    const description = elements.incomeDescription.value.trim();
    const amount = parseAmount(elements.incomeAmount.value);
    const error = validateIncome(description, amount);

    if (error) {
      showMessage(elements.incomeMessage, error, 'error');
      return;
    }

    const income = {
      id: createId('income'),
      description,
      amount,
      date: elements.incomeDate.value || today()
    };

    incomes.push(income);
    saveLedger();
    logDebugState('Added income', income);

    elements.incomeForm.reset();
    elements.incomeDate.value = today();
    showMessage(elements.incomeMessage, 'Приходът е добавен успешно.', 'success');
    render();
  }

  function handleExpenseListClick(event) {
    const button = event.target.closest('[data-expense-id]');
    if (!button) {
      return;
    }

    expenses = expenses.filter(expense => expense.id !== button.dataset.expenseId);
    saveLedger();
    logDebugState('Deleted expense', button.dataset.expenseId);
    render();
  }

  function handleIncomeListClick(event) {
    const button = event.target.closest('[data-income-id]');
    if (!button) {
      return;
    }

    incomes = incomes.filter(income => income.id !== button.dataset.incomeId);
    saveLedger();
    logDebugState('Deleted income', button.dataset.incomeId);
    render();
  }

  function validateExpense(name, amount) {
    if (!name) {
      return 'Моля, въведете име на разход.';
    }

    if (!elements.expenseCategory.value) {
      return 'Моля, изберете категория.';
    }

    return validatePositiveAmount(amount);
  }

  function validateIncome(description, amount) {
    if (!description) {
      return 'Моля, въведете описание на приход.';
    }

    return validatePositiveAmount(amount);
  }

  function validatePositiveAmount(amount) {
    if (amount === null) {
      return 'Моля, въведете сума.';
    }

    if (!Number.isFinite(amount)) {
      return 'Сумата трябва да бъде число.';
    }

    if (amount <= 0) {
      return 'Сумата трябва да бъде положително число.';
    }

    return '';
  }

  function parseAmount(value) {
    const normalized = String(value).trim().replace(',', '.');

    if (!normalized) {
      return null;
    }

    return Number(normalized);
  }

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = `form-message is-${type}`;

    clearTimeout(element.hideTimer);
    element.hideTimer = setTimeout(() => {
      element.className = 'form-message';
      element.textContent = '';
    }, 3200);
  }

  function saveBudget() {
    const amount = parseAmount(elements.budgetInput.value);

    if (amount === null) {
      monthlyBudget = 0;
      localStorage.setItem(storageKeys.budget, '0');
      renderBudget();
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      elements.budgetStatus.textContent = 'Въведете валиден бюджет.';
      elements.budgetStatus.className = 'budget-status negative';
      return;
    }

    monthlyBudget = amount;
    localStorage.setItem(storageKeys.budget, String(monthlyBudget));
    renderBudget();
  }

  function saveNotes() {
    localStorage.setItem(storageKeys.notes, elements.notesArea.value);
    setNotesStatus('Бележката е запазена.');
  }

  function clearNotes() {
    elements.notesArea.value = '';
    localStorage.removeItem(storageKeys.notes);
    setNotesStatus('Бележката е изчистена.');
  }

  function setNotesStatus(text) {
    elements.notesStatus.textContent = text;
  }

  function render() {
    renderCategoryControls();
    renderExpenseList();
    renderIncomeList();
    renderSummary();
    renderCategoryBars();
    renderBudget();
    renderMonthlySummary();
  }

  function renderCategoryControls() {
    const activeCategory = elements.categoryFilter.value || 'all';
    const categories = collectCategories();

    elements.expenseCategory.innerHTML = categories
      .map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
      .join('');

    elements.categoryFilter.innerHTML = [
      '<option value="all">Всички категории</option>',
      ...categories.map(category => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    ].join('');

    if ([...elements.categoryFilter.options].some(option => option.value === activeCategory)) {
      elements.categoryFilter.value = activeCategory;
    }
  }

  function collectCategories() {
    const savedCategories = expenses.map(expense => expense.category).filter(Boolean);
    return [...new Set([...defaultCategories, ...savedCategories])];
  }

  function renderExpenseList() {
    const items = getFilteredExpenses();

    if (!items.length) {
      elements.expenseList.innerHTML = '<div class="empty-state">Няма намерени разходи.</div>';
      return;
    }

    elements.expenseList.innerHTML = items
      .map(expense => {
        const details = [
          expense.category,
          formatDate(expense.date),
          expense.description
        ].filter(Boolean).map(escapeHtml).join(' · ');

        return `
          <article class="transaction-item">
            <div>
              <div class="transaction-title">${escapeHtml(expense.name)}</div>
              <div class="transaction-meta">${details}</div>
            </div>
            <div class="transaction-amount negative">${formatMoney(expense.amount)}</div>
            <button class="delete-button" type="button" data-expense-id="${escapeHtml(expense.id)}">Изтрий</button>
          </article>
        `;
      })
      .join('');
  }

  function renderIncomeList() {
    const sortedIncomes = [...incomes].sort(sortByNewestDate);

    if (!sortedIncomes.length) {
      elements.incomeList.innerHTML = '<div class="empty-state">Няма въведени приходи.</div>';
      return;
    }

    elements.incomeList.innerHTML = sortedIncomes
      .map(income => {
        return `
          <article class="transaction-item">
            <div>
              <div class="transaction-title">${escapeHtml(income.description)}</div>
              <div class="transaction-meta">${escapeHtml(formatDate(income.date))}</div>
            </div>
            <div class="transaction-amount positive">${formatMoney(income.amount)}</div>
            <button class="delete-button" type="button" data-income-id="${escapeHtml(income.id)}">Изтрий</button>
          </article>
        `;
      })
      .join('');
  }

  function getFilteredExpenses() {
    const query = elements.expenseSearch.value.trim().toLowerCase();
    const selectedCategory = elements.categoryFilter.value;

    return [...expenses]
      .filter(expense => {
        const categoryMatches = selectedCategory === 'all' || expense.category === selectedCategory;
        const searchableText = [
          expense.name,
          expense.category,
          expense.description,
          expense.date
        ].join(' ').toLowerCase();

        return categoryMatches && searchableText.includes(query);
      })
      .sort(sortByNewestDate);
  }

  function renderSummary() {
    const totals = calculateTotals();

    elements.balanceStat.textContent = formatMoney(totals.balance);
    elements.balanceStat.className = totals.balance < 0 ? 'negative' : 'positive';
    elements.incomeStat.textContent = formatMoney(totals.incomeTotal);
    elements.incomeCountStat.textContent = `${incomes.length} ${pluralize(incomes.length, 'запис', 'записа')}`;
    elements.expenseStat.textContent = formatMoney(totals.expenseTotal);
    elements.expenseCountStat.textContent = `${expenses.length} ${pluralize(expenses.length, 'запис', 'записа')}`;
    elements.expenseCountDetail.textContent = expenses.length;
    elements.averageExpenseStat.textContent = formatMoney(expenses.length ? totals.expenseTotal / expenses.length : 0);
    elements.categoryCountStat.textContent = totals.categoryCount;

    if (totals.largestExpense) {
      elements.largestExpenseStat.textContent = formatMoney(totals.largestExpense.amount);
      elements.largestExpenseMeta.textContent = `${totals.largestExpense.name} · ${totals.largestExpense.category}`;
    } else {
      elements.largestExpenseStat.textContent = '-';
      elements.largestExpenseMeta.textContent = 'Няма въведени разходи';
    }
  }

  function renderCategoryBars() {
    const totals = calculateTotals();

    if (!expenses.length) {
      elements.categoryBars.innerHTML = '<div class="empty-state">Категориите ще се появят след добавяне на разход.</div>';
      return;
    }

    const rows = Object.entries(totals.categoryTotals)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => {
        const width = totals.expenseTotal ? Math.max(4, (amount / totals.expenseTotal) * 100) : 0;

        return `
          <div class="bar-row">
            <span class="bar-label">${escapeHtml(category)}</span>
            <div class="bar-track"><span style="width:${width}%"></span></div>
            <span class="bar-value">${formatMoney(amount)}</span>
          </div>
        `;
      });

    elements.categoryBars.innerHTML = rows.join('');
  }

  function renderBudget() {
    const { expenseTotal } = calculateTotals();

    if (!monthlyBudget) {
      elements.budgetProgress.style.width = '0%';
      elements.budgetStatus.textContent = 'Няма зададен бюджет.';
      elements.budgetStatus.className = 'budget-status';
      return;
    }

    const usedPercent = Math.min(100, (expenseTotal / monthlyBudget) * 100);
    const remaining = monthlyBudget - expenseTotal;

    elements.budgetProgress.style.width = `${usedPercent}%`;

    if (remaining >= 0) {
      elements.budgetStatus.textContent = `Използвани ${formatMoney(expenseTotal)} от ${formatMoney(monthlyBudget)}. Остават ${formatMoney(remaining)}.`;
      elements.budgetStatus.className = 'budget-status positive';
    } else {
      elements.budgetStatus.textContent = `Над бюджета с ${formatMoney(Math.abs(remaining))}.`;
      elements.budgetStatus.className = 'budget-status negative';
    }
  }

  function renderMonthlySummary() {
    const currentMonth = today().slice(0, 7);
    const monthlyExpenses = expenses.filter(expense => String(expense.date || '').startsWith(currentMonth));
    const monthlyIncomes = incomes.filter(income => String(income.date || '').startsWith(currentMonth));
    const monthlyExpenseTotal = sumAmounts(monthlyExpenses);
    const monthlyIncomeTotal = sumAmounts(monthlyIncomes);
    const monthlyBalance = monthlyIncomeTotal - monthlyExpenseTotal;

    elements.monthlyIncomeStat.textContent = formatMoney(monthlyIncomeTotal);
    elements.monthlyExpenseStat.textContent = formatMoney(monthlyExpenseTotal);
    elements.monthlyBalanceStat.textContent = formatMoney(monthlyBalance);
    elements.monthlyBalanceStat.className = monthlyBalance < 0 ? 'negative' : 'positive';
    elements.monthlyEntryCount.textContent = monthlyExpenses.length + monthlyIncomes.length;
  }

  function calculateTotals() {
    const expenseTotal = sumAmounts(expenses);
    const incomeTotal = sumAmounts(incomes);
    const categoryTotals = expenses.reduce((result, expense) => {
      const category = expense.category || 'Other';
      result[category] = (result[category] || 0) + Number(expense.amount || 0);
      return result;
    }, {});

    const largestExpense = expenses.reduce((largest, expense) => {
      if (!largest || Number(expense.amount) > Number(largest.amount)) {
        return expense;
      }

      return largest;
    }, null);

    return {
      expenseTotal,
      incomeTotal,
      balance: incomeTotal - expenseTotal,
      categoryTotals,
      categoryCount: Object.keys(categoryTotals).length,
      largestExpense
    };
  }

  function sumAmounts(items) {
    return items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }

  function sortByNewestDate(a, b) {
    return new Date(b.date || 0) - new Date(a.date || 0);
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString('bg-BG', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDate(value) {
    if (!value) {
      return '';
    }

    return new Date(`${value}T00:00:00`).toLocaleDateString('bg-BG');
  }

  function today() {
    return new Date().toISOString().slice(0, 10);
  }

  function createId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === 'function') {
      return window.crypto.randomUUID();
    }

    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function pluralize(count, singular, plural) {
    return count === 1 ? singular : plural;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, character => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
      }[character];
    });
  }

  function logDebugState(label, payload) {
    const totals = calculateTotals();

    console.log(label, payload);
    console.log('expenses:', expenses);
    console.log('incomes:', incomes);
    console.log('total expenses:', totals.expenseTotal);
    console.log('total income:', totals.incomeTotal);
    console.log('balance:', totals.balance);
  }
})();
