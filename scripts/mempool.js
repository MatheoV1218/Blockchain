document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded – initializing decentralized mempool display.");
  
    // Retrieve the selected miner from localStorage
    const selectedMiner = localStorage.getItem("selectedMiner");
  
    // Initialize local arrays
    let transactions = [];
    let globalMined = []; // Will be updated in real time from Gun
  
    // Initialize Gun with both peer endpoints
    const gun = Gun({ 
      peers: ['http://localhost:3000/gun', 'http://192.168.1.10:3000/gun'] 
    });
  
    // Set up Gun nodes
    const mempoolGun = gun.get('mempoolTransactions');
    const minedTxGun = gun.get('minedTransactions');
    const blockchainGun = gun.get('blockchainLedger'); // Node for blockchain ledger
  
    // Helper: Get current available mines and initialize if needed.
    function getCurrentMinerMines() {
      let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
      if (minersMines[selectedMiner] === undefined) {
        minersMines[selectedMiner] = 5;  // Default starting mines value
        localStorage.setItem("minersMines", JSON.stringify(minersMines));
      }
      return minersMines[selectedMiner];
    }
  
    // Helper: Update mine counter display and toggle Mine button.
    function updateMineCounter() {
      const mines = getCurrentMinerMines();
      console.log("updateMineCounter -> mines:", mines);
      const mineCounterElem = document.getElementById("mine-counter");
      if (mineCounterElem) {
        mineCounterElem.innerText = mines;
      }
      if (mines > 0) {
        showMineButton();
      } else {
        removeMineButton();
      }
    }
  
    // Render mempool transactions in table.
    function renderMempool() {
      const tableBody = document.querySelector("#blockchainTable tbody");
      if (!tableBody) {
        console.error("Table body not found.");
        return;
      }
      tableBody.innerHTML = "";
      transactions.forEach((tx, index) => {
        // Skip if transaction is globally mined.
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
  
    // Show Mine Transaction button.
    function showMineButton() {
      let mineButton = document.getElementById("mine-transaction-btn");
      if (!mineButton) {
        mineButton = document.createElement("button");
        mineButton.id = "mine-transaction-btn";
        mineButton.innerText = "Mine Transaction";
        mineButton.onclick = mineSelectedTransaction;
        const container = document.getElementById("delete-button-container");
        if (container) container.appendChild(mineButton);
      }
    }
  
    // Remove Mine Transaction button.
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
  
    // SHA-256 helper function.
    async function sha256(message) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return hashHex;
    }
  
    // Create a new block object from transactions.
    async function createBlock(transactionsSummary, previousHash, index) {
      const blockData = JSON.stringify(transactionsSummary) + previousHash;
      const hash = await sha256(blockData);
      return {
        index,
        timestamp: new Date().toISOString(),
        transactions: transactionsSummary,
        previousHash,
        hash
      };
    }
  
    // The function to mine a single, selected transaction.
    async function mineSelectedTransaction() {
      console.log("Mine Transaction button clicked.");
  
      let availableMines = getCurrentMinerMines();
      console.log("Available Mines:", availableMines);
      if (availableMines <= 0) {
        alert("You have no mines left to delete transactions.");
        return;
      }
      
      const checkboxes = document.querySelectorAll(".transaction-checkbox:checked");
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
      
      // Get blockchain ledger from localStorage as backup/local cache.
      const blockchain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
      const previousHash = blockchain.length > 0 ? blockchain[blockchain.length - 1].hash : "0";
      
      // Create summary for the selected transaction.
      const summary = transactionToString(transactionToMine, index);
      const newBlock = await createBlock([summary], previousHash, blockchain.length);
      blockchain.push(newBlock);
      localStorage.setItem("blockchainLedger", JSON.stringify(blockchain));
      
      // Decrement the miner's available mines.
      let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
      minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
      localStorage.setItem("minersMines", JSON.stringify(minersMines));
      
      // Publish the mined transaction's timestamp to Gun.
      minedTxGun.set({ timestamp: transactionToMine.timestamp });
      
      // Push the new block to Gun's blockchain node for P2P distribution.
      blockchainGun.set(newBlock);
      
      // Remove the mined transaction from the local mempool.
      transactions = transactions.filter(tx => tx.timestamp !== transactionToMine.timestamp);
      
      renderMempool();
      updateMineCounter();
    }
  
    // Gun subscriptions for mempool and mined transactions.
    mempoolGun.map().on(data => {
      if (data && data.timestamp) {
        if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
          transactions.push(data);
          console.log("New transaction received:", data);
          renderMempool();
        }
      }
    });
  
    minedTxGun.map().on(minedData => {
      if (minedData && minedData.timestamp) {
        if (!globalMined.includes(minedData.timestamp)) {
          globalMined.push(minedData.timestamp);
          console.log("Global mined transaction received:", minedData.timestamp);
          renderMempool();
        }
      }
    });
  
    // Initial render.
    renderMempool();
    updateMineCounter();
  });
  