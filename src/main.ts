import './style.css'
import { initThreeScene } from './threeScene.ts'

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="top-menu">
    <h1>BROOK CRONIN - DESIGN, ART & ENGINEERING</h1>
  </div>
  <div id="three-container"></div>
  <div class="footer-bar">
    <p>&copy; ${new Date().getFullYear()} Brook Cronin</p>
    <a id="contact-link" href="#">
      <img src="path/to/contact-icon.png" alt="Contact" />
    </a>
  </div>
`

initThreeScene();

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('three-container');

  if (container) {
    const resizeEvent = new Event('resize');
    window.dispatchEvent(resizeEvent); // Force a resize event after the DOM is fully loaded
  }
});

// Obscure email address to prevent scraping
const contactLink = document.getElementById('contact-link') as HTMLAnchorElement;
if (contactLink) {
  const email = 'me' + '@' + 'brookcronin.com';
  contactLink.href = 'mailto:' + email;
}