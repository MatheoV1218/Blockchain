document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded – initializing blockchain view with fallback.");

  // Load locally stored chain first
  let blockchain =
    JSON.parse(localStorage.getItem("blockchainLedger")) || [];
  renderBlockchainLedger();

  // Then subscribe to Gun
  const gun = Gun([
    'http://localhost:3000/gun',
    'http://192.168.1.107:3000/gun'
  ]);
  const blockchainGun = gun.get('blockchainLedger');

  blockchainGun.map().on((block, key) => {
    if (block && typeof block.index === 'number') {
      const idx = blockchain.findIndex(b => b.index === block.index);
      if (idx >= 0) blockchain[idx] = block;
      else blockchain.push(block);
      renderBlockchainLedger();
    }
  });

  function renderBlockchainLedger() {
    const list = document.getElementById("archived-list");
    if (!list) return;
    list.innerHTML = "";

    if (!blockchain.length) {
      list.innerHTML = "<li>No blocks have been mined yet.</li>";
      return;
    }

    blockchain
      .sort((a, b) => a.index - b.index)
      .forEach(block => {
        const li = document.createElement("li");
        li.style.margin = "10px 0";
        li.style.padding = "10px";
        li.style.border = "1px solid #444";
        li.style.background = "#1e1e1e";

        li.innerHTML = `
          <strong>Block #${block.index}</strong><br>
          <small><strong>Mined By:</strong> ${block.minedBy}</small><br>
          <small><strong>Mined At:</strong> ${new Date(block.timestamp).toLocaleString()}</small><br>
          <small><strong>Hash:</strong> ${block.hash}</small><br>
          <small><strong>Prev Hash:</strong> ${block.previousHash}</small>
        `;

        const ul = document.createElement("ul");
        ul.style.marginTop = "8px";
        if (Array.isArray(block.transactions)) {
          block.transactions.forEach((tx, i) => {
            const txLi = document.createElement("li");
            txLi.innerHTML = `
              <strong>Tx ${i+1}:</strong>
              Miner ${tx.miner} traded ${tx.coins} coins<br>
              <em>Date:</em> ${tx.date} <em>Time:</em> ${tx.time}
            `;
            ul.appendChild(txLi);
          });
        }
        li.appendChild(ul);
        list.appendChild(li);
      });
  }
});
