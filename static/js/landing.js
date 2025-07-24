// GoRescue Landing Page JavaScript
// Author: GoRescue Team
// Description: Interactive functionality for the landing page

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavbar();
    initScrollAnimations();
    initEmergencySimulation();
    initCounterAnimations();
    initMobileMenu();
    initSmoothScroll();
    initParallaxEffects();
    initTypingAnimation();
    initProgressiveEnhancement();
});

// Navbar functionality
function initNavbar() {
    const navbar = document.querySelector('.navbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class for styling
        if (scrollTop > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });
    
    // Active nav link highlighting
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', function() {
        const scrollPos = window.scrollY + 100;
        
        sections.forEach(section => {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;
            const id = section.getAttribute('id');
            const navLink = document.querySelector(`.nav-link[href="#${id}"]`);
            
            if (scrollPos >= top && scrollPos <= bottom) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) navLink.classList.add('active');
            }
        });
    });
}

// Mobile menu functionality
function initMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMenu = document.querySelector('.nav-menu');
    const navActions = document.querySelector('.nav-actions');
    
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            this.classList.toggle('active');
            
            // Create mobile menu if it doesn't exist
            let mobileMenu = document.querySelector('.mobile-menu');
            
            if (!mobileMenu) {
                mobileMenu = document.createElement('div');
                mobileMenu.className = 'mobile-menu';
                mobileMenu.innerHTML = `
                    <div class="mobile-menu-content">
                        ${navMenu.innerHTML}
                        ${navActions.innerHTML}
                    </div>
                `;
                document.querySelector('.nav-container').appendChild(mobileMenu);
            }
            
            mobileMenu.classList.toggle('active');
            document.body.classList.toggle('menu-open');
        });
    }
}

// Scroll animations using Intersection Observer
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Trigger counter animations for stats
                if (entry.target.classList.contains('hero-stats')) {
                    animateCounters();
                }
                
                if (entry.target.classList.contains('impact-metrics')) {
                    animateImpactCounters();
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for scroll animations
    const animatedElements = document.querySelectorAll(`
        .fade-in,
        .slide-in-left,
        .slide-in-right,
        .problem-card,
        .feature-card,
        .step-item,
        .hero-stats,
        .impact-metrics
    `);
    
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

// Emergency simulation in hero phone mockup
function initEmergencySimulation() {
    const etaTime = document.querySelector('.eta-time');
    const distanceText = document.querySelector('.distance-text');
    const responderDot = document.querySelector('.responder-dot');
    const connectionLine = document.querySelector('.connection-line');
    
    if (!etaTime || !distanceText) return;
    
    let eta = 3; // minutes
    let distance = 0.8; // km
    let simulationActive = true;
    
    // Simulate real-time updates
    function updateSimulation() {
        if (!simulationActive) return;
        
        // Decrease ETA and distance over time
        if (eta > 0) {
            eta = Math.max(0, eta - 0.1);
            distance = Math.max(0, distance - 0.05);
            
            etaTime.textContent = eta > 0 ? `${eta.toFixed(1)} min` : 'Arrived!';
            distanceText.textContent = distance > 0 ? `${distance.toFixed(1)} km away` : 'On scene';
            
            // Change colors when arrived
            if (eta === 0) {
                etaTime.style.color = 'var(--success-green)';
                distanceText.style.color = 'var(--success-green)';
                
                setTimeout(() => {
                    // Reset simulation
                    eta = 3;
                    distance = 0.8;
                    etaTime.style.color = '';
                    distanceText.style.color = '';
                }, 2000);
            }
        }
        
        setTimeout(updateSimulation, 1000);
    }
    
    // Start simulation when hero is visible
    const heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                updateSimulation();
                heroObserver.unobserve(entry.target);
            }
        });
    });
    
    const heroSection = document.querySelector('.hero');
    if (heroSection) {
        heroObserver.observe(heroSection);
    }
}

