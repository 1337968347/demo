import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadCoronaryGroup, loadCoronaryProbe } from './loader';
import { prepareCoronary } from './mesh/coronary';
import { preparePlane } from "./mesh/plane";
import { prepareProbe } from "./mesh/probe"

const Matrix4 = THREE.Matrix4;


const scene = new THREE.Scene();
const viewR = 7;
const camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, -viewR * 2, viewR * 2);
const renderer = new THREE.WebGLRenderer({ antialias: true });

let size = Math.min(window.innerWidth, window.innerHeight)
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
  size = Math.min(window.innerWidth, window.innerHeight)
  renderer.setSize(size, size);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
});

new OrbitControls(camera, renderer.domElement);

const globalUniform = {
  probePos: new THREE.Vector3(0, 5, 0),
  probeDirection: new THREE.Vector3(0, 0, -90),
  sunPos: new THREE.Vector3(0.0, 0, 5.0),
  lightColor: new THREE.Vector3(0.9, 0.9, 0.9)
}

const prepareScence = async () => {

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  var directiontLight = new THREE.DirectionalLight(0xffffff, 0.5);
  scene.add(ambientLight);
  scene.add(directiontLight);
  const coronaryGroup = await loadCoronaryGroup();
  const coronaryProbe = await loadCoronaryProbe();
  await prepareCoronary(coronaryGroup, scene, globalUniform);
  await preparePlane(scene)
  await prepareProbe(coronaryProbe.children[0].geometry, scene, globalUniform)

  tick();
}


prepareScence()


var render = function () {
  if (globalUniform.probeDirection.x >= 30) {
    globalUniform.probeDirection.x = -30
  }
  globalUniform.probeDirection.x += 0.1;

  // globalUniform.probePos.x += Math.random() / 100
  // globalUniform.probeDirection.y += Math.random();
  // globalUniform.probeDirection.z += Math.random();
  const T = new Matrix4().makeTranslation(globalUniform.probePos);
  const R = new Matrix4().makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(globalUniform.probeDirection.x),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.y),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.z),
    'XYZ'));

  /******************平面相关****************************/
  const fillMesh = scene.getObjectByName('fillPlaneMesh');
  const edgesMesh = scene.getObjectByName('edgesPlaneMesh');
  const planeScale = 8;
  const S = new Matrix4().makeScale(planeScale, planeScale, planeScale);
  const planeMat4 = new Matrix4().multiply(T).multiply(S).multiply(R);
  fillMesh.matrixAutoUpdate = edgesMesh.matrixAutoUpdate = false; // 禁止自动更新矩阵
  fillMesh.matrix = edgesMesh.matrix = planeMat4;
  /**********************************************/

  /*****************心脏相关**********************/
  const coronaryMat4 = new Matrix4().multiplyMatrices(T, R).invert();
  scene.traverse((object) => {
    if (object.name === 'coronaryBack' && object instanceof THREE.Mesh) {
      object.material.uniforms.plane.value = coronaryMat4.elements;
    }
  })
  /**********************************************/

  /*****************探头相关**********************/
  const probeMesh = scene.getObjectByName('probeMesh');
  const scale = 0.015;
  const probeMat4 = new Matrix4().makeRotationFromEuler(new THREE.Euler(
    -90,
    THREE.MathUtils.degToRad(-90),
    0,
    'XYZ'))
    .multiply(new Matrix4().makeScale(scale, scale, scale));
  probeMesh.matrixAutoUpdate = false; // 禁止自动更新矩阵
  probeMesh.matrix = new Matrix4().multiply(T).multiply(R).multiply(probeMat4);
  /**********************************************/

  renderer.render(scene, camera);
};

var tick = function () {
  requestAnimationFrame(tick);
  render();
};

