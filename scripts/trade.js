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
  function tradeCoins() {
      let coinsToTrade = Number(document.getElementById("trade-coins").value);
      if (coinsToTrade > 0 && coinsToTrade <= wallet.coins) {
          wallet.coins = wallet.coins - coinsToTrade;
          wallet.transactions = wallet.transactions + 1;

          // Save the updated wallet data to localStorage
          localStorage.setItem(`minerData_${selectedMiner}_wallet`, JSON.stringify(wallet));

          // Update the UI to reflect the new wallet state
          document.getElementById("coin-amount").innerText = wallet.coins;
          document.getElementById("trade-coins").value = "";  // Reset input field
      }
  }