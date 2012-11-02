var assets = {
	objects: {
		"ammo-box": { collision: "box", mass: 250, sound: "metal" },
		"health-box": { collision: "box", mass: 250, sound: "metal" },
		"barrel-blue": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-red": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-rusty": { collision: "cylinder", mass: 250, sound: "metal" },
		"gas-tank": { collision: "cylinder", mass: 350, sound: "metal" }
	},
	items: {},
	materials: {},
	monsters: {
		"robot": {
			collision: "cylinder",
			character: { speed: 40 },
			animation: { type: "morph", duration: "1000" },
			sound: "metal"
		}
	},
	sounds: {
		"shoot": [ "fork-launch.wav" ],
		"metal": [ "metal-1.wav", "metal-2.wav", "metal-3.wav" ]
	},
	environments: {}
};
