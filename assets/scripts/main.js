import {
	AmbientLight,
	BoxGeometry,
	Clock,
	LoadingManager,
	Mesh,
	MeshBasicMaterial,
	MeshLambertMaterial,
	PerspectiveCamera,
	Raycaster,
	Scene,
	SpotLight,
	TextureLoader,
	Vector2,
	Vector3,
	WebGLRenderer,
} from 'three'; // eslint-disable-line import/no-unresolved
// eslint-disable-next-line import/no-unresolved
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import LockedControls from './LockedControls.js';
import { isTicketCurrentlyDisplayed, isTicketCurrentlyFlipped, toggleTicketOn } from './ticket.js';
import { tellPageLoaded } from './splash.js';
import { createFortuneOnTicket } from './fortunes.js';

const options = {
	shake: {
		intensity: new Vector3(0.03, 0.03, 0.03),
	},
	flicker: {
		startProbability: 0.005,
		onInterval: 0.1,
		timingFunc: () => (Math.floor(Math.random() * 0.07) + 0.07),
		countFunc: () => (Math.floor(Math.random() * 2) + 2),
	},
	cameraSlide: {
		speed: 0.05,
	},
	currentShakeDuration: 0,
	currentFlickerCount: 0,
	slideCameraTowardDefault: false,
};

// Load 3D scene and necesary objects
const scene = new Scene();
const clock = new Clock();
const manager = new LoadingManager();
const raycaster = new Raycaster();
const pointer = new Vector2();
const textureLoader = new TextureLoader();

// Load camera perspective
const camera = new PerspectiveCamera(25, window.innerWidth / window.innerHeight, 1, 2000);
const defaultCameraPos = new Vector3(-4.2, 1.7, -3.5);
camera.position.copy(defaultCameraPos);
camera.lookAt(48.3, -16.1, 79.7);

// Load renderer
const renderer = new WebGLRenderer({ alpha: false });
renderer.setClearColor(0x000000);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load custom controls
const controls = new LockedControls(camera, renderer.domElement);
controls.constrainVertical = true;
controls.verticalMin = 1.67;
controls.verticalMax = 1.87;
controls.lookSpeed = 0.035;
controls.minLon = 29;
controls.maxLon = 37;
controls.enabled = false;

// glTf 2.0 Loader
const loader = new GLTFLoader(manager);
loader.load('assets/models/fixedangle.glb', (gltf) => {
	const object = gltf.scene;
	object.scale.set(2, 2, 2);
	object.position.x = 0;
	object.position.y = -2;
	object.position.z = 0;
	scene.add(object);
});

// Ticket dispenser hitbox
const hitboxGeo = new BoxGeometry(0.2, 0.11, 0.005);
const hitboxMat = new MeshBasicMaterial({ color: 0xff0000 });
hitboxMat.opacity = 0; // set to positive value to display hitbox
hitboxMat.transparent = true;
const hitbox = new Mesh(hitboxGeo, hitboxMat);
hitbox.position.set(-2.005, -0.02, -0.75);
hitbox.rotateY(0.5);
scene.add(hitbox);

// Ticket
const paperTexture = textureLoader.load('./assets/images/background-card-map.png');

const ticketGeo = new BoxGeometry(0.1, 0.005, 0.5);
const ticketMat = new MeshLambertMaterial({ color: 0xE0C9A6 });
ticketMat.map = paperTexture;
ticketMat.roughness = 1;
const ticket = new Mesh(ticketGeo, ticketMat);
ticket.position.set(-1.945, -0.051, -0.65);
ticket.rotateY(0.57);

let ticketSpawned = false;
window.addEventListener('keydown', (event) => {
	if (event.key === ' ' && !isTicketCurrentlyDisplayed() && controls.enabled && !ticketSpawned) {
		ticketSpawned = true;
		options.currentShakeDuration = 1;
		setTimeout(() => {
			scene.add(ticket);
		}, 1000);
	}
});

// Light creation
const spotLight = new SpotLight(0xfff5b6, 3);
const ambient = new AmbientLight(0xffffff, 0.03);

// Light placement
spotLight.position.set(-8.4, 3.4, -7);
spotLight.target.position.set(-2.5, 1, -0.3);
spotLight.angle = Math.PI / 20;
spotLight.penumbra = 1;
spotLight.distance = 30;
spotLight.castShadow = true;
scene.add(spotLight.target);
scene.add(spotLight);
scene.add(ambient);

function addCardToScene() {
	createFortuneOnTicket();
	toggleTicketOn();
	scene.remove(ticket);
	ticketSpawned = false;
	controls.enabled = false;
}

// Test if hitbox is clicked on
function shootRay(event) {
	pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
	pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

	raycaster.setFromCamera(pointer, camera);
	const intersects = raycaster.intersectObjects([hitbox, ticket]);
	if (intersects.length > 0 && ticketSpawned) {
		addCardToScene();
	}
}

// When loaded, tell splash
manager.onLoad = () => { tellPageLoaded(controls); };

// Working variables
let curFlickerOn = false;
let flickerTime = 0;
let curFlickerOffInterval = options.flicker.timingFunc();
const shakeDeltaVec = new Vector3();

function animate() {
	const delta = clock.getDelta();

	if (options.currentShakeDuration > 0) {
		shakeDeltaVec.random().subScalar(0.5).multiply(options.shake.intensity);
		camera.position.add(shakeDeltaVec);
		options.currentShakeDuration -= delta;
		if (options.currentShakeDuration <= 0) {
			options.slideCameraTowardDefault = true;
		}
	}

	flickerTime += delta;
	if (options.currentFlickerCount === 0 && Math.random() < options.flicker.startProbability) {
		options.currentFlickerCount = options.flicker.countFunc();
	}
	if (options.currentFlickerCount > 0) {
		if (curFlickerOn && flickerTime >= options.flicker.onInterval) {
			scene.remove(ambient);
			curFlickerOn = false;
			flickerTime = 0;
		} else if (!curFlickerOn && flickerTime >= curFlickerOffInterval) {
			scene.add(ambient);
			curFlickerOn = true;
			options.currentFlickerCount -= 1;
			flickerTime = 0;
			curFlickerOffInterval = options.flicker.timingFunc();
		}
	}

	if (options.slideCameraTowardDefault) {
		if (camera.position.equals(defaultCameraPos)) {
			options.slideCameraTowardDefault = false;
		}
		const adjustment = defaultCameraPos.clone().sub(camera.position)
			.multiplyScalar(options.cameraSlide.speed);
		camera.position.add(adjustment);
	}

	renderer.render(scene, camera);
	requestAnimationFrame(animate);
	controls.update(0.01);
}

function init() {
	const buttonRemove = document.querySelector('#close-ticket');
	buttonRemove.addEventListener('click', () => { controls.enabled = true; });
	window.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && isTicketCurrentlyFlipped()) {
			controls.enabled = true;
		}
	});

	animate();
	window.addEventListener('click', shootRay);
}
document.addEventListener('DOMContentLoaded', init);
