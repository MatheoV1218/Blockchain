// Retrieve selected miner
// Retrieve the selected miner from localStorage (this can remain if you still need to persist wallet data)
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing decentralized mempool display.");

  // Initialize Gun with both server peers
  const gun = Gun({
    peers: [
      'http://localhost:3000/gun',
      'http://192.168.1.10:3000/gun'
    ]
  });

  // Get the shared Gun node for mempool transactions
  const mempoolGun = gun.get('mempoolTransactions');

  // Local array to keep all received transactions
  let transactions = [];

  // Function to render transactions from the mempool
  function renderMempool() {
    const tableBody = document.querySelector("#blockchainTable tbody");
    if (!tableBody) {
      console.error("Could not find the table body element.");
      return;
    }
    // Clear the table body
    tableBody.innerHTML = "";
    
    // Add a new row for each transaction
    transactions.forEach((tx, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${tx.miner}</td>
        <td>${tx.coins}</td>
        <td>${tx.date}</td>
        <td>${tx.time}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Subscribe to new transactions from the Gun node.
  // This will be invoked every time a transaction is added by any node.
  mempoolGun.map().on(data => {
    if (data) {
      // Use the unique timestamp to avoid duplicates
      if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
        transactions.push(data);
        console.log("New transaction received:", data);
        renderMempool();
      }
    }
  });

  // Do an initial render in case there are persisted transactions
  renderMempool();
});

  
  

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
