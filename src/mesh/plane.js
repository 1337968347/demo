import * as THREE from 'three';

/**
 * 准备扇形切面
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 */
export const preparePlane = async (scene, globalUniform) => {

    // 加载扇形扫描区域
    const fillGeometry = new THREE.CircleGeometry(1, 10, -Math.PI / 5, globalUniform.probeAngleSize);
    // 填充材质
    const fillMaterial = new THREE.MeshLambertMaterial({
        color: 0xffffff,
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
    // 创建边框扇形
    fillCircle.name = 'fillPlaneMesh';

    const geometry = new THREE.CylinderGeometry(0.01, 0.01, 1, 6);
    // 创建边缘材质
    const lineMaterialL = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    const lineMaterialR = new THREE.MeshPhongMaterial({ color: 0xff0000 });
    const probeLineL = new THREE.Mesh(geometry, lineMaterialL);
    probeLineL.name = 'edgesPlaneMeshL';
    const probeLineR = new THREE.Mesh(geometry, lineMaterialR);
    probeLineR.name = 'edgesPlaneMeshR';
    scene.add(fillCircle)
    scene.add(probeLineL)
    scene.add(probeLineR)

    return {}
}
