
function AIManager() {
	var timeAccumulator = 0;

	this.process = function(dt) {
		// AI processing doesn't need to run each loop
		timeAccumulator += dt;
		if (timeAccumulator < 0.050) return;
		else timeAccumulator = 0;

		var v = new THREE.Vector3();
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
				// Look at player
				v.copy(pl.position);
				v.subSelf(monster.position);
				v.y = 0;
				monster.mesh.lookAt(v.normalize());
				// Shoot?
				if (Math.random() < 0.05) {
					shoot(monster.position, monster.mesh.rotation, v.set(0, 0.11, -1.2), true);
				}
			}

			// Does the monster have active waypoints?
			if (monster.waypoints) {
				// Move?
				if (monster.position.distanceToSquared(pl.position) > 4) {
					if (monster.animation) monster.animation.play();
					else monster.stopAnimation = false;
					monster.setLinearVelocity(v.multiplyScalar(monster.speed * dt));
				} else if (!pl.dead) {
					pl.hp--; // TODO: Touch damage from assets.js
					updateHUD();
					monster.setLinearVelocity(v.set(0, 0, 0));
					if (monster.animation) monster.animation.stop();
					else monster.stopAnimation = true;
				}
			}
		}
	};

}



