"use strict";

if (!Detector.webgl) {
	Detector.addGetWebGLMessage();
	document.getElementById('container').innerHTML = "";
}

Physijs.scripts.worker = 'libs/physijs_worker.js';
Physijs.scripts.ammo = '../libs/ammo.js';

var hashParams = (function() {
	var params = {}, param;
	var q = window.location.hash.replace('#', '').split('&');
	for (var i = 0; i < q.length; ++i) {
		param = q[i].split('=');
		params[param[0]] = param[1];
	}
	return params;
})();

var CONFIG = {
	fullscreen: false,
	showStats: true,
	quarterMode: false,
	sounds: true,
	postprocessing: true,
	particles: true,
	maxLights: 4,
	maxShadows: 2,
	antialias: true,
	anisotropy: 0, // 0 = auto
	shadows: true,
	softShadows: true,
	physicalShading: true,
	normalMapping: true,
	specularMapping: true,
	linearTextureFilter: true,
	bloom: true,
	SSAO: true,
	FXAA: false
};

var updateConfig = function() {
	lightManager.maxLights = CONFIG.maxLights;
	lightManager.maxShadows = CONFIG.maxShadows;
	renderer.shadowMapEnabled = CONFIG.shadows;
	renderer.shadowMapSoft = CONFIG.softShadows;
	renderer.physicallyBasedShading = CONFIG.physicalShading;
	passes.bloom.enabled = CONFIG.bloom;
	passes.ssao.enabled = CONFIG.SSAO;
	passes.fxaa.enabled = CONFIG.FXAA;
	var statDisplay = CONFIG.showStats ? "block" : "none";
	if (renderStats) renderStats.domElement.style.display = statDisplay;
	if (physicsStats) physicsStats.domElement.style.display = statDisplay;
	if (rendererInfo) rendererInfo.style.display = statDisplay;
	localStorage.setItem("CONFIG", JSON.stringify(CONFIG));
};

(function() {
	var loadedConfig = localStorage.getItem("CONFIG");
	if (loadedConfig) {
		loadedConfig = JSON.parse(loadedConfig);
		for (var prop in loadedConfig) {
			if (loadedConfig.hasOwnProperty(prop) && typeof loadedConfig[prop] !== "function")
				CONFIG[prop] = loadedConfig[prop];
		}
	}
})();
"use strict";
function Cache() {
	this.models = {};
	this.geometries = {};
	this.materials = {};
	var self = this;
	var loader = new THREE.JSONLoader(true);
	loader.statusDomElement.style.left = "0px";
	loader.statusDomElement.style.fontSize = "1.8em";
	loader.statusDomElement.style.width = "auto";
	loader.statusDomElement.style.color = "#c00";
	document.body.appendChild(loader.statusDomElement);
	var modelsPending = 0;

	this.loadModel = function(path, callback) {
		var m = this.models[path];
		if (!m) { // First time request for this model
			this.models[path] = [ callback ];
			loader.statusDomElement.style.display = "block";
			modelsPending++;
			loader.load(path, function(geometry) {
				var mm = self.models[path];
				for (var i = 0; i < mm.length; ++i)
					mm[i](geometry);
				self.models[path] = geometry;
				modelsPending--;
				if (modelsPending == 0)
					loader.statusDomElement.style.display = "none";
			});
		} else if (m instanceof Array) { // Pending
			m.push(callback);
		} else // Already loaded
			callback(m);
	};

	this.getGeometry = function(name, generator) {
		var g = this.geometries[name];
		if (g) return g;
		this.geometries[name] = g = generator();
		return g;
	};

	this.getMaterial = function(name) {
		var t = this.materials[name];
		if (t) return t;
		this.materials[name] = t = createMaterial(name);
		return t;
	};
}
"use strict";
/**
 * original author mrdoob / http://mrdoob.com/ (THREE.PlaneGeometry)
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Plane.as
 */

function PlaneGeometry(width, height, segmentsX, segmentsY, dir, uRepeat, vRepeat, randDisplace) {

	THREE.Geometry.call(this);

	var ix, iz,
	width_half = width / 2,
	height_half = height / 2,
	gridX = segmentsX || 1,
	gridZ = segmentsY || 1,
	gridX1 = gridX + 1,
	gridZ1 = gridZ + 1,
	segment_width = width / gridX,
	segment_height = height / gridZ,
	normal = new THREE.Vector3(),
	xmul = new THREE.Vector3(),
	ymul = new THREE.Vector3();

	uRepeat = uRepeat || 1;
	vRepeat = vRepeat || 1;
	randDisplace = randDisplace || 0;

	dir = dir || "pz";
	switch (dir) {
		case "nx": normal.x = -1; xmul.z = -1; ymul.y = 1; break;
		case "px": normal.x =  1; xmul.z = -1; ymul.y = -1; break;
		case "ny": normal.y = -1; xmul.x = -1; ymul.z = 1; break;
		case "py": normal.y =  1; xmul.x = -1; ymul.z = -1; break;
		case "nz": normal.z = -1; xmul.x = 1; ymul.y = 1; break;
		case "pz": normal.z =  1; xmul.x = 1; ymul.y = -1; break;
		default: console.error("Unknown plane direction " + dir);
	}
	var displace = new THREE.Vector3();

	for (iz = 0; iz < gridZ1; iz++) {
		for (ix = 0; ix < gridX1; ix++) {
			var x = ix * segment_width - width_half;
			var y = iz * segment_height - height_half;
			var vert = new THREE.Vector3( x * xmul.x, x * xmul.y, x * xmul.z );
			vert.set( vert.x + y * ymul.x, vert.y + y * ymul.y, vert.z + y * ymul.z );
			// Random displacement?
			if (randDisplace && ix > 0 && ix < gridX1 - 1) {
				displace.copy(normal);
				displace.multiplyScalar(-randDisplace + Math.random() * randDisplace * 2);
				vert.addSelf(displace);
			}
			this.vertices.push(vert);
		}
	}

	for ( iz = 0; iz < gridZ; iz ++ ) {
		for ( ix = 0; ix < gridX; ix ++ ) {
			var a = ix + gridX1 * iz;
			var b = ix + gridX1 * ( iz + 1 );
			var c = ( ix + 1 ) + gridX1 * ( iz + 1 );
			var d = ( ix + 1 ) + gridX1 * iz;

			var face = new THREE.Face4( a, b, c, d );
			face.normal.copy( normal );
			face.vertexNormals.push( normal.clone(), normal.clone(), normal.clone(), normal.clone() );
			face.materialIndex = 0;

			this.faces.push( face );
			this.faceVertexUvs[ 0 ].push([
				new THREE.UV( ix / gridX * uRepeat, (1 - iz / gridZ) * vRepeat ),
				new THREE.UV( ix / gridX * uRepeat, (1 - (iz + 1) / gridZ) * vRepeat ),
				new THREE.UV( (ix + 1) / gridX * uRepeat, (1 - (iz+ 1) / gridZ) * vRepeat ),
				new THREE.UV( (ix + 1) / gridX * uRepeat, (1 - iz / gridZ) * vRepeat )
			]);
		}
	}

	this.computeCentroids();
	if (randDisplace)
		this.computeVertexNormals();
};

PlaneGeometry.prototype = Object.create( THREE.Geometry.prototype );
"use strict";
/**
 * original author mrdoob / http://mrdoob.com/ (THREE.CubeGeometry)
 * based on http://papervision3d.googlecode.com/svn/trunk/as3/trunk/src/org/papervision3d/objects/primitives/Cube.as
 */

