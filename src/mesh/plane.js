import * as THREE from 'three';

/**
 * 准备扇形切面
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 * @param {Object}
 */
export const preparePlane = async (scene, globalUniform, config) => {

    const isNorm = config.isNorm;
    // 加载扇形扫描区域
    const fillGeometry = new THREE.CircleGeometry(1, 15, -globalUniform.probeAngleSize / 2, globalUniform.probeAngleSize);
    // 填充材质
    const fillMaterial = new THREE.MeshLambertMaterial({
        color: config.planeColor,
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
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
    sprite.name = 'probeText';

    const group = new THREE.Group();

    group.add(fillCircle)
    if (!isNorm) {
        group.add(probeLineL)
        group.add(sprite)
        group.add(probeLineR)
    }
    return group
}
