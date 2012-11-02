
function SoundManager() {
	var sounds = {
		"shoot": new Audio("assets/sounds/fork-launch.wav"),
		"metal": new Audio("assets/sounds/metal-hit-1.wav")
	};

	this.play = function(name) {
		if (window.chrome) sounds[name].load(); // Chrome requires reload
		else sounds[name].currentTime = 0;
		sounds[name].play();
	};
}