function BlockGeometry(width, height, depth, segmentsWidth, segmentsHeight, segmentsDepth, materials, sides, uRepeat, vRepeat, randDisplace) {
	THREE.Geometry.call(this);

	var scope = this,
	width_half = width / 2,
	height_half = height / 2,
	depth_half = depth / 2;

	uRepeat = uRepeat || 1;
	vRepeat = vRepeat || 1;
	randDisplace = randDisplace || 0;

	var mpx, mpy, mpz, mnx, mny, mnz;

	if (materials !== undefined) {
		if (materials instanceof Array) {
			this.materials = materials;
		} else {
			this.materials = [];
			for (var i = 0; i < 6; i ++) {
				this.materials.push(materials);
			}
		}
		mpx = 0; mnx = 1; mpy = 2; mny = 3; mpz = 4; mnz = 5;
	} else {
		this.materials = [];
	}

	this.sides = { px: true, nx: true, py: true, ny: true, pz: true, nz: true };

	if (sides) {
		for (var s in sides) {
			if (this.sides[s] !== undefined) {
				this.sides[s] = sides[s];
			}
		}
	}

	this.sides.px && buildPlane('z', 'y', - 1, - 1, depth, height, width_half, mpx); // px
	this.sides.nx && buildPlane('z', 'y',   1, - 1, depth, height, - width_half, mnx); // nx
	this.sides.py && buildPlane('x', 'z', - 1,   1, width, depth, height_half, mpy, true); // py
	this.sides.ny && buildPlane('x', 'z', - 1, - 1, width, depth, - height_half, mny, true); // ny
	this.sides.pz && buildPlane('x', 'y',   1, - 1, width, height, depth_half, mpz); // pz
	this.sides.nz && buildPlane('x', 'y', - 1, - 1, width, height, - depth_half, mnz); // nz

	function buildPlane(u, v, udir, vdir, width, height, depth, material, flipNormal) {
		var w, ix, iy,
		gridX = segmentsWidth || 1,
		gridY = segmentsHeight || 1,
		width_half = width / 2,
		height_half = height / 2,
		offset = scope.vertices.length;

		if ((u === 'x' && v === 'y') || (u === 'y' && v === 'x')) {
			w = 'z';
		} else if ((u === 'x' && v === 'z') || (u === 'z' && v === 'x')) {
			w = 'y';
			gridY = segmentsDepth || 1;
		} else if ((u === 'z' && v === 'y') || (u === 'y' && v === 'z')) {
			w = 'x';
			gridX = segmentsDepth || 1;
		}

		var gridX1 = gridX + 1,
		gridY1 = gridY + 1,
		segment_width = width / gridX,
		segment_height = height / gridY,
		normal = new THREE.Vector3();

		normal[w] = depth > 0 ? 1 : - 1;
		if (flipNormal) normal[w] *= -1;

		for (iy = 0; iy < gridY1; iy ++) {
			for (ix = 0; ix < gridX1; ix ++) {
				var vector = new THREE.Vector3();
				vector[u] = (ix * segment_width - width_half) * udir;
				vector[v] = (iy * segment_height - height_half) * vdir;
				vector[w] = depth;
				// Random displacement?
				if (randDisplace && ix > 0 && ix < gridX1 - 1)
					vector[w] += -randDisplace + Math.random() * randDisplace * 2;

				scope.vertices.push(vector);
			}
		}

		for (iy = 0; iy < gridY; iy++) {
			for (ix = 0; ix < gridX; ix++) {
				var a = ix + gridX1 * iy;
				var b = ix + gridX1 * (iy + 1);
				var c = (ix + 1) + gridX1 * (iy + 1);
				var d = (ix + 1) + gridX1 * iy;

				var face = new THREE.Face4(a + offset, b + offset, c + offset, d + offset);
				face.normal.copy(normal);
				face.vertexNormals.push(normal.clone(), normal.clone(), normal.clone(), normal.clone());
				face.materialIndex = material;

				scope.faces.push(face);
				scope.faceVertexUvs[0].push([
					new THREE.UV(ix / gridX * uRepeat, (1 - iy / gridY) * vRepeat),
					new THREE.UV(ix / gridX * uRepeat, (1 - (iy + 1) / gridY) * vRepeat),
					new THREE.UV((ix + 1) / gridX * uRepeat, (1- (iy + 1) / gridY) * vRepeat),
					new THREE.UV((ix + 1) / gridX * uRepeat, (1 - iy / gridY) * vRepeat)
				]);
			}
		}
	}

	this.computeCentroids();
	this.mergeVertices();
	if (randDisplace)
		this.computeVertexNormals();
};

BlockGeometry.prototype = Object.create(THREE.Geometry.prototype);
"use strict";
function LightManager(params) {
	params = params || {};
	this.maxLights = params.maxLights || 4;
	this.maxShadows = params.maxShadows || 2;
	this.lights = [];
	this.shadows = [];

	this.addLight = function(light) {
		this.lights.push(light);
	};

	this.addShadow = function(light) {
		this.shadows.push(light);
	};

	var updateSkip = 0;
	var v1 = new THREE.Vector2();
	var v2 = new THREE.Vector2();

	this.update = function(observer) {
		if (++updateSkip <= 20) return; // Perhaps should also/instead check moved distance?
		else updateSkip = 0;

		function angleDist(a, b) {
			v1.set(a.x - observer.position.x, a.z - observer.position.z).normalize();
			v2.set(b.x - observer.position.x, b.z - observer.position.z).normalize();
			return Math.acos(v1.dot(v2));
		}
		function distSq(a, b) {
			var dx = b.x - a.x, dz = b.z - a.z;
			return dx * dx + dz * dz;
		}
		function sortByDist(a, b) {
			return distSq(a.position, observer.position) - distSq(b.position, observer.position);
		}
		var i, used = 0;

		this.lights.sort(sortByDist);
		for (i = 0; i < this.lights.length; ++i) {
			if (used < this.maxLights && (
				angleDist(this.lights[i].position, controls.target) < Math.PI * 0.4 ||
				distSq(this.lights[i].position, observer.position) < 1.5 * this.lights[i].distance * this.lights[i].distance))
				{
					this.lights[i].visible = true;
					++used;
			} else this.lights[i].visible = false;
		}

		this.shadows.sort(sortByDist);
		for (i = 0; i < this.shadows.length; ++i) {
			if (i < this.maxShadows) this.shadows[i].castShadow = true;
			else this.shadows[i].castShadow = false;
		}

	};
}

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

function AIManager() {
	var timeAccumulator = 0;

	var v = new THREE.Vector3();

	function walkTowards(monster, pos, sq_thres, dt) {
		v.copy(pos);
		v.subSelf(monster.position);
		v.y = 0;
		if (monster.mesh) monster.mesh.lookAt(v.normalize());
		else monster.lookAt(v.normalize());
		if (monster.position.distanceToSquared(pos) >= sq_thres) {
			monster.setLinearVelocity(v.multiplyScalar(monster.speed * dt));
			if (monster.mesh) monster.mesh.animate = true;
			return false;
		} else {
			monster.setLinearVelocity(v.set(0, 0, 0));
			if (monster.mesh) monster.mesh.animate = false;
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
				walkTowards(monster, pl.position, 12, dt);
				// Shoot?
				if (Math.random() < 0.05) {
					shoot(monster.position, monster.mesh ? monster.mesh.rotation : monster.rotation, v.set(0, 0.11, -1.2), true);
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
				else if (walkTowards(monster, monster.waypoints[0], 1, dt)) {
					// Move on to the next waypoint
					monster.waypoints.splice(0, 1);
				}
			}
		}
	};

}




function SoundManager() {
	var sounds = {};
	for (var s in assets.sounds)
		sounds[s] = new Sound(assets.sounds[s], 5);

	this.play = function(name) {
		sounds[name].play();
	};

	this.playSpatial = function(name, position, radius) {
		// Hack: Should have an update method instead of using a global reference
		var distance = pl.camera.position.distanceTo(position);
		if (distance < radius)
			sounds[name].play(1 - distance / radius);
	};
}

function Sound(samples, minPlayers) {
	if (typeof samples === "string") samples = [ samples ];
	minPlayers = minPlayers || 1;

	this.sampleIndex = 0;
	this.samples = [];

	while (this.samples.length < minPlayers)
		for (var i = 0; i < samples.length; ++i)
			this.samples.push(new Audio("assets/sounds/" + samples[i]));

	this.play = function(volume) {
		if (!CONFIG.sounds) return;
		try { // Firefox fails at GitHub MIME types
			var sample = this.samples[this.sampleIndex];
			if (window.chrome) sample.load(); // Chrome requires reload
			else sample.currentTime = 0;
			if (volume !== undefined)
				sample.volume = volume;
			sample.play();
			this.sampleIndex = (this.sampleIndex + 1) % this.samples.length;
		} catch(e) {};
	};
}
"use strict";
var _textures = [];

function loadTexture(path, opts) {
	opts = opts || {};
	var image = new Image();
	image.onload = function() { texture.needsUpdate = true; };
	image.src = path;
	var texture = new THREE.Texture(
		image,
		new THREE.UVMapping(),
		THREE.RepeatWrapping,
		THREE.RepeatWrapping,
		CONFIG.linearTextureFilter ? THREE.LinearFilter : THREE.NearestFilter,
		CONFIG.linearTextureFilter ? THREE.LinearMipMapLinearFilter : THREE.NearestFilter,
		opts.alpha ? THREE.RGBAFormat : THREE.RGBFormat,
		THREE.UnsignedByteType,
		CONFIG.anisotropy
	);
	_textures.push(texture);
	return texture;
}


function updateTextures() {
	for (var i = 0; i < _textures.length; ++i) {
		_textures[i].magFilter = CONFIG.linearTextureFilter ? THREE.LinearFilter : THREE.NearestFilter;
		_textures[i].minFilter = CONFIG.linearTextureFilter ? THREE.LinearMipMapLinearFilter : THREE.NearestFilter;
		_textures[i].anisotropy = CONFIG.anisotropy;
		_textures[i].needsUpdate = true;
	}
	updateConfig();
}


function fixAnisotropy(mat, value) {
	if (!mat) return;
	value = value || CONFIG.anisotropy;

	function fixAnisotropyTex(tex) {
		if (!tex) return;
		tex.anisotropy = value;
		tex.needsUpdate = true;
	}

	if (mat instanceof THREE.ShaderMaterial) {
		fixAnisotropyTex(mat.uniforms.tDiffuse.value);
		fixAnisotropyTex(mat.uniforms.tNormal.value);
		fixAnisotropyTex(mat.uniforms.tSpecular.value);
		fixAnisotropyTex(mat.uniforms.tAO.value);
		fixAnisotropyTex(mat.uniforms.tCube.value);
		fixAnisotropyTex(mat.uniforms.tDisplacement.value);
	} else {
		fixAnisotropyTex(mat.map);
		fixAnisotropyTex(mat.normalMap);
		fixAnisotropyTex(mat.specularMap);
		fixAnisotropyTex(mat.lightMap);
	}
}


