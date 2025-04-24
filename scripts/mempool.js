// scripts/mempool.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing mempool (final version).");

  // Retrieve selected miner
  const selectedMiner = localStorage.getItem("selectedMiner") || "Miner1";

  // In-memory arrays
  let transactions = [];
  let globalMined  = [];

  // Init Gun & nodes
  const gun           = Gun({
    peers: [
      'http://localhost:3000/gun',
      'http://192.168.1.10:3000/gun'
    ]
  });
  const mempoolGun    = gun.get('mempoolTransactions');
  const minedTxGun    = gun.get('minedTransactions');
  const blockchainGun = gun.get('blockchainLedger'); // treated as a SET

  // Miner-quota helpers
  function getCurrentMinerMines() {
    const all = JSON.parse(localStorage.getItem("minersMines")) || {};
    if (all[selectedMiner] === undefined) {
      all[selectedMiner] = 5;
      localStorage.setItem("minersMines", JSON.stringify(all));
    }
    return all[selectedMiner];
  }

  function updateMineCounter() {
    const mines = getCurrentMinerMines();
    const elem  = document.getElementById("mine-counter");
    if (elem) elem.innerText = mines;
    if (mines > 0) showMineButton();
    else removeMineButton();
  }

  // Render mempool table
  function renderMempool() {
    const tbody = document.querySelector("#blockchainTable tbody");
    if (!tbody) return;
    // only show un­mined txs
    const visible = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    tbody.innerHTML = "";
    visible.forEach((tx, idx) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input type="checkbox" class="transaction-checkbox" data-index="${idx}"></td>
        <td>${idx + 1}</td>
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
    btn.onclick   = mineSelectedTransactions;
    document.getElementById("delete-button-container")?.appendChild(btn);
  }

  function removeMineButton() {
    document.getElementById("mine-transaction-btn")?.remove();
  }

  // Utilities for block creation
  async function sha256(msg) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // Create a block with all transactions concatenated into one string
  async function createBlock(txArray, prevHash, idx) {
    const txString = txArray
      .map(tx => `Miner:${tx.miner}|Coins:${tx.coins}|Date:${tx.date}|Time:${tx.time}`)
      .join('\n');
    const blockData = txString + prevHash;
    const hash      = await sha256(blockData);
    return {
      index:        idx,
      timestamp:    new Date().toISOString(),
      transactions: txString,
      previousHash: prevHash,
      hash
    };
  }

  function getLatestBlock() {
    return new Promise(resolve => {
      let latest = null;
      blockchainGun.map().once(b => {
        if (b && typeof b.index === "number") {
          if (!latest || b.index > latest.index) latest = b;
        }
      });
      setTimeout(() => resolve(latest), 500);
    });
  }

  // Mine logic using .set(...)
  async function mineSelectedTransactions() {
    console.log("🔨 Mine Transaction button clicked.");
    const available = getCurrentMinerMines();
    if (available <= 0) { alert("No mines left."); return; }

    const checked = Array.from(document.querySelectorAll(".transaction-checkbox:checked"));
    if (checked.length < 1) {
      alert("Select at least one transaction.");
      return;
    }
    // ← NEW: limit to 5 per mine
    if (checked.length > 5) {
      alert("You can only mine up to 5 transactions at once.");
      return;
    }

    // Gather selected tx objects
    const visible = transactions.filter(tx => !globalMined.includes(tx.timestamp));
    const toMine  = checked
      .map(cb => visible[+cb.dataset.index])
      .filter(Boolean);
    if (!toMine.length) { alert("No valid txs selected."); return; }

    const latest    = await getLatestBlock();
    const prevHash  = latest?.hash || "0";
    const newIndex  = latest ? latest.index + 1 : 0;
    const newBlock  = await createBlock(toMine, prevHash, newIndex);

    console.log("✅ Created new block:", newBlock);

    // 1) Notify mined txs (so they disappear from all peers’ mempools)
    toMine.forEach(tx => minedTxGun.set({ timestamp: tx.timestamp }));

    // 2) Publish the block itself as a SET entry
    blockchainGun.set(newBlock, ack => {
      if (ack.err) console.error("❌ Gun set failed:", ack.err);
      else console.log("✅ Block set success:", newBlock.index);
    });

    // 3) Backup locally
    const localChain = JSON.parse(localStorage.getItem("blockchainLedger")) || [];
    localChain.push(newBlock);
    localStorage.setItem("blockchainLedger", JSON.stringify(localChain));

    // 4) ← CHANGED: decrement exactly one mine per block, not per tx
    const allM = JSON.parse(localStorage.getItem("minersMines")) || {};
    allM[selectedMiner] = Math.max(0, allM[selectedMiner] - 1);
    localStorage.setItem("minersMines", JSON.stringify(allM));

    // 5) Update UI
    transactions = transactions.filter(tx => !toMine.some(t => t.timestamp === tx.timestamp));
    renderMempool();
    updateMineCounter();
  }

  // Listen for incoming mempool txs
  mempoolGun.map().on(data => {
    if (data?.timestamp && !transactions.find(tx => tx.timestamp === data.timestamp)) {
      transactions.push(data);
      renderMempool();
    }
  });

  // Listen for mined-tx notifications
  minedTxGun.map().on(mined => {
    if (mined?.timestamp && !globalMined.includes(mined.timestamp)) {
      globalMined.push(mined.timestamp);
      renderMempool();
    }
  });

  // Initial render & mine-button update
  renderMempool();
  updateMineCounter();
});
