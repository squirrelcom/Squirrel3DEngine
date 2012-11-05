var assets = {
	objects: {
		"ammo-box": { collision: "box", mass: 250, sound: "metal", item: { type: "clips", amount: 2 } },
		"health-box": { collision: "box", mass: 250, sound: "metal", item: { type: "hp", amount: 25 } },
		"barrel-blue": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-red": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-rusty": { collision: "cylinder", mass: 250, sound: "metal" },
		"gas-tank": { collision: "cylinder", mass: 350, sound: "metal" },
		"trash": { collision: "box", mass: 150 },
		"turbine": { collision: "box", sound: "metal" }
	},
	items: {},
	materials: {},
	monsters: {
		"robot": {
			collision: "capsule",
			character: { speed: 40, hp: 50 },
			animation: { type: "morph", duration: "1000" },
			sound: "metal"
		}
	},
	sounds: {
		"shoot": [ "fork-launch.wav" ],
		"shoot-dry": [ "empty-gun.wav" ],
		"reload": [ "reload.wav" ],
		"metal": [ "metal-1.wav", "metal-2.wav", "metal-3.wav" ],
		"robot-death": [ "robot-death.wav" ]
	},
	environments: {}
};