function updateMaterials() {
	for (var i in cache.materials) {
		if (!cache.materials.hasOwnProperty(i)) continue;
		cache.materials[i].needsUpdate = true;
		// Also affected: shadows, soft shadows, physical shading
	}
	updateConfig();
}


function createMaterial(name) {
	var texture_path = "assets/textures/";
	var ambient = 0xaaaaaa, diffuse = 0xaaaaaa, specular = 0xffffff, shininess = 30, scale = 1.0;
	/*var shader = THREE.ShaderUtils.lib["normal"];
	var uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	uniforms["tDiffuse"].value = loadTexture(texture_path + name + ".jpg");
	uniforms["tSpecular"].value = loadTexture(texture_path + "specular/" + name + ".jpg");
	uniforms["tNormal"].value = loadTexture(texture_path + "normal/"  + name + ".jpg");
	uniforms["uShininess"].value = shininess;
	//uniforms["uNormalScale"].value = new THREE.Vector2(1, 1);

	//uniforms["tDisplacement"].texture = loadTexture(texture_path + "height/"  + name + ".jpg");
	//uniforms["uDisplacementBias"].value = - 0.428408 * scale;
	//uniforms["uDisplacementScale"].value = 2.436143 * scale;

	uniforms["enableAO"].value = false;
	uniforms["enableDiffuse"].value = true;
	uniforms["enableSpecular"].value = true;
	uniforms["enableReflection"].value = false;
	uniforms["enableDisplacement"].value = false;

	uniforms["uDiffuseColor"].value.setHex(diffuse);
	uniforms["uSpecularColor"].value.setHex(specular);
	uniforms["uAmbientColor"].value.setHex(ambient);

	uniforms["uDiffuseColor"].value.convertGammaToLinear();
	uniforms["uSpecularColor"].value.convertGammaToLinear();
	uniforms["uAmbientColor"].value.convertGammaToLinear();

	//uniforms["wrapRGB"].value.set(0.575, 0.5, 0.5);
	return new THREE.ShaderMaterial({
		fragmentShader: shader.fragmentShader,
		vertexShader: shader.vertexShader,
		uniforms: uniforms,
		fog: true,
		lights: true
	});*/

	return new THREE.MeshPhongMaterial({
		ambient: ambient,
		diffuse: diffuse,
		specular: specular,
		shininess: shininess,
		perPixel: true,
		map: loadTexture(texture_path + name + ".jpg"),
		specularMap: CONFIG.specularMapping ? loadTexture(texture_path  + "specular/" + name + ".jpg") : undefined,
		normalMap: CONFIG.normalMapping ? loadTexture(texture_path + "normal/" + name + ".jpg") : undefined
	});

}


function dumpInfo() {
	var gl = renderer.context;
	var gl_info = {
		"Version": gl.getParameter(gl.VERSION),
		"Shading language": gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
		"Vendor": gl.getParameter(gl.VENDOR),
		"Renderer": gl.getParameter(gl.RENDERER),
		"Max varying vectors": gl.getParameter(gl.MAX_VARYING_VECTORS),
		"Max vertex attribs": gl.getParameter(gl.MAX_VERTEX_ATTRIBS),
		"Max vertex uniform vectors": gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS),
		"Max fragment uniform vectors": gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
		"Max renderbuffer size": gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
		"Max texture size": gl.getParameter(gl.MAX_TEXTURE_SIZE),
		"Max cube map texture size": gl.getParameter(gl.MAX_CUBE_MAP_TEXTURE_SIZE),
		"Max texture image units": gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
		"Max vertex texture units": gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
		"Max combined texture units": gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS),
		"Max viewport dims": gl.getParameter(gl.MAX_VIEWPORT_DIMS)[0] + "x" + gl.getParameter(gl.MAX_VIEWPORT_DIMS)[1]
	};
	console.log("WebGL info: ", gl_info);
}

function screenshot(dontDownload, useJPG) {
	var imgtype = useJPG ? "image/jpeg" : "image/png";
	var dataUrl = renderer.domElement.toDataURL(imgtype);
	if (!dontDownload) dataUrl = dataUrl.replace(imgtype, "image/octet-stream");
	window.open(dataUrl, "_blank");
}


var performance = window.performance || {};
performance.now = (function() {
  return performance.now       ||
         performance.mozNow    ||
         performance.msNow     ||
         performance.oNow      ||
         performance.webkitNow ||
         function() { return new Date().getTime(); };
})();

function Profiler(name) {
	name = name || "Profiling";
	name += ": ";
	this.start = function() {
		this.time = performance.now();
	};
	this.end = function() {
		var diff = performance.now() - this.time;
		console.log(name + diff + "ms");
	};
	this.start();
}
"use strict";
// Most of the contents from this file is adapted from examples of firework.js
// http://jeromeetienne.github.com/fireworks.js/


// Particle system initializer for simple particle flames
function particleSystemCreator(emitter, position, color, texture) {
	var i, geometry = new THREE.Geometry();
	// Init vertices
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.vertices.push(new THREE.Vector3());
	// Init colors
	geometry.colors = new Array(emitter.nParticles());
	for (i = 0; i < emitter.nParticles(); i++)
		geometry.colors[i] = new THREE.Color();
	// Init material
	var material = new THREE.ParticleBasicMaterial({
		color: new THREE.Color(color).getHex(),
		size: 0.3,
		sizeAttenuation: true,
		vertexColors: true,
		map: texture || Fireworks.ProceduralTextures.buildTexture(),
		blending: THREE.AdditiveBlending,
		depthWrite: false,
		transparent: true
	});
	// Init particle system
	var particleSystem = new THREE.ParticleSystem(geometry, material);
	particleSystem.dynamic = true;
	particleSystem.sortParticles = true;
	particleSystem.position = position;
	scene.add(particleSystem);
	return particleSystem;
}

