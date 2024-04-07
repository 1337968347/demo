varying vec3 vPosition; // 在顶点着色器中声明一个 varying 变量
varying vec3 vNormal; // 定义一个 varying 变量用于传递法线
varying vec2 vUv; // 传递给片元着色器的UV值变量
varying mat3 TBN;

void main() {
    vNormal = normalize(normalMatrix * normal); // 计算变换后的法线并传递给 varying 变量
    vec4 wPosition = modelViewMatrix * vec4(position, 1.0);
    vPosition = wPosition.xyz; // 将顶点位置传递给插值变量
    vUv = uv;

    // 计算切线空间矩阵
    vec3 T = vec3(0.0, 1.0, 0.0); // 顶点位置
    vec3 N = vNormal; // 顶点法向
    vec3 B = cross(T, N); // 右手法则计算副切线
    T = cross(N, B); // 修正切线
    TBN = mat3(T, B, N); // 构建TBN矩阵

    gl_Position = projectionMatrix * wPosition;
}