# SpendWise — Personal Expense Manager

A multi-page, fully functional front-end web application to track income, expenses and a monthly budget.
All data is stored in the browser using **LocalStorage** — no backend, no signup.

## How to run

1. Unzip the folder.
2. Open `index.html` in any browser (or right-click → Open with Live Server in VS Code).
3. Go to **Transactions**, add a few entries, then check **Dashboard**, **Budget** and **Reports**.

Internet is needed on first load for the Font Awesome and Chart.js CDNs.

## Pages

| File | What it does |
|---|---|
| `index.html` | Hero with live balance, features, how it works, statistics, CTA |
| `dashboard.html` | Summary cards, budget snapshot, top categories, recent transactions, monthly summary, quick actions, reset data |
| `transactions.html` | Totals, add form with validation, search + type + category filters, full table with delete |
| `budget.html` | Budget stats, set/remove budget, progress bar with warning levels, category split, tips |
| `reports.html` | Overview stats, doughnut / pie / bar / line charts, biggest-category ranking |
| `about.html` | Project info, features, technologies, build timeline, developer |
| `contact.html` | Contact details, validated form with success message, FAQ accordion, CTA |

## Folder structure

```
SpendWise/
├── index.html
├── dashboard.html
├── transactions.html
├── budget.html
├── reports.html
├── about.html
├── contact.html
├── css/
│   ├── style.css        (global: variables, navbar, cards, forms, tables, footer)
│   ├── pages.css        (home, about, contact sections)
│   ├── dashboard.css    (dashboard, transactions, budget, reports)
│   └── responsive.css   (all media queries — loaded last)
├── js/
│   ├── main.js          (core: LocalStorage, calculations, formatting, navbar, toast)
│   ├── home.js
│   ├── transactions.js
│   ├── dashboard.js
│   ├── budget.js
│   ├── reports.js
│   └── contact.js
└── assets/images/
```

## JavaScript concepts used

- Objects and object literals (`SW`, `CATEGORIES`)
- Arrays: `filter`, `map`, `reduce`, `sort`, `forEach`, `slice`
- `JSON.parse` / `JSON.stringify` with LocalStorage
- DOM selection, creation and event handling
- Form validation with inline error messages and regex (email, phone)
- Date handling and Indian number formatting
- `try...catch` error handling
- Dynamic Chart.js configuration from stored data

## Data flow

```
Add Transaction → Validate Form → Save to LocalStorage
      → Update Dashboard → Calculate Income / Expense / Balance
      → Update Budget progress → Update Reports & Charts
```

## Technologies

HTML5 · CSS3 · JavaScript (ES5-safe) · LocalStorage · Font Awesome 6.5.2 · Chart.js 4.4.1

All icons come from the Font Awesome CDN — no emoji anywhere in the project.
