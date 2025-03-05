<<<<<<< HEAD
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
=======
    // Select the table body for mempool
    const urlParams = new URLSearchParams(window.location.search);
    const minerNumber = urlParams.get("miner");  // Gets the "miner" value
    const coinsTraded = urlParams.get("coins");  // Gets the "coins" value
    console.log(`Miner: ${minerNumber}, Coins: ${coinsTraded}`);

    const tableBody = document.querySelector("#blockchainTable tbody");

    // Check if tableBody is correctly selected
    console.log(tableBody); // Should print the tbody element, not null

    // Track the transaction count
    let transactionCount = document.querySelectorAll("#blockchainTable tr").length - 1; // Subtracting the header row

    // Function to add a new transaction to the table
   
        console.log("addTransaction called"); // Check if the function is being called
        console.log("Miner Number:", minerNumber);
        console.log("Coins Traded:", coinsTraded);

        transactionCount++; // Increment the transaction count
        console.log("Updated Transaction Count:", transactionCount);

        // Get the current date and time
        const now = new Date();
        const date = now.toLocaleDateString();
        const time = now.toLocaleTimeString();

        console.log("Current Date:", date);
        console.log("Current Time:", time);

        // Create a new row for the transaction
        const newRow = document.createElement("tr");
        console.log("New Row Created:", newRow);

        // Create and append cells for transaction number, miner, data, date, and time
        const numberCell = document.createElement("td");
        numberCell.textContent = transactionCount;
        console.log("Number Cell Created:", numberCell);

        const minerCell = document.createElement("td");
        minerCell.textContent = minerNumber;
        console.log("Miner Cell Created:", minerCell);

        const dataCell = document.createElement("td");
        dataCell.textContent = `Coins Traded: ${coinsTraded}`;
        console.log("Data Cell Created:", dataCell);

        const dateCell = document.createElement("td");
        dateCell.textContent = date;
        console.log("Date Cell Created:", dateCell);

        const timeCell = document.createElement("td");
        timeCell.textContent = time;
        console.log("Time Cell Created:", timeCell);

        // Append the cells to the new row
        newRow.appendChild(numberCell);
        newRow.appendChild(minerCell);
        newRow.appendChild(dataCell);
        newRow.appendChild(dateCell);
        newRow.appendChild(timeCell);
        console.log("Cells Appended to New Row:", newRow);

        // Append the new row to the table body
        console.log("tableBody before appending:", tableBody);
        if (tableBody) {
            tableBody.appendChild(newRow);
            console.log("New Row Appended to tableBody:", newRow);
        } else {
            console.error("Error: tableBody is null. Check if #blockchainTable tbody exists in the HTML.");
        }

        // Update the table's date and time
        updateDateTime();



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

>>>>>>> f7618df (changed the trade js file to link you into the mempool html and changed the mempool js file, removing the addTransaction function)
