console.log("muffcast client v0.1");

var muffcastUrl = "http://localhost:8128";
browser.storage.local.get("muffcast").then(function(result) {
	muffcastUrl = result.muffcast && result.muffcast.url || muffcastUrl;
})

var sendServer = function(message) {
	return new Promise(function(resolve, reject) {
		var xhttp = new XMLHttpRequest();
		xhttp.open("POST", muffcastUrl, true);
		xhttp.addEventListener("load", function() {
			if (this.readyState == 4) {
				if (this.status == 200) {
					var response = this.responseText ? JSON.parse(this.responseText) : false;
					resolve(response);
				} else {
					reject({
						status: this.status,
						error: this.statusText,
						body: this.responseText
					});
				}
			}
		});
		xhttp.setRequestHeader("content-type", "application/json");
		xhttp.send(JSON.stringify(message));
	})
}


var clientUpdate = function() {
	browser.tabs.query({
		currentWindow: true,
		active: true
	}).then(function(tabs) {
		var tab = tabs[0];
		browser.tabs.sendMessage(
			tab.id, {
				command: "update"
			}
		);
	});
}

var injectCss = function(tabId) {
	browser.tabs.insertCSS(tabId, {
		code: "@font-face {	font-family: 'FontAwesome';" +
			"src: url('" + browser.extension.getURL("fonts/fontawesome.eot") + "?v=4.7.0');" +
			"src: url('" + browser.extension.getURL("fonts/fontawesome.eot") + "?#iefix&v=4.7.0') format('embedded-opentype')," +
			"url('" + browser.extension.getURL("fonts/fontawesome.woff2") + "?v=4.7.0') format('woff2')," +
			"url('" + browser.extension.getURL("fonts/fontawesome.woff") + "?v=4.7.0') format('woff')," +
			"url('" + browser.extension.getURL("fonts/fontawesome.ttf") + "?v=4.7.0') format('truetype')," +
			"url('" + browser.extension.getURL("fonts/fontawesome.svg") + "?v=4.7.0#fontawesomeregular') format('svg');" +
			"font - weight: normal;" +
			"font - style: normal;}"
	});

	browser.tabs.insertCSS(tabId, {
		file: "css/font-awesome.css"
	});

	browser.tabs.insertCSS(tabId, {
		file: "css/overlay.css"
	});
}

browser.tabs.onActivated.addListener(function(tab) {
	injectCss(tab.id);
	clientUpdate();
});

browser.tabs.onUpdated.addListener(function(tabId, changeInfo) {
	injectCss(tabId);
	if (changeInfo.status === "complete") {
		clientUpdate();
	}
});

browser.runtime.onMessage.addListener(function(message) {
	console.log("send", message);
	sendServer(message).then(function(response) {
		console.log("response", response);
		if (message.command == "load") {
			clientUpdate();
		}
	})
})
