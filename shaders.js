
const vertexShaderSource = `
attribute vec3 inVertexPosition;
attribute vec2 inVertexTexCoord;

uniform mat4 uViewMatrix;

varying highp vec2 varTexCoord;

void main() {
    mat4 P = mat4(
        1, 0, 0, 0,
        0, -1, 0, 0,
        0, 0, 1, 1,
        0, 0, 0, 0
    );

    const mat3 R = mat3(
        1, 0, 0,
        0, 0, 1,
        0, -1, 0
    );

    const vec3 t = vec3(-55.0, -147.0, 98.3);

    //gl_Position = P * vec4(R * (inVertexPosition-t), 1);
    gl_Position = uViewMatrix * vec4(inVertexPosition, 1);
    gl_Position.z = gl_Position.w * (-gl_Position.z/500.0 + 1.0);
    //gl_Position = vec4((inVertexPosition.x + 50.0) / 200.0, (inVertexPosition.y + 130.0) / 200.0, inVertexPosition.z / 1500.0, 1);
    varTexCoord = inVertexTexCoord;
}
`

const fragmentShaderSource = `
varying highp vec2 varTexCoord;

uniform sampler2D uniSampler;

void main() {
    gl_FragColor = texture2D(uniSampler, varTexCoord);
}
`


function compileShader(gl, type, source)
{
    const shader = gl.createShader(type)
    gl.shaderSource(shader, source)
    gl.compileShader(shader)

  
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        const infoLog = gl.getShaderInfoLog(shader)
        gl.deleteShader(shader)
        throw Error(`Failed to compile shader: ${infoLog}`)
    }

    return shader;
}

function createProgram(gl) {
    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)
  
    const program = gl.createProgram()
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
  
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        const infoLog = gl.getProgramInfoLog(program)
        throw Error(`Failed to link program: ${infoLog}`)
    }
  
    return {
        program: program,
        attributes: {
            vertexPosition: gl.getAttribLocation(program, 'inVertexPosition'),
            vertexTexCoord: gl.getAttribLocation(program, 'inVertexTexCoord'),
        },
        uniforms: {
            sampler: gl.getUniformLocation(program, 'uniSampler'),
        },
        uViewMatrix: gl.getUniformLocation(program, 'uViewMatrix'),
    }
}