// Create a simple fire emitter
function createSimpleFire(position) {
	var emitter = Fireworks.createEmitter({ nParticles: 30 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(20)
		.position(Fireworks.createShapeSphere(0, 0, 0, 0.1))
		.velocity(Fireworks.createShapePoint(0, 1, 0))
		.lifeTime(0.3, 0.6)
		.renderToThreejsParticleSystem({
			particleSystem: particleSystemCreator(emitter, position, 0xee8800)
		}).back()
	.start();
	return emitter;
}


// Create a teleporter emitter
var _novaTexture = null; //loadTexture("assets/particles/nova.png", { alpha: true });
function createTeleporterParticles(position) {
	var emitter = Fireworks.createEmitter({ nParticles: 30 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(20)
		.position(Fireworks.createShapeSphere(0, 0, 0, 0.3))
		.velocity(Fireworks.createShapePoint(0, 1, 0))
		.lifeTime(0.6, 1.2)
		.renderToThreejsParticleSystem({
			particleSystem: particleSystemCreator(emitter, position, 0x0088ee, _novaTexture)
		}).back()
	.start();
	return emitter;
}


// Create a torch fire emitter
var _fireTexture = null; //loadTexture("assets/particles/flame.png", { alpha: true });
function createTexturedFire(parent) {
	var numSprites = 8;
	var emitter = Fireworks.createEmitter({ nParticles: 20 });
	emitter.effectsStackBuilder()
		.spawnerSteadyRate(15)
		.position(Fireworks.createShapeSphere(0, 0.05, 0, 0.05))
		.velocity(Fireworks.createShapePoint(0, 1.5, 0))
		.lifeTime(0.1, 0.3)
		.friction(0.99)
		//.randomVelocityDrift(Fireworks.createVector(0.1,2,0))
		.createEffect('scale', {
				origin: 1/1000,
				factor: 1.02
			}).onBirth(function(particle) {
				var object3d = particle.get('threejsObject3D').object3d;
				var scale = this.opts.origin;
				object3d.scale.set(scale*1.5, scale*4)
			}).onUpdate(function(particle, deltaTime) {
				var object3d = particle.get('threejsObject3D').object3d;
				object3d.scale.multiplyScalar(this.opts.factor);
			}).back()
		.createEffect('rotation')
			.onBirth(function(particle) {
				var object3d = particle.get('threejsObject3D').object3d;
				object3d.rotation = Math.random() * Math.PI * 2;
			}).back()
		.createEffect('opacity', {
				gradient: Fireworks.createLinearGradient()
						.push(0.00, 0.00)
						.push(0.05, 1.00)
						.push(0.99, 1.00)
						.push(1.00, 0.00)
			}).onUpdate(function(particle) {
				var object3d = particle.get('threejsObject3D').object3d;
				var canonAge = particle.get('lifeTime').normalizedAge();
				object3d.opacity = this.opts.gradient.get(canonAge);
			}).back()
		.renderToThreejsObject3D({
			container: parent,
			create: function() {
				var object3d = new THREE.Sprite({
					useScreenCoordinates: false,
					map: _fireTexture,
					blending: THREE.AdditiveBlending,
					transparent: true
				});
				object3d.uvScale.set(1, 1 / numSprites)
				return object3d;
			}
		})
		.createEffect("updateSpritesheet")
			.onUpdate(function(particle, deltaTime) {
				var object3d = particle.get('threejsObject3D').object3d;
				var canonAge = particle.get('lifeTime').normalizedAge();
				var imageIdx = Math.floor(canonAge * (numSprites));
				var uvOffsetY = imageIdx * 1 / numSprites;
				object3d.uvOffset.set(0, uvOffsetY)
			}).back()
		.back()
	.start();
	return emitter;
}
"use strict";
/**
 * @author mrdoob / http://mrdoob.com/
 * @author alteredq / http://alteredqualia.com/
 * @author paulirish / http://paulirish.com/
 * @author tapio / http://tapio.github.com/
 */

// Based on THREE.FirstPersonControls
function Controls(object, handlers, domElement) {
	this.object = object;
	this.handlers = handlers || {};
	this.target = new THREE.Vector3(0, 0, 0);
	this.domElement = (domElement !== undefined) ? domElement : document;

	this.movementSpeed = 1.0;
	this.lookSpeed = 0.005;
	this.lookVertical = true;
	this.autoForward = false;
	this.mouseEnabled = true;
	this.active = true;

	this.constrainVerticalLook = false;
	this.verticalMin = 0;
	this.verticalMax = Math.PI;

	this.pointerLockEnabled = false;
	this.mouseFallback = false;

	this.mouseX = 0;
	this.mouseY = 0;

	var lat = 0, lon = 0, phi = 0, theta = 0;
	var moveForward = false, moveBackward = false;
	var moveLeft = false, moveRight = false;
	var moveUp = false, moveDown = false;
	var viewHalfX = 0, viewHalfY = 0;

	if (this.domElement !== document) {
		this.domElement.setAttribute('tabindex', -1);
	}

	//

	this.setYAngle = function(angle) {
		lon = angle;
	}

	this.reset = function() {
		lat = 0; lon = 0;
	};

	this.handleResize = function () {
		if (this.domElement === document) {
			viewHalfX = window.innerWidth / 2;
			viewHalfY = window.innerHeight / 2;
		} else {
			viewHalfX = this.domElement.offsetWidth / 2;
			viewHalfY = this.domElement.offsetHeight / 2;
		}
	};

	this.onMouseDown = function (event) {
		event.preventDefault();
		if (this.domElement !== document) this.domElement.focus();
		if (this.pointerLockEnabled) event.stopPropagation();
		if (this.mouseEnabled && this.active && this.handlers.mouse && this.pointerLockEnabled)
			this.handlers.mouse(event.button);
	};

	this.onMouseUp = function (event) {
		event.preventDefault();
		if (this.pointerLockEnabled) event.stopPropagation();
		if (this.mouseEnabled && this.active) {
			switch (event.button) {
				case 0: break;
				case 2: break;
			}
		}
	};

	this.onMouseMove = function (event) {
		function limit(a, lo, hi) { return a < lo ? lo : (a > hi ? hi : a); }
		if (!this.mouseEnabled || !this.active) return;
		if (this.pointerLockEnabled) {
			if (event.mozMovementX === 0 && event.mozMovementY === 0) return; // Firefox fires 0-movement event right after real one
			this.mouseX = event.movementX || event.webkitMovementX || event.mozMovementX || 0;
			this.mouseY = event.movementY || event.webkitMovementY || event.mozMovementY || 0;
			this.mouseX = limit(this.mouseX * 20, -600, 600);
			this.mouseY = limit(this.mouseY * 20, -600, 600);
		} else if (this.domElement === document) {
			this.mouseX = event.pageX - viewHalfX;
			this.mouseY = event.pageY - viewHalfY;
		} else {
			this.mouseX = event.pageX - this.domElement.offsetLeft - viewHalfX;
			this.mouseY = event.pageY - this.domElement.offsetTop - viewHalfY;
		}
	};

	this.onKeyDown = function (event) {
		//event.preventDefault();
		switch (event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ moveForward = true; break;
			case 37: /*left*/
			case 65: /*A*/ moveLeft = true; break;
			case 40: /*down*/
			case 83: /*S*/ moveBackward = true; break;
			case 39: /*right*/
			case 68: /*D*/ moveRight = true; break;
			case 82: /*R*/ reload(); break;
			case 70: /*F*/ pl.shadow.visible = !pl.shadow.visible; break;
			case 123: /*F12*/ screenshot(true); break;
		}
	};

	this.onKeyUp = function (event) {
		switch(event.keyCode) {
			case 38: /*up*/
			case 87: /*W*/ moveForward = false; break;
			case 37: /*left*/
			case 65: /*A*/ moveLeft = false; break;
			case 40: /*down*/
			case 83: /*S*/ moveBackward = false; break;
			case 39: /*right*/
			case 68: /*D*/ moveRight = false; break;
		}
	};

	this.update = function(delta) {
		if (!this.active) return;

		var actualMoveSpeed = delta * this.movementSpeed,
			actualLookSpeed = this.mouseEnabled ? delta * this.lookSpeed : 0,
			cameraPosition = this.object.position;

		// Looking

		if (this.pointerLockEnabled ||
			(this.mouseFallback && this.mouseX * this.mouseX + this.mouseY * this.mouseY > 5000))
			{
			lon += this.mouseX * actualLookSpeed;
			if (this.lookVertical)
				lat -= this.mouseY * actualLookSpeed;
		}

		lat = Math.max(-85, Math.min(85, lat));
		phi = (90 - lat) * Math.PI / 180;
		theta = lon * Math.PI / 180;

		if (this.constrainVerticalLook)
			phi = THREE.Math.mapLinear(phi, 0, Math.PI, this.verticalMin, this.verticalMax);

		this.target.x = cameraPosition.x + 100 * Math.sin(phi) * Math.cos(theta);
		this.target.y = cameraPosition.y + 100 * Math.cos(phi);
		this.target.z = cameraPosition.z + 100 * Math.sin(phi) * Math.sin(theta);

		if (this.pointerLockEnabled) {
			this.mouseX = 0;
			this.mouseY = 0;
		}

		this.object.lookAt(this.target);

		// Movement

		if (moveForward || (this.autoForward && !moveBackward)) {
			this.object.translateZ(-actualMoveSpeed);
		} else if (moveBackward) {
			this.object.translateZ(actualMoveSpeed);
		}

		if (moveLeft) {
			this.object.translateX(-actualMoveSpeed);
		} else if (moveRight) {
			this.object.translateX(actualMoveSpeed);
		}

		if (moveUp) {
			this.object.translateY(actualMoveSpeed);
		} else if (moveDown) {
			this.object.translateY(-actualMoveSpeed);
		}

	};


	this.domElement.addEventListener('contextmenu', function (event) { event.preventDefault(); }, false);
	this.domElement.addEventListener('mousemove', bind(this, this.onMouseMove), false);
	this.domElement.addEventListener('mousedown', bind(this, this.onMouseDown), false);
	this.domElement.addEventListener('mouseup', bind(this, this.onMouseUp), false);
	this.domElement.addEventListener('keydown', bind(this, this.onKeyDown), false);
	this.domElement.addEventListener('keyup', bind(this, this.onKeyUp), false);

	function bind(scope, fn) {
		return function () {
			fn.apply(scope, arguments);
		};
	}

	this.handleResize();
};
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
		"ammo-box": { name: "ammo", collision: "box", mass: 250, sound: "metal", item: { type: "clips", amount: 2 } },
		"health-box": { name: "health pack", collision: "box", mass: 250, sound: "metal", item: { type: "hp", amount: 25 } },
		"heated-forks-box": { name: "heated forks ammo upgrade", collision: "box", mass: 150, item: { type: "heated-forks" } },
		"plasma-forks-box": { name: "plasma forks ammo upgrade", collision: "box", mass: 150, item: { type: "plasma-forks" } }
	},
	monsters: {
		"robot": {
			collision: "capsule",
			character: { speed: 120, hp: 50 },
			animation: { type: "morph", duration: "1000" },
			sound: "metal"
		}
	},
	lights: {
		"ceiling-lamp": { type: "ceiling", offset: { x: 0, y: -0.2, z: 0 } }
	},
	sounds: {
		"shoot": [ "fork-launch.ogg" ],
		"shoot-dry": [ "empty-gun.ogg" ],
		"reload": [ "reload.ogg" ],
		"pick-up": [ "pick-up.ogg" ],
		"metal": [ "metal-1.ogg", "metal-2.ogg", "metal-3.ogg" ],
		"robot-death": [ "robot-death.ogg" ]
	},
	materials: {
		"metal-01": { repeat: 2 },
		"metal-02": {},
		"metal-03": {},
		"metal-bumps-01": { repeat: 2 },
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
"use strict";
var VOID = " ";
var OPEN = ".";
var WALL = "#";
var DIAG = "%";

function Map(w, h, data) {
	this.map = new Array(w * h);

	if (data && data.length && data instanceof Array) {
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				this.map[j * w + i] = data[j][i];
			}
		}
	} else if (data) {
		for (var k = 0; k < w * h; ++k) this.map[k] = data;
	}

	this.get = function(x, y, fallback) {
		if (x < 0 || x >= w || y < 0 || y >= h) return fallback || null;
		return this.map[y * w + x];
	};

	this.put = function(x, y, what) {
		if (x < 0 || x >= w || y < 0 || y >= h) return;
		this.map[y * w + x] = what;
	};

	this.toJSON = function() {
		var res = new Array(h);
		for (var j = 0; j < h; ++j) {
			res[j] = "";
			for (var i = 0; i < w; ++i) {
				res[j] += this.map[j * w + i];
			}
		}
		return res;
	};

	this.replace = function(oldval, newval) {
		for (var j = 0; j < h; ++j) {
			for (var i = 0; i < w; ++i) {
				if (this.map[j * w + i] == oldval)
					this.map[j * w + i] = newval;
			}
		}
	};

	function floodFill(map, x, y, target, filler, skip) {
		var cell = map.get(x, y);
		if (cell != target && cell != skip) return;
		if (cell != skip)
			map.map[y * w + x] = filler;
		floodFill(map, x-1, y, target, filler, skip);
		floodFill(map, x+1, y, target, filler, skip);
		floodFill(map, x, y-1, target, filler, skip);
		floodFill(map, x, y+1, target, filler, skip);
	};

	this.fill = function(x, y, target, filler, skip) {
		floodFill(this, x, y, target, filler, skip);
	};

	function distSq(x1, y1, x2, y2) {
		var dx = x2 - x1, dy = y2 - y1;
		return dx * dx + dy * dy;
	}

	this.raycast = function(x1, y1, x2, y2, step) {
		step = step || 0.5;
		var angle = Math.atan2(y2 - y1, x2 - x1);
		var dx = Math.cos(angle) * step;
		var dy = Math.sin(angle) * step;
		while (distSq(x1, y1, x2, y2) > step * step) {
			if (this.map[(y1|0) * w + (x1|0)] == WALL)
				return false;
			x1 += dx;
			y1 += dy;
		}
		return true;
	};

	this.getWalkableMatrix = function() {
		var grid = new Array(h);
		for (var j = 0; j < h; ++j) {
			grid[j] = [];
			for (var i = 0; i < w; ++i) {
				grid[j].push(this.map[j * w + i] == WALL ? 1 : 0);;
			}
		}
		return grid;
	};

}
"use strict";
function MapGen() {
	var self = this;

	// Checks if the given position overlaps with the given array of objects
	function testOverlap(pos, objects, tolerance) {
		if (!objects.length) return false;
		tolerance = tolerance ? tolerance * tolerance : 0.000001; // Distance squared
		for (var i = 0; i < objects.length; ++i) {
			var dx = objects[i].position.x - pos.x, dz = objects[i].position.z - pos.z;
			if (dx * dx + dz * dz <= tolerance) return true;
		}
		return false;
	}

	// Checks if the given grid position is a corridor
	function testCorridor(pos, map) {
		var count = 0;
		count += map.get(pos.x-1, pos.z) == WALL ? 1 : 0;
		count += map.get(pos.x+1, pos.z) == WALL ? 1 : 0;
		count += map.get(pos.x, pos.z-1) == WALL ? 1 : 0;
		count += map.get(pos.x, pos.z+1) == WALL ? 1 : 0;
		return count == 2;
	}

	this.generateMap = function(level) {
		var width = level.width = rand(25,35);
		var depth = level.depth = rand(25,35);
		level.map = new Map(width, depth, WALL);
		var i, j;

		// Materials
		level.env = randProp(assets.environments);
		level.materials = {
			floor: randElem(level.env.floor),
			ceiling: randElem(level.env.ceiling),
			wall: randElem(level.env.wall)
		};

		// Create rooms
		var roomsize = rand(3,4);
		var rooms = Math.floor(width * depth / (roomsize * roomsize * 4));
		var x = rand(roomsize+1, width-roomsize-1);
		var z = rand(roomsize+1, depth-roomsize-1);
		var ox, oz, swapx, swapz;

		for (var room = 0; room < rooms; ++room) {
			var rw = rand(2, roomsize);
			var rd = rand(2, roomsize);
			var xx = x - rand(0, rw-1);
			var zz = z - rand(0, rd-1);

			// Floor for the room
			for (j = zz; j < zz + rd; ++j)
				for (i = xx; i < xx + rw; ++i)
					level.map.put(i, j, OPEN);

			ox = x; oz = z;

			// Don't create a dead end corridor
			if (room == rooms-1) break;

			// Pick new room location
			do {
				x = rand(roomsize+1, width-roomsize-1);
				z = rand(roomsize+1, depth-roomsize-1);
			} while (level.map.get(x,z) == WALL && Math.abs(ox-x) + Math.abs(oz-z) >= 30);

			// Do corridors
			swapx = x < ox;
			for (i = swapx ? x : ox; i < (swapx ? ox : x); ++i)
				level.map.put(i, oz, OPEN);
			swapz = z < oz;
			for (j = swapz ? z : oz; j < (swapz ? oz : z); ++j)
				level.map.put(x, j, OPEN);
		}

		// Count open space
		level.floorCount = 0;
		for (z = 0; z < depth; ++z)
			for (x = 0; x < width; ++x)
				if (level.map.get(x,z) == OPEN) level.floorCount++;

		// Place start
		do {
			level.start[0] = rand(1, width-2);
			level.start[1] = rand(1, depth-2);
		} while (level.map.get(level.start[0], level.start[1]) == WALL);

		// Place exit
		do {
			level.exit[0] = rand(1, width-2);
			level.exit[1] = rand(1, depth-2);
		} while (level.map.get(level.exit[0], level.exit[1]) == WALL);
		level.exit[0] += 0.5;
		level.exit[1] += 0.5;
	};

	this.generateLights = function(level) {
		// Point lights
		var nLights = Math.floor(level.floorCount / 20);
		var pos = new THREE.Vector3();
		var i = 0;
		while (i < nLights) {
			// Pick a random place
			pos.x = rand(0, level.width-1);
			pos.z = rand(0, level.depth-1);
			// Make sure we are not inside a wall
			if (level.map.get(pos.x, pos.z) == WALL) continue;
			// Pick a random cardinal direction
			var dir = rand(0,3) * Math.PI * 0.5;
			var dx = Math.round(Math.cos(dir));
			var dz = -Math.round(Math.sin(dir));
			// Travel until wall found
			while (level.map.get(pos.x, pos.z, WALL) != WALL) {
				pos.x += dx;
				pos.z += dz;
			}
			// Back away to wall face
			pos.x = pos.x - 0.6 * dx + 0.5;
			pos.z = pos.z - 0.6 * dz + 0.5;
			pos.y = level.roomHeight * 0.7;
			if (testOverlap(pos, level.lights, 4.1)) continue;
			++i;
			// Actual light
			level.lights.push({
				position: { x: pos.x, y: pos.y, z: pos.z },
				target: { x: pos.x - dx * 1.1, y: pos.y - 1, z: pos.z - dz * 1.1 }
			});
		}
	};

	this.generateObjects = function(level) {
		// Placement
		var nObjects = Math.floor(level.floorCount / 8);
		var pos = new THREE.Vector3();
		var i = 0;
		while (i < nObjects) {
			// Pick a random place
			pos.x = rand(0, level.width-1);
			pos.z = rand(0, level.depth-1);
			// Make sure we are not inside a wall
			if (level.map.get(pos.x, pos.z) == WALL) continue;
			// TODO: Place most near walls
			// TODO: Groups, stacks, etc?

			if (testCorridor(pos, level.map)) continue;

			pos.x += 0.5;
			pos.z += 0.5;
			pos.y = null; // Auto

			if (testOverlap(pos, level.objects, 1.4)) continue;
			++i;

			var objname = randElem(level.env.objects);
			level.objects.push({
				name: objname,
				position: { x: pos.x, y: pos.y, z: pos.z }
			});
		}
	};

	this.generate = function() {
		var level = {
			map: [],
			objects: [],
			lights: [],
			gridSize: 2,
			roomHeight: 3,
			start: [ 0, 0 ],
			exit: [ 0, 0 ]
		};
		this.generateMap(level);
		this.generateLights(level);
		this.generateObjects(level);
		return level;
	};
}




function randProp(obj) {
	var result, count = 0;
	for (var prop in obj)
		if (Math.random() < 1.0 / ++count) result = prop;
	return obj[result];
}

function randElem(arr) {
	return arr[(Math.random() * arr.length) | 0];
}

function rand(lo, hi) {
	return lo + Math.floor(Math.random() * (hi - lo + 1));
}

function randf(lo, hi) {
	return lo + Math.random() * (hi - lo);
}
"use strict";
function Dungeon(scene, player, levelName) {
	var self = this;
	this.loaded = false;
	this.objects = [];
	this.monsters = [];
	this.grid = null;
	this.pathFinder = null;
	this.level = null;
	var dummy_material = new THREE.MeshBasicMaterial({ color: 0x000000 });
	var debug_material = new THREE.MeshBasicMaterial({ color: 0xff00ff });
	var dead_material = new THREE.MeshLambertMaterial({ color: 0x222222, ambient: 0x222222 });

	function objectHandler(level, pos, ang, def) {
		return function(geometry) {
			if (!def) def = {};
			var obj, mass = def.mass || 0;

			// Preprocessing
			if (def.character) mass = 100000;
			var scale = 1.0;
			if (def.randScale) {
				scale += randf(-def.randScale, def.randScale);
				mass *= scale;
			}
			if (!geometry.boundingBox) geometry.computeBoundingBox();

			// Fix anisotropy
			for (var m = 0; m < geometry.materials.length; ++m)
				fixAnisotropy(geometry.materials[m]);

			var mat = geometry.materials.length > 1 ? new THREE.MeshFaceMaterial() : geometry.materials[0];

			// Mesh creation
			if (def.collision) {
				var material = Physijs.createMaterial(mat, 0.7, 0.2); // friction, restition
				if (def.collision == "plane")
					obj = new Physijs.PlaneMesh(geometry, material, mass);
				else if (def.collision == "box")
					obj = new Physijs.BoxMesh(geometry, material, mass);
				else if (def.collision == "sphere")
					obj = new Physijs.SphereMesh(geometry, material, mass);
				else if (def.collision == "cylinder")
					obj = new Physijs.CylinderMesh(geometry, material, mass);
				else if (def.collision == "cone")
					obj = new Physijs.ConeMesh(geometry, material, mass);
				else if (def.collision == "capsule")
					obj = new Physijs.CapsuleMesh(geometry, material, mass);
				else if (def.collision == "convex")
					obj = new Physijs.ConvexMesh(geometry, material, mass);
				else if (def.collision == "concave")
					obj = new Physijs.ConcaveMesh(geometry, material, mass);
				else throw "Unsupported collision mesh type " + def.collision;
				self.objects.push(obj);
			} else {
				obj = new THREE.Mesh(geometry, mat);
			}

			// Positioning
			if (def.door) {
				// Fix door positions
				pos.x = Math.floor(pos.x) + 0.5;
				pos.z = Math.floor(pos.z) + 0.5;
			}
			pos.x *= level.gridSize;
			pos.z *= level.gridSize;
			if (!pos.y && pos.y !== 0) { // Auto-height
				pos.y = 0.5 * (geometry.boundingBox.max.y - geometry.boundingBox.min.y) + 0.001;
			}
			obj.position.copy(pos);
			if (ang) obj.rotation.y = ang / 180 * Math.PI;

			// Other attributes
			obj.scale.set(scale, scale, scale);
			if (!def.noShadows && !def.animation) {
				obj.castShadow = true;
				obj.receiveShadow = true;
			}
			if (mass === 0) {
				obj.matrixAutoUpdate = false;
				obj.updateMatrix();
			}

			// Handle animated meshes
			if (def.animation) {
				obj.visible = false;
				obj.mesh = animationManager.createAnimatedMesh(geometry, mat, def);
				if (!def.noShadows) {
					obj.mesh.castShadow = true;
					obj.mesh.receiveShadow = true;
				}
				obj.add(obj.mesh);
			}

			if (def.character) {
				if (def.character.hp) obj.hp = def.character.hp;
				self.monsters.push(obj);
			}

			if (def.item) {
				obj.items = {};
				obj.items[def.item.type] = def.item.amount || 1;
				obj.itemName = def.name;
			}

			// Character collision callbacks
			obj.addEventListener('collision', function(other, vel, rot) {
				if (vel.lengthSq() < 1) return;
				if (other.damage && def.sound)
					soundManager.playSpatial(def.sound, other.position, 10);
				if (this.dead) return;
				if (this.hp && other.damage) {
					this.hp -= other.damage;
					// Check for death
					if (this.hp <= 0) {
						soundManager.playSpatial("robot-death", 20);
						this.dead = true;
						if (this.mesh) this.mesh.animate = false;
						this.setAngularFactor({ x: 1, y: 1, z: 1 });
						this.mass = 2000;
						if (this.mesh) this.mesh.material = dead_material;
						else this.material = dead_material;
					} else {
						// Hit effect
						// TODO: Can't do this because the material is shared
						//var mats = this.mesh.geometry.materials, m;
						//for (m = 0; m < mats.length; ++m) {
						//	mats[m].color.r += 0.05;
						//	mats[m].ambient.r += 0.05;
						//}
					}
				}
			});

			// Finalize
			scene.add(obj);
			if (def.character && def.collision) obj.setAngularFactor({ x: 0, y: 0, z: 0 });
			if (def.character) obj.speed = def.character.speed;
			if (def.door) {
				obj.setAngularFactor({ x: 0, y: 1, z: 0 });
				// Hinge
				var hingepos = obj.position.clone();
				var hingedist = 0.5 * (geometry.boundingBox.max.x - geometry.boundingBox.min.x) - 0.1
				hingepos.x -= Math.cos(obj.rotation.y) * hingedist;
				hingepos.z += Math.sin(obj.rotation.y) * hingedist;
				var constraint = new Physijs.HingeConstraint(
					obj,
					hingepos,
					new THREE.Vector3(0, 1, 0) // Hinge axisAxis along which the hinge lies - in this case it is the X axis
				);
				scene.addConstraint(constraint);
				constraint.setLimits(
					-Math.PI / 2 * 0.95 + obj.rotation.y, // minimum angle of motion, in radians
					Math.PI / 2 * 0.95 + obj.rotation.y, // maximum angle of motion, in radians
					0.3, // bias_factor, applied as a factor to constraint error
					0.01 // relaxation_factor, controls bounce at limit (0.0 == no bounce)
				);
			}
		};
	}

	this.generateMesh = function(level) {
		var sqrt2 = Math.sqrt(2);
		var block_mat = cache.getMaterial(level.materials.wall);
		var block_params = assets.materials[level.materials.wall] || {};

		// Level geometry
		var geometry = new THREE.Geometry(), mesh;
		var cell, px, nx, pz, nz, py, ny, tess, cube, hash, rot, repeat;
		for (var j = 0; j < level.depth; ++j) {
			for (var i = 0; i < level.width; ++i) {
				px = nx = pz = nz = py = ny = 0;
				cell = level.map.get(i, j, OPEN);
				if (cell === OPEN) continue;
				if (cell === WALL || cell === DIAG) {
					px = level.map.get(i + 1, j) == OPEN ? 1 : 0;
					nx = level.map.get(i - 1, j) == OPEN ? 2 : 0;
					pz = level.map.get(i, j + 1) == OPEN ? 4 : 0;
					nz = level.map.get(i, j - 1) == OPEN ? 8 : 0;
					// If wall completely surrounded by walls, skip
					hash = px + nx + pz + nz;
					if (hash === 0) continue;
					tess = block_params.roughness ? 10 : 0;
					repeat = block_params.repeat || 1;
					rot = 0;
					if (cell === DIAG && (hash == 5 || hash == 6 || hash == 9 || hash == 10)) {
						cube = new PlaneGeometry(level.gridSize * sqrt2, level.roomHeight, tess, tess,
							"px", level.gridSize * sqrt2 / 2 * repeat, level.roomHeight / 2 * repeat, block_params.roughness);
						if (hash == 5) rot = -45 / 180 * Math.PI;
						else if (hash == 6) rot = -135 / 180 * Math.PI;
						else if (hash == 9) rot = 45 / 180 * Math.PI;
						else if (hash == 10) rot = 135 / 180 * Math.PI;
						cube.materials = [ block_mat ];
					} else {
						cube = new BlockGeometry(level.gridSize, level.roomHeight, level.gridSize,
							tess, tess, tess, block_mat,
							{ px: px, nx: nx, py: 0, ny: 0, pz: pz, nz: nz },
							level.gridSize/2 * repeat, level.roomHeight/2 * repeat, block_params.roughness);
					}
					mesh = new THREE.Mesh(cube);
					mesh.position.x = (i + 0.5) * level.gridSize;
					mesh.position.y = 0.5 * level.roomHeight;
					mesh.position.z = (j + 0.5) * level.gridSize;
					mesh.rotation.y = rot;
					THREE.GeometryUtils.merge(geometry, mesh);

					// Collision body
					if (cell === DIAG) {
						cube = new THREE.CubeGeometry(0.01, level.roomHeight, level.gridSize * sqrt2);
					} else {
						// Bounding box needs tweaking if there is only one side in the block
						cube.computeBoundingBox();
						if (Math.abs(cube.boundingBox.max.x - cube.boundingBox.min.x) <= 0.5) {
							cube.boundingBox.min.x = -0.5 * level.gridSize;
							cube.boundingBox.max.x = 0.5 * level.gridSize;
						}
						if (Math.abs(cube.boundingBox.max.z - cube.boundingBox.min.z) <= 0.5) {
							cube.boundingBox.min.z = -0.5 * level.gridSize;
							cube.boundingBox.max.z = 0.5 * level.gridSize;
						}
					}
					var wallbody = new Physijs.BoxMesh(cube, dummy_material, 0);
					wallbody.position.copy(mesh.position);
					wallbody.visible = false;
					scene.add(wallbody);
					if (cell === DIAG) {
						wallbody.rotation.y = rot;
						wallbody.__dirtyRotation = true;
					}
				}
			}
		}

		// Ceiling
		repeat = assets.materials[level.materials.ceiling] ? assets.materials[level.materials.ceiling].repeat || 1 : 1;
		var ceiling_plane = new Physijs.PlaneMesh(
			new PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "ny", level.width * repeat, level.depth * repeat),
			Physijs.createMaterial(cache.getMaterial(level.materials.ceiling), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		ceiling_plane.position.set(level.gridSize * level.width * 0.5, level.roomHeight, level.gridSize * level.depth * 0.5);
		ceiling_plane.matrixAutoUpdate = false;
		ceiling_plane.updateMatrix();
		scene.add(ceiling_plane);

		// Floor
		repeat = assets.materials[level.materials.floor] ? assets.materials[level.materials.floor].repeat || 1 : 1;
		var floor_plane = new Physijs.PlaneMesh(
			new PlaneGeometry(level.gridSize * level.width, level.gridSize * level.depth,
				1, 1, "py", level.width * repeat, level.depth * repeat),
			Physijs.createMaterial(cache.getMaterial(level.materials.floor), 0.9, 0.0), // friction, restitution
			0 // mass
		);
		floor_plane.position.set(level.gridSize * level.width * 0.5, 0.0, level.gridSize * level.depth * 0.5);
		floor_plane.receiveShadow = true;
		floor_plane.matrixAutoUpdate = false;
		floor_plane.updateMatrix();
		scene.add(floor_plane);

		// Level mesh
		geometry.computeTangents();
		mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
		mesh.receiveShadow = true;
		mesh.matrixAutoUpdate = false;
		mesh.updateMatrix();
		scene.add(mesh);

		// Exit
		//cache.loadModel("assets/models/teleporter/teleporter.js",
		//	objectHandler(level, new THREE.Vector3().set(level.exit[0], null, level.exit[1]), 0, assets.objects.teleporter));
		//if (CONFIG.particles)
		//	this.exitParticles = createTeleporterParticles(
		//		new THREE.Vector3(level.exit[0] * level.gridSize, 0.5, level.exit[1] * level.gridSize));
	};

	this.addLights = function(level) {
		// Torch model load callback
		function torchHandler(pos, rot) {
			return function(geometry) {
				for (var m = 0; m < geometry.materials.length; ++m)
					fixAnisotropy(geometry.materials[m]);
				var mat = geometry.materials.length > 1 ? new THREE.MeshFaceMaterial() : geometry.materials[0];
				var obj = new Physijs.CylinderMesh(geometry, mat, 0);
				obj.position.copy(pos);
				obj.rotation.y = rot;
				//obj.castShadow = true;
				//obj.receiveShadow = true;
				obj.matrixAutoUpdate = false;
				obj.updateMatrix();
				scene.add(obj);
			};
		}

		// Ambient
		scene.add(new THREE.AmbientLight(0x444444));

		// Point lights
		var vec = new THREE.Vector2();
		var target = new THREE.Vector3();
		for (var i = 0; i < level.lights.length; ++i) {
			if (level.lights[i].position.y === undefined)
				level.lights[i].position.y = 2;
			// Actual light
			var light = new THREE.PointLight(0xffffaa, 1, 2 * level.gridSize);
			light.position.copy(level.lights[i].position);
			var name = "ceiling-lamp";

			// Snap to wall
			// Create wall candidates for checking which wall is closest to the light
			/*vec.set(level.lights[i].position.x|0, level.lights[i].position.z|0);
			var candidates = [
				{ x: vec.x + 0.5, y: vec.y, a: Math.PI },
				{ x: vec.x + 1.0, y: vec.y + 0.5, a: Math.PI/2 },
				{ x: vec.x + 0.5, y: vec.y + 1.0, a: 0 },
				{ x: vec.x, y: vec.y + 0.5, a: -Math.PI/2 }
			];
			vec.set(level.lights[i].position.x, level.lights[i].position.z);
			// Find the closest
			var snapped = { d: 1000 };
			for (var j = 0; j < candidates.length; ++j) {
				candidates[j].d = vec.distanceToSquared(candidates[j]);
				if (candidates[j].d < snapped.d) snapped = candidates[j];
			}
			// Position the light to the wall
			light.position.x = snapped.x;
			light.position.z = snapped.y;
			// Get wall normal vector
			vec.set((level.lights[i].position.x|0) + 0.5, (level.lights[i].position.z|0) + 0.5);
			vec.subSelf(snapped).multiplyScalar(2);
			// Check if there actually is a wall
			if (level.map.get((light.position.x - vec.x * 0.5)|0, (light.position.z - vec.y * 0.5)|0) == WALL) {
				// Switch to wall light
				//name = "wall-lamp";
				// Move out of the wall
				light.position.x += vec.x * 0.08;
				light.position.z += vec.y * 0.08;
				target.set(light.position.x + vec.x , light.position.y - 1, light.position.z + vec.y);
			} else*/ {
				// Center the ceiling hanging light to grid cell
				light.position.x = (level.lights[i].position.x|0) + 0.5;
				light.position.y = level.roomHeight;
				light.position.z = (level.lights[i].position.z|0) + 0.5;
				target.copy(light.position);
				target.y -= 1;
			}

			light.position.x *= level.gridSize;
			light.position.z *= level.gridSize;
			target.x *= level.gridSize;
			target.z *= level.gridSize;
			var modelPos = new THREE.Vector3().copy(light.position);
			if (assets.lights[name].offset) light.position.addSelf(assets.lights[name].offset);
			light.matrixAutoUpdate = false;
			light.updateMatrix();
			scene.add(light);
			lightManager.addLight(light);

			// Shadow casting light
			var light2 = new THREE.SpotLight(0xffffaa, light.intensity, light.distance);
			light2.position.copy(light.position);
			light2.position.y = level.roomHeight;
			light2.target.position.copy(target);
			light2.angle = Math.PI / 2;
			light2.castShadow = true;
			light2.onlyShadow = true;
			light2.shadowCameraNear = 0.1;
			light2.shadowCameraFar = light.distance * 1.5;
			light2.shadowCameraFov = 100;
			light2.shadowBias = -0.0002;
			light2.shadowDarkness = 0.3;
			light2.shadowMapWidth = 512;
			light2.shadowMapHeight = 512;
			light2.shadowCameraVisible = false;
			light2.matrixAutoUpdate = false;
			light2.updateMatrix();
			scene.add(light2);
			lightManager.addShadow(light2);

			// Mesh
			cache.loadModel("assets/models/" + name + "/" + name + ".js", torchHandler(modelPos, 0/*snapped.a*/));

			// Flame
			//if (CONFIG.particles)
			//	light.emitter = createTexturedFire(light);
		}

		// Player's torch
		player.light = new THREE.PointLight(0xccccaa, 1, level.gridSize * 3);
		player.light.visible = false;
		//scene.add(player.light);
		player.shadow = new THREE.SpotLight(player.light.color.getHex(), player.light.intensity, player.light.distance);
		player.shadow.angle = Math.PI / 8;
		//player.shadow.onlyShadow = true;
		player.shadow.castShadow = true;
		player.shadow.shadowCameraNear = 0.1;
		player.shadow.shadowCameraFar = 10;
		player.shadow.shadowCameraFov = 90;
		player.shadow.shadowBias = -0.0002;
		player.shadow.shadowDarkness = 0.3;
		player.shadow.shadowMapWidth = 1024;
		player.shadow.shadowMapHeight = 1024;
		player.shadow.shadowCameraVisible = false;
		scene.add(player.shadow);
	};

	this.addObjects = function(level) {
		if (!level.objects) return;
		for (var i = 0; i < level.objects.length; ++i) {
			var name = level.objects[i].name;
			cache.loadModel("assets/models/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.objects[i].position),
					level.objects[i].angle, assets.objects[name]));
		}
	};

	this.addItems = function(level) {
		if (!level.items) return;
		for (var i = 0; i < level.items.length; ++i) {
			var name = level.items[i].name;
			cache.loadModel("assets/items/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.items[i].position),
					level.items[i].angle, assets.items[name]));
		}
	};

	this.addMonsters = function(level) {
		if (!level.monsters) return;
		for (var i = 0; i < level.monsters.length; ++i) {
			var name = level.monsters[i].name;
			cache.loadModel("assets/monsters/" + name + "/" + name + ".js",
				objectHandler(level, new THREE.Vector3().copy(level.monsters[i].position), 0, assets.monsters[name]));
		}
	};

	this.getTriggerAt = function(pos) {
		if (!this.level || !this.level.triggers) return false;
		var triggers = this.level.triggers;
		for (var i = 0; i < triggers.length; ++i) {
			if (Math.abs(pos.x - triggers[i].position.x * this.level.gridSize) <= 1 &&
				Math.abs(pos.z - triggers[i].position.z * this.level.gridSize) <= 1)
					return triggers[i];
		}
	};

	this.isAtExit = function(pos) {
		return this.level &&
			Math.abs(pos.x - this.level.exit[0] * this.level.gridSize) < 0.5 &&
			Math.abs(pos.z - this.level.exit[1] * this.level.gridSize) < 0.5;
	};

	function processLevel(level) {
		if (typeof(level) == "string")
			level = JSON.parse(level);
		if (level.map instanceof Array)
			level.map = new Map(level.width, level.depth, level.map);

		player.geometry.computeBoundingBox();
		player.position.x = level.start[0] * level.gridSize;
		player.position.y = 0.5 * (player.geometry.boundingBox.max.y - player.geometry.boundingBox.min.y) + 0.001;
		player.position.z = level.start[1] * level.gridSize;
		if (level.startAngle)
			controls.setYAngle(level.startAngle);
		scene.add(pl);
		pl.setAngularFactor({ x: 0, y: 0, z: 0 });

		// Player gun
		cache.loadModel("assets/items/gun/gun.js", function(geometry) {
			player.rhand = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial());
			player.rhand.position.copy(player.position);
			scene.add(player.rhand);
		});

		// Bullets
		cache.loadModel("assets/items/fork/fork.js", function(geometry) {
			self.forks = [];
			self.forkIndex = 0;
			for (var i = 0; i < 20; ++i) {
				var fork = new Physijs.BoxMesh(geometry, geometry.materials[0], 100);
				fork.damage = 5;
				self.forks.push(fork);
				fork.visible = false;
				scene.add(fork);
			}
		});

		self.generateMesh(level);
		self.addLights(level);
		self.addObjects(level);
		self.addItems(level);
		self.addMonsters(level);
		lightManager.update(pl);
		self.level = level;
		self.grid = new PF.Grid(level.width, level.depth, level.map.getWalkableMatrix());
		self.pathFinder = new PF.AStarFinder({
			allowDiagonal: true,
			dontCrossCorners: true,
			heurestic: PF.Heuristic.euclidean
		});
		self.loaded = true;
		if (level.title) displayMessage(level.title);
	}

	levelName = levelName || hashParams.level || "01-intro";
	if (levelName == "rand") {
		var gen = new MapGen();
		processLevel(gen.generate());
	} else if (levelName.length > 24) {
		var json = window.atob(levelName);
		processLevel(JSON.parse(json));
	} else {
		$.get("assets/levels/" + levelName + ".json", processLevel);
	}

	this.serialize = function() {
		return JSON.stringify(this.level);
	}

}
"use strict";
var renderStats, physicsStats, rendererInfo;

