function updateDateTime() {
  let dateCells = document.querySelectorAll(".date");
  let timeCells = document.querySelectorAll(".time");
  
  let now = new Date();
  let date = now.toLocaleDateString(); // Format: MM/DD/YYYY
  let time = now.toLocaleTimeString(); // Format: HH:MM:SS AM/PM

  dateCells.forEach(cell => cell.textContent = date);
  timeCells.forEach(cell => cell.textContent = time);
}

updateDateTime(); // Call the function to update the table