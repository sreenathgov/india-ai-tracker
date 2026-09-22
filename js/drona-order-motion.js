/* Static style-frame renderer for the future One order through Drona animation. */
(() => {
  'use strict';

  const FRAMES = [
    { key: 'commitment', title: 'The commitment enters', note: 'A specific production order becomes the governing object for everything Drona examines.' },
    { key: 'network', title: 'The order opens into production', note: 'The commitment separates into the component, suppliers, input, milestone and delivery conditions that must hold.' },
    { key: 'warning', title: 'One signal becomes relevant', note: 'Commodity pressure connects to the Tier 2 input. Logistics and regulation remain visible but recede.' },
    { key: 'action', title: 'The response window opens', note: 'Drona recommends procuring the input earlier and prepares one approved supplier-contact route.' },
    { key: 'finance', title: 'Capital becomes a constraint', note: 'Evidence is prepared for a regulated financier. Kanan does not lend, approve or guarantee funding.' },
    { key: 'confidence', title: 'Production confidence updates', note: 'Supplier evidence returns through the same network, the route stabilises and the order advances toward delivery.' }
  ];

  let serial = 0;
  const SYMBOL_SIZES = {
    'sf-component': [140, 140], 'sf-factory': [160, 140], 'sf-material': [150, 140],
    'sf-milestone': [150, 140], 'sf-delivery': [160, 140], 'sf-commodity': [150, 150],
    'sf-logistics': [150, 150], 'sf-regulation': [150, 150], 'sf-email': [120, 120],
    'sf-message': [120, 120], 'sf-voice': [120, 120], 'sf-evidence': [180, 150],
    'sf-financier': [190, 160], 'sf-confirmation': [110, 110]
  };
  const use = (id, x, y, scale = 1, className = '') => {
    const [width, height] = SYMBOL_SIZES[id];
    return `<g class="sf-symbol ${className}" transform="translate(${x} ${y}) scale(${scale})"><use href="#${id}" width="${width}" height="${height}"/></g>`;
  };
  const label = (x, y, copy, className = 'sf-label', anchor = 'start') => `<text class="${className}" x="${x}" y="${y}" text-anchor="${anchor}">${copy}</text>`;

  function definitions(prefix) {
    return `
      <defs>
        <style>
          .sf-surface{fill:var(--dof-surface)}
          .sf-outline{fill:none;stroke:var(--dof-ink);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}
          .sf-secondary-line{fill:none;stroke:var(--dof-secondary);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round;opacity:.72}
          .sf-accent-line{fill:none;stroke:var(--dof-accent);stroke-width:2.35;stroke-linecap:round;stroke-linejoin:round}
          .sf-accent-fill{fill:var(--dof-accent);stroke:none}
        </style>
        <clipPath id="${prefix}-scan-clip"><circle cx="0" cy="0" r="210"/></clipPath>
        <symbol id="sf-order" viewBox="0 0 360 240">
          <path class="sf-surface sf-outline" d="M24 64 246 20l90 48-222 46z"/>
          <path class="sf-surface sf-secondary-line" d="M24 64v112l90 48V114m222-46v112l-222 44"/>
          <path class="sf-outline" d="M52 75 243 38l62 32-191 40z"/>
          <path class="sf-secondary-line" d="M78 84 211 58M82 99l91-18M201 76l54-11M130 132l152-31M130 147l114-23M130 162l134-27"/>
          <path class="sf-secondary-line" d="M52 127v31l46 25v-32z"/>
          <path class="sf-accent-line" d="M265 125l17 9-17 17-17-9zM256 137l7 4 12-12"/>
          <path class="sf-outline" d="M58 198v-30m11 36v-30m8 34v-30m14 37v-30m7 34v-30"/>
        </symbol>
        <symbol id="sf-component" viewBox="0 0 140 140">
          <path class="sf-surface sf-secondary-line" d="M12 76 63 47l65 34-51 30zM12 76v17l65 35v-17m51-30v16l-51 31"/>
          <path class="sf-outline" d="M40 73l12-14 13 4 9-10 18 8 1 12 14 7-7 15-17 1-8 11-18-7-2-12-15-6z"/>
          <ellipse class="sf-outline" cx="73" cy="81" rx="17" ry="10"/><ellipse class="sf-accent-fill" cx="73" cy="81" rx="5" ry="3"/>
        </symbol>
        <symbol id="sf-factory" viewBox="0 0 160 140">
          <path class="sf-surface sf-secondary-line" d="M13 76 68 45l79 41-56 33zM13 76v24l78 40v-21m56-33v22l-56 32"/>
          <path class="sf-outline" d="M36 77v-30l18-9v30l20-11v20l22-12v34M102 63V27l17-8v55"/><path class="sf-outline" d="M28 81l62 32 48-28"/>
          <path class="sf-secondary-line" d="m51 86 15 8 10-6-15-8zm29 15 15 8 10-6-15-8zm29-15 15 8 10-6-15-8z"/><path class="sf-accent-line" d="M112 41h7"/>
        </symbol>
        <symbol id="sf-material" viewBox="0 0 150 140">
          <path class="sf-surface sf-secondary-line" d="M14 88 62 60l73 38-48 29zM14 88v14l73 38v-13m48-29v13l-48 29"/>
          <circle class="sf-outline" cx="76" cy="76" r="36"/><circle class="sf-outline" cx="76" cy="76" r="21"/><circle class="sf-secondary-line" cx="76" cy="76" r="9"/><path class="sf-accent-line" d="M109 63c7 8 9 17 7 27"/>
        </symbol>
        <symbol id="sf-milestone" viewBox="0 0 150 140">
          <path class="sf-surface sf-secondary-line" d="M14 77 65 48l70 36-51 31zM14 77v19l70 37v-18m51-31v18l-51 31"/>
          <ellipse class="sf-outline" cx="77" cy="79" rx="31" ry="22"/><path class="sf-secondary-line" d="M52 77h8m35 0h8M77 58v7"/><path class="sf-accent-line" d="m64 80 10 8 20-22"/>
        </symbol>
        <symbol id="sf-delivery" viewBox="0 0 160 140">
          <path class="sf-surface sf-secondary-line" d="M13 81 67 50l80 41-55 32zM13 81v18l79 41v-17m55-32v17l-55 32"/>
          <path class="sf-outline" d="M35 84V50l52-29 47 24v38M44 79l42 22 40-23M86 101V63m-42 0 42-24 40 21"/><path class="sf-accent-line" d="M102 58v24m-10-11 10 11 11-22"/><path class="sf-secondary-line" d="M52 76V64l18-10 16 8v14L69 86z"/>
        </symbol>
        <symbol id="sf-commodity" viewBox="0 0 150 150">
          <circle class="sf-surface sf-outline" cx="75" cy="75" r="58"/><path class="sf-secondary-line" d="M43 107V48m0 59h69M54 94V78h12v16m10 0V67h12v27m10 0V52h12v42"/><path class="sf-accent-line" d="m51 79 23-17 18 8 21-26m-12 1h12v12"/>
        </symbol>
        <symbol id="sf-logistics" viewBox="0 0 150 150">
          <circle class="sf-surface sf-outline" cx="75" cy="75" r="58"/><path class="sf-secondary-line" d="M43 101 59 76l28 7 20-31"/><circle class="sf-outline" cx="43" cy="101" r="7"/><circle class="sf-outline" cx="107" cy="52" r="7"/><path class="sf-outline" d="m60 65 18-10 21 11-18 11zM60 65v18l21 11V77m18-11v18L81 94"/>
        </symbol>
        <symbol id="sf-regulation" viewBox="0 0 150 150">
          <circle class="sf-surface sf-outline" cx="75" cy="75" r="58"/><path class="sf-outline" d="M51 38h40l15 15v58H51zM91 38v15h15"/><path class="sf-secondary-line" d="M62 66h32M62 78h32M62 90h18"/><circle class="sf-accent-line" cx="94" cy="95" r="12"/><path class="sf-accent-line" d="m88 95 5 5 9-12"/>
        </symbol>
        <symbol id="sf-email" viewBox="0 0 120 120"><path class="sf-surface sf-outline" d="M17 31h86v59H17z"/><path class="sf-outline" d="m18 33 42 34 42-34M18 88l31-31m53 31L71 57"/></symbol>
        <symbol id="sf-message" viewBox="0 0 120 120"><path class="sf-surface sf-outline" d="M18 24h84v62H55l-24 17V86H18z"/><path class="sf-secondary-line" d="M35 45h50M35 59h36"/><circle class="sf-accent-fill" cx="87" cy="72" r="4"/></symbol>
        <symbol id="sf-voice" viewBox="0 0 120 120"><circle class="sf-surface sf-outline" cx="60" cy="60" r="43"/><path class="sf-secondary-line" d="M30 60h8m44 0h8M43 60v-9m8 9V39m8 21V29m8 31V41m8 19V49"/><path class="sf-accent-line" d="M43 69c8 14 25 18 38 8"/></symbol>
        <symbol id="sf-evidence" viewBox="0 0 180 150">
          <path class="sf-surface sf-secondary-line" d="M27 33h94l24 24v73H27z" transform="translate(17 -13)"/><path class="sf-surface sf-secondary-line" d="M27 33h94l24 24v73H27z" transform="translate(8 -6)"/><path class="sf-surface sf-outline" d="M27 33h94l24 24v73H27zM121 33v24h24"/><path class="sf-secondary-line" d="M48 65h64M48 80h75M48 95h51"/><path class="sf-accent-line" d="m107 105 8 7 16-21"/>
        </symbol>
        <symbol id="sf-financier" viewBox="0 0 190 160">
          <path class="sf-surface sf-outline" d="m21 55 74-36 75 36zM28 64h134M23 133h144M16 145h158"/><path class="sf-outline" d="M37 64v69m26-69v69m64-69v69m26-69v69"/><path class="sf-secondary-line" d="M43 74h14m76 0h14M69 51h52"/><circle class="sf-accent-line" cx="95" cy="43" r="8"/>
        </symbol>
        <symbol id="sf-confirmation" viewBox="0 0 110 110"><circle class="sf-surface sf-outline" cx="55" cy="55" r="42"/><circle class="sf-secondary-line" cx="55" cy="55" r="33"/><path class="sf-accent-line" d="m35 55 13 13 28-32"/></symbol>
      </defs>`;
  }

  function editorialHeader(number, kicker, title) {
    return `${label(70, 75, `0${number} / 06`, 'sf-index')}${label(800, 74, kicker.toUpperCase(), 'sf-kicker', 'middle')}${label(1530, 75, 'ONE ORDER THROUGH DRONA', 'sf-index', 'end')}<path class="sf-hairline" d="M70 102H1530"/>${label(70, 842, title, 'sf-frame-title')}<path class="sf-hairline" d="M70 868H1530"/>`;
  }

  function orderObject(x, y, scale = 1, className = '') {
    return `<g class="sf-order-object ${className}" transform="translate(${x} ${y}) scale(${scale})"><use href="#sf-order" width="360" height="240"/>${label(41, 14, 'PRODUCTION ORDER', 'sf-object-kicker')}${label(130, 188, 'Delivery commitment', 'sf-object-label')}</g>`;
  }

  function stackPlate(x, y, width, depth, className = '') {
    return `<path class="sf-surface sf-stack-plate ${className}" d="M${x} ${y}h${width}l110 ${depth}H${x + 110}z"/>`;
  }

  function frameCommitment() {
    return `${editorialHeader(1, 'The commitment', 'A real production obligation enters the system.')}
      <g class="sf-datum"><circle cx="780" cy="432" r="260"/><circle cx="780" cy="432" r="218"/><path d="M450 432h660M780 151v562"/><path d="M612 221a244 244 0 0 1 335 54"/></g>
      <g class="sf-focus-brackets"><path d="M463 254v-46h46M1051 208h46v46M1097 610v46h-46M509 656h-46v-46"/></g>
      ${orderObject(590, 315, 1.35, 'sf-hero-order')}
      <g class="sf-callout"><path d="M985 354h176l45-26"/>${label(1224, 318, 'GOVERNING OBJECT', 'sf-callout-kicker')}${label(1224, 353, 'Production order', 'sf-callout-title')}${label(1224, 383, 'Delivery commitment', 'sf-callout-copy')}</g>
      <g class="sf-status-key"><circle class="sf-accent-fill" cx="250" cy="430" r="7"/>${label(272, 438, 'Commitment received', 'sf-callout-copy')}<path class="sf-secondary-line" d="M250 462h190"/>${label(250, 495, 'Drona examines what must', 'sf-callout-copy')}${label(250, 523, 'go right for this order.', 'sf-callout-copy')}</g>
      ${label(800, 758, 'Production order · Delivery commitment', 'sf-mobile-caption', 'middle')}`;
  }

  function frameNetwork() {
    return `${editorialHeader(2, 'The production stack', 'The order opens into the conditions behind delivery.')}
      <g class="sf-stack">${stackPlate(485, 215, 500, 115, 'sf-stack-plate--quiet')}${stackPlate(420, 365, 630, 145)}${stackPlate(360, 545, 750, 170, 'sf-stack-plate--base')}<path class="sf-secondary-line" d="M485 215v55m610 60v55M420 365v58m740 87v56M360 545v54m860 116v54"/>${orderObject(630, 192, .92, 'sf-stack-order')}${use('sf-component', 525, 386, .86)}${use('sf-factory', 715, 395, .83)}${use('sf-material', 930, 390, .84)}${use('sf-milestone', 515, 580, .8)}${use('sf-delivery', 955, 580, .82)}<path class="sf-route" d="M617 453h115m110 0h130M596 650h380"/></g>
      <g class="sf-callout"><path d="M550 425H300l-45-25"/>${label(238, 391, 'CRITICAL COMPONENT', 'sf-callout-kicker', 'end')}${label(238, 426, 'Machined assembly', 'sf-callout-copy', 'end')}</g>
      <g class="sf-callout"><path d="M790 462v30"/>${label(790, 522, 'TIER 1 SUPPLIER', 'sf-callout-kicker', 'middle')}${label(790, 551, 'Production owner', 'sf-callout-copy', 'middle')}</g>
      <g class="sf-callout"><path d="M1002 430h245l45-25"/>${label(1310, 395, 'TIER 2 INPUT', 'sf-callout-kicker')}${label(1310, 430, 'Critical material', 'sf-callout-copy')}</g>
      <g class="sf-callout"><path d="M565 650H315l-42 24"/>${label(255, 675, 'PRODUCTION MILESTONE', 'sf-callout-kicker', 'end')}${label(255, 710, 'Evidence due', 'sf-callout-copy', 'end')}</g>
      <g class="sf-callout"><path d="M1030 650h215l45 24"/>${label(1310, 675, 'DELIVERY ENDPOINT', 'sf-callout-kicker')}${label(1310, 710, 'Commitment fulfilled', 'sf-callout-copy')}</g>
      ${label(800, 758, 'Component · Tier 1 · Tier 2 · Milestone · Delivery', 'sf-mobile-caption', 'middle')}`;
  }

  function frameWarning(prefix) {
    return `${editorialHeader(3, 'The relevant warning', 'Drona finds the commitment the signal could affect.')}
      <g class="sf-warning-stack">${stackPlate(180, 330, 575, 132)}${stackPlate(225, 480, 485, 112, 'sf-stack-plate--base')}${orderObject(300, 314, .73)}${use('sf-component', 545, 386, .65)}${use('sf-factory', 685, 394, .63)}${use('sf-material', 820, 385, .67, 'sf-relevant-object')}<path class="sf-route" d="M600 436h100m95 0h67M400 530h355"/><path class="sf-active-route" d="M863 435H795 700 600 512"/><circle class="sf-accent-fill" cx="864" cy="435" r="8"/><circle class="sf-accent-fill" cx="512" cy="435" r="8"/></g>
      <g class="sf-scan" clip-path="url(#${prefix}-scan-clip)" transform="translate(650 445)"><circle cx="0" cy="0" r="205"/><path d="M-210 22h420M-202 55h404M-184 88h368"/></g>
      <g class="sf-signal-grid">${use('sf-logistics', 1050, 210, .82, 'sf-muted-symbol')}${label(1112, 356, 'LOGISTICS', 'sf-signal-label sf-muted-copy', 'middle')}${label(1112, 386, 'No material connection', 'sf-signal-copy sf-muted-copy', 'middle')}${use('sf-regulation', 1292, 210, .82, 'sf-muted-symbol')}${label(1354, 356, 'REGULATION', 'sf-signal-label sf-muted-copy', 'middle')}${label(1354, 386, 'No material connection', 'sf-signal-copy sf-muted-copy', 'middle')}${use('sf-commodity', 1168, 448, 1.08, 'sf-active-symbol')}${label(1249, 645, 'COMMODITY', 'sf-signal-label', 'middle')}${label(1249, 684, 'Input cost rising', 'sf-event-label', 'middle')}</g>
      <path class="sf-active-route sf-active-route--signal" d="M1168 530C1060 530 1005 505 930 455"/><circle class="sf-pulse" cx="1015" cy="505" r="10"/>${label(250, 720, 'Only the affected route illuminates.', 'sf-statement')}${label(800, 758, 'Commodity → Tier 2 input → Production order', 'sf-mobile-caption', 'middle')}`;
  }

  function frameAction() {
    return `${editorialHeader(4, 'The action window', 'The affected dependency produces a response while time remains.')}
      <g class="sf-action-stack">${stackPlate(155, 330, 430, 98, 'sf-stack-plate--quiet')}${stackPlate(190, 455, 360, 83, 'sf-stack-plate--base')}${orderObject(225, 316, .65)}${use('sf-factory', 495, 386, .68)}${use('sf-material', 655, 378, .72, 'sf-relevant-object')}<path class="sf-active-route" d="M692 428H580 500 415"/></g>
      <g class="sf-response-panel"><path class="sf-surface sf-panel-outline" d="M780 202h680v488H780z"/><path class="sf-hairline" d="M830 284h580M830 457h580"/>${label(830, 250, 'RECOMMENDED RESPONSE', 'sf-callout-kicker')}${label(830, 365, 'Procure input', 'sf-response-title')}${label(830, 420, 'earlier', 'sf-response-title sf-response-title--accent')}${label(830, 506, 'SUPPLIER CONTACTED', 'sf-callout-kicker')}${use('sf-email', 830, 535, .72)}${use('sf-message', 1015, 535, .72)}${use('sf-voice', 1200, 535, .72)}${label(873, 650, 'Email', 'sf-channel-label', 'middle')}${label(1058, 650, 'Message', 'sf-channel-label', 'middle')}${label(1243, 650, 'Voice', 'sf-channel-label', 'middle')}<path class="sf-route" d="M873 632h370"/><circle class="sf-accent-fill" cx="873" cy="632" r="6"/><circle class="sf-accent-fill" cx="1058" cy="632" r="6"/><circle class="sf-accent-fill" cx="1243" cy="632" r="6"/>${label(1408, 605, 'WITH APPROVAL', 'sf-callout-kicker sf-approval-label', 'end')}</g>
      <path class="sf-active-route" d="M690 430c70 0 70-66 90-66"/>${label(185, 690, 'Risk becomes an actionable production decision.', 'sf-statement')}${label(800, 758, 'Procure input earlier · Supplier contacted with approval', 'sf-mobile-caption', 'middle')}`;
  }

  function frameFinance() {
    return `${editorialHeader(5, 'Conditional finance', 'The evidence travels. The lending decision does not.')}
      <g class="sf-finance-origin">${stackPlate(105, 365, 360, 82, 'sf-stack-plate--quiet')}${orderObject(160, 348, .56)}${use('sf-material', 442, 397, .63, 'sf-relevant-object')}<path class="sf-active-route" d="M475 437H355"/></g>
      <g class="sf-capital-marker"><circle class="sf-surface sf-accent-line" cx="543" cy="438" r="46"/>${label(543, 430, 'CAPITAL', 'sf-micro', 'middle')}${label(543, 452, 'REQUIRED', 'sf-micro', 'middle')}</g><path class="sf-conditional-route" d="M590 438h120"/>
      <g class="sf-evidence-stage">${use('sf-evidence', 710, 332, 1.15)}${label(810, 535, 'EVIDENCE PREPARED', 'sf-callout-kicker', 'middle')}${label(810, 570, 'Order · input · response', 'sf-callout-copy', 'middle')}</g><path class="sf-conditional-route" d="M920 438h170"/>
      <g class="sf-financier-stage">${use('sf-financier', 1090, 312, 1.32)}${label(1215, 553, 'REGULATED FINANCIER', 'sf-callout-kicker', 'middle')}${label(1215, 603, 'Financier decides', 'sf-financier-decision', 'middle')}<path class="sf-decision-stop" d="M1115 635h200"/></g>
      <g class="sf-boundary-note"><path d="M1025 238h380"/>${label(1025, 210, 'INDEPENDENT DECISION BOUNDARY', 'sf-micro')}</g>${label(120, 690, 'Capital appears only when it constrains this order.', 'sf-statement')}${label(800, 758, 'Capital required · Evidence prepared · Financier decides', 'sf-mobile-caption', 'middle')}`;
  }

  function frameConfidence() {
    return `${editorialHeader(6, 'Confidence updates', 'New evidence changes the state of the order.')}
      <g class="sf-confidence-instrument" transform="translate(465 445)"><circle class="sf-secondary-line" cx="0" cy="0" r="250"/><circle class="sf-secondary-line sf-dashed" cx="0" cy="0" r="210"/><path class="sf-confidence-arc" d="M-188 92A209 209 0 0 1 184-100"/><path class="sf-secondary-line" d="M-215 0h-25M215 0h25M0-215v-25M0 215v25"/><circle class="sf-accent-fill" cx="185" cy="-99" r="9"/></g>
      ${orderObject(250, 325, 1.2, 'sf-resolved-order')}
      <g class="sf-confidence-copy">${label(755, 285, 'PRODUCTION CONFIDENCE', 'sf-callout-kicker')}${label(755, 363, 'Updated', 'sf-confidence-title')}${label(755, 410, 'Supplier evidence received', 'sf-callout-copy')}<path class="sf-stable-line" d="M755 452h255"/><circle class="sf-stable-node" cx="780" cy="452" r="7"/><circle class="sf-stable-node" cx="857" cy="452" r="7"/><circle class="sf-stable-node" cx="934" cy="452" r="7"/></g>
      <g class="sf-confirmation-return">${use('sf-confirmation', 720, 536, .76)}${label(762, 642, 'SUPPLIER CONFIRMATION', 'sf-callout-kicker', 'middle')}<path class="sf-return-route" d="M720 578C620 578 578 545 535 505"/></g>
      <g class="sf-delivery-stage">${use('sf-delivery', 1190, 343, 1.18)}${label(1285, 568, 'DELIVERY', 'sf-callout-kicker', 'middle')}${label(1285, 604, 'Order advances', 'sf-callout-copy', 'middle')}</g><path class="sf-delivery-route" d="M1025 451h150"/><path class="sf-delivery-arrow" d="m1155 438 20 13-20 13"/>${label(1020, 712, 'The commitment remains the governing object.', 'sf-statement', 'middle')}${label(800, 758, 'Supplier confirmed · Confidence updated · Delivery', 'sf-mobile-caption', 'middle')}`;
  }

  function artwork(index, prefix) {
    if (index === 0) return frameCommitment();
    if (index === 1) return frameNetwork();
    if (index === 2) return frameWarning(prefix);
    if (index === 3) return frameAction();
    if (index === 4) return frameFinance();
    return frameConfidence();
  }

  function renderFrame(index, prefix) {
    const frame = FRAMES[index];
    const description = `${frame.title}. ${frame.note} This is frame ${index + 1} of six in the One order through Drona workflow.`;
    return `<svg class="dof-svg" viewBox="0 0 1600 900" role="img" aria-labelledby="${prefix}-title ${prefix}-desc" preserveAspectRatio="xMidYMid meet"><title id="${prefix}-title">${frame.title}</title><desc id="${prefix}-desc">${description}</desc>${definitions(prefix)}<g class="dof-artwork" aria-hidden="true">${artwork(index, prefix)}</g></svg>`;
  }

  class DronaOrderStyleFrames {
    constructor(root, options = {}) {
      this.root = root;
      this.index = Math.max(0, Math.min(FRAMES.length - 1, Number(options.frame) || 0));
      this.prefix = `dof-${++serial}`;
      this.root.classList.add('drona-order-frame');
      this.render();
    }
    setFrame(index) {
      const next = Math.max(0, Math.min(FRAMES.length - 1, Number(index)));
      if (next === this.index) return;
      this.index = next;
      this.render();
      this.root.dispatchEvent(new CustomEvent('drona-frame-change', { detail: this.current() }));
    }
    next() { this.setFrame((this.index + 1) % FRAMES.length); }
    previous() { this.setFrame((this.index - 1 + FRAMES.length) % FRAMES.length); }
    current() { return { ...FRAMES[this.index], index: this.index, number: this.index + 1 }; }
    render() {
      this.root.dataset.frame = FRAMES[this.index].key;
      this.root.innerHTML = renderFrame(this.index, `${this.prefix}-${this.index}`);
    }
  }

  window.DronaOrderStyleFrames = DronaOrderStyleFrames;
  window.DRONA_ORDER_FRAMES = FRAMES;
})();
