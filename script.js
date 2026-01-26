const mogiHeaderInput = document.getElementById('mogiHeaderInput');
const scoreboardInput = document.getElementById('scoreboardInput');
const mmrTableOutput = document.getElementById('mmrTableOutput');
const calculateButton = document.getElementById('calculateButton');
const copyButton = document.getElementById('copyButton');
const mogiHeaderStatusBar = document.getElementById('mogiHeaderStatusBar');
const scoreboardStatusBar = document.getElementById('scoreboardStatusBar');
const mmrTableStatusBar = document.getElementById('mmrTableStatusBar');
const kErrorWrongMmrMapSize = "wrong_mmr_map_size";
const kErrorWrongScoreboardMapSize = "wrong_scoreboard_map_size";
const kErrorMismatchedNames = "mismatched_names";

function setStatus(target, message, isPositive) {
  target.textContent = message;
  if (isPositive) {
    target.classList.remove("error");
    target.classList.add("success");
  } else {
    target.classList.add("error");
    target.classList.remove("success");
  }
}

mogiHeaderInput.addEventListener('input', () => {setStatus(mogiHeaderStatusBar, "", true);});
scoreboardInput.addEventListener('input', () => {setStatus(scoreboardStatusBar, "", true);});

// Generate output
calculateButton.addEventListener('click', () => {
  setStatus(mogiHeaderStatusBar, "", true);
  setStatus(scoreboardStatusBar, "", true);
  setStatus(mmrTableStatusBar, "", true);
  mmrTableOutput.value = "";
  let processTextResult = processText(mogiHeaderInput.value, scoreboardInput.value);
  if (!processTextResult.ok) {
    switch (processTextResult.reason) {
      case kErrorWrongMmrMapSize:
        setStatus(mogiHeaderStatusBar, "Detected " + processTextResult.num_detected + " unique " + (processTextResult.num_detected === 1 ? "team" : "teams") + ". For FFAs, there should be 24 players. For squad contests, there should be either 2, 3, 4, 6, 8, or 12 teams. Please confirm that the entire mogi header was copied and that there are no formatting issues or duplicate names.", false);
        break;
      case kErrorWrongScoreboardMapSize:
        setStatus(scoreboardStatusBar, "Detected " + processTextResult.num_detected + " valid scoreboard " + (processTextResult.num_detected === 1 ? "entry" : "entries") + " instead of the expected " + processTextResult.num_expected + ". Please confirm that the entire scoreboard message was copied and that there are no formatting issues or duplicate names.", false);
        break;
      case kErrorMismatchedNames: {
        const names = processTextResult.mismatchedNames;  // Alias for brevity
        let message = (names.length === 1 ? "Player " : "Players ");
        for (let i = 0; i < names.length; ++i) {
          if (names.length >= 3 && i >= 1) {
            message += ", ";
          }
          if (names.length >= 2 && i == names.length - 1) {
            message += " and ";
          }
          message += names[i];
        }
        message += (names.length === 1 ? " appears" : " appear") + " in the scoreboard but not this mogi header. If " + (names.length === 1 ? " this player is a substitute" : " these players are substitutes") + ", please replace the original " + (names.length === 1 ? "player" : "players") + " here as if the " + (names.length === 1 ? "substitute" : "substitutes") + " had participated from the start.";
        setStatus(mogiHeaderStatusBar, message, false);
        break;
      }
      default:
        setStatus(mmrTableStatusBar, "Some miscellaneous error occurred. If cozyfog5 were a better coder, he would have handled this specific case and given you a precise error message instead of this generic text.", false);
        break;
    }
    return;
  }
  mmrTableOutput.value = getMmrChangeSummaryText(processTextResult.playersInfo);
  setStatus(mmrTableStatusBar, "Output generated!", true);
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

// Ctrl+Alt+Shift+T to produce sample inputs
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.altKey && event.shiftKey && event.key === 'T') {
    event.preventDefault();
    supplySampleText();
  }
});

function supplySampleText() {
  mogiHeaderInput.value = "`Room 1 - Player List`\n`1.` Player A (11277 MMR)\n`2.` Player B (11062 MMR)\n`3.` Player C (10444 MMR)\n`4.` Player D (9030 MMR)\n`5.` Player E (8026 MMR)\n`6.` Player F (6630 MMR)\n`7.` Player G (6515 MMR)\n`8.` Player H (6465 MMR)\n`9.` Player I (6458 MMR)\n`10.` Player J (6297 MMR)\n`11.` Player K (6145 MMR)\n`12.` Player L (6016 MMR)\n`13.` Player M (5662 MMR)\n`14.` Player N (5580 MMR)\n`15.` Player O (5418 MMR)\n`16.` Player P (5368 MMR)\n`17.` Player Q (4402 MMR)\n`18.` Player R (4115 MMR)\n`19.` Player S (4007 MMR)\n`20.` Player T (3915 MMR)\n`21.` Player U (3611 MMR)\n`22.` Player V (3288 MMR)\n`23.` Player W (2796 MMR)\n`24.` Player X (2469 MMR)";
  scoreboardInput.value = "!submit 1 Q\nPlayer A 119\nPlayer B 76\nPlayer C 119\nPlayer D 89\nPlayer E 89\nPlayer F 93\nPlayer G 83\nPlayer H 77\nPlayer I 50\nPlayer J 79\nPlayer K 81\nPlayer L 90\nPlayer M 72\nPlayer N 68\nPlayer O 73\nPlayer P 61\nPlayer Q 75\nPlayer R 50\nPlayer S 38\nPlayer T 54\nPlayer U 47\nPlayer V 47\nPlayer W 56\nPlayer X 42";
}

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
  let mismatchedNames = new Array();

  // Make sure each table has exactly 24 entries.
  if (nameMmrMap.size != 24) {
    return {ok: false, reason: kErrorWrongMmrMapSize, num_detected: nameMmrMap.size};
  }
  if (nameScoreMap.size != 24) {
    return {ok: false, reason: kErrorWrongScoreboardMapSize, num_detected: nameScoreMap.size, num_expected: 24};
  }

  // Make sure both tables have identical keys.
  for (const [name, score] of nameScoreMap) {
    if (!nameMmrMap.get(name)) {
      // Name is not present in mogi header.
      mismatchedNames.push(name);
    }
  }
  if (mismatchedNames.length > 0) {
    return {ok: false, reason: kErrorMismatchedNames, mismatchedNames: mismatchedNames};
  }

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

  mmrAdjustmentText += "```\n-# Generated using https://cozyfog5.github.io. No warranty implied. May contain errors.";
  return mmrAdjustmentText;
}
