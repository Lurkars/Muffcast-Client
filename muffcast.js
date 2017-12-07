console.log("muffcast client v0.1");

var currentStatus;
var syncIntervals = [];
var syncIntervalTime = 30000;
var seekIntervals = [];
var muffcastUrl = "http://localhost:8128";

browser.storage.local.get("muffcast").then(function(result) {
	muffcastUrl = result.muffcast && result.muffcast.url || muffcastUrl;
	syncIntervalTime = result.muffcast && result.muffcast.syncInterval && parseInt(result.muffcast.syncInterval) || syncIntervalTime;
})

var getStatus = function() {
	return new Promise(function(resolve, reject) {
		var xhttp = new XMLHttpRequest();
		xhttp.open("GET", muffcastUrl, true);
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (this.status == 200) {
					var response = this.responseText ? JSON.parse(this.responseText) : false;
					resolve(response);
				} else {
					reject({
						status: this.status,
						error: this.statusText,
						body: this.responseText,
					});
				}
			}
		}
		xhttp.setRequestHeader("Content-type", "application/json");
		xhttp.send();
	})
}

var getPlayer = function(type, index, sleep) {
	return new Promise(function(resolve, reject) {
		setTimeout(function() {
			var player = document.getElementsByTagName(type)[index];
			if (player) {
				resolve(player);
			} else if (sleep < 3000) {
				return getPlayer(type, index, sleep + 500);
			} else {
				reject(player);
			}
		}, sleep);
	})
}

var getTimeString = function(seconds) {
	var hours = parseInt(seconds / 3600);
	var minutes = parseInt((seconds % 3600) / 60);
	var seconds = parseInt(seconds % 60);

	return (hours > 0 ? hours + ":" : "") + minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
}

var addCastLinks = function(type) {
	// add cast links
	var elements = document.getElementsByTagName(type);
	for (var i = 0; i < elements.length; i++) {
		var element = elements[i];
		var position = element.getBoundingClientRect();
		var castLink = document.createElement("a");
		castLink.id = "muffcast-cast-link_" + i;
		castLink.index = i;
		castLink.classList.add("muffcast-loader");
		castLink.style["top"] = position.top + "px";
		castLink.style["left"] = position.left + "px";
		castLink.innerHTML = '<i class="fa fa-fw fa-television"></i>';
		document.body.appendChild(castLink);
		castLink.addEventListener("click", function(event) {
			var index = event.target.parentNode.index;
			var player = document.getElementsByTagName(type)[index];
			player.pause();
			browser.runtime.sendMessage({
				"command": "load",
				"url": encodeURIComponent(window.location.href),
				"type": type,
				"index": index,
				"seek": player.currentTime,
				"volume": player.volume,
				"muted": player.muted
			});
		})
	}
}


