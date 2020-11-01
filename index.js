
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

function setting(name)
{
    const element = document.querySelector(`[name="${name}"]`)
    const value = element.value
    //console.log(element, value)

    if (element.type === 'checkbox')
        return element.checked

    if (element.type === 'slider')
        return value*1
    return value
}

function allSettings(name)
{
    return JSON.stringify(
        Array
            .from(document.querySelectorAll(`[name^="${name}"]`))
            .map(e => [e.name, setting(e.name)])
    )
}

async function main()
{
    const canvas = document.querySelector('#main_canvas')

    const gl = canvas.getContext("webgl")

    const canvases = {
        'camera1': document.querySelector('#canvas1').getContext('2d'),
        'camera2': document.querySelector('#canvas2').getContext('2d')
    }

    const program = createProgram(gl)
    const buffer = await createBuffer(gl)
    const texture = await createTexture(gl)

    const prevSettings = {}

    function animationFrame()
    {
        renderIfNeeded('camera1')
        renderIfNeeded('camera2')

        requestAnimationFrame(animationFrame)
    }

    requestAnimationFrame(animationFrame)

    function renderIfNeeded(name)
    {
        const settings = allSettings(name)

        if (prevSettings[name] === settings)
            return

        prevSettings[name] = settings

        renderView(name)
    }
 
    function renderView(name)
    {
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

        const focal = 0.5/Math.tan(Math.PI*setting(`${name}-fov`)/180/2)

        viewMatrix = projection_matrix([
            [focal, 0, 0, 0],
            [0, -focal, 0, 0],
            [0, 0, 1, 0],
            [0, 0, 1, 0]
        ],[
            setting(`${name}-yaw`), setting(`${name}-pitch`), setting(`${name}-roll`)
        ],[
            setting(`${name}-x`), setting(`${name}-y`), setting(`${name}-z`)
        ])

        gl.uniformMatrix4fv(program.uViewMatrix, false, viewMatrix.T.data)
    
        // Render
        gl.clearColor(0.2, 0.4, 0.6, 1.0)
        gl.clearDepth(-1000000)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
        gl.enable(gl.DEPTH_TEST)
        gl.depthFunc(gl.GEQUAL)
    
        gl.drawArrays(gl.TRIANGLES, 0, buffer.count)
        gl.flush()

        canvases[name].drawImage(canvas, 0, 0)
    }
}

main()
