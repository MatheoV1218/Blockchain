// Select the table body for mempool
const tableBody = document.querySelector("#blockchainTable tbody");

// Track the transaction count
let transactionCount = document.querySelectorAll("#blockchainTable tr").length - 1; // Subtracting the header row

// Function to add a new transaction to the table
function addTransaction(minerNumber, coinsTraded) {
    transactionCount++; // Increment the transaction count

    // Get the current date and time
    const now = new Date();
    const date = now.toLocaleDateString();
    const time = now.toLocaleTimeString();

    // Create a new row for the transaction
    const newRow = document.createElement("tr");

    // Create and append cells for transaction number, miner, data, date, and time
    const numberCell = document.createElement("td");
    numberCell.textContent = transactionCount;

    const minerCell = document.createElement("td");
    minerCell.textContent = minerNumber;

    const dataCell = document.createElement("td");
    dataCell.textContent = `Coins Traded: ${coinsTraded}`;

    const dateCell = document.createElement("td");
    dateCell.textContent = date;

    const timeCell = document.createElement("td");
    timeCell.textContent = time;

    // Append the cells to the new row
    newRow.appendChild(numberCell);
    newRow.appendChild(minerCell);
    newRow.appendChild(dataCell);
    newRow.appendChild(dateCell);
    newRow.appendChild(timeCell);

    // Append the new row to the table body
    tableBody.appendChild(newRow);

    // Update the table's date and time
    updateDateTime();
}

// Function to update date and time for all transactions
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
