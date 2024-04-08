import * as THREE from 'three';

/**
 * 准备扇形切面
 * @param {THREE.Scene} scene 
 */
export const preparePlane = async (scene) => {
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
    var ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
    var directiontLight = new THREE.DirectionalLight(0xffffff, 1);
    scene.add(ambientLight);
    scene.add(directiontLight);

    fillCircle.name = 'fillPlaneMesh';
    edgesCircle.name = 'edgesPlaneMesh';
    scene.add(fillCircle)
    scene.add(edgesCircle)

    return {}
}
