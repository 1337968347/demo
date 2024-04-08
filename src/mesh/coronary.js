import * as THREE from 'three';
import { loadTextures, loadShaders } from "../loader"

const Matrix4 = THREE.Matrix4;

/**
 * 准备冠脉Mesh
 * @param {THREE.Group} group 
 * @param {THREE.Scene} scene 
 * @param {{[key: string]: THREE.Group}} globalUniform 
 * @returns 
 */
export const prepareCoronary = async (group, scene, globalUniform) => {

    const [
        textureMap1, textureMap2, textureMap3,
        normalMap1, normalMap2, normalMap3
    ] = await loadTextures([
        // 纹理
        'Tex_0058.png', 'Tex_0414.png', 'Tex_0053.png',
        // 法线
        'Tex_0057.png', 'Tex_0177.png', 'Tex_0050.png',
    ]);

    /** 加载着色器 */
    const [vertexShader, fragmentShaderBack, fragmentShaderFront] = await loadShaders(['coronary.vert', 'coronary_back.frag', 'coronary_front.frag']);
    const matElements = new Matrix4()

    group.traverse((mesh) => {
        if (mesh instanceof THREE.Mesh || mesh instanceof THREE.LineSegments) {
            const scale = 1;
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
                sunPos: { type: 'vec3', value: globalUniform.sunPos },
                lightColor: { type: 'vec3', value: globalUniform.lightColor },
                plane: { type: 'mat4', value: matElements },
                constantAttenuation: { type: 'float', value: 1 },
                linearAttenuation: { type: 'float', value: 0.02 },
                quadraticAttenuation: { type: 'float', value: 0.005 },
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
            backMesh.name = 'coronaryBack';
            backMesh.material = coronaryBackMaterial;
            scene.add(backMesh);

            if (mesh.userData.type === 1) {
                /** 心脏前面  前侧透明 */
                const coronaryFrontMaterial = new THREE.ShaderMaterial({
                    vertexShader: vertexShader,
                    fragmentShader: fragmentShaderFront,
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
                scene.add(frontMesh);
            }
        }
    })


    return group
}