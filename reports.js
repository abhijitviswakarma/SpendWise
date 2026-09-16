/* ============================================================
   SpendWise
   File: js/reports.js
   Charts and analysis built from stored transactions (Chart.js)
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var totals = SW.getTotals();
    var transactions = SW.getTransactions();

    var PALETTE = [
        '#2563eb', '#16a34a', '#ea580c', '#7c3aed', '#0d9488',
        '#dc2626', '#d97706', '#0284c7', '#db2777'
    ];

    /* ---------- 1. OVERVIEW STATS ---------- */
    setText('repIncome', SW.formatCurrency(totals.income));
    setText('repExpense', SW.formatCurrency(totals.expense));
    setText('repBalance', SW.formatCurrency(totals.balance));

    var avgExpense = 0;
    var expenseCount = transactions.filter(function (t) { return t.type === 'expense'; }).length;
    if (expenseCount > 0) { avgExpense = totals.expense / expenseCount; }
    setText('repAverage', SW.formatCurrency(avgExpense));

    /* ---------- 2. NO DATA GUARD ---------- */
    if (transactions.length === 0) {
        showEmpty();
        return;
    }
    hideEmpty();

    if (typeof Chart === 'undefined') {
        console.warn('Chart.js did not load. Charts will be skipped.');
        return;
    }

    Chart.defaults.font.family = "'Segoe UI', Poppins, sans-serif";
    Chart.defaults.color = '#64748b';

    /* ---------- 3. CATEGORY DOUGHNUT ---------- */
    var categoryData = SW.getCategoryTotals('expense');
    var categoryCanvas = document.getElementById('categoryChart');

    if (categoryCanvas && categoryData.length > 0) {
        new Chart(categoryCanvas, {
            type: 'doughnut',
            data: {
                labels: categoryData.map(function (c) { return c.category; }),
                datasets: [{
                    data: categoryData.map(function (c) { return c.amount; }),
                    backgroundColor: PALETTE,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '58%',
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 14, boxWidth: 12 } },
                    tooltip: { callbacks: { label: tooltipCurrency } }
                }
            }
        });
    }

    /* ---------- 4. MONTHLY BAR CHART ---------- */
    var monthly = SW.getMonthlyTotals().slice(-6);
    var monthlyCanvas = document.getElementById('monthlyChart');

    if (monthlyCanvas && monthly.length > 0) {
        new Chart(monthlyCanvas, {
            type: 'bar',
            data: {
                labels: monthly.map(function (m) { return SW.formatMonth(m.month); }),
                datasets: [
                    {
                        label: 'Income',
                        data: monthly.map(function (m) { return m.income; }),
                        backgroundColor: '#16a34a',
                        borderRadius: 6
                    },
                    {
                        label: 'Expense',
                        data: monthly.map(function (m) { return m.expense; }),
                        backgroundColor: '#dc2626',
                        borderRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { boxWidth: 12 } },
                    tooltip: { callbacks: { label: tooltipCurrency } }
                },
                scales: {
                    y: { beginAtZero: true, grid: { color: '#e2e8f0' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    /* ---------- 5. SAVINGS TREND LINE ---------- */
    var trendCanvas = document.getElementById('trendChart');

    if (trendCanvas && monthly.length > 0) {
        new Chart(trendCanvas, {
            type: 'line',
            data: {
                labels: monthly.map(function (m) { return SW.formatMonth(m.month); }),
                datasets: [{
                    label: 'Savings',
                    data: monthly.map(function (m) { return m.income - m.expense; }),
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    fill: true,
                    tension: 0.35,
                    pointRadius: 4,
                    pointBackgroundColor: '#2563eb'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: tooltipCurrency } }
                },
                scales: {
                    y: { grid: { color: '#e2e8f0' } },
                    x: { grid: { display: false } }
                }
            }
        });
    }

    /* ---------- 6. INCOME SOURCES ---------- */
    var incomeData = SW.getCategoryTotals('income');
    var incomeCanvas = document.getElementById('incomeChart');

    if (incomeCanvas && incomeData.length > 0) {
        new Chart(incomeCanvas, {
            type: 'pie',
            data: {
                labels: incomeData.map(function (c) { return c.category; }),
                datasets: [{
                    data: incomeData.map(function (c) { return c.amount; }),
                    backgroundColor: PALETTE.slice().reverse(),
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { padding: 14, boxWidth: 12 } },
                    tooltip: { callbacks: { label: tooltipCurrency } }
                }
            }
        });
    }

    /* ---------- 7. TOP CATEGORY TABLE ---------- */
    var rankBody = document.getElementById('rankBody');
    if (rankBody) {
        if (categoryData.length === 0) {
            rankBody.innerHTML = '<tr><td colspan="4">No expenses recorded yet.</td></tr>';
        } else {
            var html = '';
            categoryData.slice(0, 8).forEach(function (row, index) {
                var share = totals.expense > 0 ? (row.amount / totals.expense) * 100 : 0;
                var count = transactions.filter(function (t) {
                    return t.type === 'expense' && t.category === row.category;
                }).length;

                html += '<tr>' +
                    '<td><span class="rank-badge">' + (index + 1) + '</span></td>' +
                    '<td><span class="badge badge-category">' +
                        '<i class="fa-solid ' + SW.categoryIcon('expense', row.category) + '"></i>' +
                        SW.escape(row.category) + '</span></td>' +
                    '<td>' + count + '</td>' +
                    '<td><strong>' + SW.formatCurrency(row.amount) + '</strong> ' +
                        '<small style="color:var(--gray-500)">(' + share.toFixed(1) + '%)</small></td>' +
                '</tr>';
            });
            rankBody.innerHTML = html;
        }
    }

    /* ---------- 8. INSIGHT LINE ---------- */
    var insight = document.getElementById('reportInsight');
    if (insight) {
        if (categoryData.length > 0) {
            var top = categoryData[0];
            var topShare = totals.expense > 0 ? (top.amount / totals.expense) * 100 : 0;
            insight.className = 'alert alert-info';
            insight.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Most of your spending goes to ' +
                SW.escape(top.category) + ' - ' + SW.formatCurrency(top.amount) +
                ', which is ' + topShare.toFixed(1) + '% of all expenses.';
        } else {
            insight.className = 'alert alert-info';
            insight.innerHTML = '<i class="fa-solid fa-lightbulb"></i> Add a few expenses to see where your money goes.';
        }
    }

    /* ---------- helpers ---------- */
    function tooltipCurrency(context) {
        var label = context.dataset.label ? context.dataset.label + ': ' : (context.label + ': ');
        return label + SW.formatCurrency(context.parsed.y !== undefined && context.parsed.y !== null
            ? context.parsed.y
            : context.parsed);
    }

    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) { el.textContent = value; }
    }

    function showEmpty() {
        var empty = document.getElementById('reportsEmpty');
        var charts = document.getElementById('reportsContent');
        if (empty) { empty.classList.remove('hidden'); }
        if (charts) { charts.classList.add('hidden'); }
    }

    function hideEmpty() {
        var empty = document.getElementById('reportsEmpty');
        var charts = document.getElementById('reportsContent');
        if (empty) { empty.classList.add('hidden'); }
        if (charts) { charts.classList.remove('hidden'); }
    }
});
