// Retrieve the selected miner
const selectedMiner = localStorage.getItem("selectedMiner");

// Load wallet data
let wallet = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}_wallet`)) || {
  transactions: 0,
  coins: 0,
  nfts: 0
};

// Display current coin amount
document.getElementById("coin-amount").innerText = wallet.coins;

// Initialize Gun (same peers as mempool)
const gun = Gun({
  peers: [
    'http://localhost:3000/gun'
  ]
});

function tradeCoins() {
  const coinsToTrade = Number(document.getElementById("trade-coins").value);
  if (!(coinsToTrade > 0 && coinsToTrade <= wallet.coins)) {
    alert("Enter a valid amount up to your current coins.");
    return;
  }

  // Update wallet
  wallet.coins -= coinsToTrade;
  wallet.transactions++;
  localStorage.setItem(
    `minerData_${selectedMiner}_wallet`,
    JSON.stringify(wallet)
  );
  document.getElementById("coin-amount").innerText = wallet.coins;
  document.getElementById("trade-coins").value = "";

  // Build the transaction
  const now = new Date();
  const newTransaction = {
    miner: selectedMiner,
    coins: coinsToTrade,
    date: now.toLocaleDateString(),
    time: now.toLocaleTimeString(),
    timestamp: now.getTime()
  };

  // 1) Push to Gun
  gun.get('mempoolTransactions').set(newTransaction);

  // 2) Also persist immediately in localStorage for instant UI
  const localPool =
    JSON.parse(localStorage.getItem("mempoolTransactions")) || [];
  localPool.push(newTransaction);
  localStorage.setItem(
    "mempoolTransactions",
    JSON.stringify(localPool)
  );

  // 3) Navigate to mempool
  window.location.href = 'mempool.html';
}
