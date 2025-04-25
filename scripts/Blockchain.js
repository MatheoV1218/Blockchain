// scripts/Blockchain.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing blockchain view with Gun for P2P sync.");

  // —— 1) Initialize Gun & your “set” node ——
  const gun = Gun([
    'http://localhost:3000/gun',
    , 'http://149.61.249.68:3000/gun'
    //, 'http://149.61.211.129:3000/gun'
  ]);
  const blockchainGun = gun.get('blockchainLedger');
  let blockchain = [];

  // (sha256 helper stays the same…)

  function renderBlockchainLedger() {
    const archivedList = document.getElementById("archived-list");
    if (!archivedList) return;
    archivedList.innerHTML = "";
  
    if (blockchain.length === 0) {
      archivedList.innerHTML = "<li>No blocks have been mined yet.</li>";
      return;
    }
  
    blockchain.sort((a, b) => a.index - b.index);
  
    blockchain.forEach(block => {
      const li = document.createElement("li");
      li.style.marginBottom = "15px";
      li.style.padding      = "10px";
      li.style.border       = "1px solid white";
      li.style.background   = "#1e1e1e";
  
      // Block header with Miner included
      li.innerHTML = `
        <strong>Block #${block.index}</strong><br>
        <small><strong>Timestamp:</strong> ${block.timestamp || "N/A"}</small><br>
        <small><strong>Mined by:</strong> ${block.miner || "N/A"}</small><br>
        <small><strong>Hash:</strong>      ${block.hash      || "N/A"}</small><br>
        <small><strong>Prev Hash:</strong> ${block.previousHash || "N/A"}</small><br>
      `;
  
      // Transaction details
      const txPre = document.createElement("pre");
      txPre.style.background = "#222";
      txPre.style.color      = "#ffd700";
      txPre.style.padding    = "8px";
      txPre.style.marginTop  = "8px";
      txPre.textContent      = block.transactions || "(no transactions)";
      li.appendChild(txPre);
  
      archivedList.appendChild(li);
    });
  }
  

  // —— 5) Subscribe & hydrate on page load ——
  blockchainGun
    .map()
    .on((data, key) => {
      if (data && typeof data.index === "number" && data.timestamp) {
        const idx = blockchain.findIndex(b => b.index === data.index);
        if (idx >= 0) blockchain[idx] = data;
        else blockchain.push(data);
        renderBlockchainLedger();
      }
    });

  // Initial render
  renderBlockchainLedger();
});
