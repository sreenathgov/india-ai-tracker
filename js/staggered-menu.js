/**
 * Staggered Menu - Vanilla JS Version
 * Converted from React Bits component
 */

class StaggeredMenu {
  constructor(options = {}) {
    this.options = {
      position: 'right',
      colors: ['#B19EEF', '#5227FF'],
      items: [],
      socialItems: [],
      displaySocials: true,
      displayItemNumbering: true,
      logoUrl: 'KANANLABS-LOGO-SET/TRANSPARENT-of-KANAN-LABS-WEBSITELOGO.png',
      mobileLogoUrl: 'KANANLABS-LOGO-SET/KANANLABS-LETTERLOGO-BLUEBG.png',
      mobileOpenLogoUrl: 'KANANLABS-LOGO-SET/KANANLABS-LETTERLOGO-WHITEBG.png',
      menuButtonColor: '#f4ebd0',
      openMenuButtonColor: '#fff',
      accentColor: '#db4a2b',
      changeMenuColorOnOpen: true,
      isFixed: true,
      closeOnClickAway: true,
      ...options
    };

    this.state = {
      open: false,
      busy: false,
      textLines: ['MENU', 'CLOSE']
    };

    this.refs = {
      wrapper: null,
      panel: null,
      preLayersContainer: null,
      preLayers: [],
      plusH: null,
      plusV: null,
      icon: null,
      textInner: null,
      textWrap: null,
      toggleBtn: null
    };

    this.animations = {
      openTl: null,
      closeTween: null,
      spinTween: null,
      textCycleAnim: null,
      colorTween: null,
      itemEntranceTween: null
    };

    this.theme = {
      isLight: false,
      darkLogoUrl: 'KANANLABS-LOGO-SET/TRANSPARENT-of-KANAN-LABS-WEBSITELOGO.png',
      lightLogoUrl: 'KANANLABS-LOGO-SET/BLUE of KANAN-LABS-WEBSITELOGO.png',
      darkMenuColor: '#f4ebd0',
      lightMenuColor: '#0a2f52',
      currentMenuColor: '#f4ebd0'
    };

    this._headerHidden = false;
    this._showHeader = null;
    this._hideHeader = null;

    this.init();
  }

  init() {
    this.createMarkup();
    this.cacheRefs();
    this.setupInitialState();
    this.attachEventListeners();
    this.initThemeSwitching();
    this.initScrollHide();
  }

  createMarkup() {
    const wrapper = document.createElement('div');
    wrapper.className = `staggered-menu-wrapper${this.options.isFixed ? ' fixed-wrapper' : ''}`;
    wrapper.setAttribute('data-position', this.options.position);
    if (this.options.accentColor) {
      wrapper.style.setProperty('--sm-accent', this.options.accentColor);
    }

    // Create prelayers
    const prelayers = this.createPrelayers();

    // Create header
    const header = this.createHeader();

    // Create panel
    const panel = this.createPanel();

    wrapper.appendChild(prelayers);
    wrapper.appendChild(header);
    wrapper.appendChild(panel);

    // Insert at beginning of body
    document.body.insertBefore(wrapper, document.body.firstChild);

    this.refs.wrapper = wrapper;

    // Set initial logo based on screen size
    this.setInitialLogo();
  }

  setInitialLogo() {
    const logoImg = this.refs.wrapper.querySelector('.sm-logo-img');
    if (!logoImg) return;

    const isMobile = window.innerWidth <= 1024;
    if (isMobile) {
      logoImg.src = this.options.mobileLogoUrl;
    } else {
      logoImg.src = this.options.logoUrl;
    }
  }

  createPrelayers() {
    const container = document.createElement('div');
    container.className = 'sm-prelayers';
    container.setAttribute('aria-hidden', 'true');

    let colors = this.options.colors && this.options.colors.length
      ? this.options.colors.slice(0, 4)
      : ['#1e1e22', '#35353c'];

    let arr = [...colors];
    if (arr.length >= 3) {
      const mid = Math.floor(arr.length / 2);
      arr.splice(mid, 1);
    }

    arr.forEach(color => {
      const layer = document.createElement('div');
      layer.className = 'sm-prelayer';
      layer.style.background = color;
      container.appendChild(layer);
    });

    return container;
  }

