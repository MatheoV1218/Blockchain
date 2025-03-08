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
            <td>${index + 1}</td>
            <td>${transaction.miner}</td>
            <td>Coins Traded: ${transaction.coins}</td>
            <td class="date">${transaction.date}</td>
            <td class="time">${transaction.time}</td>
        `;
        tableBody.appendChild(newRow);
    });
}

// Function to add a new transaction
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

// If valid parameters are present, add the new transaction
if (minerNumber && coinsTraded) {
    addTransaction(minerNumber, coinsTraded);
}

// Render transactions when the page loads
renderTransactions();
updateMineCounter(); // Update the Mines counter
