// scripts/mempool.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing mempool with global index computation.");

  // ——— State & Persistence ———
  const selectedMiner = localStorage.getItem("selectedMiner") || "Miner1";
  let transactions = JSON.parse(localStorage.getItem("mempoolTransactions")) || [];
  let globalMined  = JSON.parse(localStorage.getItem("minedTransactionTimestamps")) || [];

  // Load or initialize the on‑disk blockchain array
  let localChain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];

  // Compute initial nextBlockIndex from the highest existing index
  let nextBlockIndex = parseInt(localStorage.getItem("nextBlockIndex"), 10);
  if (isNaN(nextBlockIndex)) {
    const maxIndex = localChain.reduce((max, b) => b.index > max ? b.index : max, -1);
    nextBlockIndex = maxIndex + 1;
    localStorage.setItem("nextBlockIndex", nextBlockIndex);
  }

  // ——— Gun Setup ———
  const gun = Gun({
    peers: [
      'http://localhost:3000/gun',
      'http://192.168.1.107:3000/gun'
    ]
  });
  const mempoolGun    = gun.get('mempoolTransactions');
  const minedTxGun    = gun.get('minedTransactions');
  const blockchainGun = gun.get('blockchainLedger');

  // ——— Subscribe to blockchain updates ———
  blockchainGun.map().on((block, key) => {
    if (block && typeof block.index === 'number') {
      const idx = localChain.findIndex(b => b.index === block.index);
      if (idx >= 0) {
        localChain[idx] = block;
      } else {
        localChain.push(block);
      }
      // Persist updated chain
      localStorage.setItem("blockchainLedger", JSON.stringify(localChain));
      // Recompute nextBlockIndex globally
      const maxIndex = localChain.reduce((max, b) => b.index > max ? b.index : max, -1);
      nextBlockIndex = maxIndex + 1;
      localStorage.setItem("nextBlockIndex", nextBlockIndex);
    }
  });

  // ——— Helpers ———
  function getCurrentMinerMines() {
    let mm = JSON.parse(localStorage.getItem("minersMines")) || {};
    if (mm[selectedMiner] == null) {
      mm[selectedMiner] = 5;
      localStorage.setItem("minersMines", JSON.stringify(mm));
    }
    return mm[selectedMiner];
  }

  function updateMineCounter() {
    const mines = getCurrentMinerMines();
    document.getElementById("mine-counter").innerText = mines;
    if (mines > 0) showMineButton();
    else removeMineButton();
  }

  function renderMempool() {
    const tbody = document.querySelector("#blockchainTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    const visible = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    visible.forEach((tx, i) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="transaction-checkbox" data-index="${i}"></td>
        <td>${i + 1}</td>
        <td>${tx.miner}</td>
        <td>${tx.coins}</td>
        <td>${tx.date}</td>
        <td>${tx.time}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function showMineButton() {
    if (document.getElementById("mine-transaction-btn")) return;
    const btn = document.createElement("button");
    btn.id = "mine-transaction-btn";
    btn.innerText = "Mine Selected Transaction(s)";
    btn.onclick = mineSelectedTransactions;
    document.getElementById("delete-button-container").appendChild(btn);
  }

  function removeMineButton() {
    const btn = document.getElementById("mine-transaction-btn");
    if (btn) btn.remove();
  }

  function transactionToString(tx, idx) {
    return `#${idx + 1} | Miner: ${tx.miner} | Coins: ${tx.coins} | Date: ${tx.date} | Time: ${tx.time}`;
  }

  async function sha256(msg) {
    const buf = new TextEncoder().encode(msg);
    const hashBuf = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async function createBlock(txArray, previousHash, index) {
    const blockData = JSON.stringify(txArray) + previousHash;
    const hash = await sha256(blockData);
    return {
      index,
      timestamp: new Date().toISOString(),
      transactions: txArray,
      previousHash,
      hash,
      minedBy: selectedMiner
    };
  }

  // ——— Mining Action ———
  async function mineSelectedTransactions() {
    const available = getCurrentMinerMines();
    if (available < 1) {
      alert("You have no mines left.");
      return;
    }

    const boxes = document.querySelectorAll(".transaction-checkbox:checked");
    if (boxes.length < 1) {
      alert("Select at least one transaction.");
      return;
    }
    if (boxes.length > 5) {
      alert("You can mine up to 5 transactions at once.");
      return;
    }

    const visible = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    const toMine = Array.from(boxes)
      .map(cb => visible[cb.dataset.index])
      .filter(Boolean);

    if (!toMine.length) {
      alert("No valid selections.");
      return;
    }

    // Use globally computed nextBlockIndex
    const idx = nextBlockIndex;
    const prevHash = (localChain[idx - 1] && localChain[idx - 1].hash) || "0";

    const newBlock = await createBlock(toMine, prevHash, idx);

    // Persist to localStorage
    localChain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(localChain));

    // Increment and persist nextBlockIndex
    nextBlockIndex++;
    localStorage.setItem("nextBlockIndex", nextBlockIndex);

    // Consume one mine
    const mm = JSON.parse(localStorage.getItem("minersMines"));
    mm[selectedMiner] = mm[selectedMiner] - 1;
    localStorage.setItem("minersMines", JSON.stringify(mm));

    // Notify network & broadcast block
    toMine.forEach(tx => minedTxGun.set({ timestamp: tx.timestamp }));
    blockchainGun.get(String(newBlock.index)).put(newBlock);

    // Mark them mined locally
    toMine.forEach(tx => globalMined.push(tx.timestamp));
    transactions = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));

    renderMempool();
    updateMineCounter();
  }

  // ——— Subscriptions ———

  // Mempool updates
  mempoolGun.map().on(data => {
    if (data && data.timestamp && !transactions.some(t => t.timestamp === data.timestamp)) {
      transactions.push(data);
      localStorage.setItem("mempoolTransactions", JSON.stringify(transactions));
      renderMempool();
    }
  });

  // Mined notifications
  minedTxGun.map().on(md => {
    if (md && md.timestamp && !globalMined.includes(md.timestamp)) {
      globalMined.push(md.timestamp);
      localStorage.setItem("minedTransactionTimestamps", JSON.stringify(globalMined));
      renderMempool();
    }
  });

  // ——— Initial Render ———
  renderMempool();
  updateMineCounter();
});
