import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const Matrix4 = THREE.Matrix4;
const scene = new THREE.Scene();

const viewR = 0.25
// var camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, viewR, -viewR);
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 2000);
var renderer = new THREE.WebGLRenderer();
camera.position.z = 5;

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

let coronaryBackMesh = null;
let coronaryFrontMesh = null;

/**
 * 
 * @param {THREE.Group} heartGroup 
 */
const prepareScence = (heartGroup) => {
  const circleR = 20;
  const T = new Matrix4().makeTranslation(-6, 0, 0);
  const S = new Matrix4().makeScale(circleR, circleR, circleR);
  const RX = new Matrix4().makeRotationX(-Math.PI / 2);
  const RY = new Matrix4().makeRotationY(Math.PI / 3);
  const RZ = new Matrix4().makeRotationX(Math.PI / 3);
  const mat4 = new Matrix4().multiply(S).multiply(RX).multiply(RY).multiply(RZ);

  /** 心脏顶点着色器 */
  const vertexShader = `
    varying vec3 vPosition; // 在顶点着色器中声明一个 varying 变量
    varying vec3 vNormal; // 定义一个 varying 变量用于传递法线

    void main() {
        vNormal = normalize(normal); // 计算变换后的法线并传递给 varying 变量
        vPosition = position; // 将顶点位置传递给插值变量
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /** 心脏片元着色器 */
  const fragmentShaderBack = `
    uniform mat4 plane;
    varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
    varying vec3 vPosition;
    
    void main() {
        vec4 pos = plane * vec4(vPosition, 1.0);
        vec3 light = vec3(0.0, 0.0, -1.0);
        float alight = max(dot(light, vNormal) / 4.0, 0.0) + 0.5;

        if(abs(pos.z) < 0.015) {
          gl_FragColor = vec4(0, 0.6, 0.0, 1.0);
        } else {
          if(pos.z > 0.0) {
            discard;
        } else {
            gl_FragColor =  vec4(alight, 0.0, 0.0, 1.0); // 设置像素颜色为半透明红色
        }
        }
    }
  `

  const fragmentShaderFront = `
        uniform mat4 plane;
        varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
        varying vec3 vPosition;
        
        void main() {
            vec4 pos = plane * vec4(vPosition, 1.0);
            vec3 sunPos = vec3(10.0, 10.0, 20.0);
            float len = distance(sunPos, vPosition);
            
            // 计算距离衰减因子
            float attenuation = 1.0 / (0.10 + 0.02 * len + 0.0005 * len * len);
            vec3 light = normalize(vPosition - sunPos);
            float alight = max(dot(light, vNormal) / 2.0, 0.0) * attenuation;
            
            alight += 0.15;
            if(abs(pos.z) < 0.00008) {
              gl_FragColor = vec4(0.2, 0.6, 0.0, 1.0);
            } else {
              if(pos.z > 0.0) {
                discard;
              } else {
                gl_FragColor = vec4(alight, 0.0, 0.0, 1.0);// 设置像素颜色为半透明红色
              }
            }
        }
      `

  const matElements = new Matrix4().copy(mat4).invert()

  /** 心脏背面 */
  const coronaryBackMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShaderBack,
    // side: THREE.DoubleSide,
    // transparent: false,
    // depthTest: true,
    // depthWrite: true,
    uniforms: {
      plane: { type: 'mat4', value: matElements }
    },
  });

  /** 心脏前面 */
  const coronaryFrontMaterial = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShaderFront,
    side: THREE.DoubleSide,
    uniforms: {
      plane: { type: 'mat4', value: matElements }
    },
    // transparent: true,
    // depthTest: true,
    // depthWrite: true
  });

  heartGroup.traverse((mesh) => {
    if (mesh instanceof THREE.Mesh) {
      const scale = 40;
      mesh.position.set(0, 0, 0);
      mesh.scale.setScalar(scale);
      mesh.material = coronaryFrontMaterial;
    }
  })

  // 加载扇形扫描区域
  const fillGeometry = new THREE.CircleGeometry(1, 10, -Math.PI / 7, Math.PI / 3.5);
  // 填充材质
  const fillMaterial = new THREE.MeshLambertMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide, // 设置双面渲染
    opacity: 0.3,
    depthTest: true,
    depthWrite: true,
    transparent: true,
    blending: THREE.CustomBlending, // 设置自定义混合模式
    blendSrc: THREE.SrcAlphaFactor, // 设置源混合因子
    blendDst: THREE.OneFactor, // 设置目标混合因子
    blendEquation: THREE.AddEquation // 设置混合方程
  });
  const fillCircle = new THREE.Mesh(fillGeometry, fillMaterial);
  fillCircle.applyMatrix4(mat4);
  // 更新立方体对象的世界矩阵
  fillCircle.updateMatrixWorld();

  // 创建边框扇形
  const edgesGeometry = new THREE.EdgesGeometry(fillGeometry);
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

  scene.add(heartGroup);
  // scene.add(fillCircle)
  // scene.add(edgesCircle);
  // scene.add(coronaryFrontMesh);

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  var directiontLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(ambientLight);
  scene.add(directiontLight);
}

// 加载心脏模型
const loader = new OBJLoader();
loader.load('demo.obj', function (group) {
  // prepareScence(geometry)

  const innerGroup = new THREE.Group();
  const outerGroup = new THREE.Group();
  const side = 4;

  for (let i = 0; i < side; i++) { innerGroup.add(group.children[i]) }

  for (let i = side; i < group.children.length; i++) { outerGroup.add(group.children[i]) }

  // scene.add(innerGroup);
  // scene.add(outerGroup);
  prepareScence(outerGroup)
});

var render = function () {
  renderer.render(scene, camera);
};

var GameLoop = function () {
  requestAnimationFrame(GameLoop);
  render();
};

GameLoop();