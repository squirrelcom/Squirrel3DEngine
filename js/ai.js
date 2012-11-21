
function AIManager() {
	var v = new THREE.Vector3();

	function walkTowards(monster, pos, sq_thres) {
		v.copy(pos);
		v.subSelf(monster.position);
		v.y = 0;
		if (monster.mesh) monster.mesh.lookAt(v.normalize());
		else monster.lookAt(v.normalize());
		if (monster.position.distanceToSquared(pos) >= sq_thres) {
			monster.setLinearVelocity(v.multiplyScalar(monster.speed));
			if (monster.mesh) monster.mesh.animate = true;
			return false;
		} else {
			monster.setLinearVelocity(v.set(0, 0, 0));
			if (monster.mesh) monster.mesh.animate = false;
			return true;
		}
	}

	this.process = function() {
		var i, j;
		var gridSize = dungeon.level.gridSize;
		// TODO: Should probably keep own collection
		for (i = 0; i < dungeon.monsters.length; ++i) {
			var monster = dungeon.monsters[i];
			if (monster.dead) continue;

			// Does the monster see player?
			if (dungeon.level.map.raycast(
				monster.position.x / gridSize, monster.position.z / gridSize,
				pl.position.x / gridSize, pl.position.z / gridSize))
			{
				// Mark as active
				monster.activated = true;
				monster.waypoints = null; // Clear waypoints
				// Look at player
				walkTowards(monster, pl.position, 12);
				// Shoot?
				if (Math.random() < 0.333) {
					shoot("plain", monster.faction, monster.position, monster.mesh ? monster.mesh.rotation : monster.rotation, v.set(0, 0.11, -1.2), true);
				}

			// Target lost? Let's find a path
			} else if (monster.activated && !monster.waypoints) {
				var path = dungeon.pathFinder.findPath(
					(monster.position.x / gridSize)|0, (monster.position.z / gridSize)|0,
					(pl.position.x / gridSize)|0, (pl.position.z / gridSize)|0,
					dungeon.grid.clone());
				monster.waypoints = [];
				//path = PF.Util.smoothenPath(dungeon.grid, path);
				for (j = 0; j < path.length; ++j) {
					v.set((path[j][0] + 0.5) * gridSize, monster.position.y, (path[j][1] + 0.5) * gridSize);
					monster.waypoints.push(v.clone());
				}
			}

			// Does the monster have waypoints?
			if (monster.waypoints) {
				if (!monster.waypoints.length)
					monster.waypoints = null;
				else if (walkTowards(monster, monster.waypoints[0], 1)) {
					// Move on to the next waypoint
					monster.waypoints.splice(0, 1);
				}
			}
		}
	};

}



