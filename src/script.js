import * as THREE from 'three';
import { simulationFragmentShader, simulationVertexShader, renderFragmentShader, renderVertexShader } from './shader.js';
import { EffectComposer, RenderPass, FilmPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';

const createGradient = (context, height, stops, width) => {
  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );

  stops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });

  return gradient;

};

const createCanvas = (height, width) => {

  const canvas = document.createElement("canvas"); 
  canvas.height = height; 
  canvas.width = width; 

  return canvas;
}

document.addEventListener("DOMContentLoaded", async () => { 
  
  const STOPS = [
    { color: "#D9B8D9", offset: 0.00 }, 
    { color:"#dcabdc", offset:  0.15 }, 
    { color: "#A884C1", offset: 0.30 }, 
    { color: "#39355C", offset: 0.75 },
    { color: "#231530", offset: 1.00 }];

  const FONT_COLOR = "#EDD8B7";
  const BLUR_INTENSITY = 2.0;

  const scene = new THREE.Scene(); 
  const simScene = new THREE.Scene(); 
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const FONT = "picnicMain"

  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true, 
    preserveDrawingBuffer: true, 
  }); 

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);

  composer.addPass(renderPass);

  const params = {
    strength: 0.2,
    radius: 0.4,
    threshold: 0.85
  }

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), params.strength, params.radius, params.threshold);
  composer.addPass(bloomPass);

  const filmPass = new FilmPass(0.35, 0.0, 648.0, 0.0);
  composer.addPass(filmPass);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); 
  renderer.setSize(window.innerWidth, window.innerHeight); 

  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  composer.setSize(window.innerWidth, window.innerHeight);  

  document.body.appendChild(renderer.domElement); 
  
  const mouse = new THREE.Vector2(); 
  const targetMouse = new THREE.Vector2();
  const smoothMouse = new THREE.Vector2();

  let frame = 0; 
  const width = window.innerWidth * window.devicePixelRatio; 
  const height = window.innerHeight * window.devicePixelRatio;
  
  const options = { 
    format: THREE.RGBAFormat, 
    type: THREE.FloatType, 
    minFilter: THREE.LinearFilter, 
    magFilter: THREE.LinearFilter, 
    stencilBuffer: false, 
    depthBuffer: false, 
  }; 
  
  let rtA = new THREE.WebGLRenderTarget(width, height, options); 
  let rtB = new THREE.WebGLRenderTarget(width, height, options); 

  const simMaterial = new THREE.ShaderMaterial({ 
      uniforms: { 
        textureA: { value: null }, 
        mouse: { value: mouse }, 
        resolution: { value: new THREE.Vector2(width, height) }, 
        time: { value: 0 }, 
        frame: { value: 0 }, 
      }, 
      vertexShader: simulationVertexShader, 
      fragmentShader: simulationFragmentShader, 
    }); 

  const renderMaterial = new THREE.ShaderMaterial({ 
    uniforms: { 
      textureA: { value: null }, 
      textureB: { value: null },
      text: { value: null },
      mouse: { value: mouse }, 
      resolution: { value: new THREE.Vector2(width, height) },
      scroll: { value: 0 },
    }, 
    vertexShader: renderVertexShader, 
    fragmentShader: renderFragmentShader, 
    transparent: true,
    }); 
  
  const plane = new THREE.PlaneGeometry(2, 2); 
  const simQuad = new THREE.Mesh(plane, simMaterial); 
  const renderQuad = new THREE.Mesh(plane, renderMaterial); 

  simScene.add(simQuad); 
  scene.add(renderQuad); 

  const canvas = createCanvas(height, width);
  const canvasText = createCanvas(height, width);

  const ctx = canvas.getContext("2d", { alpha: true }); 
  const ctxText = canvasText.getContext("2d", { alpha: true }); 

  ctx.fillRect(0, 0, width, height); 
  
  ctx.fillStyle = createGradient(ctx, height, STOPS, width);
  ctx.fillRect(0, 0, width, height);

  const fontSize = Math.round(200 * window.devicePixelRatio); 
  await document.fonts.load(`bold ${fontSize}px ${FONT}`);
  
  ctxText.clearRect(0, 0, width, height);
  ctxText.fillStyle = FONT_COLOR; 
  ctxText.letterSpacing = "0.1rem";
  ctxText.textAlign = "center"; 
  ctxText.textBaseline = "middle"; 
  ctxText.font = `bold ${fontSize}px ${FONT}`; 
  ctxText.textRendering = "geometricPrecision"; 
  ctxText.filter = `blur(${BLUR_INTENSITY}px)`;
  ctxText.imageSmoothingEnabled = true; 
  ctxText.imageSmoothingQuality = "high";    

  ctxText.fillText("welcome", width/2, height/2); 

  const background = new THREE.CanvasTexture(canvas)
  background.minFilter = THREE.LinearFilter; 
  background.magFilter = THREE.LinearFilter; 
  background.format = THREE.RGBAFormat; 

  const textTexture = new THREE.CanvasTexture(canvasText);
  textTexture.minFilter = THREE.LinearFilter; 
  textTexture.magFilter = THREE.LinearFilter; 
  textTexture.format = THREE.RGBAFormat; 

  let scrollY = window.scrollY;

  window.addEventListener("scroll", () => {
    scrollY = window.scrollY;
  });
  

  window.addEventListener("resize", () => { 

    const newWidth = window.innerWidth * window.devicePixelRatio; 
    const newHeight = window.innerHeight * window.devicePixelRatio; 

    renderer.setSize(window.innerWidth, window.innerHeight); 
    rtA.setSize(newWidth, newHeight); 
    rtB.setSize(newWidth, newHeight); 
    simMaterial.uniforms.resolution.value.set(newWidth, newHeight); 
    
    canvas.width = newWidth; 
    canvas.height = newHeight; 
    ctx.fillRect(0, 0, newWidth, newHeight); 
  
    ctx.fillStyle = createGradient(ctx, height, STOPS, width);;
    ctx.fillRect(0, 0, width, height);

    const newFontSize = Math.round(250 * window.devicePixelRatio); 

    ctx.fillStyle = FONT_COLOR; 
    ctx.font = `bold ${newFontSize}px ${FONT}`; 
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle"; 
    ctx.textRendering = "geometricPrecision"; 
    ctx.filter = `blur(${BLUR_INTENSITY}px)`;
    ctx.imageSmoothingEnabled = true; 
    ctx.imageSmoothingQuality = "high"; 
    ctx.fillText("welcome", width/2, height/2); 

    textTexture.needsUpdate = true; 
  }); 

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX * window.devicePixelRatio; 
    mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio; 
    targetMouse.x = e.clientX / window.innerWidth;
    targetMouse.y = 1 - e.clientY / window.innerHeight;     
  });

  renderer.domElement.addEventListener("mouseleave", () => { 
    mouse.set(0, 0); 
  }); 
    
  const animate = () => { 

    simMaterial.uniforms.frame.value = frame++; 
    simMaterial.uniforms.time.value = performance.now() / 1000; 

    simMaterial.uniforms.textureA.value = rtA.texture; 
    renderer.setRenderTarget(rtB); 
    renderer.render(simScene, camera); 
    smoothMouse.lerp(targetMouse, 0.05);

    renderMaterial.uniforms.textureA.value = rtB.texture;
    renderMaterial.uniforms.text.value = textTexture; 
    renderMaterial.uniforms.textureB.value = background;
    renderMaterial.uniforms.mouse.value = smoothMouse;
    renderMaterial.uniforms.scroll.value = scrollY;

    renderer.setRenderTarget(null); 
    renderer.render(scene, camera);

    composer.render();

    

    const temp = rtA; 
    rtA = rtB; 
    rtB = temp;

    requestAnimationFrame(animate); 
  }; 
        
  animate(); 
      
}); 
