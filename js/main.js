"use strict";
var pl, controls, scene, renderer, composer;
var renderTargetParametersRGBA, renderTargetParametersRGB;
var colorTarget, depthTarget, depthPassPlugin;
var lightManager, animationManager, soundManager, aiManager, dungeon;
var clock = new THREE.Clock();
var cache = new Cache();
var passes = {};

function init() {
	scene = new Physijs.Scene();
	scene.setGravity(new THREE.Vector3(0, -10, 0));
	scene.fog = new THREE.FogExp2(0x000000, 0.05);
	scene.addEventListener('update', function() {
		if (CONFIG.showStats) physicsStats.update();
	});

	pl = new Physijs.CapsuleMesh(
		new THREE.CylinderGeometry(0.8, 0.8, 2.0),
		new THREE.MeshBasicMaterial({ color: 0xff00ff }),
		100
	);
	pl.visible = false;
	pl.addEventListener('collision', function(other, vel, rot) {
		if (this.dead) return;
		if (other.items) {
			for (var i in other.items) {
				if (pl[i] !== undefined) {
					if (typeof(other.items[i]) === "number") pl[i] += other.items[i];
					else pl[i] = other.items[i];
				}
			}
			soundManager.play("pick-up");
			displayMinorMessage("Picked up " + other.itemName);
			updateHUD();
			other.items = undefined;
			other.visible = false;
			other.parent.remove(other);
		}
		if (other.damage) {
			if (vel.lengthSq() < 5 || other.position.y < 0.3) return;
			this.hp -= other.damage;
			updateHUD();
			// Death is checked in render loop
			// TODO: Hit sound?
			// TODO: Screen effect?
		}
	});
	// Add pl later to the scene

	// Player stats
	pl.hp = 100;
	pl.bulletsPerClip = 15;
	pl.bullets = pl.bulletsPerClip;
	pl.clips = 5;
	pl.ammoType = "plain";
	updateHUD();

	pl.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 25);

	controls = new Controls(pl.camera, { mouse: mouseHandler });
	controls.movementSpeed = 10;
	controls.lookSpeed = 0.5;
	controls.lookVertical = true;
	controls.constrainVerticalLook = true;
	controls.verticalMin = 1.1;
	controls.verticalMax = 2.2;

	renderer = new THREE.WebGLRenderer({
		clearColor: 0x000000,
		maxLights: CONFIG.maxLights + 2, // Player light is separate
		antialias: CONFIG.antialias,
		preserveDrawingBuffer: true
	});
	renderer.setSize(window.innerWidth, window.innerHeight);
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapSoft = CONFIG.softShadows;
	renderer.shadowMapDebug = false;
	renderer.gammaInput = true;
	renderer.gammaOutput = true;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	renderer.autoClear = false;
	if (!CONFIG.anisotropy) CONFIG.anisotropy = renderer.getMaxAnisotropy();

	renderTargetParametersRGB  = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBFormat };
	renderTargetParametersRGBA = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat };
	depthTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGBA);
	colorTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParametersRGB);

	// Postprocessing effects
	passes.scene = new THREE.RenderPass(scene, pl.camera);
	passes.ssao = new THREE.ShaderPass(THREE.ShaderExtras.ssao);
	passes.ssao.uniforms.tDepth.value = depthTarget;
	passes.ssao.uniforms.size.value.set(window.innerWidth, window.innerHeight);
	passes.ssao.uniforms.cameraNear.value = pl.camera.near;
	passes.ssao.uniforms.cameraFar.value = pl.camera.far;
	passes.ssao.uniforms.fogNear.value = scene.fog.near;
	passes.ssao.uniforms.fogFar.value = scene.fog.far;
	passes.ssao.uniforms.fogEnabled.value = 0;
	passes.ssao.uniforms.aoClamp.value = 0.4;
	passes.ssao.uniforms.onlyAO.value = 0;
	passes.fxaa = new THREE.ShaderPass(THREE.ShaderExtras.fxaa);
	passes.fxaa.uniforms.resolution.value.set(1/window.innerWidth, 1/window.innerHeight);
	passes.bloom = new THREE.BloomPass(0.5);
	passes.adjust = new THREE.ShaderPass(THREE.ShaderExtras.hueSaturation);
	passes.adjust.uniforms.saturation.value = 0.2;

	composer = new THREE.EffectComposer(renderer, colorTarget);
	//composer.addPass(passes.scene);
	composer.addPass(passes.ssao);
	composer.addPass(passes.fxaa);
	composer.addPass(passes.bloom);
	composer.addPass(passes.adjust);
	composer.passes[composer.passes.length - 1].renderToScreen = true;

	// Depth pass
	depthPassPlugin = new THREE.DepthPassPlugin();
	depthPassPlugin.renderTarget = depthTarget;
	renderer.addPrePlugin(depthPassPlugin);

	if (CONFIG.quarterMode) onWindowResize();

	resetLevel();
	updateConfig();
	dumpInfo();
	initUI();
}

