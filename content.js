function getLastWordFromCaret(text, caretPos) {
  const left = text.slice(0, caretPos);
  const match = left.match(/(\S+)$/); // match last word
  return match ? match[1] : "";
}

function replaceLastWord(text, caretPos, command, replacement) {
  const left = text.slice(0, caretPos);
  const right = text.slice(caretPos);
  const newLeft = left.replace(new RegExp(`${command}$`), replacement);
  const newCaret = newLeft.length;
  return { newText: newLeft + right, newCaret };
}

// For input and textarea
function handleTextInput(el) {
  el.addEventListener("input", () => {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || {};
      const caretPos = el.selectionStart;
      const value = el.value;
      const word = getLastWordFromCaret(value, caretPos);

      const matched = Object.keys(snippets).find(k => k === word);
      if (!matched) return;

      const snippet = typeof snippets[matched] === "string"
        ? snippets[matched]
        : snippets[matched].value;

      const { newText, newCaret } = replaceLastWord(value, caretPos, matched, snippet);
      el.value = newText;
      el.setSelectionRange(newCaret, newCaret);
    });
  });
}

// For contenteditable
function handleContentEditable(el) {
  el.addEventListener("input", () => {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || {};
      const selection = window.getSelection();
      if (!selection || !selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const caretNode = range.startContainer;
      const caretOffset = range.startOffset;

      const fullText = el.innerText;
      const flatCaretPos = getFlatCaretPosition(el, selection);

      const word = getLastWordFromCaret(fullText, flatCaretPos);
      const matched = Object.keys(snippets).find(k => k === word);
      if (!matched) return;

      const snippet = typeof snippets[matched] === "string"
        ? snippets[matched]
        : snippets[matched].value;

      const { newText, newCaret } = replaceLastWord(fullText, flatCaretPos, matched, snippet);
      el.innerText = newText;

      // Restore caret
      setFlatCaretPosition(el, newCaret);
    });
  });
}

// Flatten caret position from selection
function getFlatCaretPosition(container, selection) {
  const range = document.createRange();
  range.setStart(container, 0);
  range.setEnd(selection.anchorNode, selection.anchorOffset);
  return range.toString().length;
}

// Set caret at flat character position
function setFlatCaretPosition(container, charIndex) {
  const nodeIterator = document.createNodeIterator(container, NodeFilter.SHOW_TEXT, null);
  let currentNode;
  let total = 0;

  while ((currentNode = nodeIterator.nextNode())) {
    const nextTotal = total + currentNode.length;
    if (charIndex <= nextTotal) {
      const offset = charIndex - total;
      const range = document.createRange();
      range.setStart(currentNode, offset);
      range.collapse(true);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      return;
    }
    total = nextTotal;
  }
}

// Bind listeners to all editable fields
function initListeners(root = document) {
  const inputs = root.querySelectorAll("input[type='text'], textarea");
  const editables = root.querySelectorAll("[contenteditable='true']");

  inputs.forEach(handleTextInput);
  editables.forEach(handleContentEditable);
}

// Initialize on page load
initListeners();

// Watch dynamic changes for SPA apps like Sentinel or Notion
const observer = new MutationObserver(() => initListeners());
observer.observe(document.body, { childList: true, subtree: true });

console.log("⚡ Real-time snippet expansion active in all inputs and editors");
