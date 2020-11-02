
function programInfo2(gl) {
    function createProgram(gl, vertexShaderSource, fragmentShaderSource)
    {
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

        return program
    }

    const program = createProgram(gl, `
attribute vec3 aVertexPosition;
attribute vec3 aVertexColor;

uniform mat4 uViewMatrix;
uniform vec3 uCameraPosition;
uniform mat3 uCameraRotation;
uniform float uCameraFocal;

varying highp vec3 vColor;

void main() {
    // Apply field of view 
    vec3 vertexPositionInCamera = uCameraFocal < 1.0
        ? vec3(aVertexPosition.x, aVertexPosition.y, aVertexPosition.z*uCameraFocal)
        : vec3(aVertexPosition.x/uCameraFocal, aVertexPosition.y/uCameraFocal, aVertexPosition.z);

    // Apply scale
    vertexPositionInCamera *= 4.0;
    // Apply redered camera orientation
    vec3 vertexPosition = uCameraRotation * vertexPositionInCamera + uCameraPosition;
    gl_Position = uViewMatrix * vec4(vertexPosition, 1);
    gl_Position.z = gl_Position.w * (-gl_Position.z/500.0 + 1.0);
    vColor = aVertexColor;
}
`, `
varying highp vec3 vColor;

void main() {
    gl_FragColor = vec4(vColor.x/255.0, vColor.y/255.0, vColor.z/255.0, 1);
}
`)
  
    return {
        program: program,
        aVertexPosition: gl.getAttribLocation(program, 'aVertexPosition'),
        aVertexColor: gl.getAttribLocation(program, 'aVertexColor'),
        uViewMatrix: gl.getUniformLocation(program, 'uViewMatrix'),
        uCameraPosition: gl.getUniformLocation(program, 'uCameraPosition'),
        uCameraRotation: gl.getUniformLocation(program, 'uCameraRotation'),
        uCameraFocal: gl.getUniformLocation(program, 'uCameraFocal'),
    }
}