var assets = {
	objects: {
		"barrel-blue": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-red": { collision: "cylinder", mass: 250, sound: "metal" },
		"barrel-rusty": { collision: "cylinder", mass: 250, sound: "metal" },
		"gas-tank": { collision: "cylinder", mass: 350, sound: "metal" },
		"military-box": { collision: "box", mass: 200, sound: "metal" },
		"trash": { collision: "box", mass: 150 },
		"turbine": { collision: "box", sound: "metal" }
	},
	items: {
		"ammo-box": { collision: "box", mass: 250, sound: "metal", item: { type: "clips", amount: 2 } },
		"health-box": { collision: "box", mass: 250, sound: "metal", item: { type: "hp", amount: 25 } },
	},
	monsters: {
		"robot": {
			collision: "capsule",
			character: { speed: 120, hp: 50 },
			animation: { type: "morph", duration: "1000" },
			sound: "metal"
		}
	},
	sounds: {
		"shoot": [ "fork-launch.wav" ],
		"shoot-dry": [ "empty-gun.wav" ],
		"reload": [ "reload.wav" ],
		"pick-up": [ "pick-up.wav" ],
		"metal": [ "metal-1.wav", "metal-2.wav", "metal-3.wav" ],
		"robot-death": [ "robot-death.wav" ]
	},
	materials: {
		"metal-01": {},
		"metal-02": {},
		"metal-03": {},
		"metal-bumps-01": {},
		"metal-bumps-02": {},
		"metal-bumps-03": {},
		"metal-colored-01": {},
		"metal-colored-02": {},
		"metal-colored-03": {},
		"metal-colored-04": {},
		"metal-colored-05": {},
		"metal-colored-06": {},
		"metal-colored-07": {},
		"metal-colored-08": {},
		"metal-colored-09": {},
		"metal-corrugated-01": {},
		"metal-corrugated-02": {},
		"metal-worn-01": {},
		"metal-worn-02": {},
	},
	environments: {}
};
