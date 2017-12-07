function saveOptions(e) {
	e.preventDefault();
	browser.storage.local.set({
		"muffcast": {
			"url": document.querySelector("#muffcast-url").value,
			"syncInterval": document.querySelector("#muffcast-sync-interval").value
		}
	});
}

function restoreOptions() {
	browser.storage.local.get("muffcast").then(function(result) {
		document.querySelector("#muffcast-url").value = result.muffcast && result.muffcast.url || "http://localhost:8128";
		document.querySelector("#muffcast-sync-interval").value = result.muffcast && result.muffcast.syncInterval || 30000;
	});
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
