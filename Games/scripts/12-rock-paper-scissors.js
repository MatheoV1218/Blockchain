// Load score and wallet from localStorage or set defaults
let score = JSON.parse(localStorage.getItem('score')) || {
  wins: 0,
  losses: 0,
  ties: 0
};

let wallet = JSON.parse(localStorage.getItem('wallet')) || {
  transactions: 0,
  coins: 0,
  nfts: 0
};

updateScoreElement();

// Auto-play logic remains unchanged
let isAutoPlaying = false;
let intervalId;

function autoPlay() {
  if (!isAutoPlaying) {
    intervalId = setInterval(() => {
      const playerMove = pickComputerMove();
      playGame(playerMove);
    }, 1000);
    isAutoPlaying = true;
  } else {
    clearInterval(intervalId);
    isAutoPlaying = false;
  }
}

// Event listeners remain unchanged
document.querySelector('.js-rock-button').addEventListener('click', () => {
  playGame('rock');
});

document.querySelector('.js-paper-button').addEventListener('click', () => {
  playGame('paper');
});

document.querySelector('.js-scissors-button').addEventListener('click', () => {
  playGame('scissors');
});

document.body.addEventListener('keydown', (event) => {
  if (event.key === 'r') playGame('rock');
  else if (event.key === 'p') playGame('paper');
  else if (event.key === 's') playGame('scissors');
});

function playGame(playerMove) {
  const computerMove = pickComputerMove();
  let result = '';

  if (playerMove === 'scissors') {
    if (computerMove === 'rock') result = 'You lose.';
    else if (computerMove === 'paper') result = 'You win.';
    else if (computerMove === 'scissors') result = 'Tie.';
  } else if (playerMove === 'paper') {
    if (computerMove === 'rock') result = 'You win.';
    else if (computerMove === 'paper') result = 'Tie.';
    else if (computerMove === 'scissors') result = 'You lose.';
  } else if (playerMove === 'rock') {
    if (computerMove === 'rock') result = 'Tie.';
    else if (computerMove === 'paper') result = 'You lose.';
    else if (computerMove === 'scissors') result = 'You win.';
  }

  // Update score and wallet based on result
  if (result === 'You win.') {
    score.wins += 1;
    wallet.coins += 1; // Add 1 coin when you win
  } else if (result === 'You lose.') {
    score.losses += 1;
  } else if (result === 'Tie.') {
    score.ties += 1;
  }

  // Save updated score and wallet to localStorage
  localStorage.setItem('score', JSON.stringify(score));
  localStorage.setItem('wallet', JSON.stringify(wallet));

  updateScoreElement();

  document.querySelector('.js-result').innerHTML = result;
  document.querySelector('.js-moves').innerHTML = `You
    <img src="images/${playerMove}-emoji.png" class="move-icon">
    <img src="images/${computerMove}-emoji.png" class="move-icon">
    Computer`;
}

function updateScoreElement() {
  document.querySelector('.js-score').innerHTML = `Wins: ${score.wins}, Losses: ${score.losses}, Ties: ${score.ties}`;
}

function pickComputerMove() {
  const randomNumber = Math.random();
  let computerMove = '';
  if (randomNumber >= 0 && randomNumber < 1 / 3) computerMove = 'rock';
  else if (randomNumber >= 1 / 3 && randomNumber < 2 / 3) computerMove = 'paper';
  else if (randomNumber >= 2 / 3 && randomNumber < 1) computerMove = 'scissors';
  return computerMove;
}