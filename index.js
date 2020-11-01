
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
    // console.log(element, value)

    if (element.type === 'checkbox')
        return element.checked

    if (element.type === 'slider')
        return value*1

    return value
}

function allSettings(names)
{
    const selector = names.split(',').map(name => `[name^="${name}"]`).join(', ')

    return JSON.stringify(
        Array
            .from(document.querySelectorAll(selector))
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
        renderIfNeeded('camera1', renderView)
        renderIfNeeded('camera2', renderView)
        renderIfNeeded('epipolar,camera1,camera2', updateEpipolarGeometry)

        requestAnimationFrame(animationFrame)
    }

    requestAnimationFrame(animationFrame)

    function renderIfNeeded(name, render)
    {
        const settings = allSettings(name)

        if (prevSettings[name] === settings)
            return

        // console.log(prevSettings, '!=', settings)

        prevSettings[name] = settings

        render(name)
    }

    function updateEpipolarGeometry()
    {
        const anchor = setting(`epipolar-anchor`)

        if (anchor === '')
            return

        const focal1 = 0.5/Math.tan(Math.PI*setting(`camera1-fov`)/180/2)
        const focal2 = 0.5/Math.tan(Math.PI*setting(`camera2-fov`)/180/2)

        const F = fundamental_matrix([
            [focal1, 0, 0],
            [0, -focal1, 0],
            [0, 0, 1],
        ],[
            setting(`camera1-yaw`), setting(`camera1-pitch`), setting(`camera1-roll`)
        ],[
            setting(`camera1-x`), setting(`camera1-y`), setting(`camera1-z`)
        ],[
            [focal2, 0, 0],
            [0, -focal2, 0],
            [0, 0, 1],
        ],[
            setting(`camera2-yaw`), setting(`camera2-pitch`), setting(`camera2-roll`)
        ],[
            setting(`camera2-x`), setting(`camera2-y`), setting(`camera2-z`)
        ])

        const [id, x, y] = anchor.split(',').map(v => v*1)
        const [x1, y1, x2, y2] = compute_lines(id, x, y, F)

        document.querySelector(`#svg${3-id}`).innerHTML = `
            <line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
                style="stroke: red; stroke-width: 0.01;" />
        `

        const [x3, y3, x4, y4] = compute_lines(3-id, x2, y2, F)

        document.querySelector(`#svg${id}`).innerHTML = `
            <line x1="${x3}" y1="${y3}" x2="${x4}" y2="${y4}" 
                style="stroke: red; stroke-width: 0.01;" />
        `
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

function setup_svg_events()
{
    document.querySelectorAll('svg').forEach(svg => {
        svg.addEventListener('mousemove', (event) => {
            if (event.buttons != 1)
                return

            const id = svg.id.slice(3)|0
            if ([1, 2].indexOf(id) === -1)
                throw Error('Wrong svg name')

            const x = 2 * event.offsetX / svg.clientWidth - 1
            const y = 2 * event.offsetY / svg.clientWidth - 1
            
            document.querySelector('input[name="epipolar-anchor"]').value = [id, x, y].join(',')
        })

        svg.addEventListener('mouseleave', (event) => {
            // document.querySelector('input[name="epipolar-anchor"]').value = ''
        })
    })
}

setup_svg_events()
main()
