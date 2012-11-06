
function AIManager() {
	var timeAccumulator = 0;

	var v = new THREE.Vector3();

	function walkTowards(monster, pos, dt) {
		v.copy(pos);
		v.subSelf(monster.position);
		v.y = 0;
		monster.mesh.lookAt(v.normalize());
		if (monster.position.distanceToSquared(pos) > 2) {
			if (monster.animation) monster.animation.play();
			else monster.stopAnimation = false;
			monster.setLinearVelocity(v.multiplyScalar(monster.speed * dt));
			return false;
		} else {
			monster.setLinearVelocity(v.set(0, 0, 0));
			if (monster.animation) monster.animation.stop();
			else monster.stopAnimation = true;
			return true;
		}
	}

	this.process = function(dt) {
		// AI processing doesn't need to run each loop
		timeAccumulator += dt;
		if (timeAccumulator < 0.050) return;
		else timeAccumulator = 0;

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
				walkTowards(monster, pl.position, dt);
				// Shoot?
				if (Math.random() < 0.05) {
					shoot(monster.position, monster.mesh.rotation, v.set(0, 0.11, -1.2), true);
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
					v.set((path[j][0] + 0.5) * gridSize, monster.position.y, (path[j][1] + 0.5) *gridSize);
					monster.waypoints.push(v.clone());
				}
			}

			// Does the monster have waypoints?
			if (monster.waypoints) {
				if (!monster.waypoints.length)
					monster.waypoints = null;
				else if (walkTowards(monster, monster.waypoints[0], dt)) {
					// Move on to the next waypoint
					monster.waypoints.splice(0, 1);
				}
			}
		}
	};

}



