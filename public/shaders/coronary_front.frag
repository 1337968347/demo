uniform float constantAttenuation;
uniform float linearAttenuation;
uniform float quadraticAttenuation;
uniform mat4 plane;
uniform vec3 sunPos;
uniform vec3 baseColor;
varying vec3 vNormal; // 接收从顶点着色器传递过来的法线
varying vec3 vPosition;

void main() {
    vec4 pos = plane * vec4(vPosition, 1.0);
    float len = distance(sunPos, vPosition);
    vec3 normal = normalize(vNormal);
    if(gl_FrontFacing == false) {
        normal = -normal;
    }
            // 计算距离衰减因子
    float attenuation = 1.0 / (constantAttenuation + linearAttenuation * len + quadraticAttenuation * len * len);
    vec3 light = normalize(sunPos - vPosition);
    float alight = max(dot(light, normal), 0.0) * attenuation;

    alight += 0.25;
    if(pos.z < 0.0) {
        discard;
    } else {
        gl_FragColor = vec4(alight * baseColor, 0.1);
    }
}