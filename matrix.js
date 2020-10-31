
function matrix(data, rows, cols)
{
    // console.log('matrix', data, rows, cols)

    if (rows === undefined)
        rows = Math.floor(Math.sqrt(data.length))|0

    if (cols === undefined)
        cols = Math.floor(data.length/rows)|0

    if (rows*cols != data.length)
        throw Error("Invalid matrix size")

    return {data, rows, cols}
}

function transpose(a)
{
    const ret = a.data.slice()

    for (var y = 0; y < a.rows; ++y)
        for (var x = 0; x < a.cols; ++x)
            ret[x*a.rows+y] = a.data[y*a.cols+x]

    return matrix(ret, a.cols, a.rows)
}

function multiply(a, b)
{
    // console.log('multiply', a, b)

    if (Number.isFinite(a))
    {
        const data = b.data.slice()

        for (var i = 0; i < data.length; ++i)
            data[i] = a*data[i]

        return matrix(data, b.rows, b.cols)
    }

    if (a.cols != b.rows)
        throw Error('Wrong dimentions for matmul.')

    const c = Array(a.rows*b.cols).fill(0)

    for (var y = 0; y < a.rows; ++y)
        for (var x = 0; x < b.cols; ++x)
            for (var k = 0; k < a.cols; ++k)
                c[y*b.cols+x] += a.data[y*a.cols+k] * b.data[k*b.cols+x]

    return matrix(c, a.rows, b.cols)
}

function add_column(a, column)
{
    if (a.rows != column.length)
        throw Error('Cant add column')

    const data = Array(a.rows*(a.cols+1)).fill(0)

    for (var y = 0; y < a.rows; ++y)
    {
        for (var x = 0; x < a.cols; ++x)
            data[y*(a.cols+1)+x] = a.data[y*a.cols+x]

        data[y*(a.cols+1)+a.cols] = column[y]
    }

    return matrix(data, a.rows, a.cols+1)
}

function add_row(a, row)
{
    if (a.cols != row.length)
        throw Error('Cant add row')

    const data = Array((a.rows+1)*a.cols).fill(0)

    for (var x = 0; x < a.cols; ++x)
    {
        for (var y = 0; y < a.rows; ++y)
            data[y*a.cols+x] = a.data[y*a.cols+x]

        data[y*a.cols+a.rows] = row[x]
    }

    return matrix(data, a.rows+1, a.cols)
}

function pretty_matrix(a)
{
    const rows = []

    for (var y = 0; y < a.rows; ++y)
    {
        const row = []
        for (var x = 0; x < a.cols; ++x)
            row.push(a.data[y*a.cols+x])

        rows.push(row.join('  '))
    }
    return rows.join('\n')
}

function compute_rotation_matrix(yaw, pitch, roll)
{
    const fromAircraftCS = matrix([
        0, 1, 0,
        1, 0, 0,
        0, 0, -1
    ])
    const toAircraftCS = matrix([
        0, 0, 1,
        1, 0, 0,
        0, 1, 0
    ])

    const cos = deg => Math.cos(Math.PI*deg/180)
    const sin = deg => Math.sin(Math.PI*deg/180)

    const yawRotation = matrix([
        cos(yaw), -sin(yaw), 0,
        sin(yaw), cos(yaw), 0,
        0, 0, 1
    ])

    const pitchRotation = matrix([
        cos(pitch), 0, sin(pitch),
        0, 1, 0,
        -sin(pitch), 0, cos(pitch)
    ])

    const rollRotation = matrix([
        1, 0, 0,
        0, cos(roll), sin(roll),
        0, -sin(roll), cos(roll)
    ])

    var total =  multiply(rollRotation, toAircraftCS)
    total =  multiply(pitchRotation, total)
    total =  multiply(yawRotation, total)
    total =  multiply(fromAircraftCS, total)
    return total
}

function projection_matrix(camera_matrix, [yaw, pitch, roll], view_position)
{
    // Normal convention:
    // P = K @ [R|t]
    // y = [R|t] x = Rx + t

    // Custom convention:
    // y = R'(x-t) = [R'|-R't]

    camera_matrix = matrix(camera_matrix)
    rotation_matrix = transpose(compute_rotation_matrix(yaw, pitch, roll))
    translation_column = multiply(-1, multiply(rotation_matrix, matrix(view_position, 3)))

    const Rt = add_column(rotation_matrix, translation_column.data)
    const extendedRt = add_row(Rt, [0, 0, 0, 1])
    const P = multiply(camera_matrix, extendedRt)

    return P
}