  createHeader() {
    const header = document.createElement('header');
    header.className = 'staggered-menu-header';
    header.setAttribute('aria-label', 'Main navigation header');

    // Logo
    const logoDiv = document.createElement('div');
    logoDiv.className = 'sm-logo';
    logoDiv.setAttribute('aria-label', 'Logo');

    const logoImg = document.createElement('img');
    logoImg.src = this.options.logoUrl;
    logoImg.alt = 'Logo';
    logoImg.className = 'sm-logo-img';
    logoImg.draggable = false;
    logoImg.width = 110;
    logoImg.height = 24;

    logoDiv.appendChild(logoImg);

    // Toggle button
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'sm-toggle';
    toggleBtn.setAttribute('aria-label', 'Open menu');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'staggered-menu-panel');
    toggleBtn.type = 'button';

    // Text wrapper
    const textWrap = document.createElement('span');
    textWrap.className = 'sm-toggle-textWrap';
    textWrap.setAttribute('aria-hidden', 'true');

    const textInner = document.createElement('span');
    textInner.className = 'sm-toggle-textInner';

    this.state.textLines.forEach(line => {
      const span = document.createElement('span');
      span.className = 'sm-toggle-line';
      span.textContent = line;
      textInner.appendChild(span);
    });

    textWrap.appendChild(textInner);

    // Icon - Three horizontal stripes
    const icon = document.createElement('span');
    icon.className = 'sm-icon';
    icon.setAttribute('aria-hidden', 'true');

    const line1 = document.createElement('span');
    line1.className = 'sm-icon-line sm-icon-line-1';

    const line2 = document.createElement('span');
    line2.className = 'sm-icon-line sm-icon-line-2';

    const line3 = document.createElement('span');
    line3.className = 'sm-icon-line sm-icon-line-3';

    icon.appendChild(line1);
    icon.appendChild(line2);
    icon.appendChild(line3);

    toggleBtn.appendChild(textWrap);
    toggleBtn.appendChild(icon);

    header.appendChild(logoDiv);
    header.appendChild(toggleBtn);

