

class Matrix {
    constructor({ rows, cols } = {}) {
        [this.rows, this.cols] = [rows, cols]
        this.data = Array.from(arguments).slice(1)

        if (this.rows === undefined && this.cols === undefined)
            this.rows = this.data.length

        this.data = this.data.flat().map(e => e*1)

        if (this.rows === undefined)
            this.rows = Math.floor(this.data.length / this.cols) | 0

        if (this.cols === undefined)
            this.cols = Math.floor(this.data.length / this.rows) | 0

        if (this.data.length == 0)
            this.data = Array(this.rows * this.cols).fill(0)

        if (this.rows * this.cols !== this.data.length)
            throw Error('Wrong matrix data')
    }

    at(y, x=0) {
        return this.data[y * this.cols + x]
    }

    set(y, x, value) {
        this.data[y * this.cols + x] = value
    }

    toArrays() {
        const rows = []
        for (var y = 0; y < this.rows; ++y) {
            const row = []

            for (var x = 0; x < this.cols; ++x)
                row.push(this.at(y, x))

            rows.push(row)
        }
        return rows
    }

    get T() {
        const ret = new Matrix({ cols: this.rows, rows: this.cols })
        for (var y = 0; y < this.rows; ++y)
            for (var x = 0; x < this.cols; ++x)
                ret.set(x, y, this.at(y, x))

        return ret
    }

    get cross() {
        if (this.rows !== 3 || this.cols !== 1)
            throw Error(`Cant get cross for shape ${this.rows}x${this.cols}.`)

        const [x, y, z] = this.data

        return new Matrix({}, [0, -z, y], [z, 0, -x], [-y, x, 0])
    }

    hconcat(other) {
        if (this.rows !== other.rows)
            throw Error(`Cant hconcat shapes ${this.rows}x${this.cols} and ${other.rows}x${other.cols}.`)

        const ret = new Matrix({ rows: this.rows, cols: this.cols + other.cols })
        for (var y = 0; y < ret.rows; ++y)
            for (var x = 0; x < ret.cols; ++x)
                ret.set(y, x, x < this.cols ? this.at(y, x) : other.at(y, x - this.cols))

        return ret
    }

    vconcat(other) {
        if (this.cols !== other.cols)
            throw Error(`Cant hconcat shapes ${this.rows}x${this.cols} and ${other.rows}x${other.cols}.`)

        const ret = new Matrix({ rows: this.rows + other.rows, cols: this.cols })
        for (var y = 0; y < ret.rows; ++y)
            for (var x = 0; x < ret.cols; ++x)
                ret.set(y, x, y < this.rows ? this.at(y, x) : other.at(y - this.rows, x))

        return ret
    }

    get pretty() {
        const rows = this.toArrays()
        return rows.map(row => row.join(' ')).join('\n')
    }

    static sum(a, b) {
        if (a.rows !== b.rows || a.cols !== b.cols)
            throw Error(`Cant add shapes ${a.rows}x${a.cols} and ${b.rows}x${b.cols}.`)

        const ret = new Matrix({ rows: a.rows, cols: a.cols })
        for (var y = 0; y < ret.rows; ++y)
            for (var x = 0; x < ret.cols; ++x)
                ret.set(y, x, a.at(y, x) + b.at(y, x))

        return ret
    }

    static multiply_by_scalar(scalar, matrix) {
        const ret = new Matrix({ rows: matrix.rows, cols: matrix.cols })
        for (var y = 0; y < ret.rows; ++y)
            for (var x = 0; x < ret.cols; ++x)
                ret.set(y, x, scalar * matrix.at(y, x))

        return ret
    }

    static multiply(a, b) {
        if (Number.isFinite(a))
            return Matrix.multiply_by_scalar(a, b)
        if (Number.isFinite(b))
            return Matrix.multiply_by_scalar(b, a)

        if (a.cols !== b.rows)
            throw Error(`Cant multiply shapes ${a.rows}x${a.cols} and ${b.rows}x${b.cols}.`)

        const ret = new Matrix({ rows: a.rows, cols: b.cols })
        for (var y = 0; y < ret.rows; ++y)
            for (var x = 0; x < ret.cols; ++x)
                for (var k = 0; k < a.cols; ++k)
                    ret.set(y, x, ret.at(y, x) + a.at(y, k) * b.at(k, x))

        return ret
    }

