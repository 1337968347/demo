import * as THREE from 'three';
import { loadShaders } from "../loader"
const Matrix4 = THREE.Matrix4;

/**
 * 准备扇形切面
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 * @param {Object}
 */
export const preparePlane = async (scene, globalUniform, config) => {
    const { probeGeometry, isNorm, planeColor } = config;


    const [probeVert, probeFrag] = await loadShaders(['probe.vert', 'probe.frag'])
    // 填充材质
    const probeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            sunPos: { type: 'vec3', value: globalUniform.sunPos },
            lightColor: { type: 'vec3', value: isNorm ? new THREE.Vector3(0.7, 0.4, 0.4) : globalUniform.lightColor },
        },
        vertexShader: probeVert,
        fragmentShader: probeFrag,
        transparent: false,
    });
    const probe = new THREE.Mesh(probeGeometry, probeMaterial);

    // 加载扇形扫描区域
    const fillGeometry = new THREE.CircleGeometry(1, 15, -globalUniform.probeAngleSize / 2, globalUniform.probeAngleSize);
    // 填充材质
    const fillMaterial = new THREE.MeshPhongMaterial({
        color: planeColor,
        side: THREE.DoubleSide, // 设置双面渲染
        opacity: 0.5,
        depthTest: true,
        depthWrite: true,
        transparent: true,
        blending: THREE.CustomBlending, // 设置自定义混合模式
        blendSrc: THREE.SrcAlphaFactor, // 设置源混合因子
        blendDst: THREE.OneFactor, // 设置目标混合因子
        blendEquation: THREE.AddEquation // 设置混合方程
    });
    const fillCircle = new THREE.Mesh(fillGeometry, fillMaterial);
    // 创建边框扇形
    fillCircle.name = 'fillPlaneMesh';
    const geometry = new THREE.CylinderGeometry(0.003, 0.003, 1, 6);
    // 创建边缘材质
    const lineMaterialL = new THREE.MeshPhongMaterial({ color: 0x00AA00 });
    const lineMaterialR = new THREE.MeshPhongMaterial({ color: 0xAA0000 });
    const probeLineL = new THREE.Mesh(geometry, lineMaterialL);
    probeLineL.name = 'edgesPlaneMeshL';
    const probeLineR = new THREE.Mesh(geometry, lineMaterialR);
    probeLineR.name = 'edgesPlaneMeshR';

    let sprite = null;
    if (!isNorm) {
        // 创建P图标
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 32;
        canvas.height = 32;

        // 2. 设置文字样式
        context.font = '18px Arial';
        context.fillStyle = 'red';
        context.fillText('P', 6, 27);
        const texture = new THREE.CanvasTexture(canvas);
        sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.name = 'probeText';
    }

    const group = new THREE.Group();

    group.userData.tick = (scene) => {
        const planeScale = 8;
        const S = new Matrix4().makeScale(planeScale, planeScale, planeScale);
        fillCircle && (fillCircle.matrixAutoUpdate = false);
        probeLineL && (probeLineL.matrixAutoUpdate = false);
        probeLineR && (probeLineR.matrixAutoUpdate = false);
        sprite && (sprite.matrixAutoUpdate = false);
        const probeLineLocalMat4 = new Matrix4().makeRotationZ(THREE.MathUtils.degToRad(-90))
            .multiply(new Matrix4().makeTranslation(0, 0.5, 0));
        const lineOffset = new Matrix4().makeRotationZ(globalUniform.probeAngleSize / 2);
        fillCircle && (fillCircle.matrix = new Matrix4().multiply(S));
        probeLineL && (probeLineL.matrix = new Matrix4().multiply(S).multiply(lineOffset).multiply(probeLineLocalMat4));
        probeLineR && (probeLineR.matrix = new Matrix4().multiply(S).multiply(new Matrix4().copy(lineOffset).invert()).multiply(probeLineLocalMat4));
        // 探头文字相关
        const tipOffset = new Matrix4().multiply(new Matrix4().makeRotationZ(THREE.MathUtils.degToRad(60)))
            .multiply(new Matrix4().makeTranslation(1, 0, 0));
        sprite && (sprite.matrix = new Matrix4().multiply(tipOffset));

        const scale = isNorm ? 0.015 : 0.025;
        const probeMat4 = new Matrix4().makeRotationFromEuler(new THREE.Euler(
            THREE.MathUtils.degToRad(-90),
            THREE.MathUtils.degToRad(-90),
            0,
            'XYZ'))
            .multiply(new Matrix4().makeScale(scale, scale, scale));
        probe.matrixAutoUpdate = false;
        probe.matrix = new Matrix4().multiply(probeMat4);


    }
    group.add(fillCircle)
    group.add(probe);
    if (!isNorm) {
        group.add(probeLineL)
        group.add(sprite)
        group.add(probeLineR)
    }
    return group
}
