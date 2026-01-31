// Глобальные переменные
let currentDate = new Date();
let selectedDate = new Date();
let statsDate = new Date();
let expenses = {};

const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const categories = {
    fixed: ['Коммунальные платежи', 'Налоги', 'Аренда', 'Страхование', 'Кредит'],
    variable: ['Питание', 'Топливо', 'Репетиторы', 'Транспорт', 'Одежда', 'Здоровье'],
    other: ['Кино', 'Театр', 'Ресторан', 'Развлечения', 'Подарки', 'Путешествия']
};

const icons = {
    fixed: '🏠',
    variable: '🛒',
    other: '🎭'
};

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('familyExpensesCalendar');
    if (saved) {
        expenses = JSON.parse(saved);
    }
}

// Сохранение данных
function saveData() {
    localStorage.setItem('familyExpensesCalendar', JSON.stringify(expenses));
}

// Форматирование даты
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Переключение вкладок
function switchTab(tab) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    if (tab === 'calendar') {
        document.querySelector('.nav-tab:nth-child(1)').classList.add('active');
        document.getElementById('calendar-tab').classList.add('active');
    } else {
        document.querySelector('.nav-tab:nth-child(2)').classList.add('active');
        document.getElementById('stats-tab').classList.add('active');
        updateStats();
    }
}

// Отрисовка календаря
function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
    
    const container = document.getElementById('calendarDays');
    container.innerHTML = '';
    
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthDays - i;
        const cell = createDayCell(day, true, new Date(year, month - 1, day));
        container.appendChild(cell);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const date = new Date(year, month, day);
        const cell = createDayCell(day, false, date);
        container.appendChild(cell);
    }
    
    const remainingCells = 42 - container.children.length;
    for (let day = 1; day <= remainingCells; day++) {
        const cell = createDayCell(day, true, new Date(year, month + 1, day));
        container.appendChild(cell);
    }
}

function createDayCell(day, otherMonth, date) {
    const cell = document.createElement('div');
    cell.className = 'calendar-day';
    
    if (otherMonth) {
        cell.classList.add('other-month');
    }
    
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
        cell.classList.add('today');
    }
    
    if (date.toDateString() === selectedDate.toDateString()) {
        cell.classList.add('selected');
    }
    
    const dateKey = formatDate(date);
    const dayExpenses = expenses[dateKey];
    let total = 0;
    
    if (dayExpenses && dayExpenses.length > 0) {
        cell.classList.add('has-expenses');
        total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    }
    
    cell.innerHTML = `
        <div class="day-number">${day}</div>
        ${total > 0 ? `<div class="day-total">${formatAmount(total)}</div>` : ''}
    `;
    
    if (!otherMonth) {
        cell.addEventListener('click', () => selectDate(date));
    }
    
    return cell;
}

