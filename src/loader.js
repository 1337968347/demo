import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';


const loader = new OBJLoader();

// 加载心脏模型
const textureLoader = new THREE.TextureLoader();

/**
* 加载一堆纹理
* @param {String[]} urls 
*/
export const loadTextures = async (urls) => {
    const promises = urls.map((url) => {
        return new Promise((resolve, reject) => {
            textureLoader.load(
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

/**
* 加载着色器
* @param {String[]} urls 
* @returns 
*/
export const loadShaders = async (urls) => {
    const promises = urls.map((url) => {
        return new Promise((resolve, reject) => {
            fetch('shaders/' + url).then(response => response.text())
                .then(data => {
                    resolve(data)
                });
        })
    })
    return await Promise.all(promises)
}

/**
 * 处理加载冠脉mesh
 * @returns {THREE.Group}
 */
export const loadCoronaryGroup = () => {
    return new Promise((resolve) => {
        loader.load('heart.obj', async (group) => {
            const shellGroup = new THREE.Group();
            const innerGroup = new THREE.Group();
            // 心脏里面的血管
            const bloodGroup = new THREE.Group();
            const demoGroup = new THREE.Group();
            
            bloodGroup.add(group.children[0]);
            bloodGroup.add(group.children[0]);
            bloodGroup.add(group.children[0]);
            shellGroup.add(group.children[0])
            /** 右心房 */
            innerGroup.add(group.children[0])
            /** 右心房外壳 */
            shellGroup.add(group.children[0]);
            /** 左心房 */
            innerGroup.add(group.children[0]);
            bloodGroup.add(group.children[0])
            /** 主动脉 */
            shellGroup.add(group.children[0]);
            /** 主动脉壳 */
            const aortaShellMesh = new THREE.Mesh(group.children[0].geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            innerGroup.add(aortaShellMesh);
            group.remove(group.children[0])
            shellGroup.add(group.children[0]);
            // 心室相关
            innerGroup.add(group.children[0]);

            bloodGroup.traverse((mesh) => { mesh.userData.type = 2 })
            shellGroup.traverse((mesh) => { mesh.userData.type = 1 })
            innerGroup.traverse((mesh) => { mesh.userData.type = 3 })

            const newGroup = new THREE.Group()
            newGroup.add(shellGroup)
            newGroup.add(innerGroup)
            newGroup.add(bloodGroup)

            resolve(newGroup)
        });

    })
}

/**
 * 加载超声探头
 */
export const loadCoronaryProbe = () => {
    return new Promise((resolve) => {
        loader.load('probe.obj', async (group) => {

            resolve(group)
        })
    })
}