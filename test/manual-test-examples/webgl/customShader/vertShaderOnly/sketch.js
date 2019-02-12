let vertDisplacementShader;

function preload() {
  vertDisplacementShader = loadShader('vert.glsl');
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  noStroke();
  shader(vertDisplacementShader);
  
}

function draw() {
  vertDisplacementShader.setUniform('uMaterialColor', [0.45,0,0.6,1]);
  vertDisplacementShader.setUniform('uTime', frameCount * 0.01);
  background(0);
  sphere(120);
}
