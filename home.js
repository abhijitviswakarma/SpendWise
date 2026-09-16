/* ============================================================
   SpendWise
   File: js/home.js
   Home page - live figures in the hero card and stats section
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    var totals = SW.getTotals();

    /* ---------- hero preview card ---------- */
    var heroBalance = document.getElementById('heroBalance');
    var heroIncome = document.getElementById('heroIncome');
    var heroExpense = document.getElementById('heroExpense');
    var heroBar = document.getElementById('heroBar');

    if (heroBalance) { heroBalance.textContent = SW.formatCurrency(totals.balance); }
    if (heroIncome) { heroIncome.textContent = SW.formatCurrency(totals.income); }
    if (heroExpense) { heroExpense.textContent = SW.formatCurrency(totals.expense); }

    if (heroBar) {
        var used = totals.income > 0 ? (totals.expense / totals.income) * 100 : 0;
        if (used > 100) { used = 100; }
        setTimeout(function () { heroBar.style.width = used.toFixed(1) + '%'; }, 200);
    }

    /* ---------- statistics section ---------- */
    var categoriesUsed = {};
    SW.getTransactions().forEach(function (t) { categoriesUsed[t.category] = true; });

    var statTransactions = document.getElementById('statTransactions');
    var statIncome = document.getElementById('statIncome');
    var statExpense = document.getElementById('statExpense');
    var statCategories = document.getElementById('statCategories');

    if (statTransactions) { statTransactions.textContent = totals.count; }
    if (statIncome) { statIncome.textContent = SW.formatShortCurrency(totals.income); }
    if (statExpense) { statExpense.textContent = SW.formatShortCurrency(totals.expense); }
    if (statCategories) { statCategories.textContent = Object.keys(categoriesUsed).length; }
});
