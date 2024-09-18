export const juliaSetShader = /* glsl */`
float juliaSetDistance(vec3 p) {
    vec4 z = vec4(p, 0.0);
    vec4 c = vec4(0.355, 0.355, 0.355, 0.0);
    for (int i = 0; i < 16; i++) {
        z = vec4(z.x*z.x - z.y*z.y - z.z*z.z - z.w*z.w,
                 2.0*z.x*z.y,
                 2.0*z.x*z.z,
                 2.0*z.x*z.w) + c;
        if (dot(z, z) > 4.0) break;
    }
    return 0.5 * log(dot(z, z)) * length(z) / length(vec3(z));
}

float dist(vec3 p) {
    return juliaSetDistance(p);
}
`;

// Add more shaders here
export const mandelbulb = /* glsl */`
 float mandelbulb(vec3 p) {
            const int iterations = 16; // Number of iterations for detail
            const float power = 8.0; // Power for fractal complexity
            float r = length(p);
            float theta = acos(p.y / r);
            float phi = atan(p.z, p.x);
            float m = 0.0;

            for (int i = 0; i < iterations; i++) {
                r = pow(r, power); // Radius raised to the power
                theta *= power; // Angle adjusted by power
                phi *= power; // Angle adjusted by power

                // Convert back to Cartesian coordinates
                p = r * vec3(sin(theta) * cos(phi), cos(theta), sin(theta) * sin(phi));
                p += 0.5; // Translate the shape to avoid zero length
                m = max(m, length(p)); // Max distance
            }
            return m; // Return the distance
        }

        float dist(vec3 p) {
            return mandelbulb(p) - 1.0; // Create a surface at distance 1
        }
`;

export const mandelbox = /* glsl */`
    float dist(vec3 p) {
        vec3 z = p;
        float scale = 2.0;
        float offset = 1.0;
        float fixedRadius = 1.0;
        float minRadius = 0.5;
        for (int i = 0; i < 10; i++) {
            z = clamp(z, -fixedRadius, fixedRadius) * 2.2 - z;
            z *= scale;
            z += p * offset;
        }
        return length(z) / abs(scale) - minRadius;
    }
`;

export const boxHoles = /* glsl */`
    float dist(vec3 p) {
        vec3 boxSize = vec3(0.5, 0.5, 0.5); // Box dimensions
        float radius = 0.1; // Rounding radius
        vec3 q = abs(p) - boxSize + vec3(radius);
        float distBox = length(max(q, vec3(0.0))) - radius;
        float holeRadius = 0.2;
        float distHoles = length(p.xy) - holeRadius;
        return max(distBox, -distHoles);
    }
`;