function formatAmount(amount) {
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(1)}k ₽`;
    }
    return `${amount} ₽`;
}

function selectDate(date) {
    selectedDate = new Date(date);
    renderCalendar();
    updateSelectedDateInfo();
    renderDayExpenses();
}

function updateSelectedDateInfo() {
    const dayName = dayNames[selectedDate.getDay()];
    const dateStr = selectedDate.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long'
    });
    document.getElementById('selectedDateDisplay').textContent = `${dayName}, ${dateStr}`;
}

function renderDayExpenses() {
    const dateKey = formatDate(selectedDate);
    const dayExpenses = expenses[dateKey] || [];
    const container = document.getElementById('dayExpensesList');
    
    if (dayExpenses.length === 0) {
        container.innerHTML = '<div class="empty-state">Нет расходов за этот день</div>';
        document.getElementById('dayTotal').textContent = '0 ₽';
        return;
    }
    
    const total = dayExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    document.getElementById('dayTotal').textContent = `${total.toLocaleString('ru-RU')} ₽`;
    
    container.innerHTML = dayExpenses.map((exp, index) => `
        <div class="expense-item">
            <div class="expense-icon">${icons[exp.type]}</div>
            <div class="expense-details">
                <div class="expense-name">${exp.name}</div>
                <div class="expense-category">${exp.category}</div>
            </div>
            <div class="expense-right">
                <div class="expense-amount">${exp.amount.toLocaleString('ru-RU')} ₽</div>
                <button class="btn-delete" onclick="deleteExpense('${dateKey}', ${index})">Удалить</button>
            </div>
        </div>
    `).join('');
}

function openModal() {
    document.getElementById('expenseModal').classList.add('active');
    document.body.classList.add('modal-open');
}

function closeModal() {
    document.getElementById('expenseModal').classList.remove('active');
    document.body.classList.remove('modal-open');
}

function closeModalOnOverlay(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
    }
}

function addExpense(event) {
    event.preventDefault();
    
    const type = document.getElementById('expenseType').value;
    const category = document.getElementById('expenseCategory').value;
    const name = document.getElementById('expenseName').value;
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    
    const dateKey = formatDate(selectedDate);
    
    if (!expenses[dateKey]) {
        expenses[dateKey] = [];
    }
    
    expenses[dateKey].push({
        type: type,
        category: category,
        name: name,
        amount: amount,
        timestamp: Date.now()
    });
    
    document.getElementById('expenseName').value = '';
    document.getElementById('expenseAmount').value = '';
    
    saveData();
    renderCalendar();
    renderDayExpenses();
    closeModal();
}

function deleteExpense(dateKey, index) {
    if (confirm('Удалить этот расход?')) {
        expenses[dateKey].splice(index, 1);
        if (expenses[dateKey].length === 0) {
            delete expenses[dateKey];
        }
        saveData();
        renderCalendar();
        renderDayExpenses();
    }
}

document.getElementById('expenseType').addEventListener('change', function() {
    const type = this.value;
    const categorySelect = document.getElementById('expenseCategory');
    categorySelect.innerHTML = categories[type].map(cat => 
        `<option value="${cat}">${cat}</option>`
    ).join('');
});

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function goToToday() {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    updateSelectedDateInfo();
    renderDayExpenses();
}

function previousStatsMonth() {
    statsDate.setMonth(statsDate.getMonth() - 1);
    updateStats();
}

function nextStatsMonth() {
    statsDate.setMonth(statsDate.getMonth() + 1);
    updateStats();
}

function goToCurrentMonth() {
    statsDate = new Date();
    updateStats();
}

function updateStats() {
    const year = statsDate.getFullYear();
    const month = statsDate.getMonth();
    
    document.getElementById('statsMonthYear').textContent = `${monthNames[month]} ${year}`;
    
    let totals = { fixed: 0, variable: 0, other: 0 };
    let dailyStats = {};
    
    Object.keys(expenses).forEach(dateKey => {
        const date = new Date(dateKey);
        if (date.getFullYear() === year && date.getMonth() === month) {
            const dayExpenses = expenses[dateKey];
            
            if (!dailyStats[dateKey]) {
                dailyStats[dateKey] = { fixed: 0, variable: 0, other: 0, total: 0 };
            }
            
            dayExpenses.forEach(exp => {
                totals[exp.type] += exp.amount;
                dailyStats[dateKey][exp.type] += exp.amount;
                dailyStats[dateKey].total += exp.amount;
            });
        }
    });
    
    const grandTotal = totals.fixed + totals.variable + totals.other;
    
    document.getElementById('statsFixed').textContent = `${totals.fixed.toLocaleString('ru-RU')} ₽`;
    document.getElementById('statsVariable').textContent = `${totals.variable.toLocaleString('ru-RU')} ₽`;
    document.getElementById('statsOther').textContent = `${totals.other.toLocaleString('ru-RU')} ₽`;
    document.getElementById('statsTotal').textContent = `${grandTotal.toLocaleString('ru-RU')} ₽`;
    
    updateChart(totals.fixed, totals.variable, totals.other);
    updateDailyStatsTable(dailyStats);
}

function updateChart(fixed, variable, other) {
    const maxValue = Math.max(fixed, variable, other, 1);
    const maxHeight = 180;
    
    const barFixed = document.getElementById('barFixed');
    const barVariable = document.getElementById('barVariable');
    const barOther = document.getElementById('barOther');
    
    barFixed.style.height = `${(fixed / maxValue) * maxHeight}px`;
    barFixed.querySelector('.bar-value').textContent = formatAmount(fixed);
    
    barVariable.style.height = `${(variable / maxValue) * maxHeight}px`;
    barVariable.querySelector('.bar-value').textContent = formatAmount(variable);
    
    barOther.style.height = `${(other / maxValue) * maxHeight}px`;
    barOther.querySelector('.bar-value').textContent = formatAmount(other);
}

function updateDailyStatsTable(dailyStats) {
    const tbody = document.getElementById('dailyStatsBody');
    const sortedDates = Object.keys(dailyStats).sort().reverse();
    
    if (sortedDates.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">Нет данных</td></tr>';
        return;
    }
    
    tbody.innerHTML = sortedDates.map(dateKey => {
        const date = new Date(dateKey);
        const stats = dailyStats[dateKey];
        const dateStr = `${date.getDate()}.${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        return `
            <tr>
                <td>${dateStr}</td>
                <td class="stats-amount">${formatAmount(stats.fixed)}</td>
                <td class="stats-amount">${formatAmount(stats.variable)}</td>
                <td class="stats-amount">${formatAmount(stats.other)}</td>
                <td class="stats-amount" style="color: #9b59b6;">${formatAmount(stats.total)}</td>
            </tr>
        `;
    }).join('');
}

// Инициализация
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    renderCalendar();
    updateSelectedDateInfo();
    renderDayExpenses();
    updateStats();
    
    let lastTouchEnd = 0;
    document.addEventListener('touchend', function(event) {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            event.preventDefault();
        }
        lastTouchEnd = now;
    }, false);
});
