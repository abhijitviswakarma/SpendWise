/* ============================================================
   SpendWise
   File: js/dashboard.js
   Summary cards, recent transactions, budget snapshot,
   category breakdown and monthly summary
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var totals = SW.getTotals();

    /* ---------- 1. SUMMARY CARDS ---------- */
    setText('totalIncome', SW.formatCurrency(totals.income));
    setText('totalExpense', SW.formatCurrency(totals.expense));
    setText('currentBalance', SW.formatCurrency(totals.balance));
    setText('transactionCount', totals.count + (totals.count === 1 ? ' entry' : ' entries'));

    var balanceEl = document.getElementById('currentBalance');
    if (balanceEl) {
        balanceEl.classList.remove('text-success', 'text-danger');
        balanceEl.classList.add(totals.balance < 0 ? 'text-danger' : 'text-success');
    }

    var savingRate = totals.income > 0
        ? ((totals.balance / totals.income) * 100)
        : 0;
    setText('savingRate', totals.income > 0 ? savingRate.toFixed(1) + '% of income saved' : 'Add income to see this');

    /* ---------- 2. BUDGET SNAPSHOT ---------- */
    var budget = SW.getBudget();
    var monthExpense = SW.getCurrentMonthExpense();
    var remaining = budget - monthExpense;
    var percent = budget > 0 ? (monthExpense / budget) * 100 : 0;

    setText('budgetAmount', budget > 0 ? SW.formatCurrency(budget) : 'Not set');
    setText('budgetSpent', SW.formatCurrency(monthExpense));
    setText('budgetRemaining', budget > 0 ? SW.formatCurrency(remaining) : '-');
    setText('budgetMonth', SW.formatMonth(SW.currentMonthKey()));

    var fill = document.getElementById('budgetProgress');
    var status = document.getElementById('budgetStatus');

    if (fill) {
        var width = percent > 100 ? 100 : percent;
        fill.className = 'progress-fill ' + levelClass(percent);
        setTimeout(function () { fill.style.width = width.toFixed(1) + '%'; }, 200);
    }
    setText('budgetPercent', budget > 0 ? percent.toFixed(1) + '% used' : '0% used');

    if (status) {
        if (budget <= 0) {
            status.className = 'alert alert-info';
            status.innerHTML = '<i class="fa-solid fa-circle-info"></i> No monthly budget set. Set one on the Budget page.';
        } else if (percent >= 100) {
            status.className = 'alert alert-danger';
            status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Budget crossed by ' +
                SW.formatCurrency(Math.abs(remaining)) + ' this month.';
        } else if (percent >= 80) {
            status.className = 'alert alert-warning';
            status.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Only ' +
                SW.formatCurrency(remaining) + ' left in this month\'s budget.';
        } else {
            status.className = 'alert alert-success';
            status.innerHTML = '<i class="fa-solid fa-circle-check"></i> Spending is on track. ' +
                SW.formatCurrency(remaining) + ' still available.';
        }
    }

    /* ---------- 3. RECENT TRANSACTIONS ---------- */
    var recentBody = document.getElementById('recentBody');
    var recentEmpty = document.getElementById('recentEmpty');

    if (recentBody) {
        var recent = SW.getTransactions()
            .sort(function (a, b) { return new Date(b.date) - new Date(a.date); })
            .slice(0, 6);

        if (recent.length === 0) {
            recentBody.innerHTML = '';
            if (recentEmpty) { recentEmpty.classList.remove('hidden'); }
        } else {
            if (recentEmpty) { recentEmpty.classList.add('hidden'); }
            var rows = '';
            recent.forEach(function (t) {
                var isIncome = t.type === 'income';
                rows += '<tr>' +
                    '<td>' + SW.formatDate(t.date) + '</td>' +
                    '<td><span class="badge badge-category">' +
                        '<i class="fa-solid ' + SW.categoryIcon(t.type, t.category) + '"></i>' +
                        SW.escape(t.category) + '</span></td>' +
                    '<td><span class="badge badge-' + t.type + '">' +
                        (isIncome ? 'Income' : 'Expense') + '</span></td>' +
                    '<td class="' + (isIncome ? 'text-success' : 'text-danger') + '"><strong>' +
                        (isIncome ? '+' : '-') + SW.formatCurrency(t.amount) + '</strong></td>' +
                '</tr>';
            });
            recentBody.innerHTML = rows;
        }
    }

    /* ---------- 4. TOP SPENDING CATEGORIES ---------- */
    var catList = document.getElementById('categoryList');
    var catEmpty = document.getElementById('categoryEmpty');

    if (catList) {
        var categories = SW.getCategoryTotals('expense').slice(0, 5);

        if (categories.length === 0) {
            catList.innerHTML = '';
            if (catEmpty) { catEmpty.classList.remove('hidden'); }
        } else {
            if (catEmpty) { catEmpty.classList.add('hidden'); }
            var highest = categories[0].amount;
            var html = '';

            categories.forEach(function (item) {
                var share = highest > 0 ? (item.amount / highest) * 100 : 0;
                html += '<li>' +
                    '<div class="cat-top">' +
                        '<span><i class="fa-solid ' + SW.categoryIcon('expense', item.category) + '"></i>' +
                            SW.escape(item.category) + '</span>' +
                        '<strong>' + SW.formatCurrency(item.amount) + '</strong>' +
                    '</div>' +
                    '<div class="cat-track"><div class="cat-fill" style="width:' + share.toFixed(1) + '%"></div></div>' +
                '</li>';
            });
            catList.innerHTML = html;
        }
    }

    /* ---------- 5. MONTHLY SUMMARY ---------- */
    var monthList = document.getElementById('monthList');
    var monthEmpty = document.getElementById('monthEmpty');

    if (monthList) {
        var months = SW.getMonthlyTotals().slice(-6).reverse();

        if (months.length === 0) {
            monthList.innerHTML = '';
            if (monthEmpty) { monthEmpty.classList.remove('hidden'); }
        } else {
            if (monthEmpty) { monthEmpty.classList.add('hidden'); }
            var listHtml = '<li class="month-head"><span>Month</span><span>Income</span><span>Expense</span><span>Saved</span></li>';

            months.forEach(function (row) {
                var saved = row.income - row.expense;
                listHtml += '<li>' +
                    '<span><strong>' + SW.formatMonth(row.month) + '</strong></span>' +
                    '<span class="text-success">' + SW.formatShortCurrency(row.income) + '</span>' +
                    '<span class="text-danger">' + SW.formatShortCurrency(row.expense) + '</span>' +
                    '<span class="' + (saved < 0 ? 'text-danger' : 'text-primary') + '"><strong>' +
                        SW.formatShortCurrency(saved) + '</strong></span>' +
                '</li>';
            });
            monthList.innerHTML = listHtml;
        }
    }

    /* ---------- 6. RESET ALL DATA ---------- */
    var clearBtn = document.getElementById('clearAllData');
    if (clearBtn) {
        clearBtn.addEventListener('click', function () {
            if (!window.confirm('Delete every transaction and the saved budget? This cannot be undone.')) { return; }
            SW.clearAll();
            SW.showToast('All data cleared.', 'warning');
            setTimeout(function () { window.location.reload(); }, 900);
        });
    }

    /* ---------- helpers ---------- */
    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) { el.textContent = value; }
    }

    function levelClass(value) {
        if (value >= 100) { return 'level-danger'; }
        if (value >= 80) { return 'level-warning'; }
        return 'level-ok';
    }
});
