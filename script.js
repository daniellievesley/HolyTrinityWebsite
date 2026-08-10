const findoutmore = document.getElementById('findoutmore');
const gotoCOFEC = document.getElementById('cofecbtn');

if (findoutmore) {
    findoutmore.addEventListener('click', gotoContact);
}

if (gotoCOFEC) {
    gotoCOFEC.addEventListener('click', gotoCOFECSite);
}

function gotoContact() {
    window.location.href = 'contact.html';
}

function gotoCOFECSite() {
    window.location.assign('https://cofec.org');
}

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getAuth, getIdTokenResult, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBK5RX5qMHDT-bzdC4--8MHnl-VlVo6w5U",
  authDomain: "holy-trinity-frinton.firebaseapp.com",
  projectId: "holy-trinity-frinton",
  storageBucket: "holy-trinity-frinton.firebasestorage.app",
  messagingSenderId: "924076294440",
  appId: "1:924076294440:web:2f995c2e6f09d303fa501d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();


async function getUserClaims(user) {
  const result = await getIdTokenResult(user, true);
  return result.claims || {};
}

async function renderAuthState(user) {
  const authDiv = document.getElementById('auth');
  const signedIn = document.getElementById('signedIn');
  const signedOut = document.getElementById('signedOut');
  const who = document.getElementById('who');
  const userPhoto = document.getElementById('userPhoto');
  const editorArea = document.getElementById('editorArea');
  const authStatus = document.getElementById('authStatus');

  if (!signedIn || !signedOut || !authDiv) return;

  if (!user) {
    signedIn.style.display = 'none';
    signedOut.style.display = 'block';
    if (editorArea) editorArea.style.display = 'none';
    authDiv.style.display = 'block';
    if (authStatus) authStatus.textContent = 'Sign in with the publisher account.';
    return;
  }

  const claims = await getUserClaims(user);
  const isPublisher = claims.publisher === true;

  signedIn.style.display = 'block';
  signedOut.style.display = 'none';

  if (who) {
    who.textContent = user.displayName || user.email || '';
  }

  if (userPhoto && user.photoURL) {
    userPhoto.src = user.photoURL;
  }

  if (!isPublisher) {
    if (authStatus) authStatus.textContent = 'This account does not have the publisher claim. Sign out and use the admin Google account that was assigned the claim.';
    authDiv.style.display = 'block';
    if (editorArea) editorArea.style.display = 'none';
    await signOut(auth);
    return;
  }

  authDiv.style.display = 'block';
  if (editorArea) editorArea.style.display = 'block';
  if (authStatus) authStatus.textContent = 'Signed in as publisher.';
}

(function(){
  const signInBtn = document.getElementById('signInBtn');
  if (!signInBtn) return;
  signInBtn.addEventListener('click', async ()=>{
    const status = document.getElementById('authStatus');
    if (status) status.textContent = 'Opening Google sign-in...';
    try {
      await signInWithPopup(auth, provider);
      const user = auth.currentUser;
      if (user) {
        await renderAuthState(user);
      }
    } catch (error) {
      console.error(error);
      if (status) status.textContent = `Sign-in failed: ${error.code || ''} ${error.message || error}`.trim();
    }
  });
})();

(function(){
  const signOutBtn = document.getElementById('signOutBtn');
  if (!signOutBtn) return;
  signOutBtn.addEventListener('click', async ()=>{
    await signOut(auth);
    const status = document.getElementById('authStatus');
    if (status) status.textContent = 'Signed out.';
  });
})();

// Handle news form submission
const newsForm = document.getElementById('newsForm');
const newsFormStatus = document.getElementById('newsFormStatus');

if (newsForm) {
  newsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const title = document.getElementById('newsTitle').value;
    const content = document.getElementById('newsContent').value;
    
    if (!title || !content) {
      newsFormStatus.textContent = 'Title and content are required.';
      return;
    }
    
    newsFormStatus.textContent = 'Publishing...';
    
    try {
      // Create news document in Firestore without storing images
      await addDoc(collection(db, 'news'), {
        title,
        content,
        authorEmail: auth.currentUser.email,
        createdAt: serverTimestamp(),
        published: true
      });
      
      // Clear form
      newsForm.reset();
      newsFormStatus.textContent = 'News published successfully!';
      
      setTimeout(() => {
        newsFormStatus.textContent = '';
      }, 3000);
      
    } catch (error) {
      console.error('Publish error:', error);
      newsFormStatus.textContent = `Error: ${error.message}`;
    }
  });
}

onAuthStateChanged(auth, async user=>{
  await renderAuthState(user);
});

// Helper to avoid simple XSS
function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

