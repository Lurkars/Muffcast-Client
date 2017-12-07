# Muffcast
An alternative to Chromecast working with every website with HTML5 Video/Audio elements by just playing HTML5 video/audio on other Firefox instance in full-screen.

## Client
This is the client extension. Go to any website with HTML5 Video elements to play it on the [Muffcast Server](https://github.com/Lurkars/Muffcast-Server) instance by clicking on a **Muffcast**-symbol next to it.

### Requirements
- Firefox/Browser
- [Muffcast Server](https://github.com/Lurkars/Muffcast-Server) running in same network
- Internet access

### Firefox/Browser Setup
In Add-ons Preferences, define URL of the *Muffcast Server*-extension running on any device in your network on port 8128.

#### Limitations
- This only works for websites with HTML5 Video/Audio elements. This does not work in native applications.
- To work properly for websites with authentication (like Netflix), the browser on server side also needs valid session. This extension does not handle any authentication, so valid sessions are required. In short: manually login and save session before use.
- There are some websites that required further interactions before the HTML5 Video is loaded properly, e.g. to click a non-standard play button. Those sites do not work without special treatment in the server component. Please feel free to report issues with those sites for being included in server component code.
- This extension is developed and tested in Firefox 57. A port for other browsers like Chrome should be easy due to WebExtensions API, but is not warranted to work properly.
- Video quality is not part of the Media API and any websites handles this on it's own. So like authentication, to control playback quality, manually settings on server side are required. (Hopefully the automatic settings fit your needs, but e.g. on a Raspberry Pi too high quality can cause stuttering.)
