let gem = document.querySelector('.gem-cost');
let parsedGem = parseFloat(gem.innerHTML);

let clickerCost = document.querySelector('.clicker-cost');
let parsedClickerCost = parseFloat(clickerCost.innerHTML);
let clickerLevel = document.querySelector('.clicker-level');
let clickerIncrease = document.querySelector('.clicker-increase');
let parsedClickerIncrease = parseFloat(clickerIncrease.innerHTML);

let pickaxeCost = document.querySelector('.pickaxe-cost');
let parsedPickaxeCost = parseFloat(pickaxeCost.innerHTML);
let pickaxeLevel = document.querySelector('.pickaxe-level');
let pickaxeIncrease = document.querySelector('.pickaxe-increase');
let parsedPickaxeIncrease = parseFloat(pickaxeIncrease.innerHTML);

let minerCost = document.querySelector('.miner-cost');
let parsedMinerCost = parseFloat(minerCost.innerHTML);
let minerLevel = document.querySelector('.miner-level');
let minerIncrease = document.querySelector('.miner-increase');
let parsedMinerIncrease = parseFloat(minerIncrease.innerHTML);
let gps = 0;

let gpcText = document.getElementById('gpc-text');
let gpsText = document.getElementById('gps-text')


let gpc = 1;
function incrementGem(){
  gem.innerHTML = Math.round(parsedGem += gpc);
}

function buyClicker() {
  if (parsedGem >= parsedClickerCost) {
    gem.innerHTML = Math.round(parsedGem -= parsedClickerCost);

    clickerLevel.innerHTML ++

    parsedClickerIncrease = parseFloat((parsedClickerIncrease * 1.03).toFixed(2))
    clickerIncrease.innerHTML = parsedClickerIncrease
    gpc += parsedClickerIncrease
    parsedClickerCost *= 1.18;
    clickerCost.innerHTML = Math.round(parsedClickerCost)
  }
}

function buyPickaxe() {
  if (parsedGem >= parsedPickaxeCost) {
    gem.innerHTML = Math.round(parsedGem -= parsedPickaxeCost);

    pickaxeLevel.innerHTML ++

    parsedPickaxeIncrease = parseFloat((parsedPickaxeIncrease * 1.03).toFixed(2))
    pickaxeIncrease.innerHTML = parsedPickaxeIncrease
    gps += parsedPickaxeIncrease
    parsedPickaxeCost *= 1.18;
    pickaxeCost.innerHTML = Math.round(parsedPickaxeCost)
  }
}

function buyMiner() {
  if (parsedGem >= parsedMinerCost) {
    gem.innerHTML = Math.round(parsedGem -= parsedMinerCost);

    minerLevel.innerHTML ++

    parsedMinerIncrease = parseFloat((parsedMinerIncrease * 1.03).toFixed(2))
    minerIncrease.innerHTML = parsedMinerIncrease
    gps += parsedMinerIncrease
    parsedMinerCost *= 1.18;
    minerCost.innerHTML = Math.round(parsedMinerCost)
  }
}
setInterval(() => {
parsedGem += gps / 10;
gem.innerHTML = Math.round(parsedGem)
gpcText.innerHTML = Math.round(gpc)
gpsText.innerHTML = Math.round(gps)
}, 100)