    return header;
  }

  createPanel() {
    const panel = document.createElement('aside');
    panel.id = 'staggered-menu-panel';
    panel.className = 'staggered-menu-panel';
    panel.setAttribute('aria-hidden', 'true');

    const inner = document.createElement('div');
    inner.className = 'sm-panel-inner';

    // Menu items
    const menuList = document.createElement('ul');
    menuList.className = 'sm-panel-list';
    menuList.setAttribute('role', 'list');
    if (this.options.displayItemNumbering) {
      menuList.setAttribute('data-numbering', '');
    }

    if (this.options.items && this.options.items.length) {
      this.options.items.forEach((item, idx) => {
        const li = document.createElement('li');
        li.className = 'sm-panel-itemWrap';

        const link = document.createElement('a');
        link.className = 'sm-panel-item';
        link.href = item.link;
        link.setAttribute('aria-label', item.ariaLabel);
        link.setAttribute('data-index', idx + 1);

        const label = document.createElement('span');
        label.className = 'sm-panel-itemLabel';
        label.textContent = item.label;

        // Handle custom actions (e.g., opening contact panel)
        if (item.action === 'openContactPanel') {
          link.addEventListener('click', (e) => {
            e.preventDefault();
            this.closeMenu();
            setTimeout(() => {
              if (window.contactPanel) window.contactPanel.open();
            }, 400);
          });
        }

        link.appendChild(label);
        li.appendChild(link);
        menuList.appendChild(li);
      });
    }

    inner.appendChild(menuList);

    // Social items
    if (this.options.displaySocials && this.options.socialItems && this.options.socialItems.length > 0) {
      const socialsDiv = document.createElement('div');
      socialsDiv.className = 'sm-socials';
      socialsDiv.setAttribute('aria-label', 'Social links');

      const title = document.createElement('h3');
      title.className = 'sm-socials-title';
      title.textContent = 'Socials';

      const socialsList = document.createElement('ul');
      socialsList.className = 'sm-socials-list';
      socialsList.setAttribute('role', 'list');

      this.options.socialItems.forEach(social => {
        const li = document.createElement('li');
        li.className = 'sm-socials-item';

        const link = document.createElement('a');
        link.href = social.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.className = 'sm-socials-link';
        link.textContent = social.label;

        li.appendChild(link);
        socialsList.appendChild(li);
      });

      socialsDiv.appendChild(title);
      socialsDiv.appendChild(socialsList);
      inner.appendChild(socialsDiv);
    }

    panel.appendChild(inner);
    return panel;
  }

  cacheRefs() {
    const wrapper = this.refs.wrapper;

    this.refs.panel = wrapper.querySelector('.staggered-menu-panel');
    this.refs.preLayersContainer = wrapper.querySelector('.sm-prelayers');
    this.refs.preLayers = Array.from(wrapper.querySelectorAll('.sm-prelayer'));
    this.refs.line1 = wrapper.querySelector('.sm-icon-line-1');
    this.refs.line2 = wrapper.querySelector('.sm-icon-line-2');
    this.refs.line3 = wrapper.querySelector('.sm-icon-line-3');
    this.refs.icon = wrapper.querySelector('.sm-icon');
    this.refs.textInner = wrapper.querySelector('.sm-toggle-textInner');
    this.refs.textWrap = wrapper.querySelector('.sm-toggle-textWrap');
    this.refs.toggleBtn = wrapper.querySelector('.sm-toggle');
    this.refs.logoImg = wrapper.querySelector('.sm-logo-img');
  }

  setupInitialState() {
    const { panel, preLayers, line1, line2, line3, icon, textInner, toggleBtn } = this.refs;

    if (!panel || !line1 || !line2 || !line3 || !icon || !textInner) return;

    const offscreen = this.options.position === 'left' ? -100 : 100;

    gsap.set([panel, ...preLayers], { xPercent: offscreen });
    gsap.set(line1, { transformOrigin: '50% 50%', y: -4 });
    gsap.set(line2, { transformOrigin: '50% 50%', y: 0, opacity: 1 });
    gsap.set(line3, { transformOrigin: '50% 50%', y: 4 });
    gsap.set(icon, { rotate: 0, transformOrigin: '50% 50%' });
    gsap.set(textInner, { yPercent: 0 });

    if (toggleBtn) {
      gsap.set(toggleBtn, { color: this.options.menuButtonColor });
    }
  }

  attachEventListeners() {
    const { toggleBtn } = this.refs;

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleMenu());
    }

    if (this.options.closeOnClickAway) {
      document.addEventListener('mousedown', (e) => this.handleClickOutside(e));
    }

    // Handle window resize to update logo
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (!this.state.open) {
          this.setInitialLogo();
        }
      }, 150);
    });
  }

  handleClickOutside(event) {
    if (!this.state.open) return;

    const { panel, toggleBtn } = this.refs;

    if (panel && !panel.contains(event.target) &&
        toggleBtn && !toggleBtn.contains(event.target)) {
      this.closeMenu();
    }
  }

  buildOpenTimeline() {
    const { panel, preLayers } = this.refs;
    if (!panel) return null;

    // Kill existing animations
    if (this.animations.openTl) this.animations.openTl.kill();
    if (this.animations.closeTween) {
      this.animations.closeTween.kill();
      this.animations.closeTween = null;
    }
    if (this.animations.itemEntranceTween) this.animations.itemEntranceTween.kill();

    const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
    const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
    const socialTitle = panel.querySelector('.sm-socials-title');
    const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));

    const layerStates = preLayers.map(el => ({
      el,
      start: Number(gsap.getProperty(el, 'xPercent'))
    }));
    const panelStart = Number(gsap.getProperty(panel, 'xPercent'));

    // Set initial states
    if (itemEls.length) {
      gsap.set(itemEls, { yPercent: 140, rotate: 10 });
    }
    if (numberEls.length) {
      gsap.set(numberEls, { '--sm-num-opacity': 0 });
    }
    if (socialTitle) {
      gsap.set(socialTitle, { opacity: 0 });
    }
    if (socialLinks.length) {
      gsap.set(socialLinks, { y: 25, opacity: 0 });
    }

    const tl = gsap.timeline({ paused: true });

    // Animate layers
    layerStates.forEach((ls, i) => {
      tl.fromTo(
        ls.el,
        { xPercent: ls.start },
        { xPercent: 0, duration: 0.5, ease: 'power4.out' },
        i * 0.07
      );
    });

    const lastTime = layerStates.length ? (layerStates.length - 1) * 0.07 : 0;
    const panelInsertTime = lastTime + (layerStates.length ? 0.08 : 0);
    const panelDuration = 0.65;

    // Animate panel
    tl.fromTo(
      panel,
      { xPercent: panelStart },
      { xPercent: 0, duration: panelDuration, ease: 'power4.out' },
      panelInsertTime
    );

    // Animate items
    if (itemEls.length) {
      const itemsStartRatio = 0.15;
      const itemsStart = panelInsertTime + panelDuration * itemsStartRatio;

      tl.to(
        itemEls,
        {
          yPercent: 0,
          rotate: 0,
          duration: 1,
          ease: 'power4.out',
          stagger: { each: 0.1, from: 'start' }
        },
        itemsStart
      );

      if (numberEls.length) {
        tl.to(
          numberEls,
          {
            duration: 0.6,
            ease: 'power2.out',
            '--sm-num-opacity': 1,
            stagger: { each: 0.08, from: 'start' }
          },
          itemsStart + 0.1
        );
      }
    }

    // Animate socials
    if (socialTitle || socialLinks.length) {
      const socialsStart = panelInsertTime + panelDuration * 0.4;

      if (socialTitle) {
        tl.to(
          socialTitle,
          {
            opacity: 1,
            duration: 0.5,
            ease: 'power2.out'
          },
          socialsStart
        );
      }

      if (socialLinks.length) {
        tl.to(
          socialLinks,
          {
            y: 0,
            opacity: 1,
            duration: 0.55,
            ease: 'power3.out',
            stagger: { each: 0.08, from: 'start' },
            onComplete: () => {
              gsap.set(socialLinks, { clearProps: 'opacity' });
            }
          },
          socialsStart + 0.04
        );
      }
    }

    this.animations.openTl = tl;
    return tl;
  }

  playOpen() {
    if (this.state.busy) return;
    this.state.busy = true;

    const tl = this.buildOpenTimeline();
    if (tl) {
      tl.eventCallback('onComplete', () => {
        this.state.busy = false;
      });
      tl.play(0);
    } else {
      this.state.busy = false;
    }
  }

  playClose() {
    if (this.animations.openTl) this.animations.openTl.kill();
    this.animations.openTl = null;
    if (this.animations.itemEntranceTween) this.animations.itemEntranceTween.kill();

    const { panel, preLayers } = this.refs;
    if (!panel) return;

    const all = [...preLayers, panel];
    if (this.animations.closeTween) this.animations.closeTween.kill();

    const offscreen = this.options.position === 'left' ? -100 : 100;

    this.animations.closeTween = gsap.to(all, {
      xPercent: offscreen,
      duration: 0.32,
      ease: 'power3.in',
      overwrite: 'auto',
      onComplete: () => {
        const itemEls = Array.from(panel.querySelectorAll('.sm-panel-itemLabel'));
        if (itemEls.length) {
          gsap.set(itemEls, { yPercent: 140, rotate: 10 });
        }

        const numberEls = Array.from(panel.querySelectorAll('.sm-panel-list[data-numbering] .sm-panel-item'));
        if (numberEls.length) {
          gsap.set(numberEls, { '--sm-num-opacity': 0 });
        }

        const socialTitle = panel.querySelector('.sm-socials-title');
        const socialLinks = Array.from(panel.querySelectorAll('.sm-socials-link'));
        if (socialTitle) gsap.set(socialTitle, { opacity: 0 });
        if (socialLinks.length) gsap.set(socialLinks, { y: 25, opacity: 0 });

        this.state.busy = false;
      }
    });
  }

  animateIcon(opening) {
    const { line1, line2, line3 } = this.refs;
    if (!line1 || !line2 || !line3) return;

    if (this.animations.spinTween) this.animations.spinTween.kill();

    if (opening) {
      // Transform to X: top line rotates 45deg, middle disappears, bottom rotates -45deg
      this.animations.spinTween = gsap.timeline()
        .to(line1, { y: 0, rotate: 45, duration: 0.3, ease: 'power2.out' }, 0)
        .to(line2, { opacity: 0, duration: 0.2, ease: 'power2.out' }, 0)
        .to(line3, { y: 0, rotate: -45, duration: 0.3, ease: 'power2.out' }, 0);
    } else {
      // Transform back to hamburger
      this.animations.spinTween = gsap.timeline()
        .to(line1, { y: -4, rotate: 0, duration: 0.3, ease: 'power2.out' }, 0)
        .to(line2, { opacity: 1, duration: 0.2, ease: 'power2.out' }, 0.1)
        .to(line3, { y: 4, rotate: 0, duration: 0.3, ease: 'power2.out' }, 0);
    }
  }

  animateColor(opening) {
    const { toggleBtn } = this.refs;
    if (!toggleBtn) return;

    if (this.animations.colorTween) this.animations.colorTween.kill();

    if (this.options.changeMenuColorOnOpen) {
      const targetColor = opening ? this.options.openMenuButtonColor : this.theme.currentMenuColor;
      this.animations.colorTween = gsap.to(toggleBtn, {
        color: targetColor,
        delay: 0.18,
        duration: 0.3,
        ease: 'power2.out'
      });
    } else {
      gsap.set(toggleBtn, { color: this.options.menuButtonColor });
    }
  }

  animateText(opening) {
    const { textInner } = this.refs;
    if (!textInner) return;

    if (this.animations.textCycleAnim) this.animations.textCycleAnim.kill();

    const currentLabel = opening ? 'MENU' : 'CLOSE';
    const targetLabel = opening ? 'CLOSE' : 'MENU';
    const cycles = 3;
    const seq = [currentLabel];
    let last = currentLabel;

    for (let i = 0; i < cycles; i++) {
      last = last === 'MENU' ? 'CLOSE' : 'MENU';
      seq.push(last);
    }

    if (last !== targetLabel) seq.push(targetLabel);
    seq.push(targetLabel);

    // Update text lines
    textInner.innerHTML = '';
    seq.forEach(line => {
      const span = document.createElement('span');
      span.className = 'sm-toggle-line';
      span.textContent = line;
      textInner.appendChild(span);
    });

    gsap.set(textInner, { yPercent: 0 });

    const lineCount = seq.length;
    const finalShift = ((lineCount - 1) / lineCount) * 100;

    this.animations.textCycleAnim = gsap.to(textInner, {
      yPercent: -finalShift,
      duration: 0.5 + lineCount * 0.07,
      ease: 'power4.out'
    });
  }

  toggleMenu() {
    const target = !this.state.open;
    this.state.open = target;

    const { wrapper, toggleBtn, panel } = this.refs;

    if (wrapper) {
      if (target) {
        wrapper.setAttribute('data-open', '');
      } else {
        wrapper.removeAttribute('data-open');
      }
    }

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', target ? 'true' : 'false');
      toggleBtn.setAttribute('aria-label', target ? 'Close menu' : 'Open menu');
    }

    if (panel) {
      panel.setAttribute('aria-hidden', target ? 'false' : 'true');
    }

    if (target) {
      if (this._showHeader) this._showHeader();
      this.playOpen();
      this.updateLogoForFullScreen(true);
    } else {
      this.playClose();
      this.updateLogoForFullScreen(false);
    }

    this.animateIcon(target);
    this.animateColor(target);
    this.animateText(target);
  }

  updateLogoForFullScreen(isOpen) {
    const logoImg = this.refs.wrapper.querySelector('.sm-logo-img');
    if (!logoImg) return;

    const isMobile = window.innerWidth <= 1024;

    if (isMobile) {
      // Mobile: Smooth transition between letter logos
      const targetSrc = isOpen ? this.options.mobileOpenLogoUrl : this.options.mobileLogoUrl;

      if (logoImg.src.includes(targetSrc)) return; // Already correct logo

      // Smooth fade transition timed with panel animation
      gsap.to(logoImg, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          logoImg.src = targetSrc;
          gsap.to(logoImg, {
            opacity: 1,
            duration: 0.3,
            delay: 0.2, // Delay to sync with panel sliding in
            ease: 'power2.out'
          });
        }
      });
    } else {
      // Desktop: Keep full logo — theme switcher manages the src, don't override
      if (this.theme && this.theme.isLight) return;
      if (!logoImg.src.includes(this.options.logoUrl)) {
        logoImg.src = this.options.logoUrl;
      }
    }
  }

  closeMenu() {
    if (this.state.open) {
      this.state.open = false;

      const { wrapper, toggleBtn, panel } = this.refs;

      if (wrapper) wrapper.removeAttribute('data-open');
      if (toggleBtn) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open menu');
      }
      if (panel) panel.setAttribute('aria-hidden', 'true');

      this.playClose();
      this.updateLogoForFullScreen(false);
      this.animateIcon(false);
      this.animateColor(false);
      this.animateText(false);

      // Re-apply theme that may have changed while menu was open
      if (this.theme.isLight) {
        this._applyTheme(this.theme.lightMenuColor, this.theme.lightLogoUrl);
      } else {
        this._applyTheme(this.theme.darkMenuColor, this.theme.darkLogoUrl);
      }
    }
  }

  // ─── THEME SWITCHING ────────────────────────────────────────────

  switchToLightTheme() {
    if (this.theme.isLight) return;
    this.theme.isLight = true;
    this.theme.currentMenuColor = this.theme.lightMenuColor;
    if (this.state.open) return; // defer visual until menu closes
    this._applyTheme(this.theme.lightMenuColor, this.theme.lightLogoUrl);
  }

  switchToDarkTheme() {
    if (!this.theme.isLight) return;
    this.theme.isLight = false;
    this.theme.currentMenuColor = this.theme.darkMenuColor;
    if (this.state.open) return;
    this._applyTheme(this.theme.darkMenuColor, this.theme.darkLogoUrl);
  }

  _applyTheme(menuColor, logoUrl) {
    const { toggleBtn, logoImg } = this.refs;

    // Animate menu button color (icon lines inherit via currentColor in CSS)
    if (toggleBtn) {
      gsap.to(toggleBtn, { color: menuColor, duration: 0.4, ease: 'power2.out' });
    }

    // Desktop logo swap with fade
    if (logoImg && window.innerWidth > 1024) {
      gsap.to(logoImg, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          logoImg.src = logoUrl;
          gsap.to(logoImg, { opacity: 1, duration: 0.35, ease: 'power2.out' });
        }
      });
    }
  }

  initThemeSwitching() {
    const lightSections = [
      document.querySelector('.advisory-section'),
      document.querySelector('.identity-section')
    ].filter(Boolean);

    if (!lightSections.length) return;

    const checkTheme = () => {
      const headerMid = window.scrollY + 30;
      const isLight = lightSections.some(s => {
        return headerMid >= s.offsetTop && headerMid < (s.offsetTop + s.offsetHeight);
      });
      isLight ? this.switchToLightTheme() : this.switchToDarkTheme();
    };

    window.addEventListener('scroll', checkTheme, { passive: true });
    window.addEventListener('resize', checkTheme, { passive: true });
    checkTheme();
  }

  // ─── SCROLL HIDE / HOVER REVEAL ─────────────────────────────────

  initScrollHide() {
    const header = this.refs.wrapper.querySelector('.staggered-menu-header');
    if (!header) return;

    // Ghost zone: invisible strip at top edge that reveals header on hover
    const ghost = document.createElement('div');
    ghost.className = 'sm-ghost-zone';
    document.body.appendChild(ghost);

    const showHeader = () => {
      if (!this._headerHidden) return;
      this._headerHidden = false;
      ghost.style.pointerEvents = 'none';
      gsap.to(header, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
    };

    const hideHeader = () => {
      if (this._headerHidden || this.state.open) return;
      this._headerHidden = true;
      ghost.style.pointerEvents = 'auto';
      gsap.to(header, { y: -80, opacity: 0, duration: 0.45, ease: 'power2.inOut' });
    };

    this._showHeader = showHeader;
    this._hideHeader = hideHeader;

    // Hover reveal
    ghost.addEventListener('mouseenter', showHeader);
    header.addEventListener('mouseenter', showHeader);

    // Scroll detection
    let lastY = window.scrollY;
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - lastY;
        if (y < 80) {
          showHeader();
        } else if (delta > 4 && !this.state.open) {
          hideHeader();
        } else if (delta < -4) {
          showHeader();
        }
        lastY = y;
        ticking = false;
      });
    }, { passive: true });
  }
}

