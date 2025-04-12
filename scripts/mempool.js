<<<<<<< Updated upstream
// Retrieve selected miner
const selectedMiner = localStorage.getItem("selectedMiner");

// Select the table body for transactions
const urlParams = new URLSearchParams(window.location.search);
const minerNumber = urlParams.get("miner");
const coinsTraded = urlParams.get("coins");
const tableBody = document.querySelector("#blockchainTable tbody");

// Load existing transactions from localStorage
let transactions = JSON.parse(localStorage.getItem("mempoolTransactions")) || [];
=======
// mempool.js
>>>>>>> Stashed changes

// Retrieve the selected miner from localStorage
const selectedMiner = localStorage.getItem("selectedMiner");

// Array to hold mempool transactions and a shared array for mined transactions from Gun
let transactions = [];
let globalMined = [];  // This array will be updated in real time from Gun

// Initialize Gun instance (shared by everything)
const gun = Gun({ peers: ['http://localhost:3000/gun', 'http://192.168.1.19:3000/gun'] });

// Node for mempool transactions and mined transactions.
const mempoolGun = gun.get('mempoolTransactions');
const minedTxGun = gun.get('minedTransactions');

// Function to get current available mines and initialize if necessary.
function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    if (minersMines[selectedMiner] === undefined) {
        minersMines[selectedMiner] = 5;  // Default starting mines value
        localStorage.setItem("minersMines", JSON.stringify(minersMines));
    }
    return minersMines[selectedMiner];
}

// Update the mine counter display and show/hide the Mine button.
function updateMineCounter() {
<<<<<<< Updated upstream
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
=======
    const mines = getCurrentMinerMines();
    console.log("updateMineCounter -> mines:", mines);
    
    document.getElementById("mine-counter").innerText = mines;

    if (mines > 0) {
        showMineButton();
>>>>>>> Stashed changes
    } else {
        removeMineButton();
    }
}

<<<<<<< Updated upstream
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
=======
// Render the mempool transactions in a table.
function renderMempool() {
    const tableBody = document.querySelector("#blockchainTable tbody");
    if (!tableBody) return;
    
    tableBody.innerHTML = "";

    transactions.forEach((tx, index) => {
        // If the transaction is globally marked as mined, skip rendering it.
        if (globalMined.includes(tx.timestamp)) return;
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><input type="checkbox" class="transaction-checkbox" data-index="${index}"></td>
            <td>${index + 1}</td>
            <td>${tx.miner}</td>
            <td>Coins Traded: ${tx.coins}</td>
            <td>${tx.date}</td>
            <td>${tx.time}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Show the Mine Transaction button if it's not already present.
function showMineButton() {
    let mineButton = document.getElementById("mine-transaction-btn");
    if (!mineButton) {
        mineButton = document.createElement("button");
        mineButton.id = "mine-transaction-btn";
        mineButton.innerText = "Mine Transaction";
        mineButton.onclick = mineSelectedTransaction;
        document.getElementById("delete-button-container").appendChild(mineButton);
    }
}

// Remove the Mine Transaction button.
function removeMineButton() {
    let mineButton = document.getElementById("mine-transaction-btn");
    if (mineButton) {
        mineButton.remove();
    }
}

// Convert a transaction object into a summary string.
function transactionToString(tx, index) {
    return `#${index + 1} | Miner #${tx.miner} | Coins Traded: ${tx.coins} | Date: ${tx.date} | Time: ${tx.time}`;
}

// SHA-256 helper function to create a block hash.
>>>>>>> Stashed changes
async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

<<<<<<< Updated upstream
// ✅ Create a full block object
async function createBlock(transactions, previousHash, index) {
    const blockData = JSON.stringify(transactions) + previousHash;
=======
// Create a new block object from transactions.
async function createBlock(transactionsSummary, previousHash, index) {
    const blockData = JSON.stringify(transactionsSummary) + previousHash;
>>>>>>> Stashed changes
    const hash = await sha256(blockData);
    return {
        index,
        timestamp: new Date().toISOString(),
        transactions: transactionsSummary,
        previousHash,
        hash
    };
}

<<<<<<< Updated upstream
// ✅ Delete (mine) transactions and store block
async function deleteSelectedTransactions() {
=======
// The function to mine a single, selected transaction.
async function mineSelectedTransaction() {
    console.log("Mine Transaction button clicked.");

>>>>>>> Stashed changes
    let availableMines = getCurrentMinerMines();
    console.log("Available Mines:", availableMines);
    if (availableMines <= 0) {
        alert("You have no mines left to delete transactions.");
        return;
    }
    
    const checkboxes = document.querySelectorAll(".transaction-checkbox:checked");
    // Ensure exactly one transaction is selected.
    if (checkboxes.length !== 1) {
        alert("Please select exactly one transaction to mine.");
        return;
    }
    
    const index = parseInt(checkboxes[0].dataset.index);
    const transactionToMine = transactions[index];
    if (!transactionToMine) {
        alert("Selected transaction not found.");
        return;
    }
    
    // Get the blockchain ledger from localStorage.
    const blockchain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
    const previousHash = blockchain.length > 0 ? blockchain[blockchain.length - 1].hash : "0";
<<<<<<< Updated upstream

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
=======
    
    // Create a summary string for the selected transaction.
    const summary = transactionToString(transactionToMine, index);
    const newBlock = await createBlock([summary], previousHash, blockchain.length);
>>>>>>> Stashed changes
    blockchain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(blockchain));
    
    // Decrement the miner's available mines by one.
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
    localStorage.setItem("minersMines", JSON.stringify(minersMines));
<<<<<<< Updated upstream

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
=======
    
    // Publish the mined transaction's timestamp to Gun so all peers know it's been mined.
    minedTxGun.set({ timestamp: transactionToMine.timestamp });
    
    // Remove the mined transaction from the local mempool.
    transactions = transactions.filter(tx => tx.timestamp !== transactionToMine.timestamp);
    
    renderMempool();
    updateMineCounter();
}

// Setup Gun subscriptions and render the mempool when DOM is loaded.
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded – initializing decentralized mempool display.");
    
    // Subscribe to new mempool transactions.
    mempoolGun.map().on(data => {
        if (data && data.timestamp) {
            // Only add if not already in the transactions array.
            if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
                transactions.push(data);
                console.log("New transaction received:", data);
                renderMempool();
            }
        }
    });
    
    // Subscribe to the mined transactions from all peers.
    minedTxGun.map().on(minedData => {
        if (minedData && minedData.timestamp) {
            if (!globalMined.includes(minedData.timestamp)) {
                globalMined.push(minedData.timestamp);
                console.log("Global mined transaction:", minedData.timestamp);
                renderMempool();
            }
        }
    });
    
    renderMempool();
    updateMineCounter();
});
>>>>>>> Stashed changes
