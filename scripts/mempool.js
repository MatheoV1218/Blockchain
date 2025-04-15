document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing decentralized mempool display.");

  // Retrieve the selected miner from localStorage
  const selectedMiner = localStorage.getItem("selectedMiner");

  // Local arrays to store incoming transactions and mined transaction timestamps.
  let transactions = [];
  let globalMined = []; // Contains timestamps for transactions that have been mined

  // Initialize Gun with your peer endpoints
  const gun = Gun({
    peers: ['http://localhost:3000/gun']
  });

  // Set up Gun nodes:
  const mempoolGun = gun.get('mempoolTransactions');
  const minedTxGun = gun.get('minedTransactions');
  const blockchainGun = gun.get('blockchainLedger'); // For storing mined blocks

  // Helper: Get (and initialize if needed) the current miner's available mines.
  function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    if (minersMines[selectedMiner] === undefined) {
      minersMines[selectedMiner] = 5; // Default starting mines value
      localStorage.setItem("minersMines", JSON.stringify(minersMines));
    }
    return minersMines[selectedMiner];
  }

  // Update the mine counter display and toggle the Mine button.
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

  // Render the mempool transactions in a sequential, gap-free order.
  function renderMempool() {
    const tableBody = document.querySelector("#blockchainTable tbody");
    if (!tableBody) {
      console.error("Table body not found.");
      return;
    }
    // Filter out transactions that have already been mined.
    const visibleTransactions = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    tableBody.innerHTML = "";
    // Render each visible transaction with a new index (1, 2, 3, ...).
    visibleTransactions.forEach((tx, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><input type="checkbox" class="transaction-checkbox" data-index="${index}"></td>
        <td>${index + 1}</td>
        <td>${tx.miner}</td>
        <td>${tx.coins}</td>
        <td>${tx.date}</td>
        <td>${tx.time}</td>
      `;
      tableBody.appendChild(row);
    });
  }

  // Show the Mine Transaction button.
  function showMineButton() {
    let btn = document.getElementById("mine-transaction-btn");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "mine-transaction-btn";
      btn.innerText = "Mine Transaction";
      btn.onclick = mineSelectedTransaction;
      const container = document.getElementById("delete-button-container");
      if (container) {
        container.appendChild(btn);
      }
    }
  }

  // Remove the Mine Transaction button.
  function removeMineButton() {
    const btn = document.getElementById("mine-transaction-btn");
    if (btn) {
      btn.remove();
    }
  }

  // SHA-256 helper function.
  async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Create a new block from an array of transaction objects.
  // Because Gun does not allow top-level arrays in .put(), we convert the array to an object.
  async function createBlock(txArray, previousHash, index) {
    const blockData = JSON.stringify(txArray) + previousHash;
    const hash = await sha256(blockData);
    const txObject = txArray.reduce((acc, tx, i) => {
      acc[i] = tx;
      return acc;
    }, {});
    return {
      index: index,
      timestamp: new Date().toISOString(),
      transactions: txObject,
      previousHash: previousHash,
      hash: hash
    };
  }

  // Get the latest block from Gun's blockchainLedger node.
  function getLatestBlock() {
    return new Promise(resolve => {
      let latest = null;
      blockchainGun.map().once(data => {
        if (data && typeof data.index === "number") {
          if (!latest || data.index > latest.index) {
            latest = data;
          }
        }
      });
      setTimeout(() => {
        resolve(latest);
      }, 500); // Adjust the timeout according to network conditions
    });
  }

  // Mine the selected transaction.
  async function mineSelectedTransaction() {
    console.log("🔨 Mine Transaction button clicked");

    const availableMines = getCurrentMinerMines();
    if (availableMines <= 0) {
      alert("You have no mines left to delete transactions.");
      return;
    }

    // Use the visible transactions array for sequential ordering.
    const visibleTransactions = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    const checkboxes = document.querySelectorAll(".transaction-checkbox:checked");
    if (checkboxes.length !== 1) {
      alert("Please select exactly one transaction to mine.");
      return;
    }
    const visibleIndex = parseInt(checkboxes[0].dataset.index);
    const transactionToMine = visibleTransactions[visibleIndex];
    if (!transactionToMine) {
      alert("Selected transaction not found.");
      return;
    }
    console.log("Transaction to mine:", transactionToMine);

    const latestBlock = await getLatestBlock();
    const previousHash = latestBlock ? latestBlock.hash : "0";
    const newIndex = latestBlock ? latestBlock.index + 1 : 0;

    // Create a new block that stores the full transaction object.
    const newBlock = await createBlock([transactionToMine], previousHash, newIndex);
    console.log("✅ Created new block:", newBlock);

    // (Optional) Save a backup in localStorage.
    let localBlockchain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
    localBlockchain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(localBlockchain));

    // Update the miner's available mines locally.
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - 1);
    localStorage.setItem("minersMines", JSON.stringify(minersMines));

    // Publish the mined transaction's timestamp for mempool sync.
    minedTxGun.set({ timestamp: transactionToMine.timestamp });

    // Push the new block to Gun under its numeric index.
    console.log("🚀 Pushing block to Gun with index:", newBlock.index);
    blockchainGun.get(newBlock.index.toString()).put(newBlock, ack => {
      if (ack.err) {
        console.error("❌ Gun put failed:", ack.err);
      } else {
        console.log("✅ Gun put success at index:", newBlock.index);
      }
    });

    // Remove the mined transaction from the transactions array.
    transactions = transactions.filter(tx => tx.timestamp !== transactionToMine.timestamp);
    renderMempool();
    updateMineCounter();
  }

  // Subscribe to new mempool transactions.
  mempoolGun.map().on(data => {
    if (data && data.timestamp) {
      if (!transactions.some(tx => tx.timestamp === data.timestamp)) {
        transactions.push(data);
        console.log("New transaction received:", data);
        renderMempool();
      }
    }
  });

  // Subscribe to notifications of mined transactions.
  minedTxGun.map().on(minedData => {
    if (minedData && minedData.timestamp) {
      if (!globalMined.includes(minedData.timestamp)) {
        globalMined.push(minedData.timestamp);
        console.log("Global mined transaction received:", minedData.timestamp);
        renderMempool();
      }
    }
  });

  // Initial render and mine counter update.
  renderMempool();
  updateMineCounter();
});
