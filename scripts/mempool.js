// Retrieve the selected miner from localStorage
const selectedMiner = localStorage.getItem("selectedMiner") || "Unknown";

// Select all table rows (excluding the header row)
const tableRows = document.querySelectorAll("#blockchainTable tr");

// Loop through rows and update the 'Miner #' column dynamically
for (let i = 1; i < tableRows.length; i++) { // Start from index 1 to skip the header
    const minerCell = tableRows[i].children[1]; // The second column (Miner #)
    minerCell.textContent = selectedMiner;
}

// Update date and time dynamically
function updateDateTime() {
    const now = new Date();
    const dateCells = document.querySelectorAll(".date");
    const timeCells = document.querySelectorAll(".time");
    
    dateCells.forEach(cell => {
        cell.textContent = now.toLocaleDateString();
    });
    
    timeCells.forEach(cell => {
        cell.textContent = now.toLocaleTimeString();
    });
}

updateDateTime();
