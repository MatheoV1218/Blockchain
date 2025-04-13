document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM fully loaded – initializing decentralized mempool display.");
  
    const selectedMiner = localStorage.getItem("selectedMiner");
    let transactions = [];
    let globalMined = [];
  
    const gun = Gun({ 
      peers: ['http://localhost:3000/gun', 'http://192.168.1.172:3000/gun'] 
    });
  
    const mempoolGun = gun.get('mempoolTransactions');
    const minedTxGun = gun.get('minedTransactions');
    const blockchainGun = gun.get('blockchainLedger');
  
    function getCurrentMinerMines() {
      let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
      if (minersMines[selectedMiner] === undefined) {
        minersMines[selectedMiner] = 5;
        localStorage.setItem("minersMines", JSON.stringify(minersMines));
      }
      return minersMines[selectedMiner];
    }
  
    function updateMineCounter() {
      const mines = getCurrentMinerMines();
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
  
    function renderMempool() {
      const tableBody = document.querySelector("#blockchainTable tbody");
      if (!tableBody) return;
      tableBody.innerHTML = "";
  
      transactions.forEach((tx, index) => {
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
  
    function removeMineButton() {
      let mineButton = document.getElementById("mine-transaction-btn");
      if (mineButton) {
        mineButton.remove();
      }
    }
  
    function transactionToString(tx, index) {
      return `#${index + 1} | Miner #${tx.miner} | Coins Traded: ${tx.coins} | Date: ${tx.date} | Time: ${tx.time}`;
    }
  
    async function sha256(message) {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  
    async function createBlock(transactionsSummary, previousHash, index) {
        const blockData = JSON.stringify(transactionsSummary) + previousHash;
        const hash = await sha256(blockData);
        return {
          index,
          timestamp: new Date().toISOString(),
          transactions: { ...transactionsSummary }, // 🔧 Convert array to object
          previousHash,
          hash
        };
      }
      
      async function mineSelectedTransaction() {
        console.log("🔨 Mine Transaction button clicked");
      
        let availableMines = getCurrentMinerMines();
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
      
        const blockchain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
        const previousHash = blockchain.length > 0 ? blockchain[blockchain.length - 1].hash : "0";
      
        const summary = transactionToString(transactionToMine, index);
        const newBlock = await createBlock([summary], previousHash, blockchain.length);
      
        console.log("✅ Created new block:", newBlock);
      
        blockchain.push(newBlock);
        localStorage.setItem("blockchainLedger", JSON.stringify(blockchain));
      
        let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
        minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
        localStorage.setItem("minersMines", JSON.stringify(minersMines));
      
        minedTxGun.set({ timestamp: transactionToMine.timestamp });
      
        console.log("🚀 Attempting to push block to Gun with index:", newBlock.index);
      
        // Final Gun write with full logging
        blockchainGun.get(newBlock.index.toString()).put(newBlock, ack => {
          if (ack.err) {
            console.error("❌ Gun put failed:", ack.err);
          } else {
            console.log("✅ Gun put success at index:", newBlock.index);
          }
        });
      
        // Remove transaction locally
        transactions = transactions.filter(tx => tx.timestamp !== transactionToMine.timestamp);
      
        renderMempool();
        updateMineCounter();
      }
      
  
    mempoolGun.map().on(data => {
      if (data && data.timestamp) {
        if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
          transactions.push(data);
          renderMempool();
        }
      }
    });
  
    minedTxGun.map().on(minedData => {
      if (minedData && minedData.timestamp) {
        if (!globalMined.includes(minedData.timestamp)) {
          globalMined.push(minedData.timestamp);
          renderMempool();
        }
      }
    });
  
    renderMempool();
    updateMineCounter();
  });
  