async function loadNews() {
  const container = document.getElementById('newsGallery') || document.querySelector('.gallery');
  if (!container) return;
  container.innerHTML = '';

  // Primary query uses published + createdAt ordering. If the composite index is
  // missing, fall back to a simpler query and filter client-side.
  async function fetchNewsWithFallback() {
    const primaryQuery = query(
      collection(db, 'news'),
      where('published', '==', true),
      orderBy('createdAt', 'desc')
    );

    try {
      return await getDocs(primaryQuery);
    } catch (err) {
      const msg = String(err?.message || '').toLowerCase();
      const isMissingIndex = msg.includes('index') && (msg.includes('create') || msg.includes('requires'));
      if (!isMissingIndex) throw err;

      console.warn('Primary news query needs a Firestore index. Using fallback query.', err);
      const fallbackQuery = query(collection(db, 'news'), orderBy('createdAt', 'desc'));
      return await getDocs(fallbackQuery);
    }
  }

  try {
    const snap = await fetchNewsWithFallback();
    const docs = snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.published === true);

    if (docs.length === 0) {
      container.innerHTML = '<p>No news yet.</p>';
      return;
    }

    docs.forEach(d => {
      const date = d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toLocaleDateString() : '';
      const section = document.createElement('section');
      section.className = 'news-item';
      const shortContent = (d.content || '').slice(0, 300);
      const needsReadMore = (d.content || '').length > 300;
      section.innerHTML = `
        <p class="contentTitle">${escapeHtml(d.title || '')}</p>
        <p class="news-date">${escapeHtml(date)}</p>
        <div class="news-body">${escapeHtml(needsReadMore ? shortContent + '...' : (d.content || ''))}</div>
      `;
      if (needsReadMore) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'read-more';
        btn.textContent = 'Read more';
        btn.addEventListener('click', ()=>{
          const body = section.querySelector('.news-body');
          if (body) body.textContent = d.content || '';
          btn.remove();
        });
        section.appendChild(btn);
      }
      container.appendChild(section);
    });
  } catch (err) {
    console.error('loadNews error', err);
    if (String(err?.code || '').includes('permission-denied')) {
      container.innerHTML = '<p>Error loading news: Firestore rules denied read access.</p>';
      return;
    }
    container.innerHTML = '<p>Error loading news.</p>';
  }
}

// run on pages that have the gallery
loadNews();


const menuToggle = document.getElementById('menuToggle');
const navMenu = document.getElementById('navMenu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    navMenu.classList.toggle('open');
  });

  document.querySelectorAll('#navMenu a').forEach(link => {
    link.addEventListener('click', () => {
      navMenu.classList.remove('open');
    });
  });
} else if (menuToggle) {
  menuToggle.style.display = 'none';
}


// --- Cookie consent and YouTube click-to-load ---
(function(){
  const ytContainer = document.getElementById('ytContainer');
  const ytLoadBtn = document.getElementById('ytLoadBtn');
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('acceptCookies');
  const rejectBtn = document.getElementById('rejectCookies');

  function getConsent(){
    try{ return JSON.parse(localStorage.getItem('cookieConsent')||'{}'); }catch(e){return{}}
  }
  function saveConsent(obj){ localStorage.setItem('cookieConsent', JSON.stringify(obj)); }

  function loadYouTube(){
    if (!ytContainer) return;
    if (ytContainer.dataset.loaded) return;
    const src = ytContainer.dataset.src;
    const iframe = document.createElement('iframe');
    iframe.width = '560'; iframe.height = '315';
    iframe.src = src; iframe.frameBorder = '0'; iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    iframe.allowFullscreen = true;
    ytContainer.innerHTML = '';
    ytContainer.appendChild(iframe);
    ytContainer.dataset.loaded = '1';
  }

  function showBanner(){ if (banner) banner.style.display = 'flex'; }
  function hideBanner(){ if (banner) banner.style.display = 'none'; }

  document.addEventListener('DOMContentLoaded', ()=>{
    const consent = getConsent();
    if (ytContainer && consent.youtube){ loadYouTube(); }
    // if no decision and the page has ytContainer, prompt
    if (ytContainer && (consent.youtube===undefined)) showBanner();
  });

  if (ytLoadBtn) ytLoadBtn.addEventListener('click', ()=>{ saveConsent({youtube:true}); loadYouTube(); hideBanner(); });
  if (acceptBtn) acceptBtn.addEventListener('click', ()=>{ saveConsent({youtube:true}); loadYouTube(); hideBanner(); });
  if (rejectBtn) rejectBtn.addEventListener('click', ()=>{ saveConsent({youtube:false}); hideBanner(); });
})();
// --- end cookie consent ---
