function loadSnippets() {
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || {};
      const list = document.getElementById("snippets");
      list.innerHTML = "";
  
      for (const [key, value] of Object.entries(snippets)) {
        const li = document.createElement("li");
        li.className = "snippet-item";
  
        const span = document.createElement("span");
        span.innerHTML = `<strong>Command: ${key} </strong><br><span class="snippet-value">${value}</span>`;
        span.className = "snippet-text";
  
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.className = "delete-btn";
        delBtn.title = `Delete "${key}"`;
        delBtn.addEventListener("click", () => {
          delete snippets[key];
          chrome.storage.local.set({ snippets }, loadSnippets);
        });
  
        li.appendChild(span);
        li.appendChild(delBtn);
        list.prepend(li);
      }
    });
  }

  document.getElementById("save").addEventListener("click", () => {
    const key = document.getElementById("shortcut").value.trim();
    const value = document.getElementById("content").value.trim();
    if (!key || !value) return;
  
    chrome.storage.local.get("snippets", (data) => {
      const snippets = data.snippets || {};
      snippets[key] = value;
      chrome.storage.local.set({ snippets }, loadSnippets);
    });
  });
  
  document.getElementById("content").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent newline
      document.getElementById("save").click();
    }});

  // Download snippets as JSON
document.getElementById("download").addEventListener("click", () => {
  chrome.storage.local.get("snippets", (data) => {
    const blob = new Blob([JSON.stringify(data.snippets, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "snippets.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Upload and import snippets
document.getElementById("upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedSnippets = JSON.parse(e.target.result);
      chrome.storage.local.get("snippets", (data) => {
        const current = data.snippets || {};
        const merged = { ...current, ...importedSnippets };
        chrome.storage.local.set({ snippets: merged }, loadSnippets);
      });
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});


  loadSnippets();
  