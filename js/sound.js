
function SoundManager() {
	var sounds = {};
	for (var s in assets.sounds)
		sounds[s] = new Sound(assets.sounds[s], 5);

	this.play = function(name) {
		sounds[name].play();
	};
}

function Sound(samples, minPlayers) {
	if (typeof samples === "string") samples = [ samples ];
	minPlayers = minPlayers || 1;

	this.sampleIndex = 0;
	this.samples = [];

	while (this.samples.length < minPlayers)
		for (var i = 0; i < samples.length; ++i)
			this.samples.push(new Audio("assets/sounds/" + samples[i]));

	this.play = function() {
		if (window.chrome) this.samples[this.sampleIndex].load(); // Chrome requires reload
		else this.samples[this.sampleIndex].currentTime = 0;
		this.samples[this.sampleIndex].play();
		this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
	};
}