function initUI() {
	var container = document.getElementById('container');
	container.appendChild(renderer.domElement);

	renderStats = new Stats();
	renderStats.domElement.style.position = 'absolute';
	renderStats.domElement.style.bottom = '0px';
	container.appendChild(renderStats.domElement);

	physicsStats = new Stats();
	physicsStats.domElement.style.position = 'absolute';
	physicsStats.domElement.style.bottom = '0px';
	physicsStats.domElement.style.left = '85px';
	container.appendChild(physicsStats.domElement);

	rendererInfo = document.getElementById("renderer-info");

	container.requestPointerLock = container.requestPointerLock ||
			container.mozRequestPointerLock || container.webkitRequestPointerLock;

	container.requestFullscreen = container.requestFullscreen ||
		container.mozRequestFullscreen || container.mozRequestFullScreen || container.webkitRequestFullscreen;

	$(window).resize(onWindowResize);
	$(window).blur(pause);
	$(window).focus(resume);
	$("#instructions").click(function() {
		// Firefox doesn't support fullscreenless pointer lock, so resort to this hack
		if (CONFIG.fullscreen || /Firefox/i.test(navigator.userAgent)) {
			var onFullscreenChange = function(event) {
				if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullscreenElement || document.mozFullScreenElement) {
					document.removeEventListener('fullscreenchange', onFullscreenChange);
					document.removeEventListener('mozfullscreenchange', onFullscreenChange);
					document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
					container.requestPointerLock();
				}
			};
			document.addEventListener('fullscreenchange', onFullscreenChange, false);
			document.addEventListener('mozfullscreenchange', onFullscreenChange, false);
			document.addEventListener('webkitfullscreenchange', onFullscreenChange, false);
			container.requestFullscreen();
		} else {
			container.requestPointerLock();
		}
	});

	document.addEventListener('pointerlockchange', onPointerLockChange, false);
	document.addEventListener('webkitpointerlockchange', onPointerLockChange, false);
	document.addEventListener('mozpointerlockchange', onPointerLockChange, false);
	$("#instructions").show();

	// GUI controls
	var gui = new dat.GUI();
	gui.add(CONFIG, "fullscreen").onChange(updateConfig);
	gui.add(CONFIG, "quarterMode").onChange(function() { updateConfig(); onWindowResize(); });
	gui.add(CONFIG, "showStats").onChange(updateConfig);
	gui.add(CONFIG, "sounds").onChange(updateConfig);
	gui.add(controls, "mouseFallback");
	gui.add(window, "editLevel");
	var guiRenderer = gui.addFolder("Renderer options (reload required)");
	guiRenderer.add(CONFIG, "antialias").onChange(updateConfig);
	guiRenderer.add(CONFIG, "physicalShading").onChange(updateConfig);
	guiRenderer.add(CONFIG, "normalMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "specularMapping").onChange(updateConfig);
	guiRenderer.add(CONFIG, "particles").onChange(updateConfig);
	guiRenderer.add(window, "reload");
	var guiLighting = gui.addFolder("Light and shadow");
	guiLighting.add(CONFIG, "maxLights", 0, 6).step(1).onChange(updateConfig);
	guiLighting.add(CONFIG, "maxShadows", 0, 6).step(1).onChange(updateConfig);
	guiLighting.add(CONFIG, "shadows").onChange(updateMaterials);
	guiLighting.add(CONFIG, "softShadows").onChange(updateMaterials);
	var guiTextures = gui.addFolder("Texture options");
	guiTextures.add(CONFIG, "anisotropy", 1, renderer.getMaxAnisotropy()).step(1).onChange(updateTextures);
	guiTextures.add(CONFIG, "linearTextureFilter").onChange(updateTextures);
	var guiPostproc = gui.addFolder("Post-processing");
	guiPostproc.add(CONFIG, "postprocessing").onChange(updateConfig);
	guiPostproc.add(CONFIG, "SSAO").onChange(updateConfig);
	guiPostproc.add(CONFIG, "FXAA").onChange(updateConfig);
	guiPostproc.add(CONFIG, "bloom").onChange(updateConfig);
	gui.close();
}

