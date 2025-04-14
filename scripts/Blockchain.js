document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM fully loaded – initializing blockchain view.");

  // Initialize Gun with the given peer endpoints.
  const gun = Gun([
    'http://localhost:3000/gun',
    //, 'http://149.61.227.220:3000/gun' (Matheo's IP), 
    // 'http://149.61.211.129:3000/gun'(Edward's IP), 
    // 'http://149.61.248.174:3000/gun' (Ardion's IP)] 
  ]);

  // Get the Gun node for the blockchain ledger.
  const blockchainGun = gun.get('blockchainLedger');
  let blockchain = [];

  // Subscribe to all blocks under blockchainLedger via .map().on(...)
  blockchainGun.map().on((data, key) => {
    // Log every received block for debugging.
    console.log(`Received block at key ${key}:`, data);

    // Ensure the block has an index and a timestamp (i.e. valid block data)
    if (data && data.index !== undefined && data.timestamp) {
      // Check if this block is already in our array (by comparing index)
      const existing = blockchain.find(b => b.index === data.index);
      if (existing) {
        // Optionally update the block if needed
        Object.assign(existing, data);
      } else {
        blockchain.push(data);
      }
      renderBlockchainLedger();
    }
  });

  // Render the blockchain ledger to the #archived-list element.
  function renderBlockchainLedger() {
    const archivedList = document.getElementById("archived-list");
    if (!archivedList) {
      console.error("Could not find the 'archived-list' element in the DOM.");
      return;
    }

    // Clear the element.
    archivedList.innerHTML = "";

    if (blockchain.length === 0) {
      archivedList.innerHTML = "<li>No blocks have been mined yet.</li>";
      return;
    }

    // Sort the blockchain array by block index (in ascending order).
    blockchain.sort((a, b) => a.index - b.index);

    // Iterate over each block and build the HTML display.
    blockchain.forEach((block, i) => {
      // Instead of checking if transactions is an array,
      // we treat it as an object and get its values.
      const txValues = block.transactions && typeof block.transactions === "object" 
        ? Object.values(block.transactions) 
        : [];

      const blockWrapper = document.createElement("li");
      blockWrapper.innerHTML = `
        <div style="margin-bottom: 10px;">
          <strong>Block #${block.index}</strong><br>
          <small><strong>Timestamp:</strong> ${block.timestamp || "N/A"}</small><br>
          <small><strong>Hash:</strong> ${block.hash || "N/A"}</small><br>
          <small><strong>Prev Hash:</strong> ${block.previousHash || "N/A"}</small>
        </div>
      `;

      const txList = document.createElement("ul");
      txList.style.marginTop = "8px";

      txValues.forEach((tx, idx) => {
        const txItem = document.createElement("li");
        txItem.textContent = tx || `Transaction ${idx} (empty)`;
        txList.appendChild(txItem);
      });

      blockWrapper.appendChild(txList);
      archivedList.appendChild(blockWrapper);
    });
  }
});
