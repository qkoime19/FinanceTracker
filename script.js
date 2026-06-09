(function () {
  const storageKey = 'financeTrackerExpensesV1';
  const budgetKey = 'financeTrackerBudgetV1';
  const notesKey = 'financeTrackerNotesV1';
  const themeKey = 'financeTrackerThemeV1';

  let expenses = JSON.parse(localStorage.getItem(storageKey) || '[]');
  let budget = Number(localStorage.getItem(budgetKey) || 0);

  const $ = id => document.getElementById(id);

  const money = n => {
    return Number(n || 0).toLocaleString('bg-BG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }) + ' €.';
  };

  const categories = [
    'Храна',
    'Дом',
    'Транспорт',
    'Забавления',
    'Образование',
    'Здраве',
    'Друго'
  ];

  $('expenseDate').valueAsDate = new Date();
  $('notesArea').value = localStorage.getItem(notesKey) || '';
  $('budgetInput').value = budget ? budget : '';

  if (localStorage.getItem(themeKey) === 'dark') {
    document.body.classList.add('dark');
    $('themeBtn').textContent = '☀️ Светла тема';
  }

  function save() {
    localStorage.setItem(storageKey, JSON.stringify(expenses));
  }

  function showMessage(type, msg) {
    const box = type === 'error' ? $('errorBox') : $('successBox');
    const other = type === 'error' ? $('successBox') : $('errorBox');

    other.style.display = 'none';
    box.textContent = msg;
    box.style.display = 'block';

    clearTimeout(box.timer);
    box.timer = setTimeout(() => {
      box.style.display = 'none';
    }, 3200);
  }

  function validate(name, amount) {
    if (!name.trim()) {
      return 'Моля, въведете име на разход.';
    }

    if (String(amount).trim() === '') {
      return 'Моля, въведете сума.';
    }

    const num = Number(String(amount).replace(',', '.'));

    if (Number.isNaN(num)) {
      return 'Сумата трябва да бъде число.';
    }

    if (num <= 0) {
      return 'Сумата трябва да бъде положително число.';
    }

    return '';
  }

  function totals() {
    const total = expenses.reduce((sum, expense) => {
      return sum + Number(expense.amount);
    }, 0);

    const biggest = expenses.reduce((max, expense) => {
      if (!max || Number(expense.amount) > Number(max.amount)) {
        return expense;
      }

      return max;
    }, null);

    const cats = new Set(expenses.map(expense => expense.category));

    return {
      total,
      biggest,
      cats
    };
  }

  function renderFilters() {
    const current = $('categoryFilter').value || 'all';

    $('categoryFilter').innerHTML =
      '<option value="all">Всички категории</option>' +
      categories.map(category => {
        return `<option value="${category}">${category}</option>`;
      }).join('');

    $('categoryFilter').value = current;
  }

  function filtered() {
    const query = $('searchInput').value.trim().toLowerCase();
    const category = $('categoryFilter').value;

    return expenses.filter(expense => {
      const matchesCategory = category === 'all' || expense.category === category;

      const text = [
        expense.name,
        expense.category,
        expense.description,
        expense.date
      ].join(' ').toLowerCase();

      const matchesSearch = text.includes(query);

      return matchesCategory && matchesSearch;
    });
  }

  function renderList() {
    const list = $('expenseList');

    const items = filtered().sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });

    if (!items.length) {
      list.innerHTML = '<div class="empty">Няма намерени разходи. Добави първия от формата вляво.</div>';
      return;
    }

    list.innerHTML = items.map(expense => {
      return `
        <article class="expense">
          <div>
            <div class="expense-title">${escapeHtml(expense.name)}</div>
            <div class="meta">
              ${escapeHtml(expense.category)} • ${escapeHtml(expense.date || 'без дата')}
              ${expense.description ? '• ' + escapeHtml(expense.description) : ''}
            </div>
          </div>

          <div class="price">${money(expense.amount)}</div>

          <button class="del" data-id="${expense.id}" type="button">Изтрий</button>
        </article>
      `;
    }).join('');
  }

  function renderStats() {
    const { total, biggest, cats } = totals();
    const remaining = budget - total;

    $('heroBudget').textContent = money(budget);
    $('heroSpent').textContent = money(total);

    if (budget) {
      $('heroRemaining').textContent = `Оставащо: ${money(remaining)}`;
    } else {
      $('heroRemaining').textContent = 'Задай месечен бюджет, за да се изчисли оставащата сума.';
    }

    $('budgetStat').textContent = money(budget);
    $('spentStat').textContent = money(total);
    $('remainingStat').textContent = budget ? money(remaining) : '—';

    $('remainingStat').className = budget && remaining < 0 ? 'bad-text' : 'good-text';

    $('countStat').textContent = expenses.length;
    $('avgStat').textContent = money(expenses.length ? total / expenses.length : 0);
    $('catStat').textContent = cats.size;

    if (biggest) {
      $('heroBiggest').textContent = money(biggest.amount);
      $('heroBiggestMeta').textContent = biggest.name + ' • ' + biggest.category;
    } else {
      $('heroBiggest').textContent = '-';
      $('heroBiggestMeta').textContent = 'Все още няма добавени разходи.';
    }

    renderBudget();
  }

  function renderBars() {
    const box = $('categoryBars');
    const { total } = totals();

    if (!expenses.length) {
      box.innerHTML = '<div class="empty">Категориите ще се покажат след добавяне на разходи.</div>';
      return;
    }

    const sums = {};

    expenses.forEach(expense => {
      sums[expense.category] = (sums[expense.category] || 0) + Number(expense.amount);
    });

    box.innerHTML = Object.entries(sums)
      .sort((a, b) => b[1] - a[1])
      .map(([category, sum]) => {
        const width = total ? Math.max(4, (sum / total) * 100) : 0;

        return `
          <div class="bar-row">
            <strong>${category}</strong>
            <div class="bar">
              <span style="width:${width}%"></span>
            </div>
            <span>${money(sum)}</span>
          </div>
        `;
      }).join('');
  }

  function renderBudget() {
    const total = totals().total;

    if (!budget) {
      $('budgetText').textContent = 'Няма зададен бюджет.';
      $('budgetProgress').style.width = '0%';
      return;
    }

    const percent = Math.min(100, (total / budget) * 100);
    const left = budget - total;

    $('budgetProgress').style.width = percent + '%';

    if (left >= 0) {
      $('budgetText').textContent = `Използвани ${money(total)} от ${money(budget)}. Остават ${money(left)}.`;
    } else {
      $('budgetText').textContent = `Над бюджета с ${money(Math.abs(left))}.`;
    }
  }

  function render() {
    renderFilters();
    renderList();
    renderStats();
    renderBars();
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, match => {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;'
      }[match];
    });
  }

  $('expenseForm').addEventListener('submit', event => {
    event.preventDefault();

    const name = $('expenseName').value;
    const amountRaw = $('expenseAmount').value;

    const error = validate(name, amountRaw);

    if (error) {
      showMessage('error', error);
      return;
    }

    const expense = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: name.trim(),
      category: $('expenseCategory').value,
      amount: Number(String(amountRaw).replace(',', '.')),
      date: $('expenseDate').value || new Date().toISOString().slice(0, 10),
      description: $('expenseDescription').value.trim()
    };

    expenses.push(expense);
    save();

    console.log('Added expense:', expense);
    console.log('expenses:', expenses);
    console.log('total:', totals().total);

    event.target.reset();
    $('expenseDate').valueAsDate = new Date();

    showMessage('success', 'Разходът е добавен успешно.');
    render();
  });

  $('expenseList').addEventListener('click', event => {
    if (event.target.matches('.del')) {
      expenses = expenses.filter(expense => expense.id !== event.target.dataset.id);
      save();
      render();
    }
  });

  $('searchInput').addEventListener('input', renderList);
  $('categoryFilter').addEventListener('change', renderList);

  $('saveBudget').addEventListener('click', () => {
    const value = Number(String($('budgetInput').value).replace(',', '.'));

    if (Number.isNaN(value) || value < 0) {
      alert('Въведи валиден бюджет.');
      return;
    }

    budget = value;
    localStorage.setItem(budgetKey, String(budget));

    renderStats();
    renderBudget();
  });

  function setNotesStatus(text) {
    $('notesStatus').textContent = text;
  }

  $('notesArea').addEventListener('input', () => {
    setNotesStatus('Има незапазени промени.');
  });

  $('saveNotes').addEventListener('click', () => {
    localStorage.setItem(notesKey, $('notesArea').value);
    setNotesStatus('Бележката е запазена.');
  });

  $('clearNotes').addEventListener('click', () => {
    if (confirm('Сигурна ли си, че искаш да изчистиш бележката?')) {
      $('notesArea').value = '';
      localStorage.removeItem(notesKey);
      setNotesStatus('Бележката е изчистена.');
    }
  });

  $('themeBtn').addEventListener('click', () => {
    document.body.classList.toggle('dark');

    const dark = document.body.classList.contains('dark');

    localStorage.setItem(themeKey, dark ? 'dark' : 'light');
    $('themeBtn').textContent = dark ? '☀️ Светла тема' : '🌙 Тъмна тема';
  });

  $('sampleBtn').addEventListener('click', () => {
    const today = new Date().toISOString().slice(0, 10);

    expenses = [
      {
        id: 's1' + Date.now(),
        name: 'Храна',
        category: 'Храна',
        amount: 42.30,
        date: today,
        description: 'Седмично пазаруване'
      },
      {
        id: 's2' + Date.now(),
        name: 'Автобус',
        category: 'Транспорт',
        amount: 8.00,
        date: today,
        description: 'Билети'
      },
      {
        id: 's3' + Date.now(),
        name: 'Интернет',
        category: 'Дом',
        amount: 28.99,
        date: today,
        description: 'Месечна такса'
      }
    ];

    save();
    render();
  });

  render();
})();