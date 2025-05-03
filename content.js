function expandSnippet(input) {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || {};
      for (const key in snippets) {
        if (input.value.includes(key)) {
          input.value = input.value.replaceAll(key, snippets[key]);
        }
      }
    });
  }
  
  document.addEventListener("keydown", (e) => {
    if (e.key === " " || e.key === "Enter") {
      const active = document.activeElement;
      if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT" || active.isContentEditable)) {
        expandSnippet(active);
      }
    }
  });

console.log("Textblazed local is running...")
  