uniform float constantAttenuation;
uniform float linearAttenuation;
uniform float quadraticAttenuation;
uniform vec3 sunPos;
uniform vec3 lightColor;
uniform mat4 plane;
uniform sampler2D textureMap;
uniform sampler2D normalMap;
varying vec3 vPosition;
varying vec2 vUv;
varying mat3 TBN;

void main() {
    vec4 pos = plane * vec4(vPosition, 1.0);
    float len = distance(sunPos, vPosition);
    vec3 normal = normalize(TBN * texture2D(normalMap, vUv).xyz);
    vec3 textureColor = texture2D(textureMap, vUv).xyz;

    // 计算距离衰减因子
    float attenuation = 1.0 / (constantAttenuation + linearAttenuation * len + quadraticAttenuation * len * len);
    vec3 light = normalize(sunPos - vPosition);
    float alight = max(dot(light, normal), 0.0) * attenuation;

    alight += 0.25;

    if(pos.z >= 0.1) {
        discard;
    } else {
        gl_FragColor = vec4(textureColor * lightColor * alight, 1.0);
    }

    if(gl_FrontFacing == false) {
        if(abs(pos.z) < 0.1) {
            gl_FragColor = vec4(0.92, 0.4, 0.42, 1.0);
        } else {
            gl_FragColor = vec4(0.784, 0.46, 0.47, 1.0);
        }
    }
}