var muffcastUrl = "http://localhost:8128";
browser.storage.local.get("muffcast").then(function(result) {
	muffcastUrl = result.muffcast && result.muffcast.url || muffcastUrl;
})

var clientUpdate = function() {
	return browser.tabs.query({
		currentWindow: true,
		active: true
	}).then(function(tabs) {
		var tab = tabs[0];
		return browser.tabs.sendMessage(tab.id, {
			command: "update"
		});
	});
}

var setStatus = function() {
	var xhttp = new XMLHttpRequest();
	xhttp.open("GET", muffcastUrl, true);
	xhttp.onreadystatechange = function() {
		var idleElement = document.getElementById("idle");
		var errorElement = document.getElementById("error");
		var muffcastElement = document.getElementById("muffcast");
		if (this.readyState == 4) {
			if (this.status == 200) {
				var status = this.responseText && JSON.parse(this.responseText);
				if (status && status.running) {
					var titleElement = document.getElementById("title");
					titleElement.textContent = status.title;
					titleElement.href = decodeURIComponent(status.url);

					var hostElement = document.getElementById("host");
					hostElement.textContent = decodeURIComponent(status.host);

					var muteElement = document.getElementById("mute");

					var updateMuteElement = function() {
						muteElement.innerHTML = status.muted ? '<i class="fa fa-fw fa-volume-off"></i>' : (status.volume < 0.5 ? '<i class="fa fa-fw fa-volume-down"></i>' : '<i class="fa fa-fw fa-volume-up"></i>');
					}

					muteElement.addEventListener("click", function(event) {
						status.muted = !status.muted;
						browser.runtime.sendMessage({
							"command": "mute",
							"muted": status.muted
						});
						volumeElement.value = status.muted ? 0 : status.volume;
						updateMuteElement();
						clientUpdate();
					})

					updateMuteElement();

					var volumeElement = document.getElementById("volume");
					volumeElement.setAttribute("value", status.muted ? 0 : status.volume);

					volumeElement.addEventListener("change", function(event) {
						browser.runtime.sendMessage({
							"command": "volume",
							"volume": volumeElement.value
						});
						status.volume = volumeElement.value;
						status.muted = volumeElement.value == 0;
						updateMuteElement();
					});

					var playElement = document.getElementById("play");

					playElement.innerHTML = status.playing ? '<i class="fa fa-fw fa-pause"></i>' : '<i class="fa fa-fw fa-play"></i>';

					playElement.addEventListener("click", function(event) {
						browser.runtime.sendMessage({
							"command": status.playing ? "pause" : "play"
						});
						status.playing = !status.playing;
						playElement.innerHTML = status.playing ? '<i class="fa fa-fw fa-pause"></i>' : '<i class="fa fa-fw fa-play"></i>';

						clientUpdate();
					})

					var stopElement = document.getElementById("stop");

					stopElement.addEventListener("click", function(event) {
						browser.runtime.sendMessage({
							"command": "stop"
						});
						clientUpdate();
						muffcastElement.classList.remove("visible");
						idleElement.classList.add("visible");
						errorElement.classList.remove("visible");
					})

					muffcastElement.classList.add("visible");
					idleElement.classList.remove("visible");
					errorElement.classList.remove("visible");

				} else {
					muffcastElement.classList.remove("visible");
					idleElement.classList.add("visible");
					errorElement.classList.remove("visible");
				}
			} else {
				muffcastElement.classList.remove("visible");
				idleElement.classList.remove("visible");
				errorElement.classList.add("visible");
			}
		}
	}
	xhttp.setRequestHeader("Content-type", "application/json");
	xhttp.send();
}

setStatus();
