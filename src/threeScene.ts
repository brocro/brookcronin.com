import * as THREE from 'three';

let container: HTMLElement | null;
let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;

export function initThreeScene() {
  container = document.getElementById('three-container');
  if (!container) {
    console.error('Container element not found');
    window.addEventListener('load', () => {
        const resizeEvent = new Event('resize');
        window.dispatchEvent(resizeEvent); // Force resize after the page loads
      });
    return;
  }

  // Create a scene
  scene = new THREE.Scene();

  // Create a camera
  camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
  camera.position.z = 5;

  // Create a renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.appendChild(renderer.domElement);

  // Add a simple cube to the scene
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Render the scene
  function animate() {
    requestAnimationFrame(animate);

    // Rotate the cube for some animation
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  // Ensure the renderer and camera adjust when window size changes
  window.addEventListener('resize', () => {
    renderer.setSize(container!.clientWidth, container!.clientHeight);
    camera.aspect = container!.clientWidth / container!.clientHeight;
    camera.updateProjectionMatrix();
  });

  // Initial render to ensure correct sizing
  renderer.setSize(container.clientWidth, container.clientHeight);
  camera.aspect = container.clientWidth / container.clientHeight;
  camera.updateProjectionMatrix();
  renderer.render(scene, camera);

  animate();
}