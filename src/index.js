import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadCoronaryGroup, loadCoronaryProbe } from './loader';
import { prepareCoronary } from './mesh/coronary';
import { preparePlane } from "./mesh/plane";

const Matrix4 = THREE.Matrix4;


const scene = new THREE.Scene();
const viewR = 12;
const camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, -viewR, viewR);
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
  /** 探头实时切面 */
  probePos: new THREE.Vector3(0, 4.5, 0),
  probeDirection: new THREE.Vector3(0, 0, -90),
  /** 标准实时切面 */
  sProbePos: new THREE.Vector3(-3, 0.5, 0),
  sProbeDirection: new THREE.Vector3(0, 0, 0),

  probeAngleSize: THREE.MathUtils.degToRad(60),
  /** 标准切面 */
  sunPos: new THREE.Vector3(0.0, 1.0, 6.0),
  lightColor: new THREE.Vector3(0.9, 0.9, 0.9)
}
/** 实时探头平面 */
let realTimeProbePlane = null;
/** 标准探头平面 */
let normProbePlane = null;
let coronaryBack = null;
let coronaryFront = null;
let ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
let directiontLight = new THREE.DirectionalLight(0xffffff, 0.5);

const prepareScence = async () => {

  /** 加载模型 */
  const coronaryMeshGroup = await loadCoronaryGroup();
  const coronaryProbeMesh = await loadCoronaryProbe();
  const probeGeometry = coronaryProbeMesh.children[0].geometry
  // 初始化 材质
  const { backGroup, frontGroup } = await prepareCoronary(coronaryMeshGroup, scene, globalUniform);
  realTimeProbePlane = await preparePlane(scene, globalUniform, { planeColor: 0xffffff, isNorm: false, probeGeometry });
  normProbePlane = await preparePlane(scene, globalUniform, { planeColor: 0xAAAAAA, isNorm: true, probeGeometry });
  coronaryBack = backGroup;
  coronaryFront = frontGroup;

  tick();
}


prepareScence()


var render = function () {

  // 清空场景中的所有对象
  scene.children.forEach(child => {
    scene.remove(child);
  });

  scene.add(coronaryBack)
  scene.add(coronaryFront)
  scene.add(realTimeProbePlane)
  scene.add(normProbePlane)
  scene.add(ambientLight)
  scene.add(directiontLight)

  // if (globalUniform.probeDirection.x >= 40) {
  //   globalUniform.probeDirection.x = -30
  // }

  if (globalUniform.probePos.y <= -3) {
    globalUniform.probePos.y = 4
  }

  // globalUniform.sunPos.z += 0.03;

  // globalUniform.probeDirection.x += 0.1;
  globalUniform.probeDirection.y += 0.2;
  // globalUniform.probePos.y -= 0.02;


  const planeScale = 8;
  const S = new Matrix4().makeScale(planeScale, planeScale, planeScale);
  const T = new Matrix4().makeTranslation(globalUniform.probePos);
  const R = new Matrix4().makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(globalUniform.probeDirection.x),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.y),
    THREE.MathUtils.degToRad(globalUniform.probeDirection.z),
    'XYZ'));
  const planeMat4 = new Matrix4().multiply(T).multiply(R).multiply(S);
  const lineOffset = new Matrix4().makeRotationZ(globalUniform.probeAngleSize / 2);
  /******************实时探头平面相关****************************/
  realTimeProbePlane && (realTimeProbePlane.matrixAutoUpdate = false);
  realTimeProbePlane.matrix = new Matrix4().multiply(T).multiply(R)
  realTimeProbePlane.userData.tick(scene)

  /*********************标准切面相关******************************/

  const T1 = new Matrix4().makeTranslation(globalUniform.sProbePos);
  const R1 = new Matrix4().makeRotationFromEuler(new THREE.Euler(
    THREE.MathUtils.degToRad(globalUniform.sProbeDirection.x),
    THREE.MathUtils.degToRad(globalUniform.sProbeDirection.y),
    THREE.MathUtils.degToRad(globalUniform.sProbeDirection.z),
    'XYZ'));
  normProbePlane && (normProbePlane.matrixAutoUpdate = false);
  normProbePlane.matrix = new Matrix4().multiply(T1).multiply(R1)
  normProbePlane.userData.tick(scene)

  /*************************************************************/


  /*****************心脏相关**********************/
  let lineLVec3 = new THREE.Vector3(1, 0, 0).applyMatrix4(new Matrix4().multiply(planeMat4).multiply(lineOffset))
  let lineRVec3 = new THREE.Vector3(1, 0, 0).applyMatrix4(new Matrix4().multiply(planeMat4).multiply(new Matrix4().copy(lineOffset).invert()))

  // console.log(lineLVec3, lineRVec3)
  const coronaryMat4 = new Matrix4().multiplyMatrices(T, R).invert();
  // console.log(new THREE.Vector3().subVectors(lineLVec3, globalUniform.probePos).normalize(),
  //   new THREE.Vector3().subVectors(lineRVec3, globalUniform.probePos).normalize())

  scene.traverse((object) => {
    if (object.name === 'coronary' && object instanceof THREE.Mesh) {
      object.material.uniforms.plane.value = coronaryMat4;
      object.material.uniforms.probePos.value = globalUniform.probePos;
      object.material.uniforms.lineL.value = lineLVec3;
      object.material.uniforms.lineR.value = lineRVec3;
    }
  })
  /**********************************************/

  renderer.render(scene, camera);
};

var tick = function () {
  requestAnimationFrame(tick);
  render();
};