// Initialize menu when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  new StaggeredMenu({
    position: 'right',
    colors: ['#0a2f52', '#db4a2b', '#f4ebd0'],
    items: [
      { label: 'Home', ariaLabel: 'Go to home page', link: 'index.html' },
      { label: 'About', ariaLabel: 'Learn about this project', link: 'about.html' },
      { label: 'Publications', ariaLabel: 'View publications', link: 'publications.html' },
      { label: 'Schedule Consultation', ariaLabel: 'Schedule a strategic consultation', link: '#', action: 'openContactPanel' }
    ],
    socialItems: [
      { label: 'LinkedIn', link: 'https://www.linkedin.com/in/sreenathgovindarajan' },
      { label: 'Twitter', link: 'https://x.com/indiaAItracker' },
      { label: 'GitHub', link: 'https://github.com/sreenathgov' }
    ],
    displaySocials: true,
    displayItemNumbering: true,
    menuButtonColor: '#f4ebd0',
    openMenuButtonColor: '#db4a2b',
    accentColor: '#db4a2b',
    changeMenuColorOnOpen: true,
    logoUrl: 'KANANLABS-LOGO-SET/TRANSPARENT-of-KANAN-LABS-WEBSITELOGO.png',
    mobileLogoUrl: 'KANANLABS-LOGO-SET/KANANLABS-LETTERLOGO-BLUEBG.png',
    mobileOpenLogoUrl: 'KANANLABS-LOGO-SET/KANANLABS-LETTERLOGO-WHITEBG.png'
  });
});