    static op() {
        var expr = Array.from(arguments)
        
        for (var i = 0; i < expr.length;) {
            if (expr[i] === '*') {
                const a = expr[i - 1]
                const b = expr[i + 1]
                const c = Matrix.multiply(a, b)
                var newExpr = i > 1 ? expr.slice(0, i - 1) : []
                newExpr.push(c)
                newExpr = newExpr.concat(expr.slice(i + 2))
                expr = newExpr
            }
            else
                i += 1
        }


        for (var i = 0; i < expr.length;) {
            if (expr[i] === '+' || expr[i] === '-') {
                const a = expr[i - 1]
                const b = expr[i + 1]
                const c = (expr[i] === '+'
                    ? Matrix.sum(a, b)
                    : Matrix.sum(a, Matrix.multiply(-1, b)));
                const newExpr = expr.slice(0, i - 1)
                newExpr.push(c)
                newExpr.concat(expr.slice(i + 2))
                expr = newExpr
            }
            else
                i += 1
        }

        if (expr.length != 1)
            throw Error('Expresion failed')
        return expr[0]
    }

    static add = '+'
    static add = '-'
    static mul = '*'
}


function compute_rotation_matrix(yaw, pitch, roll) {
    const fromAircraftCS = new Matrix({},
        [0, 1, 0],
        [1, 0, 0],
        [0, 0, -1]
    )

    const toAircraftCS = new Matrix({},
        [0, 0, 1],
        [1, 0, 0],
        [0, 1, 0]
    )

    const cos = deg => Math.cos(Math.PI * deg / 180)
    const sin = deg => Math.sin(Math.PI * deg / 180)

    const yawRotation =  new Matrix({},
        [cos(yaw), -sin(yaw), 0],
        [sin(yaw), cos(yaw), 0],
        [0, 0, 1]
    )

    const pitchRotation =  new Matrix({},
        [cos(pitch), 0, sin(pitch)],
        [0, 1, 0],
        [-sin(pitch), 0, cos(pitch)]
    )

    const rollRotation = new Matrix({},
        [1, 0, 0],
        [0, cos(roll), sin(roll)],
        [0, -sin(roll), cos(roll)]
    )

    return Matrix.op(fromAircraftCS, '*', yawRotation, '*', pitchRotation, '*', rollRotation, '*', toAircraftCS)
}

function projection_matrix(camera_matrix, [yaw, pitch, roll], view_position) {
    // Normal convention:
    // P = K @ [R|t]
    // y = [R|t] x = Rx + t

    // Custom convention:
    // y = R'(x-t) = [R'|-R't]

    camera_matrix = new Matrix({}, ...camera_matrix)
    rotation_matrix = compute_rotation_matrix(yaw, pitch, roll).T

    translation_vector = Matrix.op(-1, '*', rotation_matrix, '*', new Matrix({}, ...view_position))
    // console.log('t = ', translation_vector.T.pretty)

    const Rt = rotation_matrix.hconcat(translation_vector).vconcat(new Matrix({}, [0, 0, 0, 1]))
    // console.log('K = ', camera_matrix.pretty)
    // console.log('Rt = ', Rt.pretty)
    // console.log('P = ', Matrix.multiply(camera_matrix, Rt).pretty)
    return Matrix.multiply(camera_matrix, Rt)
}

function fundamental_matrix(camera_matrix1, [yaw1, pitch1, roll1], view_position1, 
                            camera_matrix2, [yaw2, pitch2, roll2], view_position2)
{
    const K1 = new Matrix({}, ...camera_matrix1)
    const K2 = new Matrix({}, ...camera_matrix2)

    const R1 = compute_rotation_matrix(yaw1, pitch1, roll1)
    const R2 = compute_rotation_matrix(yaw2, pitch2, roll2)

    const t1 = new Matrix({}, ...view_position1)
    const t2 = new Matrix({}, ...view_position2)

    const R12 = Matrix.multiply(R1.T, R2)
    const t12 = Matrix.multiply(R1.T, Matrix.op(t2, '-', t1))

    const E = Matrix.multiply(R12.T, Matrix.op(-1, '*', R12.T, '*', t12).cross)
    const F = Matrix.op(K2, '*', E, '*', K1.T)

    return F
}

function compute_lines(id, x, y, F)
{
    const point = new Matrix({}, x, y, 1)

    const eq = id == 1 ? Matrix.multiply(F, point).data : Matrix.multiply(F.T, point).data

    const f = x => -eq[0]/eq[1] * x - eq[2]/eq[1]

    return [-1, f(-1), 1, f(1)]
}