// Counter animations for statistics
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = counter.textContent;
        const isPercent = target.includes('%');
        const isMultiplier = target.includes('x');
        const isTwentyFourSeven = target.includes('/');
        
        if (isTwentyFourSeven) return; // Skip 24/7
        
        let targetNum = parseFloat(target);
        let current = 0;
        const increment = targetNum / 50;
        
        const updateCounter = () => {
            if (current < targetNum) {
                current += increment;
                if (isPercent) {
                    counter.textContent = `${Math.ceil(current)}%`;
                } else if (isMultiplier) {
                    counter.textContent = `${current.toFixed(1)}x`;
                } else {
                    counter.textContent = Math.ceil(current);
                }
                setTimeout(updateCounter, 40);
            } else {
                counter.textContent = target; // Ensure final value is exact
            }
        };
        
        updateCounter();
    });
}

// Impact metrics counter animation
function animateImpactCounters() {
    const metrics = document.querySelectorAll('.metric-value');
    
    metrics.forEach(metric => {
        const target = metric.textContent;
        const isPercent = target.includes('%');
        const hasPlus = target.includes('+');
        
        let targetNum = parseInt(target.replace(/[^\d]/g, ''));
        let current = 0;
        const increment = targetNum / 60;
        
        const updateMetric = () => {
            if (current < targetNum) {
                current += increment;
                let displayValue = Math.ceil(current);
                
                if (isPercent) {
                    metric.textContent = `${displayValue}%`;
                } else if (hasPlus) {
                    metric.textContent = `${displayValue}+`;
                } else {
                    metric.textContent = displayValue;
                }
                
                setTimeout(updateMetric, 30);
            } else {
                metric.textContent = target; // Ensure final value is exact
            }
        };
        
        updateMetric();
    });
}

// Smooth scrolling for anchor links
function initSmoothScroll() {
    const scrollLinks = document.querySelectorAll('a[href^="#"]');
    
    scrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const offsetTop = targetSection.offsetTop - 80; // Account for fixed navbar
                
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Parallax effects for enhanced visual appeal
function initParallaxEffects() {
    const parallaxElements = document.querySelectorAll('.hero-background, .phone-mockup');
    
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        parallaxElements.forEach(element => {
            const speed = element.classList.contains('hero-background') ? 0.5 : 0.3;
            const yOffset = scrollTop * speed;
            
            element.style.transform = `translateY(${yOffset}px)`;
        });
    });
}

// Typing animation for hero title
function initTypingAnimation() {
    const titleElement = document.querySelector('.hero-title');
    if (!titleElement) return;
    
    const originalText = titleElement.innerHTML;
    const words = originalText.split(' ');
    let currentWord = 0;
    
    function typeWord() {
        if (currentWord < words.length) {
            const wordSpan = document.createElement('span');
            wordSpan.innerHTML = words[currentWord] + ' ';
            wordSpan.style.opacity = '0';
            wordSpan.style.transform = 'translateY(20px)';
            wordSpan.style.display = 'inline-block';
            wordSpan.style.transition = 'all 0.5s ease';
            
            titleElement.appendChild(wordSpan);
            
            setTimeout(() => {
                wordSpan.style.opacity = '1';
                wordSpan.style.transform = 'translateY(0)';
            }, 100);
            
            currentWord++;
            setTimeout(typeWord, 300);
        }
    }
    
    // Clear title and start typing animation
    titleElement.innerHTML = '';
    setTimeout(typeWord, 1000);
}

