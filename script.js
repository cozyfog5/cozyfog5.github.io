const inputA = document.getElementById('inputA');
const inputB = document.getElementById('inputB');
const output = document.getElementById('output');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyBtn');
const statusBar = document.getElementById('statusBar');

function setStatus(message) {
  statusBar.textContent = message;
  if (message) {
    setTimeout(() => {
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
