import * as THREE from 'three';
import { loadCoronaryGroup } from './loader';
import { prepareCoronary } from './mesh/coronary';
import { preparePlane } from "./mesh/plane";

const Matrix4 = THREE.Matrix4;


const scene = new THREE.Scene();
const viewR = 7;
const camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, -viewR * 2, viewR * 2);
const renderer = new THREE.WebGLRenderer({ antialias: true });
// camera.position.z = 0.3;

let size = Math.min(window.innerWidth, window.innerHeight)
renderer.setSize(size, size);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
  size = Math.min(window.innerWidth, window.innerHeight)
  renderer.setSize(size, size);
  camera.aspect = 1;
  camera.updateProjectionMatrix();
});

const globalUniform = {
  probePos: new THREE.Vector3(0, 6, 0),
  probeDirection: new THREE.Vector3(-30, 0, -90),
}

/**
 * @param {THREE.Group} group 
 */
const prepareScence = async (group) => {
  await prepareCoronary(group, scene, globalUniform);
  await preparePlane(scene, globalUniform)
  tick();
}

loadCoronaryGroup().then((group) => {
  prepareScence(group)
})

var render = function () {
  if (globalUniform.probeDirection.x >= 30) {
    globalUniform.probeDirection.x = -30
  }
  globalUniform.probeDirection.x += 0.1;
  // globalUniform.probeDirection.y += Math.random();
  // globalUniform.probeDirection.z += Math.random();
  const T = new Matrix4().makeTranslation(globalUniform.probePos);


  /******************平面相关****************************/
  const fillMesh = scene.getObjectByName('fillPlaneMesh');
  const edgesMesh = scene.getObjectByName('edgesPlaneMesh');
  const planeScale = 8;
  const S = new Matrix4().makeScale(planeScale, planeScale, planeScale);
  const R = new Matrix4().makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(globalUniform.probeDirection.x),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.y),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.z),
    'XYZ'));
  const planeMat4 = new Matrix4().multiply(T).multiply(S).multiply(R);
  fillMesh.matrixAutoUpdate = edgesMesh.matrixAutoUpdate = false; // 禁止自动更新矩阵
  fillMesh.matrix = edgesMesh.matrix = planeMat4;
  /**********************************************/

  const coronaryMat4 = new Matrix4().multiplyMatrices(T, R).invert();

  scene.traverse((object) => {
    if (object.name === 'coronaryBack' && object instanceof THREE.Mesh) {
      object.material.uniforms.plane.value = coronaryMat4.elements;
    }
  })

  renderer.render(scene, camera);
};

var tick = function () {
  requestAnimationFrame(tick);
  render();
};