function resetLevel(levelName) {
	if (levelName == "[credits]") {
		window.location = "credits.html";
		return;
	}
	// TODO: Reloadless reset?
	if (dungeon) {
		if (levelName) window.location.hash = "#level=" + levelName;
		window.location.reload(true);
	}
	lightManager = new LightManager({ maxLights: CONFIG.maxLights, maxShadows: CONFIG.maxShadows });
	animationManager = new AnimationManager();
	soundManager = new SoundManager();
	aiManager = new AIManager();
	dungeon = new Dungeon(scene, pl, levelName);
}

var shootVector = new THREE.Vector3();
function shoot(type, pos, rot, off, flip) {
	soundManager.playSpatial("shoot", pos, 20);
	var fork = dungeon.forks[dungeon.forkIndex];
	dungeon.forkIndex = (dungeon.forkIndex + 1) % dungeon.forks.length;
	fork.damage = dungeon.forkTypes[type].damage;
	fork.material = dungeon.forkTypes[type].material;
	fork.position.copy(pos);
	fork.rotation.copy(rot);
	if (flip) fork.rotation.y += Math.PI;
	fork.updateMatrixWorld();
	fork.matrixRotationWorld.extractRotation(fork.matrixWorld);
	shootVector.set(0, 0, -1);
	fork.matrixRotationWorld.multiplyVector3(shootVector);
	fork.translateX(off.x);
	fork.translateY(off.y);
	fork.translateZ(off.z);
	fork.__dirtyPosition = true;
	fork.__dirtyRotation = true;
	fork.setLinearVelocity(shootVector.multiplyScalar(25.0));
	fork.visible = true;
}

var reloading = false;
function reload() {
	if (reloading || pl.bullets >= pl.bulletsPerClip) return;
	if (pl.clips <= 0) {
		displayMinorMessage("Out of ammo");
		return;
	}
	reloading = true;
	window.setTimeout(function() {
		pl.bullets = pl.bulletsPerClip;
		--pl.clips;
		updateHUD();
		reloading = false;
		pl.rhand.material.materials[2] = pl.rhand.ammoGood;
		pl.rhand.materialNeedsUpdate = true;
	}, 2000);
	soundManager.play("reload");
}

var projector = new THREE.Projector();
function mouseHandler(button) {
	if (button == 0 && pl.rhand && pl.bullets <= 0 && !reloading) {
		// Clip empty, force reload if there is more
		soundManager.play("shoot-dry");
		reload();
	} else if (button == 0 && pl.rhand && pl.bullets > 0 && !reloading) {
		// Shoot!
		--pl.bullets;
		if (pl.bullets <= 0) {
			pl.rhand.material.materials[2] = pl.rhand.ammoOut;
			pl.rhand.materialNeedsUpdate = true;
		}
		shoot(pl.ammoType, pl.position, pl.camera.rotation, { x: 0.2, y: 0.4, z: -1.2 });
		updateHUD();
	} else if (button == 2) {
		// Punch/push
		shootVector.set(0, 0, 1);
		projector.unprojectVector(shootVector, pl.camera);
		var ray = new THREE.Ray(pl.camera.position, shootVector.subSelf(pl.camera.position).normalize());
		var intersections = ray.intersectObjects(dungeon.objects);
		if (intersections.length > 0) {
			var target = intersections[0].object;
			if (target.position.distanceToSquared(pl.position) < 9)
				target.applyCentralImpulse(shootVector.multiplyScalar(10000));
		}
	}
}

