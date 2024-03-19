precision highp float;

uniform mat4 plane;
varying vec3 vPosition;

void main() {
    vec4 pos = plane * vec4(vPosition, 1.0);
    if(pos.z > 0.0) {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 0.3); // 设置像素颜色为半透明红色
    } else {
        gl_FragColor = vec4(0.0, 1.0, 0.0, 0.3); // 设置像素颜色为半透明红色
    }
}