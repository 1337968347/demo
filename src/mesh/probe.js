import * as THREE from 'three';
import { loadShaders } from "../loader"

/**
 * 探头
 * @param {THREE.BufferGeometry} geometry 
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 * @returns 
 */
export const prepareProbe = async (geometry, scene, globalUniform) => {

    const [probeVert, probeFrag] = await loadShaders(['probe.vert', 'probe.frag'])
    // 填充材质
    const probeMaterial = new THREE.ShaderMaterial({
        uniforms: {
            sunPos: { type: 'vec3', value: globalUniform.sunPos },
            lightColor: { type: 'vec3', value: globalUniform.lightColor },
        },
        vertexShader: probeVert,
        fragmentShader: probeFrag,
        transparent: false,
    });
    const probeMesh = new THREE.Mesh(geometry, probeMaterial);
    probeMesh.name = 'probeMesh';
    return probeMesh
}