var setStatus = function() {
	for (let seekInterval of seekIntervals) {
		clearInterval(seekInterval);
	}
	for (let syncInterval of syncIntervals) {
		clearInterval(syncInterval);
	}

	var overlay = document.getElementById("muffcast-overlay");

	if (overlay) {
		overlay.parentNode.removeChild(overlay);
	}


	// remove all cast links
	for (let castLink of document.getElementsByClassName("muffcast-loader")) {
		document.body.removeChild(castLink);
	}

	addCastLinks("video");
	addCastLinks("audio");

	getStatus().then(function(status) {
		currentStatus = status;
		if (currentStatus.url && currentStatus.url == encodeURIComponent(window.location.href)) {
			getPlayer(currentStatus.type, currentStatus.index, 0).then(function(player) {
				player.muted = currentStatus.muted;
				player.currentTime = currentStatus.currentTime;

				player.addEventListener("canplaythrough", function() {
					if (currentStatus.playing && currentStatus.url == encodeURIComponent(window.location.href)) {
						player.pause();
					}
				})

				overlay = document.createElement("div");
				overlay.id = "muffcast-overlay";
				document.body.appendChild(overlay);

				var play = document.createElement("a");
				play.id = "muffcast-play";
				play.innerHTML = currentStatus.playing ? '<i class="fa fa-fw fa-pause"></i>' : '<i class="fa fa-fw fa-play"></i>';;

				play.addEventListener("click", function(event) {
					if (currentStatus.playing) {
						browser.runtime.sendMessage({
							"command": "pause",
							"seek": player.currentTime
						});
					} else {
						browser.runtime.sendMessage({
							"command": "play",
							"seek": player.currentTime
						});
						player.pause();
					}
					currentStatus.playing = !currentStatus.playing;
					play.innerHTML = currentStatus.playing ? '<i class="fa fa-fw fa-pause"></i>' : '<i class="fa fa-fw fa-play"></i>';
				})

				var stop = document.createElement("a");
				stop.id = "muffcast-stop";
				stop.innerHTML = '<i class="fa fa-fw fa-stop"></i>';
				stop.addEventListener("click", function(event) {
					browser.runtime.sendMessage({
						"command": "stop"
					});
					setStatus();
				})

				var duration = document.createElement("span");
				duration.id = "muffcast-duration";
				duration.classList.add("time");
				duration.textContent = getTimeString(player.duration);

				var currentTime = document.createElement("span");
				currentTime.id = "muffcast-currenttime";
				currentTime.classList.add("time");
				currentTime.textContent = getTimeString(player.currentTime);

				var seek = document.createElement("input");
				seek.id = "muffcast-seek";
				seek.setAttribute("type", "range");
				seek.setAttribute("min", 0);
				seek.setAttribute("max", currentStatus.duration);
				seek.setAttribute("value", currentStatus.currentTime);

				seek.addEventListener("change", function(event) {
					browser.runtime.sendMessage({
						"command": "seek",
						"seek": seek.value
					});
					player.currentTime = seek.value;
					currentTime.textContent = getTimeString(player.currentTime);
				});

				seekIntervals.push(setInterval(function() {
					if (seek.value < currentStatus.duration) {
						if (!player.paused || currentStatus.playing) {
							seek.value++;
							currentTime.textContent = getTimeString(seek.value);
						}
					} else {
						seek.value = 0;
						clearInterval(seekInterval);
					}
				}, 1000));

				var audio = document.createElement("div");
				audio.id = "muffcast-audio";

				var volume = document.createElement("input");
				volume.id = "muffcast-volume";
				volume.setAttribute("type", "range");
				volume.setAttribute("min", 0);
				volume.setAttribute("max", 1);
				volume.setAttribute("step", 0.01);
				volume.setAttribute("value", status.muted ? 0 : status.volume);

				volume.addEventListener("change", function(event) {
					browser.runtime.sendMessage({
						"command": "volume",
						"volume": volume.value
					});
					player.volume = volume.value;
					player.muted = volume.value == 0;
				});

				var mute = document.createElement("a");
				mute.id = "muffcast-mute";
				mute.innerHTML = status.muted ? '<i class="fa fa-fw fa-volume-off"></i>' : (player.volume < 0.5 ? '<i class="fa fa-fw fa-volume-down"></i>' : '<i class="fa fa-fw fa-volume-up"></i>');
				mute.addEventListener("click", function(event) {
					browser.runtime.sendMessage({
						"command": "mute",
						"muted": !player.muted
					});
					player.muted = !player.muted;
					volume.value = player.muted ? 0 : player.volume;
					mute.innerHTML = player.muted ? '<i class="fa fa-fw fa-volume-off"></i>' : (player.volume < 0.5 ? '<i class="fa fa-fw fa-volume-down"></i>' : '<i class="fa fa-fw fa-volume-up"></i>');
				})

				var icon = document.createElement("span");
				icon.id = "muffcast-icon";
				icon.innerHTML = '<i class="fa fa-television"></i>';

				overlay.appendChild(icon);
				overlay.appendChild(play);
				audio.appendChild(mute);
				audio.appendChild(volume);
				overlay.appendChild(audio);
				overlay.appendChild(currentTime);
				overlay.appendChild(seek);
				overlay.appendChild(duration);
				overlay.appendChild(stop);

				var castLink = document.getElementById("muffcast-cast-link_" + status.index);
				castLink.classList.add("active");

				syncIntervals.push(setInterval(function() {
					// sync status
					if (!player.isSyncInterval) {
						getStatus().then(function(status) {
							player.isSyncInterval = true;

							currentStatus.playing = status.playing;
							currentStatus.currentTime = status.currentTime;
							currentStatus.volume = status.volume;
							currentStatus.muted = status.muted;

							currentTime.textContent = getTimeString(currentStatus.currentTime);
							seek.value = currentStatus.currentTime
							play.innerHTML = currentStatus.playing ? '<i class="fa fa-fw fa-pause"></i>' : '<i class="fa fa-fw fa-play"></i>';
							volume.value = currentStatus.muted ? 0 : currentStatus.volume;
							mute.innerHTML = currentStatus.muted ? '<i class="fa fa-fw fa-volume-off"></i>' : (currentStatus.volume < 0.5 ? '<i class="fa fa-fw fa-volume-down"></i>' : '<i class="fa fa-fw fa-volume-up"></i>');

							player.volume = currentStatus.volume;
							player.muted = currentStatus.muted;
							player.currentTime = currentStatus.currentTime;
						})
					}
				}, syncIntervalTime));

				setTimeout(function() {
					player.addEventListener("play", function(event) {
						if (status.playing && status.url == encodeURIComponent(window.location.href)) {
							browser.runtime.sendMessage({
								"command": "pause",
								"seek": player.currentTime
							});
							play.innerHTML = '<i class="fa fa-fw fa-play"></i>';
							status.playing = !status.playing;
						}
					})

					player.addEventListener("pause", function(event) {
						if (!status.playing && status.url == encodeURIComponent(window.location.href.href)) {
							browser.runtime.sendMessage({
								"command": "play",
								"seek": player.currentTime
							});
							play.innerHTML = '<i class="fa fa-fw fa-play"></i>';
							status.playing = !status.playing;
						}
					})

					player.addEventListener("seeked", function(event) {
						if (status.playing && status.url == encodeURIComponent(window.location.href)) {
							if (!player.isSyncInterval) {
								browser.runtime.sendMessage({
									"command": "seek",
									"seek": player.currentTime
								});
								seek.value = player.currentTime;
								currentTime.textContent = getTimeString(player.currentTime);
							} else {
								player.isSyncInterval = false;
							};
						}
					})

					player.addEventListener("volumechange", function(event) {
						if (status.url == encodeURIComponent(window.location.href)) {
							browser.runtime.sendMessage({
								"command": "volume",
								"volume": player.volume
							});
							volume.value = player.muted ? 0 : player.volume;
							mute.innerHTML = player.muted ? '<i class="fa fa-fw fa-volume-off"></i>' : (player.volume < 0.5 ? '<i class="fa fa-fw fa-volume-down"></i>' : '<i class="fa fa-fw fa-volume-up"></i>');
						}
					})
				}, 1500);
			})
		}
	})
}

browser.runtime.onMessage.addListener(function(message) {
	var videos = document.getElementsByTagName("video");
	switch (message.command) {
		case "update":
			setStatus();
			break;
		case "load":
			var player = videos[message.index];
			player.pause();
			player.style.border = "none";
			browser.runtime.sendMessage({
				"command": "load",
				"url": encodeURIComponent(window.location.href),
				"type": "video",
				"index": message.index,
				"seek": player.currentTime,
				"volume": player.volume,
				"muted": player.muted
			});
			break;
		case "mark":
			var player = videos[message.index];
			player.style.border = "5px solid red";
			break;
		case "unmark":
			var player = videos[message.index];
			player.style.border = "none";
			break;
	}
})
