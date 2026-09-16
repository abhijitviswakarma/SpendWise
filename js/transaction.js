/* ============================================================
   SpendWise
   File: js/transactions.js
   Add / validate / save / search / filter / delete transactions
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', function () {

    /* ---------- element references ---------- */
    var form = document.getElementById('transactionForm');
    var typeRadios = document.querySelectorAll('input[name="type"]');
    var categorySelect = document.getElementById('category');
    var amountInput = document.getElementById('amount');
    var dateInput = document.getElementById('date');
    var noteInput = document.getElementById('note');

    var searchInput = document.getElementById('searchInput');
    var filterType = document.getElementById('filterType');
    var filterCategory = document.getElementById('filterCategory');
    var resetBtn = document.getElementById('resetFilters');

    var tableBody = document.getElementById('transactionTableBody');
    var emptyState = document.getElementById('emptyState');
    var resultCount = document.getElementById('resultCount');

    var sumIncome = document.getElementById('sumIncome');
    var sumExpense = document.getElementById('sumExpense');
    var sumBalance = document.getElementById('sumBalance');
    var sumCount = document.getElementById('sumCount');

    /* ---------- initial setup ---------- */
    if (dateInput) { dateInput.value = SW.todayString(); }
    updateCategoryOptions();
    buildFilterCategories();
    renderTable();
    renderSummary();

    /* ---------- income / expense switch ---------- */
    Array.prototype.forEach.call(typeRadios, function (radio) {
        radio.addEventListener('change', updateCategoryOptions);
    });

    function selectedType() {
        var checked = document.querySelector('input[name="type"]:checked');
        return checked ? checked.value : 'expense';
    }

    function updateCategoryOptions() {
        SW.fillCategorySelect(categorySelect, selectedType(), false);
    }

    function buildFilterCategories() {
        if (!filterCategory) { return; }
        var all = CATEGORIES.income.concat(CATEGORIES.expense);
        var seen = {};
        var html = '<option value="all">All categories</option>';

        all.forEach(function (category) {
            if (seen[category.value]) { return; }
            seen[category.value] = true;
            html += '<option value="' + category.value + '">' + category.value + '</option>';
        });
        filterCategory.innerHTML = html;
    }

    /* ---------- validation ---------- */
    function showError(inputId, message) {
        var input = document.getElementById(inputId);
        var box = document.getElementById(inputId + 'Error');
        if (input) { input.classList.add('input-error'); }
        if (box) { box.textContent = message; }
    }

    function clearErrors() {
        Array.prototype.forEach.call(
            document.querySelectorAll('.error-message'),
            function (box) { box.textContent = ''; }
        );
        Array.prototype.forEach.call(
            document.querySelectorAll('.input-error'),
            function (input) { input.classList.remove('input-error'); }
        );
    }

    function validateForm() {
        clearErrors();
        var valid = true;

        if (!categorySelect.value) {
            showError('category', 'Choose a category for this entry.');
            valid = false;
        }

        var amount = parseFloat(amountInput.value);
        if (amountInput.value.trim() === '') {
            showError('amount', 'Enter the amount.');
            valid = false;
        } else if (isNaN(amount) || amount <= 0) {
            showError('amount', 'Amount must be a number greater than zero.');
            valid = false;
        } else if (amount > 10000000) {
            showError('amount', 'Amount looks too large. Check it once.');
            valid = false;
        }

        if (!dateInput.value) {
            showError('date', 'Pick a date.');
            valid = false;
        }

        if (noteInput && noteInput.value.length > 60) {
            showError('note', 'Keep the note under 60 characters.');
            valid = false;
        }

        return valid;
    }

    /* ---------- submit : add a transaction ---------- */
    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (!validateForm()) {
                SW.showToast('Fix the highlighted fields and try again.', 'error');
                return;
            }

            var saved = SW.addTransaction({
                type: selectedType(),
                category: categorySelect.value,
                amount: parseFloat(amountInput.value),
                date: dateInput.value,
                note: noteInput ? noteInput.value.trim() : ''
            });

            if (!saved) {
                SW.showToast('Storage is full. Delete a few entries first.', 'error');
                return;
            }

            form.reset();
            dateInput.value = SW.todayString();
            updateCategoryOptions();
            clearErrors();

            renderTable();
            renderSummary();
            SW.showToast('Transaction added.', 'success');
        });
    }

    /* ---------- live error clearing ---------- */
    [categorySelect, amountInput, dateInput].forEach(function (field) {
        if (!field) { return; }
        field.addEventListener('input', function () {
            field.classList.remove('input-error');
            var box = document.getElementById(field.id + 'Error');
            if (box) { box.textContent = ''; }
        });
    });

    /* ---------- search & filter ---------- */
    if (searchInput) { searchInput.addEventListener('input', renderTable); }
    if (filterType) { filterType.addEventListener('change', renderTable); }
    if (filterCategory) { filterCategory.addEventListener('change', renderTable); }

    if (resetBtn) {
        resetBtn.addEventListener('click', function () {
            if (searchInput) { searchInput.value = ''; }
            if (filterType) { filterType.value = 'all'; }
            if (filterCategory) { filterCategory.value = 'all'; }
            renderTable();
        });
    }

    function getFilteredList() {
        var keyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
        var type = filterType ? filterType.value : 'all';
        var category = filterCategory ? filterCategory.value : 'all';

        return SW.getTransactions()
            .filter(function (t) {
                if (type !== 'all' && t.type !== type) { return false; }
                if (category !== 'all' && t.category !== category) { return false; }

                if (keyword) {
                    var haystack = (t.category + ' ' + (t.note || '') + ' ' + t.amount + ' ' + t.date).toLowerCase();
                    if (haystack.indexOf(keyword) === -1) { return false; }
                }
                return true;
            })
            .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    }

    /* ---------- render table ---------- */
    function renderTable() {
        if (!tableBody) { return; }

        var list = getFilteredList();
        var total = SW.getTransactions().length;

        if (resultCount) {
            resultCount.textContent = 'Showing ' + list.length + ' of ' + total + ' transactions';
        }

        if (list.length === 0) {
            tableBody.innerHTML = '';
            if (emptyState) {
                emptyState.classList.remove('hidden');
                var heading = emptyState.querySelector('h4');
                var text = emptyState.querySelector('p');
                if (total === 0) {
                    if (heading) { heading.textContent = 'No transactions yet'; }
                    if (text) { text.textContent = 'Add your first income or expense using the form above.'; }
                } else {
                    if (heading) { heading.textContent = 'Nothing matches this search'; }
                    if (text) { text.textContent = 'Change the keyword or clear the filters to see more.'; }
                }
            }
            return;
        }

        if (emptyState) { emptyState.classList.add('hidden'); }

        var rows = '';
        list.forEach(function (t) {
            var isIncome = t.type === 'income';
            rows += '<tr>' +
                '<td>' + SW.formatDate(t.date) + '</td>' +
                '<td><span class="badge badge-' + t.type + '">' +
                    '<i class="fa-solid ' + (isIncome ? 'fa-arrow-up' : 'fa-arrow-down') + '"></i>' +
                    (isIncome ? 'Income' : 'Expense') +
                '</span></td>' +
                '<td><span class="badge badge-category">' +
                    '<i class="fa-solid ' + SW.categoryIcon(t.type, t.category) + '"></i>' +
                    SW.escape(t.category) +
                '</span></td>' +
                '<td>' + (t.note ? SW.escape(t.note) : '<span style="color:var(--gray-300)">-</span>') + '</td>' +
                '<td class="' + (isIncome ? 'text-success' : 'text-danger') + '"><strong>' +
                    (isIncome ? '+' : '-') + SW.formatCurrency(t.amount) +
                '</strong></td>' +
                '<td><button class="btn-icon" data-id="' + t.id + '" aria-label="Delete transaction">' +
                    '<i class="fa-solid fa-trash"></i></button></td>' +
            '</tr>';
        });

        tableBody.innerHTML = rows;

        Array.prototype.forEach.call(
            tableBody.querySelectorAll('.btn-icon'),
            function (button) {
                button.addEventListener('click', function () {
                    handleDelete(button.getAttribute('data-id'));
                });
            }
        );
    }

    /* ---------- delete ---------- */
    function handleDelete(id) {
        if (!window.confirm('Delete this transaction? This cannot be undone.')) { return; }
        SW.deleteTransaction(id);
        renderTable();
        renderSummary();
        SW.showToast('Transaction deleted.', 'warning');
    }

    /* ---------- summary strip ---------- */
    function renderSummary() {
        var totals = SW.getTotals();
        if (sumIncome) { sumIncome.textContent = SW.formatCurrency(totals.income); }
        if (sumExpense) { sumExpense.textContent = SW.formatCurrency(totals.expense); }
        if (sumBalance) { sumBalance.textContent = SW.formatCurrency(totals.balance); }
        if (sumCount) { sumCount.textContent = totals.count; }
    }
});
