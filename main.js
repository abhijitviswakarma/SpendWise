/* ============================================================
   SpendWise - Personal Expense Manager
   File: js/main.js
   Core logic: LocalStorage, calculations, navbar, toast.
   Loaded on EVERY page (must be the first script).
   ============================================================ */

'use strict';

/* ---------- 1. STORAGE KEYS ---------- */
var STORAGE_KEYS = {
    TRANSACTIONS: 'spendwise_transactions',
    BUDGET: 'spendwise_budget'
};

/* ---------- 2. CATEGORY MASTER LIST ---------- */
var CATEGORIES = {
    income: [
        { value: 'Salary',     icon: 'fa-briefcase' },
        { value: 'Freelance',  icon: 'fa-laptop-code' },
        { value: 'Business',   icon: 'fa-store' },
        { value: 'Investment', icon: 'fa-chart-line' },
        { value: 'Gift',       icon: 'fa-gift' },
        { value: 'Other',      icon: 'fa-circle-dot' }
    ],
    expense: [
        { value: 'Food',          icon: 'fa-utensils' },
        { value: 'Transport',     icon: 'fa-bus' },
        { value: 'Shopping',      icon: 'fa-bag-shopping' },
        { value: 'Bills',         icon: 'fa-file-invoice' },
        { value: 'Rent',          icon: 'fa-house' },
        { value: 'Education',     icon: 'fa-graduation-cap' },
        { value: 'Health',        icon: 'fa-kit-medical' },
        { value: 'Entertainment', icon: 'fa-film' },
        { value: 'Other',         icon: 'fa-circle-dot' }
    ]
};

/* ============================================================
   3. SW  -  main application object
   ============================================================ */