// Progressive enhancement features
function initProgressiveEnhancement() {
    // Add loading states to buttons
    const buttons = document.querySelectorAll('.btn-primary, .btn-hero-primary, .btn-cta-primary');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Skip if it's a link to another page
            if (this.href && !this.href.includes('#')) {
                return;
            }
            
            e.preventDefault();
            
            const originalText = this.innerHTML;
            const spinner = '<span class="spinner"></span>';
            
            this.innerHTML = spinner + ' Loading...';
            this.disabled = true;
            
            // Simulate loading for demo purposes
            setTimeout(() => {
                this.innerHTML = originalText;
                this.disabled = false;
                
                // If it's a registration button, show a demo message
                if (this.textContent.includes('Start') || this.textContent.includes('Get Started')) {
                    showNotification('Demo mode: Registration would redirect to signup page', 'info');
                }
            }, 2000);
        });
    });
    
    // Add hover sound effects (optional, can be disabled)
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        addSoundEffects();
    }
    
    // Add keyboard navigation enhancements
    addKeyboardNavigation();
    
    // Add form validation enhancements
    enhanceFormValidation();
}

// Sound effects for interactions
function addSoundEffects() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    function playTone(frequency, duration) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }
    
    // Add subtle hover sounds to buttons
    const interactiveElements = document.querySelectorAll('.btn-primary, .btn-hero-primary, .feature-card, .problem-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            playTone(800, 0.1);
        });
    });
}

// Enhanced keyboard navigation
function addKeyboardNavigation() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Alt + H = Home (hero section)
        if (e.altKey && e.key === 'h') {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        
        // Alt + F = Features
        if (e.altKey && e.key === 'f') {
            e.preventDefault();
            const featuresSection = document.querySelector('#features');
            if (featuresSection) {
                featuresSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        // Alt + C = Contact
        if (e.altKey && e.key === 'c') {
            e.preventDefault();
            const contactSection = document.querySelector('#contact');
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' });
            }
        }
        
        // Escape key to close mobile menu
        if (e.key === 'Escape') {
            const mobileMenu = document.querySelector('.mobile-menu');
            if (mobileMenu && mobileMenu.classList.contains('active')) {
                mobileMenu.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        }
    });
}

// Form validation enhancements
function enhanceFormValidation() {
    // This would be used for future contact forms
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Simulate form submission
            showNotification('Demo mode: Form submission would be processed', 'success');
        });
    });
}

// Notification system
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--primary-red)' : 'var(--text-dark)'};
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        max-width: 400px;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Performance optimization
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Apply performance optimizations
window.addEventListener('scroll', throttle(function() {
    // Scroll-dependent functions are already throttled
}, 16)); // ~60fps

window.addEventListener('resize', debounce(function() {
    // Handle resize events
    const mobileMenu = document.querySelector('.mobile-menu');
    if (window.innerWidth > 768 && mobileMenu) {
        mobileMenu.classList.remove('active');
        document.body.classList.remove('menu-open');
    }
}, 250));

// Error handling
window.addEventListener('error', function(e) {
    console.error('GoRescue Landing Page Error:', e.error);
    // In production, you might want to send this to an error tracking service
});

// Feature detection and graceful degradation
if (!('IntersectionObserver' in window)) {
    // Fallback for older browsers
    const animatedElements = document.querySelectorAll('.fade-in, .slide-in-left, .slide-in-right');
    animatedElements.forEach(el => el.classList.add('visible'));
}

// Service Worker registration (for future PWA features)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('SW registered: ', registration);
            })
            .catch(function(registrationError) {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Analytics tracking preparation
function trackEvent(category, action, label) {
    // This would integrate with your analytics platform
    console.log('Event tracked:', { category, action, label });
    
    // Example: Google Analytics 4
    // gtag('event', action, {
    //     event_category: category,
    //     event_label: label
    // });
}

// Track important user interactions
document.addEventListener('click', function(e) {
    const target = e.target;
    
    if (target.matches('.btn-hero-primary')) {
        trackEvent('CTA', 'click', 'Hero Primary Button');
    }
    
    if (target.matches('.btn-cta-primary')) {
        trackEvent('CTA', 'click', 'Main CTA Button');
    }
    
    if (target.matches('.nav-link')) {
        trackEvent('Navigation', 'click', target.textContent);
    }
});

console.log('🚨 GoRescue Landing Page Loaded - Every Second Counts! 🚨');