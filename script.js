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
    setStatus('Input cleared.');
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

function processText(a, b) {
  return [
    '--- Input A ---',
    a.trim(),
    '',
    '--- Input B ---',
    b.trim(),
    '',
    '--- End ---'
  ].join('\n');
}
