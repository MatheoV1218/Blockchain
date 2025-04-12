// Retrieve the selected miner from localStorage (this can remain if you still need to persist wallet data)
const selectedMiner = localStorage.getItem("selectedMiner");

// Load wallet data specific to the selected miner
let wallet = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}_wallet`)) || {
    transactions: 0,
    coins: 0,
    nfts: 0
};

// Display current coin amount on the page
document.getElementById("coin-amount").innerText = wallet.coins;

// Ensure Gun is loaded. In your HTML, include the Gun script:
// <script src="https://unpkg.com/gun/gun.js"></script>

// Initialize Gun (update the URL if your Gun server is hosted elsewhere)
const gun = Gun('http://localhost:3000/gun');

// Trade coins function
function tradeCoins() {
    let coinsToTrade = Number(document.getElementById("trade-coins").value);

    // Debug logs
    console.log("Selected Miner:", selectedMiner);
    console.log("Wallet before trade:", wallet);

    if (coinsToTrade > 0 && coinsToTrade <= wallet.coins) {
        // Update wallet locally
        wallet.coins = wallet.coins - coinsToTrade;
        wallet.transactions = wallet.transactions + 1;

        // Save updated wallet data to localStorage (if you still need persistence)
        localStorage.setItem(`minerData_${selectedMiner}_wallet`, JSON.stringify(wallet));

        // Update the UI
        document.getElementById("coin-amount").innerText = wallet.coins;
        document.getElementById("trade-coins").value = "";  // Reset input field

        // Debug log for wallet after trade
        console.log("Wallet after trade:", wallet);

        // Create a new transaction object to push to Gun
        const now = new Date();
        const newTransaction = {
            miner: selectedMiner,
            coins: coinsToTrade,
            date: now.toLocaleDateString(),
            time: now.toLocaleTimeString(),
            timestamp: now.getTime()  // Unique identifier for the transaction
        };

        // Push the new transaction to the Gun node 'mempoolTransactions'
        gun.get('mempoolTransactions').set(newTransaction);

        // Redirect to mempool.html (no query parameters are needed now)
        window.location.href = 'mempool.html';
    }
}