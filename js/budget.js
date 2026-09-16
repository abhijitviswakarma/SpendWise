/* ============================================================
   SpendWise
   File: js/budget.js
   Set a monthly budget, track progress, show warnings
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var form = document.getElementById('budgetForm');
    var budgetInput = document.getElementById('budgetInput');
    var removeBtn = document.getElementById('removeBudget');

    /* ---------- initial load ---------- */
    if (budgetInput && SW.getBudget() > 0) {
        budgetInput.value = SW.getBudget();
    }
    render();

    /* ---------- save budget ---------- */
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            var errorBox = document.getElementById('budgetInputError');
            var value = parseFloat(budgetInput.value);

            budgetInput.classList.remove('input-error');
            if (errorBox) { errorBox.textContent = ''; }

            if (budgetInput.value.trim() === '') {
                budgetInput.classList.add('input-error');
                if (errorBox) { errorBox.textContent = 'Enter a budget amount.'; }
                SW.showToast('Enter a budget amount first.', 'error');
                return;
            }

            if (isNaN(value) || value <= 0) {
                budgetInput.classList.add('input-error');
                if (errorBox) { errorBox.textContent = 'Budget must be greater than zero.'; }
                SW.showToast('Budget must be greater than zero.', 'error');
                return;
            }

            SW.setBudget(value);
            render();
            SW.showToast('Monthly budget saved.', 'success');
        });
    }

    /* ---------- remove budget ---------- */
    if (removeBtn) {
        removeBtn.addEventListener('click', function () {
            if (!window.confirm('Remove the monthly budget?')) { return; }
            SW.setBudget(0);
            if (budgetInput) { budgetInput.value = ''; }
            render();
            SW.showToast('Budget removed.', 'warning');
        });
    }

    /* ---------- render everything ---------- */
    function render() {
        var budget = SW.getBudget();
        var spent = SW.getCurrentMonthExpense();
        var income = SW.getCurrentMonthIncome();
        var remaining = budget - spent;
        var percent = budget > 0 ? (spent / budget) * 100 : 0;

        var daysInMonth = new Date(
            new Date().getFullYear(),
            new Date().getMonth() + 1,
            0
        ).getDate();
        var today = new Date().getDate();
        var daysLeft = daysInMonth - today;
        var dailyAllowance = daysLeft > 0 && remaining > 0 ? remaining / daysLeft : 0;

        setText('currentMonthLabel', SW.formatMonth(SW.currentMonthKey()));
        setText('statBudget', budget > 0 ? SW.formatCurrency(budget) : 'Not set');
        setText('statSpent', SW.formatCurrency(spent));
        setText('statRemaining', budget > 0 ? SW.formatCurrency(remaining) : '-');
        setText('statMonthIncome', SW.formatCurrency(income));
        setText('progressPercent', budget > 0 ? percent.toFixed(1) + '%' : '0%');
        setText('progressSpent', SW.formatCurrency(spent));
        setText('progressBudget', budget > 0 ? SW.formatCurrency(budget) : SW.formatCurrency(0));
        setText('daysLeft', daysLeft + (daysLeft === 1 ? ' day left this month' : ' days left this month'));
        setText('dailyAllowance', budget > 0 && dailyAllowance > 0
            ? SW.formatCurrency(dailyAllowance) + ' per day to stay inside the budget'
            : 'No daily limit to show yet');

        var remainingEl = document.getElementById('statRemaining');
        if (remainingEl) {
            remainingEl.classList.remove('text-success', 'text-danger');
            if (budget > 0) {
                remainingEl.classList.add(remaining < 0 ? 'text-danger' : 'text-success');
            }
        }

        var fill = document.getElementById('budgetProgressBar');
        if (fill) {
            var width = percent > 100 ? 100 : percent;
            fill.className = 'progress-fill ' + levelClass(percent);
            setTimeout(function () { fill.style.width = width.toFixed(1) + '%'; }, 150);
        }

        renderWarning(budget, percent, remaining);
        renderCategoryUsage(budget);
        toggleRemoveButton(budget);
    }

    /* ---------- warning message ---------- */
    function renderWarning(budget, percent, remaining) {
        var box = document.getElementById('budgetWarning');
        if (!box) { return; }

        if (budget <= 0) {
            box.className = 'alert alert-info';
            box.innerHTML = '<i class="fa-solid fa-circle-info"></i> Set a monthly budget to start tracking how much is left.';
            return;
        }

        if (percent >= 100) {
            box.className = 'alert alert-danger';
            box.innerHTML = '<i class="fa-solid fa-circle-exclamation"></i> Budget crossed. You are ' +
                SW.formatCurrency(Math.abs(remaining)) + ' over the limit for this month.';
        } else if (percent >= 90) {
            box.className = 'alert alert-danger';
            box.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Almost finished - only ' +
                SW.formatCurrency(remaining) + ' remains.';
        } else if (percent >= 75) {
            box.className = 'alert alert-warning';
            box.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Three quarters of the budget is used. ' +
                SW.formatCurrency(remaining) + ' left.';
        } else if (percent >= 50) {
            box.className = 'alert alert-warning';
            box.innerHTML = '<i class="fa-solid fa-gauge-high"></i> Half the budget is used. ' +
                SW.formatCurrency(remaining) + ' left for the rest of the month.';
        } else {
            box.className = 'alert alert-success';
            box.innerHTML = '<i class="fa-solid fa-circle-check"></i> Spending is comfortable. ' +
                SW.formatCurrency(remaining) + ' still available.';
        }
    }

    /* ---------- category share of the budget ---------- */
    function renderCategoryUsage(budget) {
        var list = document.getElementById('budgetCategoryList');
        var empty = document.getElementById('budgetCategoryEmpty');
        if (!list) { return; }

        var monthKey = SW.currentMonthKey();
        var totals = {};

        SW.getTransactions().forEach(function (t) {
            if (t.type !== 'expense' || SW.monthKey(t.date) !== monthKey) { return; }
            totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
        });

        var rows = Object.keys(totals)
            .map(function (name) { return { category: name, amount: totals[name] }; })
            .sort(function (a, b) { return b.amount - a.amount; });

        if (rows.length === 0) {
            list.innerHTML = '';
            if (empty) { empty.classList.remove('hidden'); }
            return;
        }
        if (empty) { empty.classList.add('hidden'); }

        var base = budget > 0 ? budget : rows[0].amount;
        var html = '';

        rows.forEach(function (row) {
            var share = base > 0 ? (row.amount / base) * 100 : 0;
            if (share > 100) { share = 100; }
            html += '<li>' +
                '<div class="cat-top">' +
                    '<span><i class="fa-solid ' + SW.categoryIcon('expense', row.category) + '"></i>' +
                        SW.escape(row.category) + '</span>' +
                    '<strong>' + SW.formatCurrency(row.amount) +
                        (budget > 0 ? ' <small style="color:var(--gray-500)">(' + share.toFixed(1) + '%)</small>' : '') +
                    '</strong>' +
                '</div>' +
                '<div class="cat-track"><div class="cat-fill" style="width:' + share.toFixed(1) + '%"></div></div>' +
            '</li>';
        });

        list.innerHTML = html;
    }

    function toggleRemoveButton(budget) {
        if (!removeBtn) { return; }
        if (budget > 0) {
            removeBtn.classList.remove('hidden');
        } else {
            removeBtn.classList.add('hidden');
        }
    }

    /* ---------- helpers ---------- */
    function setText(id, value) {
        var el = document.getElementById(id);
        if (el) { el.textContent = value; }
    }

    function levelClass(value) {
        if (value >= 100) { return 'level-danger'; }
        if (value >= 75) { return 'level-warning'; }
        return 'level-ok';
    }
});
