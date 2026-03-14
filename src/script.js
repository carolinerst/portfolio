import * as THREE from 'three';
import { simulationFragmentShader, simulationVertexShader, renderFragmentShader, renderVertexShader } from './shader.js';
import { EffectComposer, RenderPass, FilmPass, BloomPass, UnrealBloomPass } from 'three/examples/jsm/Addons.js';
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
import { Vector2 } from 'three';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';


document.addEventListener("DOMContentLoaded", () => { 
  
  const backgroundColor = "#2f2963";
  const fontColor = "#B9ECB6";
  const BLUR_INTENSITY = 2.0;

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
  ctx.fillStyle = backgroundColor; 
  ctx.fillRect(0, 0, width, height); 

  const fontSize = Math.round(250 * window.devicePixelRatio); 

  ctx.fillStyle = fontColor; 
  ctx.font = `bold ${fontSize}px adelpheTrouble`; 
  ctx.textAlign = "center"; 
  ctx.textBaseline = "middle"; 
  ctx.textRendering = "geometricPrecision"; 
  ctx.filter = `blur(${BLUR_INTENSITY}px)`;
  ctx.imageSmoothingEnabled = true; 
  ctx.imageSmoothingQuality = "high"; 
  ctx.fillText("welcome", width/2, height/2); 

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
    ctx.fillStyle = backgroundColor; 
    ctx.fillRect(0, 0, newWidth, newHeight); 

    const newFontSize = Math.round(250 * window.devicePixelRatio); 

    ctx.fillStyle = fontColor; 
    ctx.font = `bold ${newFontSize}px adelpheTrouble`; 
    ctx.textAlign = "center"; 
    ctx.textBaseline = "middle"; 
    ctx.textRendering = "geometricPrecision"; 
    ctx.filter = `blur(${BLUR_INTENSITY}px)`;
    ctx.imageSmoothingEnabled = true; 
    ctx.imageSmoothingQuality = "high"; 
    ctx.fillText("welcome", width/2, height/2); 

    textTexture.needsUpdate = true; 
  }); 

  renderer.domElement.addEventListener("mousemove", (e) => { 
    mouse.x = e.clientX * window.devicePixelRatio; 
    mouse.y = (window.innerHeight - e.clientY) * window.devicePixelRatio; 
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

    renderMaterial.uniforms.textureA.value = rtB.texture; 
    renderMaterial.uniforms.textureB.value = textTexture; 

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
