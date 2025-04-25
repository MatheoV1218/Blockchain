// scripts/stake.js
/* ─────────── 1) Setup & State ─────────── */


const selectedMiner = localStorage.getItem("selectedMiner") || "Miner1";


let wallet = JSON.parse(
  localStorage.getItem(`minerData_${selectedMiner}_wallet`)
) || {
  transactions: 0,
  coins:        0,
  nfts:         0,
  mines:        0
};


document.getElementById("miner-name").innerText   = selectedMiner;
document.getElementById("wallet-coins").innerText = wallet.coins;


/* ─────────── 2) Gun init ─────────── */


const gun             = Gun({
  peers: [
    'http://localhost:3000/gun',
    'http://192.168.1.10:3000/gun'
  ]
});
const participantsGun = gun.get("raffleParticipants");
const winnerGun       = gun.get("raffleWinner");


let participantsMap   = {};     // { name: stake }
let participants      = [];     // [{name, stake}]


/* ─────────── 3) UI helpers ─────────── */


function updateParticipantsUI() {
  const list = document.getElementById("participants-list");
  list.innerHTML = "";
  participants.forEach(p => {
    const li       = document.createElement("li");
    li.textContent = `${p.name} — ${p.stake} coins`;
    list.appendChild(li);
  });
}


function showWinner(name) {
  document.getElementById("winner-text").innerText = `Winner: ${name}!`;
}


/* ─────────── 4) Realtime listeners ─────────── */


// Keep participant list in sync
participantsGun.map().on((data, key) => {
  if (data === null) {
    delete participantsMap[key];
  } else if (data && data.name && typeof data.stake === "number") {
    participantsMap[data.name] = data.stake;
  }
  participants = Object.entries(participantsMap)
                        .map(([name, stake]) => ({ name, stake }));
  updateParticipantsUI();
});


/* ----- Winner listener with **permanent** de-duplication ----- */
const LAST_TS_KEY = "lastWinnerTsProcessed";
let lastProcessedTs = parseInt(localStorage.getItem(LAST_TS_KEY), 10) || 0;


winnerGun.on(node => {
  if (!node || typeof node !== "object") return;      // ignore attribute pings
  const { name, ts } = node;
  if (!name || !ts) return;
  if (ts <= lastProcessedTs) return;                  // already handled


  // Remember that we handled this round
  lastProcessedTs = ts;
  localStorage.setItem(LAST_TS_KEY, String(ts));


  // Show winner for everyone
  localStorage.setItem("raffleWinner", name);
  showWinner(name);


  // Add +1 mine ONLY on the winner’s machine
  if (name === selectedMiner) {
    const mines = JSON.parse(localStorage.getItem("minersMines")) || {};
    mines[name] = (mines[name] || 0) + 1;
    localStorage.setItem("minersMines", JSON.stringify(mines));
  }
});


// Restore last winner on page load
const storedWinner = localStorage.getItem("raffleWinner");
if (storedWinner) showWinner(storedWinner);


/* ─────────── 5) Buttons ─────────── */


// ---- Stake ----
document.getElementById("stake-btn").addEventListener("click", () => {
  const amtInput    = document.getElementById("stake-amount");
  const stakeAmount = parseInt(amtInput.value, 10);


  if (isNaN(stakeAmount) || stakeAmount < 10) {
    return alert("Please enter at least 10 coins.");
  }
  if (stakeAmount > wallet.coins) {
    return alert("Not enough coins!");
  }


  // Deduct locally
  wallet.coins -= stakeAmount;
  localStorage.setItem(
    `minerData_${selectedMiner}_wallet`,
    JSON.stringify(wallet)
  );
  document.getElementById("wallet-coins").innerText = wallet.coins;


  // Publish / update stake
  const newStake = (participantsMap[selectedMiner] || 0) + stakeAmount;
  participantsGun.get(selectedMiner).put({
    name:  selectedMiner,
    stake: newStake
  });


  amtInput.value = "";
});


// ---- Draw Winner ----
document.getElementById("draw-btn").addEventListener("click", () => {
  if (participants.length === 0) {
    return alert("No participants in the raffle.");
  }


  // Weighted random pick
  const total = participants.reduce((sum, p) => sum + p.stake, 0);
  let r       = Math.random() * total;
  let chosen  = null;


  for (const p of participants) {
    r -= p.stake;
    if (r <= 0) {
      chosen = p.name;
      break;
    }
  }


  // Publish winner with UNIQUE timestamp
  winnerGun.put({ name: chosen, ts: Date.now() });


  // Clear stakes for next round
  Object.keys(participantsMap).forEach(name => {
    participantsGun.get(name).put(null);
  });
});


/* ─────────── 6) First render ─────────── */
updateParticipantsUI();
