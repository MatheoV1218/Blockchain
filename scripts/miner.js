function selectMiner(miner) {
  // Store selected miner in localStorage
  localStorage.setItem("selectedMiner", miner);

  // Default data for the miner (this can be customized further)
  const minerData = {
      coins: 0,
      transactions: [],
      blockchain: []
  };

  // Store default data for the selected miner
  localStorage.setItem(`minerData_${miner}`, JSON.stringify(minerData));

  // Redirect to Blockchain page
  window.location.href = "../Main.html"; 
}
