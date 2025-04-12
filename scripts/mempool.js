const selectedMiner = localStorage.getItem("selectedMiner");
let transactions = [];

function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    return minersMines[selectedMiner] || 0;
}

function updateMineCounter() {
    const mines = getCurrentMinerMines();
    document.getElementById("mine-counter").innerText = mines;

    if (mines > 0) {
        showDeleteButton();
    } else {
        removeDeleteButton();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded – initializing decentralized mempool display.");

    const gun = Gun({ peers: ['http://localhost:3000/gun'] });
    const mempoolGun = gun.get('mempoolTransactions');

    function renderMempool() {
        const tableBody = document.querySelector("#blockchainTable tbody");
        if (!tableBody) return;

        tableBody.innerHTML = "";

        transactions.forEach((tx, index) => {
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

    // ✅ Prevent mined transactions from being added
    mempoolGun.map().on(data => {
        if (data && data.timestamp) {
            const alreadyMined = JSON.parse(localStorage.getItem("minedTransactionTimestamps")) || [];

            // ✅ Skip if already mined
            if (alreadyMined.includes(data.timestamp)) return;

            // ✅ Skip if already in local array
            if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
                transactions.push(data);
                console.log("New transaction received:", data);
                renderMempool();
            }
        }
    });

    renderMempool();
    updateMineCounter();
});

async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

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

async function deleteSelectedTransactions() {
    console.log("Delete button clicked.");

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
    const minedTimestamps = [];

    indexesToDelete.forEach(index => {
        const removed = transactions[index];
        if (removed) {
            const summary = transactionToString(removed, index);
            minedTransactions.push(summary);
            minedTimestamps.push(removed.timestamp);
        }
    });

    const newBlock = await createBlock(minedTransactions, previousHash, blockchain.length);
    blockchain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(blockchain));

    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
    localStorage.setItem("minersMines", JSON.stringify(minersMines));

    // ✅ Save timestamps of mined transactions to filter them next time
    let alreadyMined = JSON.parse(localStorage.getItem("minedTransactionTimestamps")) || [];
    const updatedMined = [...alreadyMined, ...minedTimestamps];
    localStorage.setItem("minedTransactionTimestamps", JSON.stringify(updatedMined));

    // ✅ Remove them from current array
    transactions = transactions.filter(tx => !minedTimestamps.includes(tx.timestamp));

    renderMempool();
    updateMineCounter();
}

function transactionToString(tx, index) {
    return `#${index + 1} | Miner #${tx.miner} | Coins Traded: ${tx.coins} | Date: ${tx.date} | Time: ${tx.time}`;
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
