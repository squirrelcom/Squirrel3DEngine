
function AIManager() {

	this.process = function(dt) {
		var v = new THREE.Vector3();
		// TODO: Should probably keep own collection
		for (i = 0; i < dungeon.monsters.length; ++i) {
			var monster = dungeon.monsters[i];
			if (monster.dead) continue;
			// Look at player
			v.copy(pl.position);
			v.subSelf(monster.position);
			v.y = 0;
			monster.mesh.lookAt(v.normalize());
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
			// Shoot?
			if (Math.random() < 0.02) {
				shoot(monster.position, monster.mesh.rotation, v.set(0, 0.11, -1.2), true);
			}
		}
	};

}



