// scripts/Blockchain.js

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded – init blockchain with single-block consensus.");

  const gun           = Gun([
    'http://localhost:3000/gun',
    'http://192.168.1.10:3000/gun'
  ]);
  const blockchainGun = gun.get('blockchainLedger');

  const blockchain     = [];      // our in-memory chain for rendering
  let highestSeenIndex = -1;      // track max index we’ve loaded so far

  // SHA-256 helper (same as mempool)
  async function sha256(msg) {
    const buf = await crypto.subtle.digest("SHA-256",
      new TextEncoder().encode(msg)
    );
    return Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // render function unchanged
  function renderBlockchainLedger() {
    const ul = document.getElementById("archived-list");
    if (!ul) return;
    ul.innerHTML = "";
    if (!blockchain.length) {
      ul.innerHTML = "<li>No blocks have been mined yet.</li>";
      return;
    }
    blockchain
      .sort((a, b) => a.index - b.index)
      .forEach(block => {
        const li = document.createElement("li");
        li.style.cssText = "margin:15px 0; padding:10px; background:#1e1e1e; border:1px solid white;";
        li.innerHTML = `
          <strong>Block #${block.index}</strong><br>
          <small><strong>Timestamp:</strong> ${block.timestamp}</small><br>
          <small><strong>Mined by:</strong>  ${block.miner}</small><br>
          <small><strong>Hash:</strong>       ${block.hash}</small><br>
          <small><strong>Prev Hash:</strong>  ${block.previousHash}</small><br>
        `;
        const pre = document.createElement("pre");
        pre.style.cssText = "background:#222; color:#ffd700; padding:8px; margin-top:8px;";
        pre.textContent = block.transactions || "(no transactions)";
        li.appendChild(pre);
        ul.appendChild(li);
      });
  }

  // 1) Hydrate existing blocks (no checks)
  blockchainGun.map().once(data => {
    if (data && typeof data.index === "number") {
      blockchain.push(data);
      highestSeenIndex = Math.max(highestSeenIndex, data.index);
    }
  });

  // after a brief delay, render what we have and then listen for NEW only
  setTimeout(() => {
    renderBlockchainLedger();

    // 2) Subscribe for *new* blocks only
    blockchainGun.map().on(async data => {
      if (!data || typeof data.index !== "number") return;

      // skip anything ≤ the highest index we saw initially
      if (data.index <= highestSeenIndex) return;

      // now treat this as a "new" block: run consensus checks
      const prev = blockchain.find(b => b.index === data.index - 1);

      const validIndex    = prev ? data.index === prev.index + 1 : data.index === 0;
      const validPrevHash = prev ? data.previousHash === prev.hash : data.previousHash === "0";
      const recomputed    = await sha256((data.transactions||"") + data.previousHash);
      const validHash     = recomputed === data.hash;

      if (validIndex && validPrevHash && validHash) {
        console.log(`✅ New block #${data.index} is legitimate.`);
        blockchain.push(data);
        highestSeenIndex = data.index;  // update so we skip it next time
        renderBlockchainLedger();
      } else {
        console.error(`❌ Block #${data.index} failed validation:`, {
          validIndex, validPrevHash, validHash
        });
      }
    });
  }, 500); // 500ms should cover initial load

});
