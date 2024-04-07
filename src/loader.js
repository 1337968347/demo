import * as THREE from 'three';

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