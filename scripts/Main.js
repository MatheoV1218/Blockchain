window.onload = function() {
  // Get the selected miner from localStorage
  const selectedMiner = localStorage.getItem("selectedMiner");
  
  // Load the data for the selected miner
  const minerData = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}`));

  // Use the loaded data to populate the page (for example, display coins, transactions, etc.)
  displayMinerData(minerData);
}

function displayMinerData(data) {
  // Example of displaying coins (you can add more logic to display all miner data)
  document.getElementById("coins").innerText = `Coins: ${data.coins}`;
  document.getElementById("transactions").innerText = `Transactions: ${data.transactions.length}`;
  // You can also display the blockchain or any other data you need
}
