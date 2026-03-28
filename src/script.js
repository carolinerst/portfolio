import * as THREE from 'three';
import { simulationFragmentShader, simulationVertexShader, renderFragmentShader, renderVertexShader } from './shader.js';
import { EffectComposer, RenderPass, FilmPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';


const FONT_COLOR = "#EDD8B7";
const BLUR_INTENSITY = 2.0;
const FONT = "picnicMain";

const GRADIENT_STOPS = [{color: "#fffdf8", offset: 0.00}, 
  {color: "#f6debe", offset: 0.01}, 
  {color: "#ddb393", offset: 0.02}, 
  {color: "#b38a7a", offset: 0.75}, 
  {color: "#918887", offset: 1.00}
];

const addPass = (composer, passList) => {
  passList.forEach((pass) => composer.addPass(pass));
}; 

const createGradient = (context, height, width, stops) => {

  const gradient = context.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, Math.max(width, height) / 2
  );

  stops.forEach((stop) => {
    gradient.addColorStop(stop.offset, stop.color);
  });

  return gradient;
};

const createText = (context, height, width) => {

  const fontSize = Math.round(200 * window.devicePixelRatio); 

  context.fillRect(0, 0, width, height);
  context.fillStyle = FONT_COLOR; 
  context.font = `bold ${fontSize}px ${FONT}`; 
  context.letterSpacing = "0.1rem";
  context.textAlign = "center"; 
  context.textBaseline = "middle"; 
  context.textRendering = "geometricPrecision"; 
  context.filter = `blur(${BLUR_INTENSITY}px)`;
  context.imageSmoothingEnabled = true; 
  context.imageSmoothingQuality = "high"; 

  context.fillText("welcome", width/2, height/2); 

};

document.addEventListener("DOMContentLoaded", async () => { 
  
  const scene = new THREE.Scene(); 
  const simScene = new THREE.Scene(); 
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true, 
    preserveDrawingBuffer: true, 
  }); 

  const composer = new EffectComposer(renderer);
  const renderPass = new RenderPass(scene, camera);

  const bloomParams = {
    strength: 0.2,
    radius: 0.4,
    threshold: 0.85
  }

  const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), bloomParams.strength, bloomParams.radius, bloomParams.threshold);
  const filmPass = new FilmPass(0.35, 0.0, 648.0, 0.0);

  addPass(composer, [renderPass, bloomPass, filmPass]);

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
      mouse: { value: mouse }, 
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

  const canvas = document.createElement("canvas"); 

  canvas.height = height; 
  canvas.width = width; 
  const ctx = canvas.getContext("2d", { alpha: true }) 

  
  ctx.fillStyle = createGradient(ctx, height, width, GRADIENT_STOPS);


  const fontSize = Math.round(200 * window.devicePixelRatio); 
  await document.fonts.load(`bold ${fontSize}px ${FONT}`);
  
  createText(ctx, height, width);

  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.minFilter = THREE.LinearFilter; 
  textTexture.magFilter = THREE.LinearFilter; 
  textTexture.format = THREE.RGBAFormat; 

  window.addEventListener("resize", () => { 

    const newWidth = window.innerWidth * window.devicePixelRatio; 
    const newHeight = window.innerHeight * window.devicePixelRatio; 

    renderer.setSize(window.innerWidth, window.innerHeight); 
    rtA.setSize(newWidth, newHeight); 
    rtB.setSize(newWidth, newHeight); 
    simMaterial.uniforms.resolution.value.set(newWidth, newHeight); 
    
    canvas.width = newWidth; 
    canvas.height = newHeight; 
    
    ctx.fillStyle = createGradient(ctx, height, width, GRADIENT_STOPS);
    createText(ctx, newHeight, newWidth);
    textTexture.needsUpdate = true; 
  }); 

  renderer.domElement.addEventListener("mousemove", (e) => { 
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
    renderMaterial.uniforms.textureB.value = textTexture; 
    renderMaterial.uniforms.mouse.value = smoothMouse;

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
