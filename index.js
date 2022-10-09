'use strict';

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';

console.log("lektion-05c.js");

const FLOORSIZE = 2;
const ANTIALIAS = false;
const PHONG = false;
const SHADOWS = true;

var sunRotation1, sunRotation2;
var camera;
var player;

const KEY_LEFT = 37;
const KEY_UP = 38;
const KEY_RIGHT = 39;
const KEY_DOWN = 40;
const KEY_SPACE = 32;

class KeyHandler {
	keyMap = {};

	constructor() {
		document.addEventListener( "keydown", this.onKeyDown );
		document.addEventListener( "keyup", this.onKeyUp );
	}

	onKeyDown = e => {
		this.keyMap[e.keyCode]=true;
	}

	onKeyUp = e => {
		this.keyMap[e.keyCode]=false;
	}

	isKeyDown(k) {
		if(k in this.keyMap) {
			return this.keyMap[k];
		} else {
			return false;
		}
	}

	isKeyDownOnce(k) {
		var res = this.isKeyDown(k);
		this.keyMap[k]=false;
		return res;
	}
}

const keyHandler = new KeyHandler();

class World {
	constructor(size) {
		this.size = size;
		this.floor = [];
		this.coins = [];
	}

	getFloor(x,z) {
	}

	generate() {
		for(var x=-this.size;x<this.size;x++) {
			this.floor[x]=[];
			this.coins[x]=[];
			for(var z=-this.size;z<this.size;z++) {
				this.floor[x][z]=0;
				this.coins[x][z]=true;
			}
		}
	}
}

class GameObject {
	constructor() {
	}

	update() {
//		console.log("GameObject update");
	}

	collision() {
		console.log("GameObject collision");
	}

	getObject3d() {
		return this.object3d;
	}

	getPos() {
		return this.object3d.position;
	}

	setPos(p) {
		this.object3d.position = p;
	}

	getX() { return this.object3d.position.x; }
	getY() { return this.object3d.position.y; }
	getZ() { return this.object3d.position.z; }

	setX(x) { this.object3d.position.x = x; }
	setY(y) { this.object3d.position.y = y; }
	setZ(z) { this.object3d.position.z = z; }

	addX(dx) { this.object3d.position.x += dx; }
	addY(dy) { this.object3d.position.y += dy; }
	addZ(dz) { this.object3d.position.z += dz; }
}

class Coin extends GameObject {
	constructor(x,y,z) {
		super();

		const geometry = new THREE.CylinderGeometry( 1, 1, .1, 32 );
		const material = new THREE.MeshLambertMaterial( {color: 0xffff00} );
		this.object3d = new THREE.Mesh( geometry, material );

		this.object3d.position.x = 20*x+5;
		this.object3d.position.z = 20*z-5;
		this.object3d.position.y = 1.5*y;
		this.object3d.castShadow = SHADOWS;
		this.object3d.receiveShadow = SHADOWS;
		this.object3d.rotation.x = THREE.MathUtils.degToRad(90);

		this.state = 0;
	}

	update() {
		super.update();
//		console.log("Coin update");
		this.object3d.rotation.z += THREE.MathUtils.degToRad(1);
	}

	collision() {
		super.collision();
//		console.log("Coin collision");
		this.state = 1;
		this.object3d.material.color.setHex( 0xff0000 );
	}
}

class Player extends GameObject {
	constructor() {
		super();

		this.object3d = new THREE.Group();

		this.direction = 0;
		this.speedXZ = 0;
		this.speedY = 0;
	}

	update() {
		super.update();
//		console.log("Player update");
		if(keyHandler.isKeyDown(KEY_LEFT)) {
			this.direction-=.1;
		}
		if(keyHandler.isKeyDown(KEY_RIGHT)) {
			this.direction+=.1;
		}
		if(keyHandler.isKeyDown(KEY_UP)) {
			this.speedXZ=Math.min(this.speedXZ+.1,2);
		}
		if(keyHandler.isKeyDown(KEY_DOWN)) {
			this.speedXZ=Math.max(this.speedXZ-.1,0);
		}
		if(keyHandler.isKeyDownOnce(KEY_SPACE)) {
			if(this.speedY<3) {
				this.speedY+=1;
			}
		}

		// Sakta ner pga friktion
		this.speedXZ=Math.max(this.speedXZ*.9,0);

//		console.log(this.object3d.position);
//		console.log(this.speedXZ);
//		console.log(this.speedY, this.object3d.position.y);

		// Uppdatera position
		this.object3d.position.x+=this.speedXZ*Math.cos(this.direction);
		this.object3d.position.z+=this.speedXZ*Math.sin(this.direction);
		this.object3d.position.y+=this.speedY;

		// Landa på marken
		if(this.object3d.position.y<0) {
			this.object3d.position.y=0;
			this.speedY=0;
		} else {
			this.speedY-=.1;
		}
	}
}

var gameObjects = [];

function getPointLight(intensity, color) {
    var light = new THREE.PointLight(color, intensity);
    light.castShadow = SHADOWS;
    light.shadowMapWidth = 4096;
    light.shadowMapHeight = 4096;

    return light;
}

function getAmbientLight(intensity, color) {
    var light = new THREE.AmbientLight(color, intensity);

    return light;
}

