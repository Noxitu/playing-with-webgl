async function fetchBuffer()
{
    const res = await fetch('data/di-trevi/Fontana.buffer')

    const buffer = await res.arrayBuffer()

    if (buffer.byteLength%20 != 0)
        throw Error('Buffer has unexpected length')

    return {
        count: (buffer.byteLength/20)|0,  // 20 bytes per vertex (x, y, z, u, v as floats)
        array: new Float32Array(buffer)
    }
}

async function createBuffer(gl)
{
    const array = await fetchBuffer()

    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    // array.array = new Float32Array([
    //     -100, -100, 0, 1, 0,
    //     -100, 100, 0, 1, 1,
    //     100, 100, 0, 0, 1,
    // ])

    gl.bufferData(gl.ARRAY_BUFFER, array.array, gl.STATIC_DRAW)

    return {
        array: array.array,
        buffer: buffer,
        count: array.count
    }
}

function fetchTexture(maxSize)
{
    
    return new Promise((resolve, reject) => {
        const resolutions = [8192, 4096, 1024]

        const getNext = () => {
            const size = resolutions.shift()

            if (size === undefined)
                reject('Failed to aquire any texture resolution.')

            if (size > maxSize)
            {
                console.log(`Ignoring Texture.${size}.jpg since it is too big for available GL context(max=${maxSize}).`)
                return getNext()
            }

            image.src = `data/di-trevi/Texture.${size}.jpg`
        }

        const image = new Image()
        image.onload = () => { resolve(image) }
        image.onerror = () => { getNext() }
        getNext()
    })
}

async function createTexture(gl)
{
    const MAX_TEXTURE_SIZE = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    console.log(`MAX_TEXTURE_SIZE = ${MAX_TEXTURE_SIZE}`)

    const image = await fetchTexture(MAX_TEXTURE_SIZE)
    console.log(`Image size = ${image.width}x${image.height}`)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)

    return texture
}

async function createCameraBuffer(gl)
{
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)

    const array = {
        array: new Float32Array([
            0, 0, 0, 150, 150, 150,
            1, -1, 1, 150, 150, 150,
            1, 1, 1, 150, 150, 150,

            0, 0, 0, 200, 200, 200,
            1, 1, 1, 200, 200, 200,
            -1, 1, 1, 200, 200, 200,

            0, 0, 0, 150, 150, 150,
            -1, 1, 1, 150, 150, 150,
            -1, -1, 1, 150, 150, 150,

            0, 0, 0, 100, 100, 100,
            -1, -1, 1, 100, 100, 100,
            1, -1, 1, 100, 100, 100,

            1, 1, 1, 100, 200, 100,
            1, -1, 1, 200, 100, 100,
            -1, -1, 1, 200, 100, 100,

            1, 1, 1, 100, 200, 100,
            -1, 1, 1, 100, 200, 100,
            -1, -1, 1, 200, 100, 100,
        ]),
        count: 18
    }


    gl.bufferData(gl.ARRAY_BUFFER, array.array, gl.STATIC_DRAW)

    return {
        array: array.array,
        buffer: buffer,
        count: array.count
    }
}