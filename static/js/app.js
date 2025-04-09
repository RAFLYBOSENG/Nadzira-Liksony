import { util } from './util.js';
import { like } from './like.js';
import { guest } from './guest.js';
import { theme } from './theme.js';
import { audio } from './audio.js';
import { comment } from './comment.js';
import { progress } from './progress.js';
import { pagination } from './pagination.js';

document.addEventListener('DOMContentLoaded', () => {
    audio.init();
    theme.check();
    pagination.init();

    guest.init();
    progress.init();
    window.AOS.init();

    window.util = util;
    window.like = like;
    window.guest = guest;
    window.theme = theme;
    window.audio = audio;
    window.comment = comment;
    window.pagination = pagination;

    initAnimations();
    initScrollEffects();
    initDecorations();
    setupParallax();
    
    // Toggle untuk musik
    const btnMusic = document.querySelector('.btn-music');
    const audioEl = document.querySelector('audio');
    
    if (btnMusic && audioEl) {
        btnMusic.addEventListener('click', function() {
            if (audioEl.paused) {
                audioEl.play();
                btnMusic.classList.add('spin-button');
            } else {
                audioEl.pause();
                btnMusic.classList.remove('spin-button');
            }
        });
    }
});

// Animasi elemen saat scroll
function initScrollEffects() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });
    
    // Tambahkan observer ke semua elemen dengan kelas fade-in-*
    document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .section').forEach(el => {
        observer.observe(el);
    });
    
    // Tampilkan tombol scroll to top ketika scroll
    const scrollTopBtn = document.querySelector('.scroll-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollTopBtn.classList.add('visible');
            } else {
                scrollTopBtn.classList.remove('visible');
            }
        });
        
        scrollTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // Navbar effect saat scroll
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
    }
}

// Tambahkan dekorasi ke halaman
function initDecorations() {
    // Tambahkan corner decorations
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
        const decorations = `
            <div class="decorative-corner corner-top-left"></div>
            <div class="decorative-corner corner-top-right"></div>
            <div class="decorative-corner corner-bottom-left"></div>
            <div class="decorative-corner corner-bottom-right"></div>
        `;
        
        mainContent.insertAdjacentHTML('beforeend', decorations);
    }
    
    // Tambahkan class decorated-header ke semua h2 di sections
    document.querySelectorAll('section h2').forEach(header => {
        header.classList.add('decorated-header');
    });
    
    // Tambahkan ornamen ke elemen tertentu
    document.querySelectorAll('.card-header h5').forEach(header => {
        header.innerHTML = `<span class="ornament">❧</span> ${header.innerHTML} <span class="ornament">❧</span>`;
    });
    
    // Tambahkan divider elemen di antara sections
    document.querySelectorAll('section').forEach(section => {
        if (!section.nextElementSibling) return;
        const divider = document.createElement('div');
        divider.className = 'elegant-divider';
        section.after(divider);
    });
}

// Inisialisasi animasi dasar
function initAnimations() {
    // Tambahkan kelas untuk efek animasi ke elemen tertentu
    document.querySelectorAll('section:nth-child(odd)').forEach(section => {
        section.classList.add('fade-in-left');
    });
    
    document.querySelectorAll('section:nth-child(even)').forEach(section => {
        section.classList.add('fade-in-right');
    });
    
    // Tambahkan efek hover ke semua tombol
    document.querySelectorAll('.btn-primary').forEach(btn => {
        btn.classList.add('btn-elegant');
    });
}

// Setup parallax effect
function setupParallax() {
    const parallaxElements = document.querySelectorAll('.parallax-bg');
    
    // Jika ada elemen parallax, atur efeknya
    if (parallaxElements.length > 0) {
        window.addEventListener('scroll', function() {
            parallaxElements.forEach(element => {
                const scrollPosition = window.pageYOffset;
                const elementPosition = element.offsetTop;
                const distance = scrollPosition - elementPosition;
                
                if (Math.abs(distance) < window.innerHeight) {
                    const speed = element.dataset.speed || 0.5;
                    element.style.backgroundPositionY = `${distance * speed}px`;
                }
            });
        });
    }
}

// Toggle Music
function toggleMusic() {
    const audioEl = document.querySelector('audio');
    const musicBtn = document.getElementById('button-music');
    
    if (!audioEl) return;
    
    if (audioEl.paused) {
        audioEl.play();
        musicBtn.classList.add('spin-button');
    } else {
        audioEl.pause();
        musicBtn.classList.remove('spin-button');
    }
}

// Play Music Automatically
function playMusic() {
    const audioEl = document.querySelector('audio');
    const musicBtn = document.getElementById('button-music');
    
    if (!audioEl) return;
    
    audioEl.play();
    musicBtn.classList.add('spin-button');
}
