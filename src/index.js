import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js"

const Matrix4 = THREE.Matrix4;
const scene = new THREE.Scene();


// var camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, viewR, -viewR);
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);
var renderer = new THREE.WebGLRenderer();
camera.position.set(0, 0, 20)

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Resize after viewport-size-change
window.addEventListener("resize", function () {
  var height = window.innerHeight;
  var width = window.innerWidth;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Adding controls
new OrbitControls(camera, renderer.domElement);

let heartMesh = null;

const prepareScence = (heartGeometry) => {
  const circleR = 20;
  const T = new Matrix4().makeTranslation(-6, 10, 0);
  const S = new Matrix4().makeScale(circleR, circleR, circleR);
  const RX = new Matrix4().makeRotationX(-Math.PI / 2);
  const RY = new Matrix4().makeRotationY(Math.PI / 3);
  const RZ = new Matrix4().makeRotationX(Math.PI / 3);
  const mat4 = new Matrix4().multiply(T).multiply(S).multiply(RX).multiply(RY).multiply(RZ);


  const vertexShader = `
    varying vec3 vPosition; // 在顶点着色器中声明一个 varying 变量
    varying vec3 vNormal; // 定义一个 varying 变量用于传递法线

    void main() {
        vNormal = normalMatrix * normal; // 计算变换后的法线并传递给 varying 变量
        vPosition = position; // 将顶点位置传递给插值变量
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    uniform mat4 plane;
    varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
    varying vec3 vPosition;
    
    void main() {
        vec4 pos = plane * vec4(vPosition, 1.0);
        vec3 light = vec3(0.0, 1.0, 0.0);
        float alight = max(dot(light, vNormal) / 4.0, 0.0) + 0.5;

        if(pos.z > 0.0) {
            gl_FragColor =  vec4(alight, 0.0, 0.0, 0.6); // 设置像素颜色为半透明红色
        } else {
            gl_FragColor =  vec4(0.0, alight, 0.0, 1.0); // 设置像素颜色为半透明红色
        }
    }
  `

  const matElements = new Matrix4().copy(mat4).invert().elements
  const headMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      plane: { type: 'mat4', value: matElements }
    },
    transparent: true
  });

  heartMesh = new THREE.Mesh(heartGeometry, headMaterial);
  heartMesh.position.set(0, 0, 0);
  heartMesh.scale.set(0.2, 0.2, 0.2);


  // 加载扇形扫描区域
  const geometry = new THREE.CircleGeometry(1, 10, -Math.PI / 7, Math.PI / 3.5);
  // 填充材质
  const fillMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide, // 设置双面渲染
    opacity: 0.3,
    depthTest: false,
    transparent: true,
    
  });
  const fillCircle = new THREE.Mesh(geometry, fillMaterial);
  fillCircle.applyMatrix4(mat4);
  // 更新立方体对象的世界矩阵
  fillCircle.updateMatrixWorld();


  // 创建边框扇形
  const edgesGeometry = new THREE.EdgesGeometry(geometry);
  // 创建边缘材质
  const edgesMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00, // 设置边框颜色
    linewidth: 4, // 设置边框宽度
    opacity: 0.5,
    transparent: true
  });
  // 创建只包含扇形边缘的线条对象
  const edgesCircle = new THREE.LineSegments(edgesGeometry, edgesMaterial);

  edgesCircle.applyMatrix4(mat4);
  edgesCircle.updateMatrixWorld();

  scene.add(heartMesh);
  scene.add(fillCircle)
  scene.add(edgesCircle);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  var directiontLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(ambientLight);
  scene.add(directiontLight);
}

// 加载心脏模型
var loader = new STLLoader();
loader.load('Heart_N170111.stl', function (geometry) {
  prepareScence(geometry)
});



var render = function () {
  renderer.render(scene, camera);
};

var GameLoop = function () {
  requestAnimationFrame(GameLoop);
  render();
};

GameLoop();