function updateHUD() {
	$("#health").html(pl.hp);
	$("#bullets").html(pl.bullets);
	$("#clips").html(pl.clips);
}

var messageTimer = null;
function displayMessage(msg) {
	var elem = $("#message");
	if (messageTimer)
		window.clearTimeout(messageTimer);
	if (elem.is(':visible')) elem.stop(true, true).hide();
	elem.html(msg).fadeIn(2000);
	messageTimer = window.setTimeout(function() {
		elem.fadeOut(5000);
		messageTimer = null;
	}, 3000);
}

function displayMinorMessage(msg) {
	var elem = $("#minor-messages");
	if (!elem.is(':visible')) elem.html("");
	elem.stop(true, true);
	elem.prepend(msg + "<br/>").show().fadeOut(5000);
}

function editLevel() {
	var url = "editor/index.html#level=" + window.btoa(dungeon.serialize());
	window.open(url, "_blank");
}

function onWindowResize() {
	var scale = CONFIG.quarterMode ? 0.5 : 1;
	pl.camera.aspect = window.innerWidth / window.innerHeight;
	pl.camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth * scale, window.innerHeight * scale);
	colorTarget = new THREE.WebGLRenderTarget(window.innerWidth * scale, window.innerHeight * scale, renderTargetParametersRGB);
	composer.reset(colorTarget);
	depthTarget = new THREE.WebGLRenderTarget(window.innerWidth * scale, window.innerHeight * scale, renderTargetParametersRGBA);
	depthPassPlugin.renderTarget = depthTarget;
	passes.ssao.uniforms.tDepth.value = depthTarget;
	passes.ssao.uniforms.size.value.set(window.innerWidth * scale, window.innerHeight * scale);
	passes.fxaa.uniforms.resolution.value.set(scale/window.innerWidth, scale/window.innerHeight);
	controls.handleResize();
}

