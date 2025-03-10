// Retrieve selected miner
const selectedMiner = localStorage.getItem("selectedMiner");

// Select the table body for transactions
const urlParams = new URLSearchParams(window.location.search);
const minerNumber = urlParams.get("miner");
const coinsTraded = urlParams.get("coins");
const tableBody = document.querySelector("#blockchainTable tbody");

// Load existing transactions from localStorage
let transactions = JSON.parse(localStorage.getItem("mempoolTransactions")) || [];

// Load Mines for the current miner
function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    return minersMines[selectedMiner] || 0;
}

// Function to update the Mine counter on the page
function updateMineCounter() {
    document.getElementById("mine-counter").innerText = getCurrentMinerMines();
}

// Function to render transactions from localStorage
function renderTransactions() {
    tableBody.innerHTML = ""; // Clear table before rendering

    // Sort transactions in descending order by coin cost
    transactions.sort((a, b) => b.coins - a.coins);

    transactions.forEach((transaction, index) => {
        const newRow = document.createElement("tr");
        newRow.innerHTML = `
            <td><input type="checkbox" class="transaction-checkbox" data-index="${index}"></td>
            <td>${index + 1}</td>
            <td>${transaction.miner}</td>
            <td>Coins Traded: ${transaction.coins}</td>
            <td class="date">${transaction.date}</td>
            <td class="time">${transaction.time}</td>
        `;
        tableBody.appendChild(newRow);
    });

    // Ensure delete button visibility
    if (getCurrentMinerMines() > 0) {
        showDeleteButton();
    } else {
        removeDeleteButton();
    }
}

// Function to add a new transaction (Original functionality remains untouched)
function addTransaction(miner, coins) {
    if (!miner || !coins) {
        console.warn("Invalid transaction data.");
        return;
    }

    const now = new Date();
    const transaction = {
        miner,
        coins: Number(coins), // Ensure it's stored as a number
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
    };

    transactions.push(transaction);
    localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));

    renderTransactions();
}

// If valid parameters are present, add the new transaction (Original behavior is intact)
if (minerNumber && coinsTraded) {
    addTransaction(minerNumber, coinsTraded);
}

// Function to delete selected transactions (up to 5) if the miner has at least 1 mine
function deleteSelectedTransactions() {
    let availableMines = getCurrentMinerMines();

    if (availableMines <= 0) {
        alert("You have no mines left to delete transactions.");
        return;
    }

    const checkboxes = document.querySelectorAll(".transaction-checkbox:checked");
    if (checkboxes.length === 0) {
        alert("Please select transactions to delete.");
        return;
    }

    if (checkboxes.length > 5) {
        alert("You can only delete up to 5 transactions at a time.");
        return;
    }

    // Get selected indexes and remove from transactions array
    const indexesToDelete = Array.from(checkboxes).map(cb => parseInt(cb.dataset.index));
    transactions = transactions.filter((_, index) => !indexesToDelete.includes(index));

    // Deduct one mine from the miner
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1); // Prevent negative mines
    localStorage.setItem("minersMines", JSON.stringify(minersMines));

    // Update localStorage
    localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));

    // Re-render transactions and update the mine counter
    renderTransactions();
    updateMineCounter();
}

// Function to show delete button for miners with at least one mine
function showDeleteButton() {
    let deleteButton = document.getElementById("delete-transactions-btn");

    if (!deleteButton) {
        deleteButton = document.createElement("button");
        deleteButton.id = "delete-transactions-btn";
        deleteButton.innerText = "Mine Transactions (Max 5)";
        deleteButton.onclick = deleteSelectedTransactions;

        document.getElementById("delete-button-container").appendChild(deleteButton);
    }
}

// Function to remove the delete button if the miner has no mines left
function removeDeleteButton() {
    let deleteButton = document.getElementById("delete-transactions-btn");
    if (deleteButton) {
        deleteButton.remove();
    }
}

// Render transactions when the page loads (Restores original behavior)
renderTransactions();
updateMineCounter();
