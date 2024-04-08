import * as THREE from 'three';

/**
 * 探头
 * @param {THREE.BufferGeometry} geometry 
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 * @returns 
 */
export const prepareProbe = async (geometry, scene, globalUniform) => {
    // 填充材质
    const probeMaterial = new THREE.MeshLambertMaterial({
        // fragmentShader: '',
        // side: THREE.DoubleSide,
        transparent: false,
    });
    const probeMesh = new THREE.Mesh(geometry, probeMaterial);
    probeMesh.name = 'probeMesh';
    scene.add(probeMesh)
    return {}
}