function onPointerLockChange() {
	if (document.pointerLockElement || document.mozPointerLockElement || document.webkitPointerLockElement) {
		controls.pointerLockEnabled = true;
		$("#instructions").hide();
	} else {
		controls.pointerLockEnabled = false;
		if (!pl.dead) $("#instructions").show();
	}
}

function pause() {
	controls.active = false;
}

function resume() {
	controls.active = true;
}

function reload() {
	updateConfig();
	window.location.reload();
}
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
				if (pl[i] !== undefined)
					pl[i] += other.items[i];
			}
			soundManager.play("pick-up");
			displayMinorMessage("Picked up " + other.itemName);
			updateHUD();
			other.items = undefined;
			other.visible = false;
			other.parent.remove(other);
		}
		if (other.damage) {
			if (vel.lengthSq() < 5) return;
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
function shoot(pos, rot, off, flip) {
	soundManager.playSpatial("shoot", pos, 20);
	var fork = dungeon.forks[dungeon.forkIndex];
	dungeon.forkIndex = (dungeon.forkIndex + 1) % dungeon.forks.length;
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
		shoot(pl.position, pl.camera.rotation, { x: 0.2, y: 0.4, z: -1.2 });
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

	// Player weapon
	if (pl.rhand) {
		pl.rhand.position.set(pl.position.x, pl.position.y, pl.position.z);
		pl.rhand.rotation.copy(pl.camera.rotation);
		//pl.rhand.updateMatrix();
		pl.rhand.translateX(0.4);
		pl.rhand.translateY(0.2);
		pl.rhand.translateZ(-1.0);
	}

	// Trigger?
	var trigger = dungeon.getTriggerAt(pl.position);
	if (trigger) {
		if (trigger.type == "message") displayMessage(trigger.message);
	}

	// Exit?
	if (dungeon.isAtExit(pl.position))
		resetLevel(dungeon.level.next);
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

		if (!pl.dead && pl.hp <= 0) {
			// Oh noes, death!
			pl.dead = true;
			controls.active = false;
			if (!$("#deathscreen").is(':visible'))
				$("#deathscreen").fadeIn(500);
			$("#instructions").hide();
		}

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

		aiManager.process(dt);
		animate(dt);
		lightManager.update(pl);
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
	render();
});
