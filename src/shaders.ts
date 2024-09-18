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