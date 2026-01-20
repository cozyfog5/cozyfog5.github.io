const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const output = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const statusBar = document.getElementById('statusBar');

let statusBarTimeout = null;

function setStatus(message) {
  statusBar.textContent = message;
  if (statusBarTimeout) {
    clearTimeout(statusBarTimeout);
  }
  if (message) {
    statusBarTimeout = setTimeout(() => {
      statusBar.textContent = '';
    }, 3000);
  }
}

// Generate output
generateBtn.addEventListener('click', () => {
  output.value = processText(inputA.value, inputB.value);
  setStatus('Output generated.');
});

// Copy output
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    setStatus('Output copied to clipboard.');
  } catch {
    setStatus('Failed to copy output.');
  }
});

// Overlay clear buttons
document.querySelectorAll('.clear-overlay').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const textarea = document.getElementById(targetId);
    textarea.value = '';
    textarea.focus();
    //setStatus('Input cleared.');
  });
});

// Ctrl+Enter to generate
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    generateBtn.click();
  }
});

// Decision: if 1, Player A wins; if -1, player B wins; if 0, Players A and B tie
function calculateMmrAdjustment(mmrA, mmrB, decision) {
  const cap = 30;
  const logistic_base = 11;
  const mmr_delta_denom = 9500;
  const baseline = 10;
  const offset = Math.log(cap / baseline - 1) / Math.log(logistic_base);

  if (decision === 0) {
    // Tie
    return Math.sign(mmrB - mmrA) * (cap / (1 + Math.pow(logistic_base, -(Math.abs(mmrB - mmrA) / mmr_delta_denom - offset))) - cap / 3);
  } else {
    // Decision
    return Math.sign(decision) * cap / (1 + Math.pow(logistic_base, -(Math.sign(decision) * (mmrB - mmrA) / mmr_delta_denom - offset)));
  }
}

// Interprets text as the mogi "header," which I define to be the first message posted in the room,
// and returns a mapping from name to starting MMR if possible.
function parseHeaderInput(input) {
  let nameMmrMap = new Map();
  let linesArr = input.split(/\r?\n/);
  for (const line of linesArr) {
    let nameTest = line.match(/^`\d+\.` (.+) \((\d+) MMR\)$/);
    if (nameTest) {
      // Replace is needed for backslashes that get added before punctuation marks otherwise used
      // for Discord formatting (including _underscores_, which appear frequently).
      nameMmrMap.set(nameTest[1].replace(/\\/g, ""), Number(nameTest[2]));
    }
  }
  return nameMmrMap;
}

// Interprets the scoreboard and returns a mapping from name to finishing score.
function parseScoreboardInput(input) {
  let nameScoreMap = new Map();
  let linesArr = input.split(/\r?\n/);
  for (const line of linesArr) {
    let scoreTest = line.match(/^(.+) (\d+)$/);
    if (scoreTest) {
      // Replace is needed for backslashes that get added before punctuation marks otherwise used
      // for Discord formatting (including _underscores_, which appear frequently).
      nameScoreMap.set(scoreTest[1].replace(/\\/g, ""), scoreTest[2]);
    }
  }
  return nameScoreMap;
}

function processText(a, b) {
  let nameMmrMap = parseHeaderInput(a);
  let nameScoreMap = parseScoreboardInput(b);
  let placeNameMap = new Map();

  // Validate maps: Make sure each has 24 entries and identical keys.
  if (nameMmrMap.size != 24) {
    setStatus("Detected " + nameMmrMap.size + " unique names instead of the expected 24. (This tool currently supports only 24-player FFA formats.)");
    return;
  }
  if (nameScoreMap.size != 24) {
    setStatus("Detected " + nameScoreMap.size + " unique scoreboard entries instead of the expected 24.");
    return;
  }

  // TODO: Add validation to ensure names are 1:1 between maps.

  let mmrAdjustmentText = "```Expected MMR Changes (unofficial)\n";
  for (const [name1, mmr1] of nameMmrMap) {
    let mmrAdjustment = 0;
    let place = 1;
    let mmrAfter = 0;
    for (const [name2, mmr2] of nameMmrMap) {
      const decision = Math.sign(nameScoreMap.get(name1) - nameScoreMap.get(name2));
      place += (decision === -1 ? 1 : 0);
      mmrAdjustment += calculateMmrAdjustment(mmr1, mmr2, decision);
    }
    mmrAdjustment = Math.round(mmrAdjustment);
    mmrAfter = Math.ceil(mmr1 + mmrAdjustment, 0);
    mmrAdjustment = mmrAfter - mmr1;

    mmrAdjustmentText += name1 + ": " + mmr1 + " --> " + mmrAfter + " (" + mmrAdjustment + ")\n";
  }

  mmrAdjustmentText += "\nMade at https://cozyfog5.github.io```";

  return mmrAdjustmentText;
}
