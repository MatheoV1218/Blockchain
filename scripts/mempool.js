// Retrieve selected miner
const selectedMiner = localStorage.getItem("selectedMiner");

// Select the table body for transactions
const urlParams = new URLSearchParams(window.location.search);
const minerNumber = urlParams.get("miner");
const coinsTraded = urlParams.get("coins");
const tableBody = document.querySelector("#blockchainTable tbody");

// Load existing transactions from localStorage
let transactions = JSON.parse(localStorage.getItem("mempoolTransactions")) || [];

function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    return minersMines[selectedMiner] || 0;
}

function updateMineCounter() {
    document.getElementById("mine-counter").innerText = getCurrentMinerMines();
}

function renderTransactions() {
    tableBody.innerHTML = "";
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
    if (getCurrentMinerMines() > 0) {
        showDeleteButton();
    } else {
        removeDeleteButton();
    }
}

function transactionToString(transaction, index) {
    return `#${index + 1} | Miner #${transaction.miner} | Coins Traded: ${transaction.coins} | Date: ${transaction.date} | Time: ${transaction.time}`;
}

function addTransaction(miner, coins) {
    if (!miner || !coins) return;

    const now = new Date();
    const transaction = {
        miner,
        coins: Number(coins),
        date: now.toLocaleDateString(),
        time: now.toLocaleTimeString(),
    };

    transactions.push(transaction);
    localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));
    renderTransactions();
}

// ✅ SHA-256 hash function
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// ✅ Create a full block object
async function createBlock(transactions, previousHash, index) {
    const blockData = JSON.stringify(transactions) + previousHash;
    const hash = await sha256(blockData);
    return {
        index,
        timestamp: new Date().toISOString(),
        transactions,
        previousHash,
        hash
    };
}

// ✅ Delete (mine) transactions and store block
async function deleteSelectedTransactions() {
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

    const blockchain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
    const previousHash = blockchain.length > 0 ? blockchain[blockchain.length - 1].hash : "0";

    const indexesToDelete = Array.from(checkboxes)
        .map(cb => parseInt(cb.dataset.index))
        .sort((a, b) => b - a);

    const minedTransactions = [];
    indexesToDelete.forEach(index => {
        const removed = transactions.splice(index, 1)[0];
        const summary = transactionToString(removed, index);
        minedTransactions.push(summary);
    });

    const newBlock = await createBlock(minedTransactions, previousHash, blockchain.length);
    blockchain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(blockchain));

    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
    localStorage.setItem("minersMines", JSON.stringify(minersMines));

    localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));
    renderTransactions();
    updateMineCounter();
}

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

function removeDeleteButton() {
    let deleteButton = document.getElementById("delete-transactions-btn");
    if (deleteButton) {
        deleteButton.remove();
    }
}

if (minerNumber && coinsTraded) {
    addTransaction(minerNumber, coinsTraded);
}

renderTransactions();
updateMineCounter();
