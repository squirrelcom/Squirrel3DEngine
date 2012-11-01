var assets = {
	objects: {
		"ammo-box": { collision: "box", mass: 250 },
		"barrel-blue": { collision: "cylinder", mass: 250 },
		"barrel-red": { collision: "cylinder", mass: 250 },
		"barrel-rusty": { collision: "cylinder", mass: 250 },
		"gas-tank": { collision: "cylinder", mass: 350 }
	},
	items: {},
	materials: {},
	monsters: {
		"robot": {
			collision: "box",
			character: { speed: 40 },
			animation: { type: "morph", duration: "1000" }
		}
	},
	environments: {}
};
