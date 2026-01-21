const mogiHeaderInput = document.getElementById('mogiHeaderInput');
const scoreboardInput = document.getElementById('scoreboardInput');
const mmrTableOutput = document.getElementById('mmrTableOutput');
const calculateButton = document.getElementById('calculateButton');
const copyButton = document.getElementById('copyButton');
const mogiHeaderStatusBar = document.getElementById('mogiHeaderStatusBar');
const scoreboardStatusBar = document.getElementById('scoreboardStatusBar');
const mmrTableStatusBar = document.getElementById('mmrTableStatusBar');
const kErrorWrongMmrMapSize = "wrong_mmr_map_size";
const kErrorWrongScoreboardMapSize = "wrong_scoreboard_map_size"

let mmrTableStatusBarTimeout = null;

function setStatus(target, message, isPositive) {
  target.textContent = message;
  // if (mmrTableStatusBarTimeout) {
  //   clearTimeout(mmrTableStatusBarTimeout);
  // }
  // if (message) {
  //   mmrTableStatusBarTimeout = setTimeout(() => {
  //     mmrTableStatusBar.textContent = '';
  //   }, 3000);
  // }
}

// Generate output
calculateButton.addEventListener('click', () => {
  setStatus(mogiHeaderStatusBar, "", true);
  setStatus(scoreboardStatusBar, "", true);
  setStatus(mmrTableStatusBar, "", true);
  mmrTableOutput.value = "";
  let processTextResult = processText(mogiHeaderInput.value, scoreboardInput.value);
  if (!processTextResult.ok) {
    if (processTextResult.reason === kErrorWrongMmrMapSize) {
      setStatus(mogiHeaderStatusBar, "Detected " + processTextResult.num_detected + " unique entr" + (processTextResult.num_detected === 1 ? "y" : "ies") + " instead of the expected " + processTextResult.num_expected + ". This tool currently supports only 24-player FFA mogis. If you are using this format, please confirm that the entire message was copied and that there are no formatting issues or duplicate names.", false);
      return;
    }
    if (processTextResult.reason === kErrorWrongScoreboardMapSize) {
      setStatus(scoreboardStatusBar, "Detected " + processTextResult.num_detected + " unique scoreboard entr" + (processTextResult.num_detected === 1 ? "y" : "ies") + " instead of the expected " + processTextResult.num_expected + ". Please confirm that the entire message was copied and that there are no formatting issues or duplicate names.", false);
      return;
    }
  }
  mmrTableOutput.value = getMmrChangeSummaryText(processTextResult.playersInfo);
  setStatus(mmrTableStatusBar, "Output generated.", true);
});

// Copy output
copyButton.addEventListener('click', async () => {
  if (mmrTableOutput.value === "") {
    // Nothing to copy; just return instead of clearing the clipboard.
    setStatus(mmrTableStatusBar, "Nothing to copy.", false);
    return;
  }

  try {
    await navigator.clipboard.writeText(mmrTableOutput.value);
    setStatus(mmrTableStatusBar, "Output copied to clipboard.", true);
  } catch {
    setStatus(mmrTableStatusBar, "Failed to copy output.", false);
  }
});

// Overlay clear buttons
document.querySelectorAll('.clear-overlay').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    const textarea = document.getElementById(targetId);
    textarea.value = '';
    textarea.focus();
  });
});

// Ctrl+Enter to generate
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'Enter') {
    event.preventDefault();
    calculateButton.click();
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
    let nameTest = line.match(/^\s*`?\d+\.`?\s*(.+?)\s*\((\d+) MMR\)\s*$/);
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
    let scoreTest = line.match(/^\s*([^\+]+?)\s+(\d+)(\s*\+\s*(\d+))?\s*$/);
    if (scoreTest) {
      let score = Number(scoreTest[2]);
      // Special logic for cases where a scoreboard is entered with DC points manually entered like 52+7.
      if (scoreTest.length >= 5 && scoreTest[4]) {
        score += Number(scoreTest[4]);
      }
      // Replace is needed for backslashes that get added before punctuation marks otherwise used
      // for Discord formatting (including _underscores_, which appear frequently).
      nameScoreMap.set(scoreTest[1].replace(/\\/g, ""), score);
    }
  }
  return nameScoreMap;
}

function processText(a, b) {
  let nameMmrMap = parseHeaderInput(a);
  let nameScoreMap = parseScoreboardInput(b);
  let playersInfo = new Array();

  // Validate maps: Make sure each has 24 entries and identical keys.
  if (nameMmrMap.size != 24) {
    return {ok: false, reason: kErrorWrongMmrMapSize, num_detected: nameMmrMap.size, num_expected: 24};
  }
  if (nameScoreMap.size != 24) {
    return {ok: false, reason: kErrorWrongScoreboardMapSize, num_detected: nameScoreMap.size, num_expected: 24};
  }

  // TODO: Add validation to ensure names are 1:1 between maps.

  for (const [name1, mmr1] of nameMmrMap) {
    let player = {name: name1, mmrBefore: mmr1, mmrChange: 0, mmrAfter: 0, score: 0, place: 0};
    player.score = nameScoreMap.get(player.name);  // TODO: Error handling...
    for (const [name2, mmr2] of nameMmrMap) {
      const decision = Math.sign(player.score - nameScoreMap.get(name2));
      player.place += (decision === -1 ? 1 : 0);
      player.mmrChange += calculateMmrAdjustment(player.mmrBefore, mmr2, decision);
    }
    player.mmrChange = Math.round(player.mmrChange);
    player.mmrAfter = Math.ceil(player.mmrBefore + player.mmrChange, 0);  // Need to ensure that MMR doesn't drop below 0 under any circumstances.
    player.mmrChange = player.mmrAfter - player.mmrBefore;  // Update MMR adjustment to reflect possible bounding by 0.
    playersInfo.push(player);
  }

  // Sort playersInfo best placement to worst placement, then by ascending MMR (so that better adjustments tend to be upward on the table).
  playersInfo.sort((a, b) => {
    return a.place !== b.place ? a.place - b.place : a.mmrBefore - b.mmrBefore;
  });

  return {ok: true, playersInfo: playersInfo};
}

function getMmrChangeSummaryText(playersInfo) {
  let longestNameLength = 0;
  let longestMmrBeforeLength = 0;
  let longestMmrAfterLength = 0;

  // Record lengths of names and MMRs
  for (const player of playersInfo) {
    if (player.name.length > longestNameLength) {
      longestNameLength = player.name.length;
    }
    if (String(player.mmrBefore).length > longestMmrBeforeLength) {
      longestMmrBeforeLength = String(player.mmrBefore).length;
    }
    if (String(player.mmrAfter).length > longestMmrAfterLength) {
      longestMmrAfterLength = String(player.mmrAfter).length;
    }
  }
  
  let mmrAdjustmentText = "```Expected MMR Changes (unofficial)";
  for (const player of playersInfo) {
    let mmrChangeText = (player.mmrChange > 0 ? "+" : "") + player.mmrChange;
    mmrAdjustmentText += "\n" + player.name + " ".repeat(longestNameLength - player.name.length) + ": " +
        " ".repeat(longestMmrBeforeLength - String(player.mmrBefore).length) + player.mmrBefore + " --> " +
        " ".repeat(longestMmrAfterLength - String(player.mmrAfter).length) + player.mmrAfter + " (" +
        " ".repeat(4 - mmrChangeText.length) + mmrChangeText + ")";
  }

  mmrAdjustmentText += "```\n-# Made at https://cozyfog5.github.io. No warranty implied. May contain errors.";
  return mmrAdjustmentText;
}
