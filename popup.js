function loadSnippets() {
  chrome.storage.local.get("snippets", (data) => {
    const snippets = data.snippets || {};
    const list = document.getElementById("snippets");
    list.innerHTML = "";

    // sort by most recent
    const sorted = Object.entries(snippets).map(([key, val]) => {
      if (typeof val === 'string') {
        return [key, { value: val, added: 0 }];
      }
      return [key, val];
    }).sort((a, b) => b[1].added - a[1].added);

    for (const [key, entry] of sorted) {
      const li = document.createElement("li");
      li.className = "snippet-item";

      const span = document.createElement("span");
      span.innerHTML = `<strong>Command: ${key}</strong><br><span class="snippet-value">${entry.value}</span>`;
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
      list.appendChild(li);
    }
  });
}

function saveSnippet() {
  const key = document.getElementById("shortcut").value.trim();
  const value = document.getElementById("content").value.trim();
  if (!key || !value) return;

  chrome.storage.local.get("snippets", (data) => {
    const snippets = data.snippets || {};
    snippets[key] = {
      value,
      added: Date.now()
    };
    chrome.storage.local.set({ snippets }, () => {
      loadSnippets();
      document.getElementById("shortcut").value = "";
      document.getElementById("content").value = "";
      document.getElementById("shortcut").focus();
    });
  });
}

document.getElementById("save").addEventListener("click", saveSnippet);

// Allow Enter key to trigger save
document.getElementById("content").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    saveSnippet(); // Handles clearing too
  }
});

// Download snippets
document.getElementById("download").addEventListener("click", () => {
  chrome.storage.local.get("snippets", (data) => {
    const blob = new Blob([JSON.stringify(data.snippets, null, 2)], {
      type: "application/json"
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "snippets.json";
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Upload snippets
document.getElementById("upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      const normalized = {};
      for (const [key, val] of Object.entries(imported)) {
        if (typeof val === "string") {
          normalized[key] = { value: val, added: Date.now() };
        } else if (typeof val === "object" && val.value) {
          normalized[key] = { value: val.value, added: val.added || Date.now() };
        }
      }

      chrome.storage.local.get("snippets", (data) => {
        const current = data.snippets || {};
        const merged = { ...current, ...normalized };
        chrome.storage.local.set({ snippets: merged }, loadSnippets);
      });
    } catch (err) {
      alert("Invalid JSON file.");
    }
  };
  reader.readAsText(file);
});

// Initial load
loadSnippets();
