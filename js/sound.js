
function SoundManager() {
	var sounds = {};
	for (var s in assets.sounds)
		sounds[s] = new Sound(assets.sounds[s], 5);

	this.play = function(name) {
		sounds[name].play();
	};

	this.playSpatial = function(name, position, radius) {
		// Hack: Should have an update method instead of using a global reference
		var distance = pl.camera.position.distanceTo(position);
		if (distance < radius)
			sounds[name].play(1 - distance / radius);
	};
}

function Sound(samples, minPlayers) {
	if (typeof samples === "string") samples = [ samples ];
	minPlayers = minPlayers || 1;

	this.sampleIndex = 0;
	this.samples = [];

	var useAudioElems = /Firefox/i.test(navigator.userAgent);
	// Load samples
	while (this.samples.length < minPlayers) {
		for (var i = 0; i < samples.length; ++i) {
			if (useAudioElems) {
				// Firefox requires server to send the audio with the correct MIME type
				// so we attempt to work around that by setting it with <audio> tag
				var elem = document.createElement("audio");
				var source = document.createElement("source");
				source.setAttribute("type", "audio/wave");
				source.setAttribute("src", "assets/sounds/" + samples[i]);
				elem.appendChild(source);
				this.samples.push(elem);
			} else this.samples.push(new Audio("assets/sounds/" + samples[i]));
		}
	}

	this.play = function(volume) {
		if (!CONFIG.sounds) return;
		try { // Firefox fails at GitHub MIME types
			var sample = this.samples[this.sampleIndex];
			if (window.chrome || useAudioElems) sample.load(); // Chrome requires reload
			else sample.currentTime = 0;
			if (volume !== undefined)
				sample.volume = volume;
			sample.play();
			this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
		} catch(e) {};
	};
}
