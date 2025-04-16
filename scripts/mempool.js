document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing mempool (Option 2: Using references).");

  // Retrieve the selected miner from localStorage; default to "Miner1" if not set.
  const selectedMiner = localStorage.getItem("selectedMiner") || "Miner1";

  // Local arrays for all transactions and for storing timestamps of transactions that have been mined.
  let transactions = [];
  let globalMined = [];

  // Initialize Gun with your peer endpoints (adjust as needed)
  const gun = Gun({
    peers: [
      'http://localhost:3000/gun',
      'http://192.168.1.107:3000/gun'
    ]
  });

  // Get the Gun nodes.
  const mempoolGun = gun.get('mempoolTransactions');
  const minedTxGun = gun.get('minedTransactions');
  const blockchainGun = gun.get('blockchainLedger');

  // Get or initialize the miner’s available mines.
  function getCurrentMinerMines() {
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    if (minersMines[selectedMiner] === undefined) {
      // Set initial maximum mines to 5.
      minersMines[selectedMiner] = 5;
      localStorage.setItem("minersMines", JSON.stringify(minersMines));
    }
    return minersMines[selectedMiner];
  }

  // Update the displayed mine counter and show/hide the Mine button accordingly.
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

  // Render the mempool transactions as a gap-free, sequential list.
  function renderMempool() {
    const tableBody = document.querySelector("#blockchainTable tbody");
    if (!tableBody) return;
    // Filter out transactions that have been mined.
    const visibleTransactions = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    tableBody.innerHTML = "";
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
    let mineButton = document.getElementById("mine-transaction-btn");
    if (!mineButton) {
      mineButton = document.createElement("button");
      mineButton.id = "mine-transaction-btn";
      mineButton.innerText = "Mine Selected Transaction(s)";
      mineButton.onclick = mineSelectedTransactions;
      const container = document.getElementById("delete-button-container");
      if (container) container.appendChild(mineButton);
    }
  }

  // Remove the Mine Transaction button.
  function removeMineButton() {
    const mineButton = document.getElementById("mine-transaction-btn");
    if (mineButton) {
      mineButton.remove();
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

  // Create a new block with transaction references.
  async function createBlock(txArray, previousHash, index) {
    const blockData = JSON.stringify(txArray) + previousHash;
    const hash = await sha256(blockData);
    const transactionsReferences = {};

    // For each transaction, create a Gun node and store its reference (soul).
    txArray.forEach((tx, i) => {
      // Construct a unique path for each transaction.
      const txPath = `blockchainLedger/${index}/transactions/${i}`;
      const txRef = gun.get(txPath);
      txRef.put(tx);
      // Save the reference key (soul) in the block.
      transactionsReferences[i] = txRef._.soul;
    });

    return {
      index,
      timestamp: new Date().toISOString(),
      transactions: transactionsReferences, // store the references
      previousHash,
      hash,
      minedBy: selectedMiner
    };
  }

  // Get the latest block from Gun.
  function getLatestBlock() {
    return new Promise(resolve => {
      let latest = null;
      blockchainGun.map().once(block => {
        if (block && typeof block.index === "number") {
          if (!latest || block.index > latest.index) {
            latest = block;
          }
        }
      });
      setTimeout(() => resolve(latest), 500);
    });
  }

  // Mine the selected transactions (allow 1 to 5 selections).
  async function mineSelectedTransactions() {
    console.log("🔨 Mine Transaction button clicked.");
    const availableMines = getCurrentMinerMines();
    if (availableMines <= 0) {
      alert("No mines left.");
      return;
    }
    const checkboxes = document.querySelectorAll(".transaction-checkbox:checked");
    if (checkboxes.length < 1) {
      alert("Select at least one transaction.");
      return;
    }
    if (checkboxes.length > 5) {
      alert("You can only mine up to 5 transactions at once.");
      return;
    }
    if (checkboxes.length > availableMines) {
      alert(`You have only ${availableMines} mine(s) left. Choose fewer transactions.`);
      return;
    }
    const visibleTransactions = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    let transactionsToMine = [];
    checkboxes.forEach(cb => {
      const idx = parseInt(cb.dataset.index);
      if (visibleTransactions[idx]) {
        transactionsToMine.push(visibleTransactions[idx]);
      }
    });
    if (transactionsToMine.length === 0) {
      alert("No valid transactions selected.");
      return;
    }
    console.log("Transactions to mine:", transactionsToMine);
    const latestBlock = await getLatestBlock();
    const previousHash = latestBlock ? latestBlock.hash : "0";
    const newIndex = latestBlock ? latestBlock.index + 1 : 0;
    // Create a new block using the transaction references.
    const newBlock = await createBlock(transactionsToMine, previousHash, newIndex);
    console.log("✅ Created new block:", newBlock);
    // Optional: Save the block locally.
    let localChain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
    localChain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(localChain));
    // Decrement available mines.
    let minersMines = JSON.parse(localStorage.getItem("minersMines")) || {};
    minersMines[selectedMiner] = Math.max(0, minersMines[selectedMiner] - transactionsToMine.length);
    localStorage.setItem("minersMines", JSON.stringify(minersMines));
    // Notify other mempool pages of the mined transactions.
    transactionsToMine.forEach(tx => {
      minedTxGun.set({ timestamp: tx.timestamp });
    });
    // Push the new block to Gun.
    console.log("🚀 Pushing block to Gun with index:", newBlock.index);
    blockchainGun.get(newBlock.index.toString()).put(newBlock, ack => {
      if (ack.err) console.error("❌ Gun put failed:", ack.err);
      else console.log("✅ Block stored at index:", newBlock.index);
    });
    // Remove mined transactions from our local transactions.
    transactions = transactions.filter(tx => !transactionsToMine.some(t => t.timestamp === tx.timestamp));
    renderMempool();
    updateMineCounter();
  }

  // Subscribe to new transactions from the mempool.
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

  // Initial render.
  renderMempool();
  updateMineCounter();
});
