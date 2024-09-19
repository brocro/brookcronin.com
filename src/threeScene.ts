import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { SDFGeometryGenerator } from 'three/examples/jsm/geometries/SDFGeometryGenerator.js';
import { EffectComposer, RenderPass, EffectPass } from 'postprocessing';
import { ChromaticAberrationEffect } from 'postprocessing';
import { DotScreenEffect } from 'postprocessing';
import { juliaSetShader, mandelbulb, mandelbox, boxHoles } from './shaders.ts';
import { audioFiles } from './audioLinks';


let renderer: THREE.WebGLRenderer;
let meshFromSDF: THREE.Mesh | null;
let scene: THREE.Scene;
let camera: THREE.OrthographicCamera;
let clock: THREE.Clock;
let controls: OrbitControls;
let container: HTMLElement | null;
let audioListener: THREE.AudioListener;
let sound: THREE.Audio;
let audioAnalyser: THREE.AudioAnalyser;
let composer: EffectComposer;
let chromaticAberrationEffect: ChromaticAberrationEffect;
let dotScreenEffect: DotScreenEffect;


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

  // Function to randomly select a shader
  function getRandomShader() {
    const shaders = [juliaSetShader, mandelbulb, mandelbox, boxHoles];
    const randomIndex = Math.floor(Math.random() * shaders.length);
    const shaderName: string[] = ['Julia Set', 'Mandelbulb', 'Mandelbox', 'Box Holes']; // Declare and initialize the shaderName variable
    updateShaderInfo(shaderName[randomIndex]);
    return shaders[randomIndex];
  }

  // Use the randomly selected shader
  const shader = getRandomShader();

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

    initPostProcessing();

    // compile
    compile();
  }

  // Function to randomly select an audio file object
  function getRandomAudioFile() {
    const randomIndex = Math.floor(Math.random() * audioFiles.length);
    const selectedTrack = audioFiles[randomIndex]; // Get the random audio object
    updateTrackInfo(selectedTrack.name); // Update the UI with the track name
    return selectedTrack; // Return the selected track object
  }

  function initAudio(): void {
    // Add audio listener to the camera
    audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    // Create global audio source
    sound = new THREE.Audio(audioListener);

    // Load random track from github repo
    const audioLoader = new THREE.AudioLoader();
    const selectedAudio = getRandomAudioFile();
    audioLoader.load(selectedAudio.url, (buffer) => {
      sound.setBuffer(buffer);
      sound.setLoop(true);
      sound.setVolume(0.8);
    });

    // Create an audio analyser
    audioAnalyser = new THREE.AudioAnalyser(sound, 32);

    // Get the AudioContext directly from THREE
    const audioContext = THREE.AudioContext.getContext();

    // Add event listener for user interaction to start/resume audio
    const threeSceneButton = document.getElementById('three-scene-button') as HTMLButtonElement;
    threeSceneButton.addEventListener('click', () => {
      // Check if the AudioContext is suspended, and resume it if so
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          // Toggle audio playback after resuming the context
          if (sound.isPlaying) {
            sound.pause();
          } else {
            sound.play();
          }
        });
      } else {
        // If the context is not suspended, toggle audio playback
        if (sound.isPlaying) {
          sound.pause();
        } else {
          sound.play();
        }
      }
    });
  }

      //footer bar info functions
    // Functions to update footer info
function updateTrackInfo(trackName: string) {
  const trackInfoElement = document.getElementById('track-info');
  if (trackInfoElement) {
    trackInfoElement.textContent = `Track: ${trackName}`;
  }
}

function updateShaderInfo(shaderName: string) {
  const shaderInfoElement = document.getElementById('shader-info');
  if (shaderInfoElement) {
    shaderInfoElement.textContent = `Shader: ${shaderName}`;
  }
}

function updateEffectInfo(effectName: string) {
  const effectInfoElement = document.getElementById('effect-info');
  if (effectInfoElement) {
    effectInfoElement.textContent = `Effect: ${effectName}`;
  }
}

  function compile(): void {
    const generator = new SDFGeometryGenerator(renderer);
    const geometry = generator.generate(Math.pow(2, settings.res + 2), shader, settings.bounds);
    //geometry.computeVertexNormals();

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
    camera.zoom = 10; // Adjust this value to zoom in more (higher means closer zoom)
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

  // List of available post-processing effects
  function getRandomEffect() {
    const effects = ['chromaticAberration', 'dotScreen']; // Add more effects here as needed
    const randomIndex = Math.floor(Math.random() * effects.length);
    updateEffectInfo(effects[randomIndex]);
    return effects[randomIndex];
  }


  function initPostProcessing() {
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Randomly select a post-processing effect
    const selectedEffect = getRandomEffect();

    if (selectedEffect === 'chromaticAberration') {
      chromaticAberrationEffect = new ChromaticAberrationEffect({
        offset: new THREE.Vector2(0.001, 0.001),  // Set default offset values
        radialModulation: false,
        modulationOffset: 0
      });
      const chromaticAberrationPass = new EffectPass(camera, chromaticAberrationEffect);
      composer.addPass(chromaticAberrationPass);
      const effectPass = new EffectPass(camera, chromaticAberrationEffect);
      composer.addPass(effectPass);
    } else if (selectedEffect === 'dotScreen') {
      // Initialize dot screen effect
      dotScreenEffect = new DotScreenEffect({
        scale: 0  // Set default scale value
      });
      const effectPass = new EffectPass(camera, dotScreenEffect);
      composer.addPass(effectPass);
    }

    console.log('Selected Effect:', selectedEffect);  // Debug log to check which effect was chosen
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
    composer.render();
  }

  function animate(): void {
    controls.update();

    if (settings.autoRotate && meshFromSDF) {
      const deltaTime = clock.getDelta(); // Get the time since the last frame

      // Adjust rotation speed factor (can tweak this value to make it faster or slower)
      const rotationSpeed = Math.PI * 0.005;

      // Apply rotation to all axes
      meshFromSDF.rotation.y += rotationSpeed * deltaTime;
      meshFromSDF.rotation.z += rotationSpeed * deltaTime;
      meshFromSDF.rotation.x += rotationSpeed * deltaTime;

      if (audioAnalyser) {
        // Get the frequency data
        //const frequencyData = audioAnalyser.getFrequencyData();
        // Get the average frequency
        const averageFrequency = audioAnalyser.getAverageFrequency();

        //console.log('Average Frequency:', averageFrequency);
        // Log the frequency data and average frequency to the console
        //console.log('Frequency Data:', frequencyData);


        // Apply frequency data to the currently selected post-processing effect
        if (chromaticAberrationEffect) {
          const offset = THREE.MathUtils.mapLinear(averageFrequency, 0, 256, 0, 0.01);
          chromaticAberrationEffect.offset.set(offset, offset);

        } else if (dotScreenEffect) {
          // You can control dot intensity or scale using audio
          dotScreenEffect.scale = THREE.MathUtils.mapLinear(averageFrequency, 0, 256, 0, 10);
          console.log('DotScreen Scale:', dotScreenEffect.scale);
        }
      }
    }

    render();
  }
}