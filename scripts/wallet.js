  // Retrieve the selected miner
  const selectedMiner = localStorage.getItem("selectedMiner");

  // Load wallet data specific to the selected miner
  let wallet = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}_wallet`)) || {
      transactions: 0,
      coins: 0,
      nfts: 0
  };

  // Display wallet info on the page
  document.getElementById("transaction-count").textContent = wallet.transactions;
  document.getElementById("coin-amount").textContent = wallet.coins;
  document.getElementById("nft-count").textContent = wallet.nfts;

  // Update wallet data when reset button is clicked
  document.querySelector('button').addEventListener('click', () => {
      wallet.transactions = 0;
      wallet.coins = 0;
      localStorage.setItem(`minerData_${selectedMiner}_wallet`, JSON.stringify(wallet));
      document.getElementById('transaction-count').textContent = 0;
      document.getElementById('coin-amount').textContent = 0;
  });