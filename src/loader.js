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
 * @returns 
 */
export const loadCoronaryGroup = () => {
    return new Promise((resolve) => {
        loader.load('heart.obj', async (group) => {
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
            /** 壳 */
            const shellGroup = new THREE.Group();
            /** 主动脉 */
            const aortaGroup = new THREE.Group()
            /** 主动脉壳 */
            const aortaShellGroup = new THREE.Group();
            bloodGroup.add(group.children[0]);
            bloodGroup.add(group.children[0]);
            bloodGroup.add(group.children[0]);
            bloodGroup.add(group.children[0]);
            /** 右心房 */
            rightAtriumShellGroup.add(group.children[0])
            /** 右心房外壳 */
            rightAtriumGroup.add(group.children[0]);
            /** 左心房 */
            leftAtriumShellGroup.add(group.children[0]);
            leftAtriumGroup.add(group.children[0])
            /** 主动脉 */
            aortaGroup.add(group.children[0]);
            /** 主动脉壳 */
            const aortaShellMesh = new THREE.Mesh(group.children[0].geometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
            aortaShellGroup.add(aortaShellMesh);
            group.remove(group.children[0])
            shellGroup.add(group.children[0]);
            // 心室相关
            VentricleGroup.add(group.children[0]);

            bloodGroup.traverse((mesh) => { mesh.userData.type = 2 })
            rightAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
            rightAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
            leftAtriumGroup.traverse((mesh) => { mesh.userData.type = 3 })
            leftAtriumShellGroup.traverse((mesh) => { mesh.userData.type = 1 })
            VentricleGroup.traverse((mesh) => { mesh.userData.type = 1 })
            shellGroup.traverse((mesh) => { mesh.userData.type = 3 })
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

            resolve(newGroup)
        });

    })
}