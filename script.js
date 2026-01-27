// Controls
const mogiHeaderInput = document.getElementById('mogiHeaderInput');
const scoreboardInput = document.getElementById('scoreboardInput');
const mmrTableOutput = document.getElementById('mmrTableOutput');
const calculateButton = document.getElementById('calculateButton');
const copyButton = document.getElementById('copyButton');
const mogiHeaderStatusBar = document.getElementById('mogiHeaderStatusBar');
const scoreboardStatusBar = document.getElementById('scoreboardStatusBar');
const mmrTableStatusBar = document.getElementById('mmrTableStatusBar');

// Errors
const kErrorMismatchedNames = "mismatched_names";
const kErrorNotAssignedToTeam = "player_not_assigned_to_team";
const kErrorInvalidNumberOfTeams = "invalid_number_of_teams";
const kErrorInvalidNumberOfPlayersInHeader = "invalid_number_of_players_in_header";
const kErrorInvalidNumberOfPlayersOnScoreboard = "invalid_number_of_players_on_scoreboard";
const kErrorPlayerQuantityMismatch = "player_quantity_mismatch";
const kErrorMiscellaneous = "miscellaneous";

function debugStatus(message) {
  setStatus(mmrTableStatusBar, message, true);
}

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
  let processTextResult = tryProcessText(mogiHeaderInput.value, scoreboardInput.value);
  if (!processTextResult.ok) {
    switch (processTextResult.reason) {
      case kErrorWrongMmrMapSize:
        setStatus(mogiHeaderStatusBar, "Detected " + processTextResult.numDetected + " unique " + (processTextResult.numDetected === 1 ? "team" : "teams") + ". For FFAs, there should be 12 or 24 players. For squad contests, there should be either 2, 3, 4, 6, 8, or 12 teams. Please confirm that the entire mogi header was copied and that there are no formatting issues or duplicate names.", false);
        break;
      case kErrorWrongScoreboardMapSize:
        setStatus(scoreboardStatusBar, "Detected " + processTextResult.numDetected + " valid scoreboard " + (processTextResult.numDetected === 1 ? "entry" : "entries") + " instead of the expected 12 or 24. Please confirm that the entire scoreboard message was copied and that there are no formatting issues or duplicate names.", false);
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
      case kErrorMiscellaneous:
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
function calculateMmrAdjustment(mmrA, mmrB, decision, numTeams) {
  const formatConstantTable = new Map ([
    [2, {cap: 300, scaling: 4650, baseline: 100}],
    [3, {cap: 240, scaling: 4800, baseline: 80}],
    [4, {cap: 180, scaling: 5100, baseline: 60}],
    [6, {cap: 120, scaling: 5500, baseline: 40}],
    [8, {cap: 90, scaling: -1, baseline: 30}],
    [12, {cap: 60, scaling: 9500, baseline: 20}],
    [24, {cap: 30, scaling: 9500, baseline: 10}],
  ]);

  const formatConstants = formatConstantTable.get(numTeams);
  if (!formatConstants) {
    // TODO: Log an error of some kind?
    return 0;
  }

  const logisticBase = 11;
  const offset = Math.log(formatConstants.cap / formatConstants.baseline - 1) / Math.log(logisticBase);

  if (decision === 0) {
    // Tie
    return Math.sign(mmrB - mmrA) * (formatConstants.cap / (1 + Math.pow(logisticBase, -(Math.abs(mmrB - mmrA) / formatConstants.scaling - offset))) - formatConstants.cap / 3);
  } else {
    // Decision
    return Math.sign(decision) * formatConstants.cap / (1 + Math.pow(logisticBase, -(Math.sign(decision) * (mmrB - mmrA) / formatConstants.scaling - offset)));
  }
}

// Interprets text as the mogi "header," which I define to be the first message posted in the room,
// and returns a mapping from name to starting MMR if possible.
function parseHeaderInput(input) {
  let teamMmrMemberMap = new Map();
  let playerTeamMap = new Map();
  let linesArr = input.split(/\r?\n/);
  let teamId = 1;
  for (const line of linesArr) {
    let teamTest = line.match(/^\s*`?\d+\.`?\s*(.+?)\s*\((\d+) MMR\)\s*$/);
    if (teamTest) {
      // Line understood to represent a team (where a player in FFA formats is a one-person team).

      // Assign each player to their team ID.
      let teamMembers = teamTest[1].split(/,\s*/);
      for (let i = 0; i < teamMembers.length; ++i) {
        // Replace is needed for backslashes that get added before punctuation marks otherwise used
        // for Discord formatting (including _underscores_, which appear frequently).
        teamMembers[i] = teamMembers[i].replace(/\\/g, "");
      }

      // Assign a team's members. (Yes, this is a parallel data structure, but it will aid lookups
      // since we will need lookups from player to team and team to players.
      for (const player of teamMembers) {
        playerTeamMap.set(player.replace(/\\/g, ""), teamId);
      }

      // Assign players and starting MMR to the team.
      teamMmrMemberMap.set(teamId, {members: teamMembers, startingMmr: Number(teamTest[2])});

      ++teamId;
    }
  }
  return {playerTeamMap: playerTeamMap, teamMmrMemberMap: teamMmrMemberMap};
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

function tryCalculateTeamScores(playerTeamMap, nameScoreMap) {
  let teamScoreMap = new Map();
  let unassignedPlayers = new Array();



  for (const [playerName, playerScore] of nameScoreMap) {
    const teamId = playerTeamMap.get(playerName);
    if (!teamId) {
      unassignedPlayers.push(playerName);
      continue;
    }
    if (teamScoreMap.has(teamId)) {
      teamScoreMap.set(teamScoreMap.get(teamId) + playerScore);
    } else {
      teamScoreMap.set(teamId, playerScore);
    }
  }

  if (unassignedPlayers.length > 0) {
    return {ok: false, reason: kErrorNotAssignedToTeam, unassignedPlayers: unassignedPlayers};
  }

  return {ok: true, teamScoreMap: teamScoreMap};
}

function tryProcessText(a, b) {
  const headerResult = parseHeaderInput(a);
  const nameScoreMap = parseScoreboardInput(b);

  // Validate that the number of teams is something we can handle.
  const validNumTeams = [24, 12, 8, 6, 4, 2, 1];
  let hasValidNumTeams = false;
  for (const numTeams of validNumTeams) {
    if (headerResult.teamMmrMemberMap.size == numTeams) {
      hasValidNumTeams = true;
      break;
    }
  }

  if (!hasValidNumTeams) {
    return {ok: false, reason: kErrorInvalidNumberOfTeams, numTeams: headerResult.teamMmrMemberMap.size};
  }

  // Validate that the number of players in the header matches expectations.
  if (headerResult.playerTeamMap.size != 12 && headerResult.playerTeamMap.size != 24) {
    return {ok: false, reason: kErrorInvalidNumberOfPlayersInHeader, numDetected: nameScoreMap.size};
  }

  // Validate that the number of players on the scoreboard matches expectation.
  if (nameScoreMap.size != 12 && nameScoreMap.size != 24) {
    return {ok: false, reason: kErrorInvalidNumberOfPlayersOnScoreboard, numDetected: nameScoreMap.size};
  }

  // Validate that the number of players in the header matches the number of players on the scoreboard.
  if (nameScoreMap.size != headerResult.playerTeamMap.size) {
    return {ok: false, reason: kErrorPlayerQuantityMismatch, numPlayersInHeader: headerResult.playerTeamMap.size, numPlayersOnScoreboard: nameScoreMap.size};
  }

  const calculateTeamScoresResult = tryCalculateTeamScores(headerResult.playerTeamMap, nameScoreMap);

  // Report any reconciliation errors between header and scoreboard (typically mismatched names).
  if (!calculateTeamScoresResult.ok) {
    return calculateTeamScoresResult;
  }

  let teamResults = new Map();
  for (const [teamId, teamInfo] of headerResult.teamMmrMemberMap) {
    let teamResult = {startingMmr: teamInfo.startingMmr, mmrChange: 0, score: 0, place: 0};
    
    // Calculate the team's cumulative score.
    for (const member of teamInfo.members) {
      let playerScore = nameScoreMap.get(member);
      if (!playerScore) {
        // TODO: Throw precise error.
        return {ok: false, reason: kErrorMiscellaneous};
      }
      teamResult.score += nameScoreMap.get(member);
    }

    teamResults.set(teamId, teamResult);
  }

  // Calculate team placements and MMR changes.
  for (let [teamId1, teamResult1] of teamResults) {
    for (const [teamId2, teamResult2] of teamResults) {
      const decision = Math.sign(teamResult1.score - teamResult2.score);
      teamResult1.place += (decision === -1 ? 1 : 0);
      teamResult1.mmrChange += calculateMmrAdjustment(teamResult1.startingMmr, teamResult2.startingMmr, decision, headerResult.teamMmrMemberMap.size);
    }
    teamResult1.mmrChange = Math.round(teamResult1.mmrChange);
  }

  let playersInfo = new Array();
  for (const [name, score] of nameScoreMap) {
    let player = {name: name, mmrBefore: }
  }

debugStatus("HERE");

  // for (const [name1, mmr1] of nameMmrMap) {
  //   let player = {name: name1, mmrBefore: mmr1, mmrChange: 0, mmrAfter: 0, score: 0, place: 0};
  //   player.score = nameScoreMap.get(player.name);  // TODO: Error handling...
  //   for (const [name2, mmr2] of nameMmrMap) {
  //     const decision = Math.sign(player.score - nameScoreMap.get(name2));
  //     player.place += (decision === -1 ? 1 : 0);
  //     player.mmrChange += calculateMmrAdjustment(player.mmrBefore, mmr2, decision, 24);
  //   }
  //   player.mmrChange = Math.round(player.mmrChange);
  //   player.mmrAfter = Math.ceil(player.mmrBefore + player.mmrChange, 0);  // Need to ensure that MMR doesn't drop below 0 under any circumstances.
  //   player.mmrChange = player.mmrAfter - player.mmrBefore;  // Update MMR adjustment to reflect possible bounding by 0.
  //   playersInfo.push(player);
  // }

  // // Sort playersInfo best placement to worst placement, then by ascending MMR (so that better adjustments tend to be upward on the table).
  // playersInfo.sort((a, b) => {
  //   return a.place !== b.place ? a.place - b.place : a.mmrBefore - b.mmrBefore;
  // });

  // return {ok: true, playersInfo: playersInfo};
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
