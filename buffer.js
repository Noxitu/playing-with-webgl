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

function fetchTexture()
{
    return new Promise((resolve, reject) => {
        const image = new Image()
        image.onload = () => { resolve(image) }
        // image.src = 'data/di-trevi/Texture.4096.jpg'
        image.src = 'data/di-trevi/Texture.jpg'
    })
}

async function createTexture(gl)
{
    const image = await fetchTexture()
    console.log(`Image size = ${image.width}x${image.height}`)
    console.log(`MAX_TEXTURE_SIZE = ${gl.getParameter(gl.MAX_TEXTURE_SIZE)}`)

    const texture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image)
    gl.generateMipmap(gl.TEXTURE_2D)

    return texture
}