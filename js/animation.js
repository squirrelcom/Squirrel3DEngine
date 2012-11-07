
function AnimationManager() {
	this.anims = [];
}

AnimationManager.prototype.createAnimatedMesh = function(geometry, material, def) {
	var obj;
	// Handle material animation stuff
	for (var m = 0; m < geometry.materials.length; ++m) {
		if (def.animation.type === "morph") {
			geometry.materials[m].morphTargets = true;
			geometry.materials[m].morphNormals = true;
		} else if (def.animation.type === "bones") {
			geometry.materials[m].skinning = true;
		}
	}
	// Create the mesh
	if (def.animation.type === "morph") {
		geometry.computeMorphNormals();
		obj = new THREE.MorphAnimMesh(geometry, material);
		obj.duration = def.animation.duration;
		obj.time = obj.duration * Math.random();
	} else if (def.animation.type === "bones") {
		obj = new THREE.SkinnedMesh(geometry, material); // TODO: useVertexTexture?
		THREE.AnimationHandler.add(geometry.animation);
		obj.animation = new THREE.Animation(obj, "walk");
	}
	this.anims.push(obj);
	return obj;
};

AnimationManager.prototype.update = function(dt) {
	for (var i = 0; i < this.anims.length; ++i) {
		var obj = this.anims[i];
		// Update SkinnedMesh animation state
		if (obj.animation) {
			if (!obj.animation.isPlaying && obj.animate) obj.animation.play();
			else if (obj.animation.isPlaying && !obj.animate) obj.animation.stop();
		}
		if (obj.dead) continue;
		// Update morph animation
		if (obj.updateAnimation && obj.animate)
			obj.updateAnimation(dt * 1000);
	}
	// Update skinned animations
	THREE.AnimationHandler.update(dt * 1000);
};
