document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing blockchain view with Gun for P2P sync (Option 2: Dereferencing).");

  // Initialize Gun with your peer endpoints.
  const gun = Gun([
    'http://localhost:3000/gun',
    'http://192.168.1.107:3000/gun'
  ]);
  
  // Get the Gun node for the blockchain ledger.
  const blockchainGun = gun.get('blockchainLedger');
  let blockchain = [];
  
  // SHA-256 helper (optional, for validation)
  async function sha256(message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Render the blockchain ledger as a simple chain of blocks.
  function renderBlockchainLedger() {
    const archivedList = document.getElementById("archived-list");
    if (!archivedList) return;
  
    archivedList.innerHTML = "";
    if (blockchain.length === 0) {
      archivedList.innerHTML = "<li>No blocks have been mined yet.</li>";
      return;
    }
  
    // Sort the blocks by their index.
    const sortedChain = blockchain.slice().sort((a, b) => a.index - b.index);
    
    // Render each block sequentially.
    sortedChain.forEach(block => {
      const li = document.createElement("li");
      li.style.marginBottom = "15px";
      li.style.padding = "10px";
      li.style.border = "1px solid white";
      li.style.background = "#1e1e1e";
      li.innerHTML = `
        <strong>Block #${block.index}</strong><br>
        <small><strong>Mined By:</strong> ${block.minedBy || "Unknown"}</small><br>
        <small><strong>Timestamp:</strong> ${block.timestamp || "N/A"}</small><br>
        <small><strong>Hash:</strong> ${block.hash || "N/A"}</small><br>
        <small><strong>Prev Hash:</strong> ${block.previousHash || "N/A"}</small><br>
      `;
  
      // Create a sub-list for the transaction details.
      const txList = document.createElement("ul");
      txList.style.marginTop = "8px";
  
      let txArray = [];
      if (block.transactions && typeof block.transactions === "object") {
        txArray = Object.values(block.transactions);
      }
  
      // Process each transaction: dereference if it’s a string reference.
      txArray.forEach(txObj => {
        const txItem = document.createElement("li");

        // If txObj is a string that looks like a reference, dereference it.
        if (typeof txObj === "string" && txObj.includes("blockchainLedger")) {
          txItem.textContent = "Loading transaction...";
          gun.get(txObj).once(txData => {
            if (txData && txData.miner !== undefined) {
              txItem.innerHTML = `
                <strong>Miner:</strong> ${txData.miner} | 
                <strong>Coins:</strong> ${txData.coins} | 
                <strong>Date:</strong> ${txData.date} | 
                <strong>Time:</strong> ${txData.time}
              `;
            } else {
              txItem.textContent = "Transaction data not found.";
            }
          });
        }
        // If txObj is already an object with transaction details, display it directly.
        else if (txObj && typeof txObj === "object" && txObj.miner !== undefined) {
          txItem.innerHTML = `
            <strong>Miner:</strong> ${txObj.miner} | 
            <strong>Coins:</strong> ${txObj.coins} | 
            <strong>Date:</strong> ${txObj.date} | 
            <strong>Time:</strong> ${txObj.time}
          `;
        }
        // Fallback to showing the raw JSON.
        else {
          txItem.textContent = JSON.stringify(txObj);
        }
        txList.appendChild(txItem);
      });
  
      li.appendChild(txList);
      archivedList.appendChild(li);
    });
  }
  
  // Listen for blocks from Gun.
  blockchainGun.map().on((data, key) => {
    console.log(`Received block at key ${key}:`, data);
    if (data && typeof data.index === "number" && data.timestamp) {
      const existingIndex = blockchain.findIndex(b => b.index === data.index);
      if (existingIndex !== -1) {
        blockchain[existingIndex] = data;
      } else {
        blockchain.push(data);
      }
      renderBlockchainLedger();
    }
  });
  
  renderBlockchainLedger();
});
