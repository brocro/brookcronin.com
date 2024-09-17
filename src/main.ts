import './style.css'
import { initThreeScene } from './threeScene.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="top-menu">
    <button id="three-scene-button">
      <img src="assets/sound.png" alt="Action" />
    </button>
    <h1>BROOK CRONIN - DESIGN, ART & ENGINEERING</h1>
  </div>
  <div id="three-container"></div>
  <div class="footer-bar">
    <p>&copy; ${new Date().getFullYear()} Brook Cronin</p>
    <a id="contact-link" href="#">
      <img src="assets/mailMe.png" alt="Contact" />
    </a>
  </div>
`

window.addEventListener('load', () => {
  initThreeScene();
});

// Add event listener to the button
const threeSceneButton = document.getElementById('three-scene-button') as HTMLButtonElement;
threeSceneButton.addEventListener('click', () => {
  const img = threeSceneButton.querySelector('img') as HTMLImageElement;
  if (img.src.includes('sound.png')) {
    img.src = './assets/mute.png'; // Switch to unsound image
  } else {
    img.src = './assets/sound.png'; // Switch back to sound image
  }
  // Call a function from threeScene or perform an action
  console.log('Button clicked!');
  // Example: If you have a function in threeScene to reset the scene, you can call it here
  // resetThreeScene();
});

// Obscure email address to prevent scraping
const contactLink = document.getElementById('contact-link') as HTMLAnchorElement;
if (contactLink) {
  const email = 'me' + '@' + 'brookcronin.com';
  contactLink.href = 'mailto:' + email;
}