var SW = {

    /* ---------- 3.1 READ / WRITE ---------- */
    getTransactions: function () {
        try {
            var raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
            var list = raw ? JSON.parse(raw) : [];
            return Array.isArray(list) ? list : [];
        } catch (err) {
            console.error('Could not read transactions:', err);
            return [];
        }
    },

    saveTransactions: function (list) {
        try {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(list));
            return true;
        } catch (err) {
            console.error('Could not save transactions:', err);
            return false;
        }
    },

    addTransaction: function (transaction) {
        var list = SW.getTransactions();
        transaction.id = Date.now().toString() + Math.floor(Math.random() * 1000);
        transaction.createdAt = new Date().toISOString();
        list.push(transaction);
        return SW.saveTransactions(list);
    },

    deleteTransaction: function (id) {
        var list = SW.getTransactions().filter(function (item) {
            return item.id !== id;
        });
        return SW.saveTransactions(list);
    },

    clearAll: function () {
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.BUDGET);
    },

    /* ---------- 3.2 BUDGET ---------- */
    getBudget: function () {
        var value = parseFloat(localStorage.getItem(STORAGE_KEYS.BUDGET));
        return isNaN(value) ? 0 : value;
    },

    setBudget: function (amount) {
        localStorage.setItem(STORAGE_KEYS.BUDGET, String(amount));
    },

    /* ---------- 3.3 CALCULATIONS ---------- */
    getTotals: function () {
        var list = SW.getTransactions();

        var income = list
            .filter(function (t) { return t.type === 'income'; })
            .reduce(function (sum, t) { return sum + Number(t.amount); }, 0);

        var expense = list
            .filter(function (t) { return t.type === 'expense'; })
            .reduce(function (sum, t) { return sum + Number(t.amount); }, 0);

        return {
            income: income,
            expense: expense,
            balance: income - expense,
            count: list.length
        };
    },

    /* returns "YYYY-MM" for a date string */
    monthKey: function (dateString) {
        return String(dateString).slice(0, 7);
    },

    currentMonthKey: function () {
        var now = new Date();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        return now.getFullYear() + '-' + month;
    },

    /* total expense of the running month */
    getCurrentMonthExpense: function () {
        var key = SW.currentMonthKey();
        return SW.getTransactions()
            .filter(function (t) { return t.type === 'expense' && SW.monthKey(t.date) === key; })
            .reduce(function (sum, t) { return sum + Number(t.amount); }, 0);
    },

    getCurrentMonthIncome: function () {
        var key = SW.currentMonthKey();
        return SW.getTransactions()
            .filter(function (t) { return t.type === 'income' && SW.monthKey(t.date) === key; })
            .reduce(function (sum, t) { return sum + Number(t.amount); }, 0);
    },

    /* { Food: 1200, Rent: 5000 ... } sorted high -> low */
    getCategoryTotals: function (type) {
        var totals = {};
        SW.getTransactions().forEach(function (t) {
            if (t.type !== type) { return; }
            totals[t.category] = (totals[t.category] || 0) + Number(t.amount);
        });

        return Object.keys(totals)
            .map(function (name) { return { category: name, amount: totals[name] }; })
            .sort(function (a, b) { return b.amount - a.amount; });
    },

    /* [{ month:'2026-09', income:0, expense:0 }] oldest -> newest */
    getMonthlyTotals: function () {
        var map = {};
        SW.getTransactions().forEach(function (t) {
            var key = SW.monthKey(t.date);
            if (!map[key]) { map[key] = { month: key, income: 0, expense: 0 }; }
            map[key][t.type] += Number(t.amount);
        });

        return Object.keys(map).sort().map(function (key) { return map[key]; });
    },

    /* ---------- 3.4 FORMATTERS ---------- */
    formatCurrency: function (amount) {
        var number = Number(amount) || 0;
        return '\u20B9' + number.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    },

    formatShortCurrency: function (amount) {
        var number = Number(amount) || 0;
        return '\u20B9' + Math.round(number).toLocaleString('en-IN');
    },

    formatDate: function (dateString) {
        var date = new Date(dateString);
        if (isNaN(date.getTime())) { return dateString; }
        var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
    },

    formatMonth: function (monthKey) {
        var parts = String(monthKey).split('-');
        var months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
        var index = parseInt(parts[1], 10) - 1;
        return (months[index] || '') + ' ' + parts[0];
    },

    todayString: function () {
        var now = new Date();
        var month = String(now.getMonth() + 1).padStart(2, '0');
        var day = String(now.getDate()).padStart(2, '0');
        return now.getFullYear() + '-' + month + '-' + day;
    },

    categoryIcon: function (type, category) {
        var list = CATEGORIES[type] || [];
        var found = list.filter(function (c) { return c.value === category; })[0];
        return found ? found.icon : 'fa-tag';
    },

    /* escape user text before inserting into HTML */
    escape: function (text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    },

    /* ---------- 3.5 TOAST ---------- */
    showToast: function (message, type) {
        var toast = document.getElementById('toast');
        if (!toast) { return; }

        var icon = toast.querySelector('i');
        var text = document.getElementById('toastMessage');

        var iconClass = 'fa-solid fa-circle-check';
        if (type === 'error') { iconClass = 'fa-solid fa-circle-exclamation'; }
        if (type === 'warning') { iconClass = 'fa-solid fa-triangle-exclamation'; }

        if (icon) { icon.className = iconClass; }
        if (text) { text.textContent = message; }

        toast.className = 'toast-' + (type || 'success') + ' show';

        clearTimeout(SW._toastTimer);
        SW._toastTimer = setTimeout(function () {
            toast.className = '';
        }, 3000);
    },

    /* ---------- 3.6 NAVBAR ---------- */
    initNavbar: function () {
        var toggle = document.getElementById('menuToggle');
        var menu = document.getElementById('navMenu');

        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                menu.classList.toggle('open');
                var icon = toggle.querySelector('i');
                if (icon) {
                    icon.className = menu.classList.contains('open')
                        ? 'fa-solid fa-xmark'
                        : 'fa-solid fa-bars';
                }
            });
        }

        /* highlight the current page link automatically */
        var page = window.location.pathname.split('/').pop() || 'index.html';
        var links = document.querySelectorAll('.nav-menu a');
        Array.prototype.forEach.call(links, function (link) {
            if (link.getAttribute('href') === page) {
                link.classList.add('active');
            }
        });
    },

    /* ---------- 3.7 CATEGORY DROPDOWN ---------- */
    fillCategorySelect: function (selectElement, type, keepAll) {
        if (!selectElement) { return; }

        var html = keepAll
            ? '<option value="all">All categories</option>'
            : '<option value="">Select a category</option>';

        (CATEGORIES[type] || []).forEach(function (category) {
            html += '<option value="' + category.value + '">' + category.value + '</option>';
        });

        selectElement.innerHTML = html;
    }
};

/* ---------- 4. RUN ON EVERY PAGE ---------- */
document.addEventListener('DOMContentLoaded', function () {
    SW.initNavbar();
});
