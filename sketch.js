// ============================================================
//  FLUID COSMIC TAPESTRY — Generative Image Formation
//  Upload an image, then watch particles flow organically
//  and gradually form your picture with cosmic effects.
//
//  Ready to run at: https://editor.p5js.org/
//  Paste this code into sketch.js and click Play.
// ============================================================

// ---- Canvas Dimensions ----
const W = 800;
const H = 800;

// ---- Particle Configuration ----
const NOISE_SCALE = 0.003;        // Perlin noise granularity for the flow-field

// ---- Runtime Controls (modified by sliders) ----
let speedMultiplier = 1.0;        // Animation speed (0.2 – 3.0)
let particleDensity = 2500;       // Number of active particles (500 – 5000)

// ---- State ----
let particles = [];
let img = null;                    // Uploaded image reference
let imgReady = false;              // True once image is loaded & processed
let zOff = 0;                      // Noise z-offset for animation
let formProgress = 0;              // 0 = free flow → 1 = fully formed
let isForming = true;              // Whether particles are being attracted to image
let isRecordingGif = false;        // GIF recording state

// ---- UI Elements ----
let fileInput;
let toggleBtn, resetBtn;
let speedSlider, densitySlider;
let speedValLabel, densityValLabel;
let progressBar;



// ============================================================
//  INJECT CSS — Styles for the control panel
//  (p5.js editor doesn't have a CSS file by default,
//   so we inject styles directly into the <head>)
// ============================================================
function injectStyles() {
  let css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* ---- Control Panel Container ---- */
    .cosmic-panel {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: linear-gradient(145deg, #0f0f1a 0%, #1a1028 100%);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 16px;
      padding: 20px 24px;
      margin-top: 16px;
      width: 800px;
      box-sizing: border-box;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4),
                  0 0 60px rgba(139, 92, 246, 0.06);
    }

    /* ---- Section Headers ---- */
    .cosmic-panel .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: rgba(196, 181, 253, 0.5);
      margin: 0 0 10px 0;
      padding: 0;
    }

    /* ---- Upload Area ---- */
    .upload-area {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px dashed rgba(139, 92, 246, 0.25);
      border-radius: 12px;
      padding: 14px 18px;
      transition: all 0.3s ease;
    }
    .upload-area:hover {
      border-color: rgba(139, 92, 246, 0.5);
      background: rgba(139, 92, 246, 0.05);
    }
    .upload-icon {
      font-size: 28px;
      line-height: 1;
    }
    .upload-text {
      font-size: 13px;
      color: #c4b5fd;
      margin: 0;
    }
    .upload-text span {
      display: block;
      font-size: 11px;
      color: rgba(196, 181, 253, 0.4);
      margin-top: 3px;
    }

    /* ---- Divider ---- */
    .cosmic-divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.2), transparent);
      margin: 16px 0;
      border: none;
    }

    /* ---- Slider Rows ---- */
    .slider-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 10px;
    }
    .slider-label {
      font-size: 12px;
      font-weight: 500;
      color: #a5b4fc;
      min-width: 60px;
    }
    .slider-value {
      font-size: 12px;
      font-weight: 600;
      color: #e0e7ff;
      min-width: 50px;
      text-align: right;
      font-variant-numeric: tabular-nums;
    }

    /* ---- Custom Range Slider ---- */
    .cosmic-panel input[type="range"] {
      -webkit-appearance: none;
      appearance: none;
      flex: 1;
      height: 6px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.08);
      outline: none;
      transition: background 0.2s;
    }
    .cosmic-panel input[type="range"]:hover {
      background: rgba(255, 255, 255, 0.12);
    }
    .cosmic-panel input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      cursor: pointer;
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.5),
                  0 2px 6px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .cosmic-panel input[type="range"]::-webkit-slider-thumb:hover {
      transform: scale(1.2);
      box-shadow: 0 0 16px rgba(139, 92, 246, 0.7),
                  0 2px 8px rgba(0, 0, 0, 0.4);
    }
    .cosmic-panel input[type="range"]::-moz-range-thumb {
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: linear-gradient(135deg, #8b5cf6, #a78bfa);
      cursor: pointer;
      border: none;
      box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
    }

    /* ---- Buttons Row ---- */
    .btn-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .cosmic-btn {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 8px 18px;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.25s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      letter-spacing: 0.2px;
    }
    .cosmic-btn:active { transform: scale(0.96); }

    .cosmic-btn.primary {
      background: linear-gradient(135deg, #7c3aed, #6d28d9);
      color: #fff;
      box-shadow: 0 2px 12px rgba(124, 58, 237, 0.35);
    }
    .cosmic-btn.primary:hover {
      background: linear-gradient(135deg, #8b5cf6, #7c3aed);
      box-shadow: 0 4px 20px rgba(124, 58, 237, 0.5);
    }

    .cosmic-btn.secondary {
      background: rgba(255, 255, 255, 0.06);
      color: #c4b5fd;
      border: 1px solid rgba(139, 92, 246, 0.15);
    }
    .cosmic-btn.secondary:hover {
      background: rgba(139, 92, 246, 0.12);
      border-color: rgba(139, 92, 246, 0.3);
      color: #e0e7ff;
    }



    /* ---- Progress Bar ---- */
    .progress-container {
      margin-top: 4px;
      margin-bottom: 6px;
    }
    .progress-label {
      font-size: 11px;
      color: rgba(196, 181, 253, 0.5);
      margin-bottom: 5px;
      display: flex;
      justify-content: space-between;
    }
    .progress-track {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 2px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, #8b5cf6, #ec4899, #22d3ee);
      border-radius: 2px;
      transition: width 0.3s ease;
    }

    /* ---- Keyboard Hint ---- */
    .kbd-hint {
      font-size: 10px;
      color: rgba(196, 181, 253, 0.3);
      margin-top: 12px;
      text-align: center;
    }
    .kbd-hint kbd {
      display: inline-block;
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      padding: 1px 6px;
      font-family: 'Inter', monospace;
      font-size: 10px;
      color: rgba(196, 181, 253, 0.5);
      margin: 0 1px;
    }

    /* ---- File input styling ---- */
    .cosmic-panel input[type="file"] {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      color: #a5b4fc;
    }
    .cosmic-panel input[type="file"]::file-selector-button {
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 12px;
      font-weight: 600;
      padding: 6px 14px;
      border: 1px solid rgba(139, 92, 246, 0.3);
      border-radius: 8px;
      background: rgba(139, 92, 246, 0.15);
      color: #c4b5fd;
      cursor: pointer;
      margin-right: 10px;
      transition: all 0.2s ease;
    }
    .cosmic-panel input[type="file"]::file-selector-button:hover {
      background: rgba(139, 92, 246, 0.25);
      border-color: rgba(139, 92, 246, 0.5);
    }
  `;

  let styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);
}

// ============================================================
//  SETUP
// ============================================================
function setup() {
  createCanvas(W, H);
  colorMode(HSB, 360, 100, 100, 1);
  background(0, 0, 5);

  // Inject our custom CSS into the page
  injectStyles();

  // ---- Build the control panel ----
  buildControlPanel();

  // Draw the welcome screen on canvas
  drawWelcomeScreen();
}

// ============================================================
//  BUILD CONTROL PANEL — Beautiful styled UI below the canvas
// ============================================================
function buildControlPanel() {
  // Main container
  let panel = createDiv('');
  panel.class('cosmic-panel');

  // ================ UPLOAD SECTION ================
  let uploadSection = createDiv('');
  uploadSection.class('upload-area');
  uploadSection.parent(panel);

  let uploadIcon = createSpan('🌌');
  uploadIcon.class('upload-icon');
  uploadIcon.parent(uploadSection);

  let uploadInfo = createDiv('');
  uploadInfo.parent(uploadSection);

  let uploadText = createP('Upload an image to transform');
  uploadText.class('upload-text');
  uploadText.parent(uploadInfo);

  let uploadHint = createElement('span', 'JPG, PNG or WebP — any size works');
  uploadHint.parent(uploadText);

  fileInput = createFileInput(handleFile);
  fileInput.parent(uploadSection);
  fileInput.style('margin-top', '4px');

  // ================ DIVIDER ================
  let div1 = createElement('hr');
  div1.class('cosmic-divider');
  div1.parent(panel);

  // ================ CONTROLS SECTION ================
  let controlsTitle = createP('CONTROLS');
  controlsTitle.class('section-title');
  controlsTitle.parent(panel);

  // ---- Speed Slider ----
  let speedRow = createDiv('');
  speedRow.class('slider-row');
  speedRow.parent(panel);

  let speedLbl = createSpan('Speed');
  speedLbl.class('slider-label');
  speedLbl.parent(speedRow);

  speedSlider = createSlider(0.2, 3.0, 1.0, 0.1);
  speedSlider.parent(speedRow);
  speedSlider.input(() => {
    speedMultiplier = speedSlider.value();
    speedValLabel.html(nf(speedMultiplier, 1, 1) + 'x');
  });

  speedValLabel = createSpan('1.0x');
  speedValLabel.class('slider-value');
  speedValLabel.parent(speedRow);

  // ---- Density Slider ----
  let densityRow = createDiv('');
  densityRow.class('slider-row');
  densityRow.parent(panel);

  let densityLbl = createSpan('Density');
  densityLbl.class('slider-label');
  densityLbl.parent(densityRow);

  densitySlider = createSlider(500, 5000, 2500, 100);
  densitySlider.parent(densityRow);
  densitySlider.input(() => {
    particleDensity = densitySlider.value();
    densityValLabel.html(particleDensity.toLocaleString());
    adjustParticleCount();
  });

  densityValLabel = createSpan('2,500');
  densityValLabel.class('slider-value');
  densityValLabel.parent(densityRow);

  // ================ PROGRESS BAR ================
  let progressContainer = createDiv('');
  progressContainer.class('progress-container');
  progressContainer.parent(panel);
  progressContainer.id('progress-section');
  progressContainer.style('display', 'none');

  let progressLabels = createDiv('');
  progressLabels.class('progress-label');
  progressLabels.parent(progressContainer);

  let progressLabelLeft = createSpan('Formation Progress');
  progressLabelLeft.parent(progressLabels);

  let progressLabelRight = createSpan('0%');
  progressLabelRight.parent(progressLabels);
  progressLabelRight.id('progress-pct');

  let progressTrack = createDiv('');
  progressTrack.class('progress-track');
  progressTrack.parent(progressContainer);

  progressBar = createDiv('');
  progressBar.class('progress-fill');
  progressBar.parent(progressTrack);

  // ================ DIVIDER ================
  let div2 = createElement('hr');
  div2.class('cosmic-divider');
  div2.parent(panel);

  // ================ ACTIONS SECTION ================
  let actionsTitle = createP('ACTIONS');
  actionsTitle.class('section-title');
  actionsTitle.parent(panel);

  let btnRow = createDiv('');
  btnRow.class('btn-row');
  btnRow.parent(panel);

  // Toggle Forming button
  toggleBtn = createButton('⏸  Pause');
  toggleBtn.class('cosmic-btn primary');
  toggleBtn.parent(btnRow);
  toggleBtn.mousePressed(toggleFormMode);
  toggleBtn.id('toggle-btn');
  toggleBtn.style('display', 'none');

  // Reset button
  resetBtn = createButton('↻  Reset');
  resetBtn.class('cosmic-btn secondary');
  resetBtn.parent(btnRow);
  resetBtn.mousePressed(resetSketch);
  resetBtn.id('reset-btn');
  resetBtn.style('display', 'none');

  // Save GIF button (4 seconds, optimized)
  let gifBtn = createButton('🎞  Save GIF (4s)');
  gifBtn.class('cosmic-btn secondary');
  gifBtn.parent(btnRow);
  gifBtn.mousePressed(startGifRecording);
  gifBtn.id('gif-btn');
  gifBtn.style('display', 'none');

  // ================ KEYBOARD HINTS ================
  let kbdHint = createDiv(
    '<kbd>Space</kbd> Pause &nbsp;&nbsp; <kbd>R</kbd> Reset &nbsp;&nbsp; <kbd>G</kbd> Save GIF'
  );
  kbdHint.class('kbd-hint');
  kbdHint.parent(panel);
}

// ============================================================
//  DRAW LOOP
// ============================================================
function draw() {
  if (!imgReady) return;

  // ---- Semi-transparent background wash for trailing effect ----
  noStroke();
  fill(0, 0, 5, 0.025);
  rect(0, 0, W, H);

  // ---- Gradually increase formProgress ----
  if (isForming && formProgress < 1) {
    formProgress += 0.0006 * speedMultiplier;
    formProgress = constrain(formProgress, 0, 1);
  }

  // ---- Update progress bar ----
  if (progressBar) {
    let pct = floor(formProgress * 100);
    progressBar.style('width', pct + '%');
    let pctLabel = select('#progress-pct');
    if (pctLabel) pctLabel.html(pct + '%');
  }

  // ---- Update & render all particles ----
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].display();
  }

  // ---- Geometric accent rings (occasionally, during early flow) ----
  if (frameCount % 200 === 0 && formProgress < 0.8) {
    drawGeometricAccent();
  }

  // ---- Advance noise z-offset for animation ----
  zOff += 0.0008 * speedMultiplier;
}

// ============================================================
//  HANDLE FILE UPLOAD
// ============================================================
function handleFile(file) {
  if (file.type === 'image') {
    img = loadImage(file.data, () => {
      // Resize source image to match canvas for pixel lookups
      img.resize(W, H);
      img.loadPixels();

      // Reset animation state
      formProgress = 0;
      isForming = true;
      imgReady = false;

      // Spawn particles
      initParticles();

      // Clear canvas & start drawing
      background(0, 0, 5);
      imgReady = true;

      // Show control buttons & progress bar
      showControls();
      toggleBtn.html('⏸  Pause');
    });
  }
}

// ---- Show control buttons once an image is loaded ----
function showControls() {
  select('#toggle-btn').style('display', 'inline-flex');
  select('#reset-btn').style('display', 'inline-flex');
  select('#gif-btn').style('display', 'inline-flex');
  select('#progress-section').style('display', 'block');
}

// ============================================================
//  PARTICLE INITIALIZATION
// ============================================================
function initParticles() {
  particles = [];
  for (let i = 0; i < particleDensity; i++) {
    particles.push(new Particle());
  }
}

// ---- Dynamically adjust particle count from density slider ----
function adjustParticleCount() {
  if (!imgReady) return;
  let target = particleDensity;
  if (target > particles.length) {
    for (let i = particles.length; i < target; i++) {
      particles.push(new Particle());
    }
  } else if (target < particles.length) {
    particles.length = target;
  }
}

// ============================================================
//  PARTICLE CLASS
// ============================================================
class Particle {
  constructor() {
    // Start at a random position across the canvas
    this.pos = createVector(random(W), random(H));
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.prevPos = this.pos.copy();

    // Target position on the image that this particle will migrate to
    this.target = createVector(random(W), random(H));

    // Visual properties
    this.size = random(1.0, 3.5);
    this.maxLife = random(200, 600);
    this.life = random(0, this.maxLife * 0.5);

    // Individual noise offset for movement variation
    this.noiseOffset = random(1000);
  }

  // ---- Compute flow-field force from multi-dimensional Perlin noise ----
  flowForce() {
    let angle = noise(
      this.pos.x * NOISE_SCALE,
      this.pos.y * NOISE_SCALE,
      zOff + this.noiseOffset * 0.001
    ) * TWO_PI * 4;

    let force = p5.Vector.fromAngle(angle);
    force.setMag(0.35 * speedMultiplier);
    return force;
  }

  // ---- Compute attraction force toward target (image) position ----
  attractForce() {
    let dir = p5.Vector.sub(this.target, this.pos);
    let dist = dir.mag();

    // Attraction strength grows with formProgress and distance
    let strength = map(dist, 0, W * 0.5, 0, 1.2) * formProgress * speedMultiplier;

    // Soft easing when very close to target
    if (dist < 5) strength *= 0.1;

    dir.setMag(strength);
    return dir;
  }

  update() {
    this.life++;

    // Recycle particle if lifespan exceeded (only during early flow phase)
    if (this.life > this.maxLife && formProgress < 0.85) {
      this.reset();
    }

    this.prevPos = this.pos.copy();

    // ---- Blend forces: flow vs. attraction ----
    let flow = this.flowForce();
    let attract = this.attractForce();

    // Weights shift as the image forms:
    //   Early: flow dominates → Late: attraction dominates
    let flowWeight = map(formProgress, 0, 1, 1.0, 0.15);
    let attractWeight = map(formProgress, 0, 1, 0.0, 1.0);

    // Subtle organic wobble so particles stay alive even when formed
    let wobble = createVector(
      sin(frameCount * 0.02 * speedMultiplier + this.noiseOffset) * 0.15,
      cos(frameCount * 0.025 * speedMultiplier + this.noiseOffset) * 0.15
    );

    flow.mult(flowWeight);
    attract.mult(attractWeight);

    this.acc.add(flow);
    this.acc.add(attract);
    this.acc.add(wobble);

    // Integrate velocity & position
    this.vel.add(this.acc);
    this.vel.limit(formProgress > 0.7 ? 2.0 : 3.5);
    this.vel.mult(0.92); // Damping / friction
    this.pos.add(this.vel);
    this.acc.mult(0);

    // Edge wrapping during free-flow; constrain during formation
    if (formProgress < 0.5) {
      if (this.pos.x > W) { this.pos.x = 0; this.prevPos.x = 0; }
      if (this.pos.x < 0) { this.pos.x = W; this.prevPos.x = W; }
      if (this.pos.y > H) { this.pos.y = 0; this.prevPos.y = 0; }
      if (this.pos.y < 0) { this.pos.y = H; this.prevPos.y = H; }
    } else {
      this.pos.x = constrain(this.pos.x, 0, W);
      this.pos.y = constrain(this.pos.y, 0, H);
    }
  }

  display() {
    if (!img) return;

    // ---- Sample color from the TARGET position on the source image ----
    let ix = floor(constrain(this.target.x, 0, img.width - 1));
    let iy = floor(constrain(this.target.y, 0, img.height - 1));
    let c = img.get(ix, iy);

    let h = hue(c);
    let s = saturation(c);
    let b = brightness(c);

    // ---- Shimmer: gentle hue variation over time ----
    let shimmer = sin(this.life * 0.06 + this.pos.x * 0.008) * 10;

    // ---- Alpha: fade in/out during flow; stabilize when formed ----
    let lifeFrac = this.life / this.maxLife;
    let alpha;
    if (formProgress > 0.8) {
      alpha = map(formProgress, 0.8, 1.0, 0.6, 0.85);
    } else {
      alpha = sin(lifeFrac * PI) * 0.7;
    }

    // ---- Boost vibrancy for a rich, neon look ----
    let finalH = (h + shimmer + 360) % 360;
    let finalS = constrain(s * 1.25, 15, 100);
    let finalB = constrain(b * 1.2 + 10, 30, 100);

    // ---- Size increases slightly as particles settle ----
    let dynamicSize = this.size * map(formProgress, 0, 1, 1.0, 1.5);

    // ---- Render as a short line segment (motion trail) ----
    strokeWeight(dynamicSize);
    stroke(finalH, finalS, finalB, alpha);
    line(this.prevPos.x, this.prevPos.y, this.pos.x, this.pos.y);
  }

  // ---- Reset particle to a new random position & target ----
  reset() {
    this.pos = createVector(random(W), random(H));
    this.prevPos = this.pos.copy();
    this.vel.mult(0);
    this.life = 0;
    this.target = createVector(random(W), random(H));
  }
}

// ============================================================
//  GEOMETRIC ACCENT — Soft concentric rings
// ============================================================
function drawGeometricAccent() {
  let cx = random(W * 0.15, W * 0.85);
  let cy = random(H * 0.15, H * 0.85);
  let maxR = random(50, 160);
  let h = random(360);

  push();
  noFill();
  strokeWeight(0.4);
  for (let r = 10; r < maxR; r += 7) {
    let a = map(r, 10, maxR, 0.12, 0.02);
    stroke(h, 55, 90, a);
    ellipse(cx, cy, r * 2, r * 2);
  }
  pop();
}

// ============================================================
//  WELCOME SCREEN
// ============================================================
function drawWelcomeScreen() {
  background(0, 0, 5);

  // Scatter decorative particles
  for (let i = 0; i < 150; i++) {
    let x = random(W);
    let y = random(H);
    let s = random(1, 3);
    let h = random(360);
    noStroke();
    fill(h, 70, 90, random(0.1, 0.4));
    ellipse(x, y, s, s);
  }

  // Title
  textAlign(CENTER, CENTER);
  textSize(28);
  fill(280, 60, 95);
  text('✦ Fluid Cosmic Tapestry', W / 2, H / 2 - 30);

  textSize(15);
  fill(0, 0, 70);
  text('Upload an image below to begin', W / 2, H / 2 + 15);

  textSize(12);
  fill(0, 0, 45);
  text('Particles will flow and gradually form your picture', W / 2, H / 2 + 45);
}



// ============================================================
//  TOGGLE FORMING MODE
// ============================================================
function toggleFormMode() {
  isForming = !isForming;
  toggleBtn.html(isForming ? '⏸  Pause' : '▶  Resume');
}

// ============================================================
//  RESET SKETCH
// ============================================================
function resetSketch() {
  if (!img) return;
  formProgress = 0;
  isForming = true;
  background(0, 0, 5);
  initParticles();
  toggleBtn.html('⏸  Pause');
}

// ============================================================
//  OPTIMIZED GIF RECORDING
// ============================================================
function startGifRecording() {
  if (isRecordingGif) return;
  isRecordingGif = true;
  
  let gifBtn = select('#gif-btn');
  if (gifBtn) {
    gifBtn.html('⏳ Recording (4s)...');
    gifBtn.style('opacity', '0.7');
  }

  // Use 20 FPS to allow a longer duration without exploding the frame count.
  // 80 frames @ 20 FPS = 4 seconds.
  // This keeps memory usage low and drastically reduces computer lag during encoding.
  frameRate(20);
  
  // Multiply speed by 3 (60/20) so the animation pace looks identical to 60fps
  speedMultiplier = speedSlider.value() * 3;
  
  // Capture exactly 80 frames to be safe
  saveGif('cosmic_tapestry', 80, { units: 'frames', silent: true })
    .then(() => {
      finishGifRecording();
    })
    .catch((e) => {
      console.error(e);
      finishGifRecording();
    });
    
  // Visual feedback for encoding phase (80 frames at 20fps takes ~4 seconds)
  setTimeout(() => {
    if (isRecordingGif && gifBtn) {
      gifBtn.html('⚙️ Encoding... (PC may pause)');
    }
  }, 4000);
}

function finishGifRecording() {
  isRecordingGif = false;
  frameRate(60);
  speedMultiplier = speedSlider.value();
  
  let gifBtn = select('#gif-btn');
  if (gifBtn) {
    gifBtn.html('🎞  Save GIF (4s)');
    gifBtn.style('opacity', '1');
  }
}

// ============================================================
//  KEYBOARD SHORTCUTS
//  Space = toggle  |  R = reset  |  G = save GIF
// ============================================================
function keyPressed() {
  if (key === 'r' || key === 'R') {
    resetSketch();
  }
  if (key === 'g' || key === 'G') {
    startGifRecording();
  }
  if (key === ' ') {
    toggleFormMode();
    return false; // Prevent page scroll
  }
}