function animate(dt) {
	if (!dungeon.loaded) return;
	function getAnim(time) { return Math.abs(time - (time|0) - 0.5) * 2.0; }
	function fract(num) { return num - (num|0); }
	var i, v = new THREE.Vector3();

	// Update object animations
	animationManager.update(dt);

	// Lights
	var timeNow = new Date().getTime();
	for (i = 0; i < lightManager.lights.length; ++i) {
		var light = lightManager.lights[i];
		//var anim = timeNow / (1000.0 + i);
		//light.intensity = 0.5 + 0.5 * getAnim(anim);
		if (light.visible && light.emitter)
			light.emitter.update(dt).render();
	}
	if (dungeon.exitParticles) dungeon.exitParticles.update(dt).render();

	// Player light
	//pl.light.intensity = 0.5 + 0.5 * getAnim(timeNow / 1000.0);
	pl.light.position.set(pl.position.x, pl.position.y + 0.2, pl.position.z);
	pl.shadow.position.copy(pl.light.position);
	pl.shadow.target.position.copy(controls.target);
}

$(document).ready(function() {
	var v0 = new THREE.Vector3();
	var v1 = new THREE.Vector3();

	function formatRenderInfo(info) {
		var report = [
			"Prog:", info.memory.programs,
			"Geom:", info.memory.geometries,
			"Tex:", info.memory.textures,
			"Calls:", info.render.calls,
			"Verts:", info.render.vertices,
			"Faces:", info.render.faces,
			"Pts:", info.render.points
		];
		return report.join(' ');
	}

	function render() {
		requestAnimationFrame(render);
		if (!dungeon.loaded) return;

		// Player movement, controls and physics
		var dt = clock.getDelta();
		if (dt > 0.05) dt = 0.05; // Limit delta to 20 FPS
		// Take note of the position
		v0.set(pl.camera.position.x, 0, pl.camera.position.z);
		// Let controls update the position
		controls.update(dt);
		// Get the new position
		v1.set(pl.camera.position.x, 0, pl.camera.position.z);
		// Subtract them to get the velocity
		v1.subSelf(v0);
		// Convert the velocity unit to per second
		v1.divideScalar(dt);
		// We only use the planar velocity, so we preserve the old y-velocity
		var vy = pl.getLinearVelocity().y;
		// Set the velocity, but disallow jumping/flying, i.e. upwards velocity
		pl.setLinearVelocity({ x: v1.x, y: vy < 0 ? vy : 0, z: v1.z });
		// Simulate physics
		scene.simulate();
		// Put the camera/controls back to the real, simulated position
		// FIXME: 0.5 below is magic number to rise camera
		controls.object.position.set(pl.position.x, pl.position.y + 0.5, pl.position.z);
		pl.rotation.copy(pl.camera.rotation);
		pl.__dirtyRotation = true;

		if (!pl.dead) animate(dt);

		renderer.clear();
		if (CONFIG.postprocessing) {
			renderer.shadowMapEnabled = CONFIG.shadows;
			depthPassPlugin.enabled = true;
			renderer.render(scene, pl.camera, composer.renderTarget2, true);
			if (CONFIG.showStats) rendererInfo.innerHTML = formatRenderInfo(renderer.info);
			renderer.shadowMapEnabled = false;
			depthPassPlugin.enabled = false;
			composer.render(dt);
		} else {
			renderer.render(scene, pl.camera);
			if (CONFIG.showStats) rendererInfo.innerHTML = formatRenderInfo(renderer.info);
		}

		if (CONFIG.showStats) renderStats.update();
	}

	init();

	window.setInterval(function() { lightManager.update(pl); }, 690);
	window.setInterval(function() { if (!pl.dead) aiManager.process(); }, 100);
	// Main game logic updater
	window.setInterval(function() {
		if (!pl.dead && pl.hp <= 0) {
			// Oh noes, death!
			pl.dead = true;
			controls.active = false;
			if (!$("#deathscreen").is(':visible'))
				$("#deathscreen").fadeIn(500);
			$("#instructions").hide();
		}

		// Trigger?
		var trigger = dungeon.getTriggerAt(pl.position);
		if (trigger) {
			if (trigger.type == "message") displayMessage(trigger.message);
		}

		// Exit?
		if (dungeon.isAtExit(pl.position))
			resetLevel(dungeon.level.next);
	}, 100);

	render();
});
