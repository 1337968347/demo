import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

const Matrix4 = THREE.Matrix4;
const scene = new THREE.Scene();

// var camera = new THREE.OrthographicCamera(-viewR, viewR, viewR, -viewR, viewR, -viewR);
var camera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 100);
var renderer = new THREE.WebGLRenderer();
camera.position.z = 5;

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

window.addEventListener("resize", function () {
  var height = window.innerHeight;
  var width = window.innerWidth;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

new OrbitControls(camera, renderer.domElement);

/**
 * 
 * @param {THREE.Group} group 
 * @param { {[key: string]: THREE.Texture} } textures
 */
const prepareScence = (group, textures) => {

  const { textureMap1, textureMap2, textureMap3, normalMap1, normalMap2, normalMap3 } = textures;

  const circleR = 20;
  // 物体的基础旋转
  const baseR = new Matrix4().makeRotationY(- Math.PI / 4).multiply(new Matrix4().makeRotationX(Math.PI / 12));

  const S = new Matrix4().makeScale(circleR, circleR, circleR);
  const RX = new Matrix4().makeRotationX(-Math.PI / 2 - Math.PI / 8);
  const RY = new Matrix4().makeRotationY(-Math.PI / 2);
  const RZ = new Matrix4().makeRotationX(Math.PI / 3);
  // 切面的旋转
  const mat4 = new Matrix4().multiply(new Matrix4().copy(baseR).invert()).multiply(S).multiply(RX).multiply(RY).multiply(RZ);

  /** 心脏顶点着色器 */
  const vertexShader = `
    varying vec3 vPosition; // 在顶点着色器中声明一个 varying 变量
    varying vec3 vNormal; // 定义一个 varying 变量用于传递法线
    varying vec2 vUv; // 传递给片元着色器的UV值变量

    void main() {
        vNormal = normalize(normalMatrix * normal); // 计算变换后的法线并传递给 varying 变量
        vPosition = position; // 将顶点位置传递给插值变量
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  /** 心脏片元着色器 */
  const fragmentShaderBack = `
        uniform float constantAttenuation;
        uniform float linearAttenuation;
        uniform float quadraticAttenuation;
        uniform vec3 sunPos;
        uniform mat4 plane;
        uniform sampler2D textureMap;
        uniform sampler2D normalMap;
        varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
            vec4 pos = plane * vec4(vPosition, 1.0);
            float len = distance(sunPos, vPosition);
        
            vec3 normal = normalize(texture2D(normalMap, vUv).xyz);
            // 纹理颜色
            vec3 textureColor = texture2D(textureMap, vUv).xyz;


            if(gl_FrontFacing == false) {
                textureColor = vec3(0.88, 0.53, 0.53);
                // normal = -normal;
                normal = vec3(0.0, 0.0, 1.0);
            }
        
            // 计算距离衰减因子
            float attenuation = 1.0 / (constantAttenuation + linearAttenuation * len + quadraticAttenuation * len * len);
            vec3 light = normalize(sunPos - vPosition);
            float alight = (max(dot(light, normal), 0.0)) ;
        
            // alight += 0.15;
            // if(abs(pos.z) < 0.00002) {
            //     gl_FragColor = vec4(0.2, 0.6, 0.2, 1.0);
            // } else {
                if(pos.z > 0.0) {
                    discard;
                } else {
                    gl_FragColor = vec4(textureColor * alight, 1.0); // 设置像素颜色为半透明红色
                }
            // }
        }
  `

  const fragmentShaderFront = `
        uniform float constantAttenuation;
        uniform float linearAttenuation;
        uniform float quadraticAttenuation;
        uniform mat4 plane;
        uniform vec3 sunPos;
        uniform vec3 baseColor;
        varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
        varying vec3 vPosition;
        
        void main() {
            vec4 pos = plane * vec4(vPosition, 1.0);
            float len = distance(sunPos, vPosition);
            vec3 normal = normalize(vNormal);
            if(gl_FrontFacing == false) {
                normal = -normal;
            }
            // 计算距离衰减因子
            float attenuation = 1.0 / (constantAttenuation + linearAttenuation * len + quadraticAttenuation * len * len);
            vec3 light = normalize(sunPos - vPosition);
            float alight = max(dot(light, normal) / 2.0, 0.0) * attenuation;

            alight += 0.25;
            if(pos.z < 0.0) {
                discard;
            } else {
                gl_FragColor = vec4(alight * baseColor, 0.1);
            }
        }
      `

  const matElements = new Matrix4().copy(mat4).invert()
  const sunPos = new THREE.Vector3(0.0, 0, 2.0);

  group.traverse((mesh) => {
    if (mesh instanceof THREE.Mesh) {
      const scale = 2;
      mesh.position.set(0, 0, 0);
      mesh.scale.setScalar(scale);
      let textureMap = null, normalMap = null;
      switch (mesh.userData.type) {
        case 1:
          textureMap = textureMap1;
          normalMap = normalMap1;
          break;
        case 2:
          textureMap = textureMap2;
          normalMap = normalMap2;
          break;
        case 3:
          textureMap = textureMap3;
          normalMap = normalMap3;
          break;
        default:
          break;
      }

      const uniforms = {
        plane: { type: 'mat4', value: matElements },
        sunPos: { type: 'vec3', value: sunPos },
        constantAttenuation: { type: 'float', value: 1.0 },
        linearAttenuation: { type: 'float', value: 0.02 },
        quadraticAttenuation: { type: 'float', value: 0.005 },
        // baseColor: { type: 'vec3', value: mesh.userData.color },
        textureMap: { type: 'sampler2D', value: textureMap },
        normalMap: { type: 'sampler2D', value: normalMap },
      }

      /** 心脏背面 后侧不透明 */
      const coronaryBackMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderBack,
        side: THREE.DoubleSide,
        transparent: false,
        uniforms: uniforms
      });

      const backMesh = mesh.clone();
      const frontMesh = mesh.clone();
      backMesh.material = coronaryBackMaterial;
      backMesh.applyMatrix4(baseR);
      scene.add(backMesh);

      /** 心脏前面  前侧透明 */
      const coronaryFrontMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexShader,
        fragmentShader: fragmentShaderFront,
        // side: THREE.DoubleSide,
        transparent: false,
        depthTest: true,
        depthWrite: false,
        uniforms: uniforms,

        blending: THREE.CustomBlending, // 设置自定义混合模式
        blendSrc: THREE.SrcAlphaFactor, // 设置源混合因子
        blendDst: THREE.OneMinusSrcAlphaFactor, // 设置目标混合因子
        blendEquation: THREE.AddEquation // 设置混合方程
      });

      frontMesh.material = coronaryFrontMaterial;
      frontMesh.applyMatrix4(baseR);
      // scene.add(frontMesh);
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

  var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  var directiontLight = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(ambientLight);
  scene.add(directiontLight);
}

// 加载心脏模型
const loader = new OBJLoader();
const textLoader = new THREE.TextureLoader();

/**
 * 加载一堆纹理
 * @param {String[]} urls 
 */
const loadTextures = async (urls) => {
  const promises = urls.map((url) => {
    return new Promise((resolve, reject) => {
      textLoader.load(
        'textures/' + url,
        (texture) => {
          resolve(texture)
        },
        undefined,
        // onError callback
        (err) => {
          reject('An error happened.')
        }
      );
    })
  })
  return await Promise.all(promises)
}

var render = function () {
  renderer.render(scene, camera);
};

var GameLoop = function () {
  requestAnimationFrame(GameLoop);
  render();
};

loader.load('heart.obj', async (group) => {

  const [
    textureMap1, textureMap2, textureMap3,
    normalMap1, normalMap2, normalMap3
  ] = await loadTextures([
    // 纹理
    'Tex_0058.png', 'Tex_0414.png', 'Tex_0053.png', 
    // 法线
    'Tex_0057.png', 'Tex_0177.png', 'Tex_0050.png',
  ])

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
  // /** 右心室 */
  // const rightVentricleGroup = new THREE.Group();
  /** 壳 */
  const shellGroup = new THREE.Group();
  /** 主动脉 */
  const aortaGroup = new THREE.Group()
  /** 主动脉壳 */
  const aortaShellGroup = new THREE.Group();
  group.remove(group.children[0]);
  group.remove(group.children[0]);
  group.remove(group.children[0]);
  group.remove(group.children[0]);
  bloodGroup.add(group.children[0]);
  bloodGroup.add(group.children[0]);

  // /** 右心房 */
  rightAtriumShellGroup.add(group.children[0])
  // /** 右心房外壳 */
  rightAtriumGroup.add(group.children[0]);

  // /** 左心房 */
  leftAtriumShellGroup.add(group.children[0]);
  leftAtriumGroup.add(group.children[0])
  // /** 主动脉 */
  aortaGroup.add(group.children[0]);
  /** 主动脉壳 */
  group.remove(group.children[0]);

  aortaGroup.add(group.children[0]);
  aortaShellGroup.add(group.children[0]);
  aortaGroup.add(group.children[0]);
  // aortaShellGroup.add(group.children[0]);

  bloodGroup.traverse((mesh) => { mesh.userData.type = 2 })
  rightAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
  rightAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
  leftAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
  leftAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
  VentricleGroup.traverse((mesh) => { mesh.userData.type = 3 })
  shellGroup.traverse((mesh) => { mesh.userData.type = 1 })
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

  prepareScence(newGroup, { textureMap1, textureMap2, textureMap3, normalMap1, normalMap2, normalMap3 })
  GameLoop();
});



