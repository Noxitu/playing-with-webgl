
function indexAfter(buffer, text)
{
    const index = buffer.indexOf(text)

    if (index == -1)
        throw Error(`"${text}" not found in buffer.`)

    return index + text.length
}

function skipNewline(buffer, index)
{
    while (index < buffer.length && '\r\n'.indexOf(buffer[index]) != -1)
        index += 1

    return index
}

async function main()
{
    const canvas = document.querySelector('#main_canvas')
    // canvas.width = window.innerWidth
    // canvas.height = window.innerHeight

    const gl = canvas.getContext("webgl")
    const canvases = {
        'camera1': document.querySelector('#canvas1').getContext('2d'),
        'camera2': document.querySelector('#canvas2').getContext('2d')
    }
    console.log(canvases)

    const program = createProgram(gl)
    const buffer = await createBuffer(gl)
    const texture = await createTexture(gl)

    var id = 1
 
    function render()
    {
        const name = `camera${id}`
        id = 3 - id

        gl.useProgram(program.program)

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer)
        gl.vertexAttribPointer(program.attributes.vertexPosition, 3, gl.FLOAT, false, 20, 0)
        gl.enableVertexAttribArray(program.attributes.vertexPosition)
        
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer.buffer)
        gl.vertexAttribPointer(program.attributes.vertexTexCoord, 2, gl.FLOAT, false, 20, 12)
        gl.enableVertexAttribArray(program.attributes.vertexTexCoord)


        gl.activeTexture(gl.TEXTURE0)
        gl.bindTexture(gl.TEXTURE_2D, texture)
        gl.uniform1i(program.uniforms.sampler, 0)

        viewMatrix = projection_matrix([
            1, 0, 0, 0,
            0, -1, 0, 0,
            0, 0, 1, 0,
            0, 0, 1, 0
        ],[
            settings[`${name}-yaw`], settings[`${name}-pitch`], settings[`${name}-roll`]
            // 1, 0, 0,
            // 0, 0, 1,
            // 0, -1, 0
        ],[
            settings[`${name}-x`], settings[`${name}-y`], settings[`${name}-z`]
        ])

        gl.uniformMatrix4fv(program.uViewMatrix, false, transpose(viewMatrix).data)
    
        // Render
        gl.clearColor(0.8, 0.2, 0.8, 1.0)
        gl.clearDepth(-1000000)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.GEQUAL)
    
        gl.drawArrays(gl.TRIANGLES, 0, buffer.count)
        gl.flush()

        canvases[name].drawImage(canvas, 0, 0)
        
        if (loop)
            requestAnimationFrame(render)
    }

    var loop = true

    document.addEventListener('keypress', function(event)
    {
        if (event.code == 'Space')
        {
            loop = !loop
            if (loop)
            {
                ZERO_TIME = (new Date().getTime() - (timestamp + ZERO_TIME) + ZERO_TIME)
                requestAnimationFrame(render)
            }
        }
    })

    requestAnimationFrame(render)
}

main()