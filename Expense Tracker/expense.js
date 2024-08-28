const transactionsList = document.getElementById('transactions');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netIncomeEl = document.getElementById('net-income');
const transactionForm = document.getElementById('transaction-form');
const filterCategoryEl = document.getElementById('filter-category');
const expenseChartEl = document.getElementById('expense-chart');
const exportDataBtn = document.getElementById('export-data');
const importDataInput = document.getElementById('import-data');

let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let chart; // Global variable to hold the chart instance

function updateUI() {
    const filteredTransactions = filterTransactions();
    transactionsList.innerHTML = '';
    let totalIncome = 0;
    let totalExpenses = 0;
    const categoryTotals = {};

    filteredTransactions.forEach(transaction => {
        const li = document.createElement('li');
        li.classList.add(transaction.type === 'income' ? 'income' : 'expense');
        li.innerHTML = `
            ${transaction.date} - ${transaction.description} (${transaction.category}): $${transaction.amount.toFixed(2)}
            <button onclick="editTransaction(${transaction.id})">Edit</button>
            <button onclick="removeTransaction(${transaction.id})">X</button>
        `;
        transactionsList.appendChild(li);

        if (transaction.type === 'income') {
            totalIncome += transaction.amount;
        } else {
            totalExpenses += transaction.amount;
            categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
        }
    });

    totalIncomeEl.textContent = `$${totalIncome.toFixed(2)}`;
    totalExpensesEl.textContent = `$${totalExpenses.toFixed(2)}`;
    netIncomeEl.textContent = `$${(totalIncome - totalExpenses).toFixed(2)}`;

    updateChart(categoryTotals); // Update the chart with the new data

    localStorage.setItem('transactions', JSON.stringify(transactions));
    populateCategoryFilter(); // Update category filter after updating UI
}

function addTransaction(e) {
    e.preventDefault();

    const date = document.getElementById('date').value;
    const description = document.getElementById('description').value;
    const category = document.getElementById('category').value;
    const amount = parseFloat(document.getElementById('amount').value);

    if (!date || !description || !category || isNaN(amount)) {
        alert('Please fill out all fields with valid data.');
        return;
    }

    const transaction = {
        id: Date.now(),
        date,
        description,
        category,
        amount,
        type: amount >= 0 ? 'income' : 'expense'
    };

    transactions.push(transaction);
    updateUI();

    transactionForm.reset();
}

function removeTransaction(id) {
    transactions = transactions.filter(transaction => transaction.id !== id);
    updateUI();
}

function editTransaction(id) {
    const transaction = transactions.find(transaction => transaction.id === id);
    document.getElementById('date').value = transaction.date;
    document.getElementById('description').value = transaction.description;
    document.getElementById('category').value = transaction.category;
    document.getElementById('amount').value = transaction.amount;
    
    removeTransaction(id); // Remove the transaction to update it later
}

function filterTransactions() {
    const category = filterCategoryEl.value;
    if (category === 'all') {
        return transactions;
    } else {
        return transactions.filter(transaction => transaction.category === category);
    }
}

function populateCategoryFilter() {
    const categories = [...new Set(transactions.map(transaction => transaction.category))];
    const currentCategory = filterCategoryEl.value;
    
    filterCategoryEl.innerHTML = '<option value="all">All</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        filterCategoryEl.appendChild(option);
    });

    // Re-select the previous filter category, or default to "All"
    if (categories.includes(currentCategory)) {
        filterCategoryEl.value = currentCategory;
    } else {
        filterCategoryEl.value = 'all';
    }
}

function updateChart(categoryTotals) {
    const chartData = {
        labels: Object.keys(categoryTotals),
        datasets: [{
            data: Object.values(categoryTotals),
            backgroundColor: ['#ff6384', '#36a2eb', '#cc65fe', '#ffce56', '#ffa726', '#8d6e63'],
        }]
    };

    if (chart) {
        chart.destroy(); // Destroy the old chart instance before creating a new one
    }

    chart = new Chart(expenseChartEl, {
        type: 'pie',
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(transactions));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "transactions.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importData(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(event) {
        transactions = JSON.parse(event.target.result);
        updateUI();
    };
    reader.readAsText(file);
}

transactionForm.addEventListener('submit', addTransaction);
filterCategoryEl.addEventListener('change', updateUI);
exportDataBtn.addEventListener('click', exportData);
importDataInput.addEventListener('change', importData);

updateUI();
