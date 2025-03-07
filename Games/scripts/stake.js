// Retrieve selected miner
const selectedMiner = localStorage.getItem("selectedMiner");

// Load miner's wallet data
let wallet = JSON.parse(localStorage.getItem(`minerData_${selectedMiner}_wallet`)) || {
    transactions: 0,
    coins: 0,
    nfts: 0
};

// Display miner name and wallet balance
document.getElementById("miner-name").innerText = selectedMiner;
document.getElementById("wallet-coins").innerText = wallet.coins;

// Load existing participants from localStorage
let participants = JSON.parse(localStorage.getItem("raffleParticipants")) || [];

// Load winner if already selected
let winner = localStorage.getItem("raffleWinner");
if (winner) {
    document.getElementById("winner-text").innerText = `🎉 Winner: ${winner}!`;
}

// Update participant list UI
function updateParticipantsUI() {
    let list = document.getElementById("participants-list");
    list.innerHTML = "";
    participants.forEach(p => {
        let listItem = document.createElement("li");
        listItem.textContent = `${p.name} - ${p.stake} coins`;
        list.appendChild(listItem);
    });
}
updateParticipantsUI();

// Stake Button Logic
document.getElementById("stake-btn").addEventListener("click", function() {
    let stakeAmount = parseInt(document.getElementById("stake-amount").value);

    // Validate input
    if (isNaN(stakeAmount) || stakeAmount <= 0) {
        alert("Please enter a valid stake amount.");
        return;
    }
    if (stakeAmount > wallet.coins) {
        alert("Not enough coins!");
        return;
    }

    // Deduct from wallet
    wallet.coins -= stakeAmount;
    localStorage.setItem(`minerData_${selectedMiner}_wallet`, JSON.stringify(wallet));
    document.getElementById("wallet-coins").innerText = wallet.coins;

    // Check if miner already exists in participants
    let existingParticipant = participants.find(p => p.name === selectedMiner);
    if (existingParticipant) {
        existingParticipant.stake += stakeAmount; // Add to existing stake
    } else {
        participants.push({ name: selectedMiner, stake: stakeAmount });
    }

    // Save participants to localStorage
    localStorage.setItem("raffleParticipants", JSON.stringify(participants));

    // Update UI
    updateParticipantsUI();

    // Reset input
    document.getElementById("stake-amount").value = "";
});

// Draw Winner Button Logic
document.getElementById("draw-btn").addEventListener("click", function() {
    if (participants.length === 0) {
        alert("No participants in the raffle.");
        return;
    }

    // Weighted random selection
    let totalStake = participants.reduce((sum, p) => sum + p.stake, 0);
    let rand = Math.random() * totalStake;
    
    let cumulative = 0;
    let winnerName = null;
    for (let participant of participants) {
        cumulative += participant.stake;
        if (rand <= cumulative) {
            winnerName = participant.name;
            break;
        }
    }

    // Save winner in localStorage so all accounts see it
    localStorage.setItem("raffleWinner", winnerName);
    document.getElementById("winner-text").innerText = `🎉 Winner: ${winnerName}!`;

    // Clear the game state
    localStorage.removeItem("raffleParticipants");
    participants = [];
    updateParticipantsUI();
});
