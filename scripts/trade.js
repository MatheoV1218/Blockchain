  // Retrieve the selected miner
  const selectedMiner = localStorage.getItem("selectedMiner");

  // Load wallet data specific to the selected miner
  let wallet = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}_wallet`)) || {
      transactions: 0,
      coins: 0,
      nfts: 0
  };

  // Display current coin amount on the page
  document.getElementById("coin-amount").innerText = wallet.coins;

  // Trade coins function
 // Assuming your current coin trading logic is here...

// After a successful trade, call the addTransaction function from mempool.js
function tradeCoins() {
    let coinsToTrade = Number(document.getElementById("trade-coins").value);
    
    // Debugging log to check if the miner is being retrieved correctly
    console.log("Selected Miner:", selectedMiner);

    // Check if the wallet is loaded correctly
    console.log("Wallet before trade:", wallet);

    if (coinsToTrade > 0 && coinsToTrade <= wallet.coins) {
        wallet.coins = wallet.coins - coinsToTrade;
        wallet.transactions = wallet.transactions + 1;

        // Save the updated wallet data to localStorage
        localStorage.setItem(`minerData_${selectedMiner}_wallet`, JSON.stringify(wallet));

        // Update the UI to reflect the new wallet state
        document.getElementById("coin-amount").innerText = wallet.coins;
        document.getElementById("trade-coins").value = "";  // Reset input field
<<<<<<< HEAD
        
        // Call the addTransaction function to update the mempool table
        addTransaction(selectedMiner, `Coins traded: ${coinsToTrade}`);

        // Debugging log to check wallet after the trade
        console.log("Wallet after trade:", wallet);
=======

        //  Transitions from the trade to the mempool html file
        console.log("hello chat");

        // Debugging log to check wallet after the trade
        console.log("Wallet after trade:", wallet);
        window.location.href = `mempool.html?miner=${selectedMiner}&coins=${coinsToTrade}`;
>>>>>>> f7618df (changed the trade js file to link you into the mempool html and changed the mempool js file, removing the addTransaction function)
    }
}

