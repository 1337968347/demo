import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { prepareCoronary } from './mesh/coronary'


const Matrix4 = THREE.Matrix4;
const scene = new THREE.Scene();

const viewR = 4;
const camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, -viewR * 2, viewR * 2);
// var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias: true });
// camera.position.z = 0.3;

renderer.setSize(Math.min(window.innerWidth, window.innerHeight), Math.min(window.innerWidth, window.innerHeight));
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
  const size = Math.min(window.innerWidth, window.innerHeight)
  renderer.setSize(size, size);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
});

// new OrbitControls(camera, renderer.domElement);

/**
 * 
 * @param {THREE.Group} group 
 */
const prepareScence = async (group) => {

  const circleR = 2;
  const S = new Matrix4().makeScale(circleR, circleR, circleR);
  const RX = new Matrix4().makeRotationX(-Math.PI / 2 - Math.PI / 6);
  const RY = new Matrix4().makeRotationY(-Math.PI / 2 - Math.PI / 6);
  const RZ = new Matrix4().makeRotationX(Math.PI / 3);
  // 切面的旋转
  const mat4 = new Matrix4().multiply(S).multiply(RX).multiply(RY).multiply(RZ);

  await prepareCoronary(group, scene, mat4);

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

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  var directiontLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(ambientLight);
  scene.add(directiontLight);

  scene.add(fillCircle)
  scene.add(edgesCircle)

  GameLoop();
}

var render = function () {
  renderer.render(scene, camera);
};

var GameLoop = function () {
  requestAnimationFrame(GameLoop);
  render();
};

const loader = new OBJLoader();


loader.load('heart.obj', async (group) => {

  // 心脏里面的血管
  const bloodGroup = new THREE.Group();
  /** 右心房 */
  const rightAtriumGroup = new THREE.Group();
  /** 右心房外壳 */
  const rightAtriumShellGroup = new THREE.Group();
  // 左心房
  const leftAtriumGroup = new THREE.Group();
  /** 左心房外壳 */
  const leftAtriumShellGroup = new THREE.Group();
  /** 心室 */
  const VentricleGroup = new THREE.Group();
  /** 壳 */
  const shellGroup = new THREE.Group();
  /** 主动脉 */
  const aortaGroup = new THREE.Group()
  /** 主动脉壳 */
  const aortaShellGroup = new THREE.Group();

  bloodGroup.add(group.children[0]);
  bloodGroup.add(group.children[0]);
  bloodGroup.add(group.children[0]);
  bloodGroup.add(group.children[0]);

  /** 右心房 */
  rightAtriumShellGroup.add(group.children[0])
  /** 右心房外壳 */
  rightAtriumGroup.add(group.children[0]);

  /** 左心房 */
  leftAtriumShellGroup.add(group.children[0]);
  leftAtriumGroup.add(group.children[0])
  /** 主动脉 */
  aortaGroup.add(group.children[0]);
  /** 主动脉壳 */
  aortaShellGroup.add(group.children[0]);

  const shellMesh = new THREE.Mesh(group.children[0].geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  shellGroup.add(shellMesh);
  group.remove(group.children[0])
  // 心室相关
  VentricleGroup.add(group.children[0]);


  bloodGroup.traverse((mesh) => { mesh.userData.type = 2 })
  rightAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
  rightAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
  leftAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
  leftAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
  VentricleGroup.traverse((mesh) => { mesh.userData.type = 1 })
  shellGroup.traverse((mesh) => { mesh.userData.type = 3 })
  aortaGroup.traverse((mesh) => { mesh.userData.type = 1 })
  aortaShellGroup.traverse((mesh) => { mesh.userData.type = 3 })

  const newGroup = new THREE.Group()
  newGroup.add(bloodGroup)
  newGroup.add(rightAtriumGroup)
  newGroup.add(rightAtriumShellGroup)

  newGroup.add(leftAtriumGroup)
  newGroup.add(leftAtriumShellGroup)

  newGroup.add(VentricleGroup)
  newGroup.add(shellGroup)

  newGroup.add(aortaGroup)
  newGroup.add(aortaShellGroup)

  prepareScence(newGroup)

});



