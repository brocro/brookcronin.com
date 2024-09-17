import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SDFGeometryGenerator } from 'three/examples/jsm/geometries/SDFGeometryGenerator.js';


let renderer: THREE.WebGLRenderer;
let meshFromSDF: THREE.Mesh | null;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let clock: THREE.Clock;
let controls: OrbitControls;
let container: HTMLElement | null;
let audioListener: THREE.AudioListener;
let sound: THREE.Audio;
// let audioAnalyser: THREE.AudioAnalyser;

interface Settings {
  res: number;
  bounds: number;
  autoRotate: boolean;
  wireframe: boolean;
  material: 'depth' | 'normal';
  vertexCount: string;
}

const settings: Settings = {
  res: 3,
  bounds: 1,
  autoRotate: true,
  wireframe: true,
  material: 'depth',
  vertexCount: '0'
};

export function initThreeScene() {
  container = document.getElementById('three-container');
  if (!container) {
    console.error('Container element not found');
    return;
  }


  // Example SDF from https://www.shadertoy.com/view/MdXSWn -->

  const shader = /* glsl */`
float juliaSetDistance(vec3 p) {
    vec4 z = vec4(p, 0.0);
    vec4 c = vec4(0.355, 0.355, 0.355, 0.0);
    for (int i = 0; i < 16; i++) {
        z = vec4(z.x*z.x - z.y*z.y - z.z*z.z - z.w*z.w,
                 2.0*z.x*z.y,
                 2.0*z.x*z.z,
                 2.0*z.x*z.w) + c;
        if (dot(z, z) > 4.0) break;
    }
    return 0.5 * log(dot(z, z)) * length(z) / length(vec3(z));
}

float dist(vec3 p) {
    return juliaSetDistance(p);
}

`;

  init();

  function init(): void {

    const w = window.innerWidth;
    const h = window.innerHeight;

    camera = new THREE.OrthographicCamera(w / -2, w / 2, h / 2, h / -2, 0.01, 1600);
    camera.position.z = 1100;

    scene = new THREE.Scene();

    clock = new THREE.Clock();

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    if (container) {
      renderer.setSize(container.clientWidth, container.clientHeight);
    } else {
      console.error('Container element not found');
    }
    renderer.setAnimationLoop(animate);
    // Append canvas to the correct container
    if (container) {
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
    } else {
      console.error('Container element not found');
    }

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    window.addEventListener('resize', onWindowResize);
    onWindowResize();

    scene.background = new THREE.Color(0x202020);  // Dark background instead of white
    // Initialize the audio
    initAudio();
    // compile
    compile();
  }

  function initAudio(): void {
    // Add audio listener to the camera
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    // Create global audio source
    sound = new THREE.Audio(audioListener);

    // Load sound
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('./audio/tech.wav', (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.5);
    });

    // Create an audio analyser
    // audioAnalyser = new THREE.AudioAnalyser(sound, 32);

    // Add button functionality to toggle sound on and off
    const threeSceneButton = document.getElementById('three-scene-button') as HTMLButtonElement;
    threeSceneButton.addEventListener('click', () => {
      if (sound.isPlaying) {
        sound.pause();
      } else {
        sound.play();
      }
    });
  }

  function compile(): void {
    const generator = new SDFGeometryGenerator(renderer);
    const geometry = generator.generate(Math.pow(2, settings.res + 2), shader, settings.bounds);
    geometry.computeVertexNormals();

    if (meshFromSDF) { // updates mesh
      meshFromSDF.geometry.dispose();
      meshFromSDF.geometry = geometry;
    } else { // inits meshFromSDF : THREE.Mesh
      meshFromSDF = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
      scene.add(meshFromSDF);

      const scale = container ? Math.min(container.clientWidth, container.clientHeight) / 2 * 0.66 : 0;
      meshFromSDF.scale.set(scale, scale, scale);

      setMaterial();
    }

    settings.vertexCount = geometry.attributes.position.count.toString();

    // Get bounding box of the mesh to adjust camera position
    const boundingBox = new THREE.Box3().setFromObject(meshFromSDF);
    const boundingSize = boundingBox.getSize(new THREE.Vector3());
    const boundingCenter = boundingBox.getCenter(new THREE.Vector3());

    // Set the camera position relative to the bounding box
    const distance = boundingSize.length(); // Calculate the distance based on size
    camera.position.set(boundingCenter.x, boundingCenter.y, boundingCenter.z + distance * 1); // Adjust z-distance to 1.5x size

    camera.lookAt(boundingCenter); // Ensure the camera is looking at the center of the mesh

    // Set the zoom level based on object size (closer view)
    camera.zoom = 12; // Adjust this value to zoom in more (higher means closer zoom)
    camera.updateProjectionMatrix(); // Update projection after changing zoom
  }

  function setMaterial(): void {
    if (!meshFromSDF) return;

    (meshFromSDF.material as THREE.Material).dispose();

    if (settings.material === 'depth') {
      meshFromSDF.material = new THREE.MeshDepthMaterial();
    } else if (settings.material === 'normal') {
      meshFromSDF.material = new THREE.MeshNormalMaterial();
    }

    (meshFromSDF.material as THREE.MeshBasicMaterial).wireframe = settings.wireframe;
  }

  function onWindowResize(): void {
    if (!container) {
      console.error('Container element not found');
      return;
    }

    const w = container.clientWidth;
    const h = container.clientHeight;

    renderer.setSize(w, h);

    camera.left = w / -2;
    camera.right = w / 2;
    camera.top = h / 2;
    camera.bottom = h / -2;

    camera.updateProjectionMatrix();
  }

  function render(): void {
    renderer.render(scene, camera);
    setTimeout(() => {
      renderer.setAnimationLoop(animate);
    }, 50);  // Small delay to ensure all assets have loaded
  }

  function animate(): void {

    controls.update();

    if (settings.autoRotate && meshFromSDF) {
      meshFromSDF.rotation.y += Math.PI * 0.005 * clock.getDelta();

      //if (audioAnalyser) {
        // Get the frequency data
        //const frequencyData = audioAnalyser.getFrequencyData();
        // Get the average frequency
        // const averageFrequency = audioAnalyser.getAverageFrequency();

        // Log the frequency data and average frequency to the console
        // console.log('Frequency Data:', frequencyData);
        // console.log('Average Frequency:', averageFrequency);
      // }
    }

    render();
  }
}