function init() {
    // Skapa en scen
    var scene = new THREE.Scene();

    // Skapa en klocka
    var clock = new THREE.Clock();

    const loader = new THREE.TextureLoader();

	// Skapa skybox
    var skybox = new THREE.CubeTextureLoader().load(['1k_stars.jpg','1k_stars.jpg','1k_stars.jpg','1k_stars.jpg','1k_stars.jpg','1k_stars.jpg']);
    skybox.format = THREE.RGBFormat;
    scene.background = skybox;

    // Bakgrundsljus
    scene.add(getAmbientLight(.5, 0xffffff));

    // Skapa en sol
    var sun = getPointLight(1, 0xffffff);
    var sunGeometry = new THREE.SphereGeometry(1);
    var sunMaterial = new THREE.MeshBasicMaterial({color: 0xffff00});
    var sunMesh = new THREE.Mesh(sunGeometry,sunMaterial);
    sun.add(sunMesh);
    var sunMove = new THREE.Group();
    sunMove.position.y = 1000;
    sunMove.add(sun);
    sunRotation2 = new THREE.Group();
    sunRotation2.add(sunMove);
    sunRotation1 = new THREE.Group();
    sunRotation1.rotation.x+=Math.PI/4;
    sunRotation1.add(sunRotation2);
    scene.add(sunRotation1);

	// Skapa och generera världen
	const world = new World(FLOORSIZE);
	world.generate();

	// Bygg upp världen
    for(var z=-FLOORSIZE;z<FLOORSIZE;z++) {
		for(var x=-FLOORSIZE;x<FLOORSIZE;x++) {
			var y=world.getFloor(z,x);
			// Skapa en gata
			var planeGeometry = new THREE.PlaneGeometry(20,20,1,1);
			var planeMaterial = new THREE.MeshLambertMaterial({color: 0xc0c0c0});
			planeMaterial.map = loader.load("512_street.jpg");
			planeMaterial.side = THREE.DoubleSide;
			var planeMesh = new THREE.Mesh(planeGeometry,planeMaterial);
			planeMesh.rotation.x = -Math.PI/2;
			planeMesh.position.x = 20*x;
			planeMesh.position.z = 20*z;
			planeMesh.receiveShadow = SHADOWS;
			scene.add(planeMesh);

			if(y>0) {
				// Skapa ett hus
				var cubeGeometry = new THREE.BoxBufferGeometry(10,5*y,10);
				var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xcb4154});
				var texture = loader.load("512_wall.jpg");
				texture.wrapS = THREE.RepeatWrapping;
				texture.wrapT = THREE.RepeatWrapping;
				texture.repeat.set(10,3*y);
				cubeMaterial.map = texture;
				var cubeMesh = new THREE.Mesh(cubeGeometry,cubeMaterial);
				cubeMesh.position.x = 20*x+5;
				cubeMesh.position.z = 20*z-5;
				cubeMesh.position.y = 2.5*y;
				cubeMesh.castShadow = SHADOWS;
				cubeMesh.receiveShadow = SHADOWS;
				scene.add(cubeMesh);
			}

			if(world.coins[x][z]) {
				var coin = new Coin(x,y,z);
				scene.add(coin.getObject3d());
				gameObjects.push(coin);
			}
		}
    }

	// Skapa spelaren
	player = new Player();
	gameObjects.push(player);

	// Skapa kamera
    camera = new THREE.PerspectiveCamera(
		60, // FoV
		window.innerWidth/window.innerHeight, // Ratio
		0.01, // Near
		1000 // Far
    );

    camera.position.x = player.object3d.position.x;
    camera.position.y = 2;
    camera.position.z = player.object3d.position.z;
    camera.lookAt(new THREE.Vector3(player.object3d.position.x+Math.cos(player.direction), 2, player.object3d.position.z+Math.sin(player.direction)));

	// Skapa renderare
    var renderer = new THREE.WebGLRenderer({antialias: ANTIALIAS});
    renderer.shadowMap.enabled = SHADOWS;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor('rgb(0, 0, 0)');

	// Koppla renderaren till canvas
    document.getElementById('webgl').appendChild(renderer.domElement);

	// Starta animation
    update(renderer, scene, camera, clock);
}

function update(renderer, scene, camera, clock) {
	// Uppdatera alla objekt
	gameObjects.forEach(e => {if(e) {e.update();}});

    // Get time in seconds (but use it as hours)
    var timeDelta = clock.getDelta();

	// Sätt kameran vid spelaren
	    camera.position.x = player.object3d.position.x;
    camera.position.y = 2+player.object3d.position.y;
    camera.position.z = player.object3d.position.z;
    camera.lookAt(new THREE.Vector3(
	player.object3d.position.x+Math.cos(player.direction),
	player.object3d.position.y+2,
	player.object3d.position.z+Math.sin(player.direction))
	);

	// Flytta solen
    sunRotation1.rotation.x+=.0;
    sunRotation2.rotation.z+=.001;

	// Kollisioner
	gameObjects.forEach(
		e => {
			var pp = player.getPos();
			var ep = e.getPos();

			// Avståndet till objektet
			var dist = Math.sqrt(Math.pow(pp.x-ep.x,2)+Math.pow(pp.z-ep.z,2));
//			console.log(ep,dist,pp.y,ep.y);

			// Om avståndet är nära, anropa collision
			if(dist<2 && Math.abs(pp.y-ep.y)<2) {
				console.log(typeof(e));
				e.collision();
			}
		});

	// Rita scenen
    renderer.render(
	scene,
	camera
    );

	// Vänta på nästa frame
    requestAnimationFrame(function() {
	update(renderer, scene, camera, clock);
    })
}

init();
