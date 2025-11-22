const roundFloatWithSign = function(val, precision = 4){
    const base = 10**precision;
    const rounded = Math.round(val * base)/base;
    let sign = "+";
    if(val < 0){
        sign = "-";
    }
    //return sign + Math.abs(rounded).toString().slice(0,precision);// max precision letters plus sign
    return sign + Math.abs(rounded).toString();
}

const roundFloat = function(val, precision = 4){
    const str = roundFloatWithSign(val, precision);
    if(str[0] === "+")return str.slice(1);
    return str;
}


export const config = {
    atol_32: 1e-5,
    rtol_32: 1e-8,
    atol_64: 1e-8,
    rtol_64: 1e-12,
};

const equalWithTolerance = function(a, b, atol, rtol){
    return Math.abs(a - b) < atol + rtol * Math.max(Math.abs(a), Math.abs(b));
};

export class Complex{
    constructor(r, i){
        this.r = r;
        this.i = i;
    }
    mul(c){
        const {r,i} = this;
        return new Complex(
            r*c.r - i*c.i,
            r*c.i + i*c.r,
        );
    }
    div(c){
        const {r,i} = this;
        const d = c.r*c.r + c.i*c.i;
        return new Complex(
            (r * c.r + i * c.i)/d,
            (i * c.r - r * c.i)/d,
        );
    }
    add(c){
        const {r,i} = this;
        return new Complex(
            r+c.r,
            i+c.i,
        );
    }
    sub(c){
        const {r,i} = this;
        return new Complex(
            r-c.r,
            i-c.i,
        );
    }
    normalize(){
        const {r,i} = this;
        const n = Math.sqrt(r*r+i*i);
        return new Complex(
            r/n,i/n
        );
    }
    invert(){
        const {r,i} = this;
        const m = this.modulusSquare();
        return new Complex(
            r/m,
            -i/m,
        );
    }
    negative(){
        const {r,i} = this;
        return new Complex(
            -r,
            -i,
        );
    }
    conjugate(){
        return new Complex(this.r, -this.i);
    }
    modulusSquare(){
        return this.r**2 + this.i**2;
    }
    magnitude(){
        return Math.sqrt(this.modulusSquare())
    }
    scale(k){
        return new Complex(
            this.r * k,
            this.i * k,
        );
    }
    static epsilon = 1e-5;
    equal(c, atol=config.atol_64, rtol=config.rtol_64){
        return equalWithTolerance(c.r, this.r, atol, rtol) &&
            equalWithTolerance(c.i, this.i, atol, rtol);
    }
    clone(){
        return new Complex(
            this.r,
            this.i,
        );
    }
    toString(precision = 4){
        const base = 10**precision;
        let r = roundFloatWithSign(this.r,precision);
        let i = roundFloatWithSign(this.i,precision);
        const r_sign = r[0];
        const i_sign = i[0];
        r = r.slice(1);
        i = i.slice(1) + "i";
        if(i === "1i")i = "i";
        if(r === "0" && i === "0i")return "0";
        if(i === "0i")return `${r_sign==="-"?"-":""}${r}`;
        if(r === "0")return `${i_sign==="-"?"-":""}${i}`;
        return `${r_sign==="-"?"-":""}${r}${i_sign}${i}`;
    }
};

export const C = function(r,i){
    return new Complex(r,i);
};


export class ComplexVector{
    static BufferType = Float32Array;
    static atol = config.atol_32;
    static rtol = config.rtol_32;
    static create(n){
        const vector = new this();
        vector.length = n;
        vector.buffer = new this.BufferType(n * 2);
        return vector;
    }
    static fromValues(array){
        const vector = this.create(array.length);
        for(let i = 0; i < array.length; i++){
            const value = array[i];
            let real = 0;
            let imag = 0;
            if(typeof value === "number"){
                real = value;
            }else if(value instanceof Array){
                real = value[0];
                imag = value[1];
            }else if(value instanceof Complex){
                real = value.r;
                imag = value.i;
            }else{
                throw new Error("Unknown value type in ComplexVector");
            }
            vector.buffer[i<<1|0] = real;
            vector.buffer[i<<1|1] = imag;
        }
        return vector;
    }
    toString(precision){
        const strings = [];
        for(let i = 0; i < this.length; i++){
            const c = new Complex();
            c.r = this.buffer[i<<1|0];
            c.i = this.buffer[i<<1|1];
            strings.push(c.toString(precision));
        }
        return "|" + strings.join(" ") + "|";
    }
    equal(vector, atol = this.constructor.atol, rtol = this.constructor.rtol){
        if(this.length !== vector.length)return false;
        for(let i = 0; i < this.length << 1; i++){
            const a = this.buffer[i];
            const b = vector.buffer[i];
            if(!equalWithTolerance(a, b, atol, rtol)){
                return false;
            }
        }
        return true;
    }
    clone(){
        return this.constructor.create(this.length).copy(this);
    }
    get(i){
        return C(
            this.buffer[i<<1|0],
            this.buffer[i<<1|1],
        );
    }
    set(i, c){
        this.buffer[i<<1|0] = c.r;
        this.buffer[i<<1|1] = c.i;
        return this;
    }
    fill(c){
        for(let i = 0; i < this.length; i++){
            this.buffer[i<<1|0] = c.r;
            this.buffer[i<<1|1] = c.i;
        }
        return this;
    }

    copy(source, offset = 0){
        this.buffer.set(source.buffer, offset<<1);
        return this;
    }
    add(vec){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = this.buffer[rr] + vec.buffer[rr];
            res.buffer[ii] = this.buffer[ii] + vec.buffer[ii];
        }
        return res;
    }
    addi(vec){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] += vec.buffer[rr];
            this.buffer[ii] += vec.buffer[ii];
        }
        return this;
    }
    sub(vec){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = this.buffer[rr] - vec.buffer[rr];
            res.buffer[ii] = this.buffer[ii] - vec.buffer[ii];
        }
        return res;
    }
    subi(vec){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] -= vec.buffer[rr];
            this.buffer[ii] -= vec.buffer[ii];
        }
        return this;
    }
    mul(vec){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const r2 = vec.buffer[rr];
            const i2 = vec.buffer[ii];
            res.buffer[rr] = r1 * r2 - i1 * i2;
            res.buffer[ii] = r1 * i2 + i1 * r2;
        }
        return res;
    }
    muli(vec){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const r2 = vec.buffer[rr];
            const i2 = vec.buffer[ii];
            this.buffer[rr] = r1 * r2 - i1 * i2;
            this.buffer[ii] = r1 * i2 + i1 * r2;
        }
        return this;
    }
    div(vec){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const r2 = vec.buffer[rr];
            const i2 = vec.buffer[ii];
            const d = r2*r2 + i2*i2;
            res.buffer[rr] = (r1 * r2 + i1 * i2)/d;
            res.buffer[ii] = (i1 * r2 - r1 * i2)/d;
        }
        return res;
    }
    divi(vec){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const r2 = vec.buffer[rr];
            const i2 = vec.buffer[ii];
            const d = r2*r2 + i2*i2;
            this.buffer[rr] = (r1 * r2 + i1 * i2)/d;
            this.buffer[ii] = (i1 * r2 - r1 * i2)/d;
        }
        return this;
    }
    smul(c){
        const res = this.constructor.create(this.length);
        const r2 = c.r;
        const i2 = c.i;
        for(let i = 0; i < this.length; i++){
            const r1 = this.buffer[i<<1|0];
            const i1 = this.buffer[i<<1|1];
            res.buffer[i<<1|0] = r1 * r2 - i1 * i2;
            res.buffer[i<<1|1] = r1 * i2 + i1 * r2;
        }
        return res;
    }
    smuli(c){
        const r2 = c.r;
        const i2 = c.i;
        for(let i = 0; i < this.length; i++){
            const r1 = this.buffer[i<<1|0];
            const i1 = this.buffer[i<<1|1];
            this.buffer[i<<1|0] = r1 * r2 - i1 * i2;
            this.buffer[i<<1|1] = r1 * i2 + i1 * r2;
        }
        return this;
    }
    invert(){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const d = r1*r1 + i1*i1;
            res.buffer[rr] = (r1)/d;
            res.buffer[ii] = (-i1)/d;
        }
        return res;
    }
    inverti(){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            const d = r1*r1 + i1*i1;
            this.buffer[rr] = (r1)/d;
            this.buffer[ii] = (-i1)/d;
        }
        return this;
    }
    negate(){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = -this.buffer[rr];
            res.buffer[ii] = -this.buffer[ii];
        }
        return res;
    }
    negatei(){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] = -this.buffer[rr];
            this.buffer[ii] = -this.buffer[ii];
        }
        return this;
    }
    conjugate(){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            res.buffer[rr] = r1;
            res.buffer[ii] = -i1;
        }
        return res;
    }
    conjugatei(){
        for(let i = 0; i < this.length * 2; i += 2){
            this.buffer[i] = -this.buffer[i];
        }
        return this;
    }
    dot(vec){
        let r_sum = 0;
        let i_sum = 0;
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            const r1 = this.buffer[rr];
            const i1 = this.buffer[ii];
            // Der zweiten Vektor muss konjugiert werden
            const r2 = vec.buffer[rr];
            const i2 = -vec.buffer[ii];
            r_sum += r1 * r2 - i1 * i2;
            i_sum += r1 * i2 + i1 * r2;
        }
        return C(r_sum, i_sum);
    }
    norm(){
        return Math.sqrt(this.normSquare());
    }
    normSquare(){
        let lsum = 0;
        for(let i = 0; i < this.length; i++){
            lsum += this.buffer[i<<1|0]**2 + this.buffer[i<<1|1]**2;
        }
        return lsum;
    }
    normalize(){
        const norm = this.norm();
        for(let i = 0; i < this.length * 2; i++){
            this.buffer[i] /= norm;
        }
        return this;
    }
    complexNormalize(){
        const norm = this.norm();
        const r0 = this.buffer[0];
        const i0 = this.buffer[1];
        const c = C(r0,i0).normalize().conjugate();
        for(let i = 0; i < this.length; i++){
            const real = this.buffer[i<<1|0];
            const imag = this.buffer[i<<1|1];
            this.buffer[i<<1|0] = (real * c.r - imag * c.i)/norm;
            this.buffer[i<<1|1] = (real * c.i + imag * c.r)/norm;
        }
        return this;
    }
    outer(vec){
        const rows = this.length;
        const cols = vec.length;
        const res = this.constructor.MatrixClass.create(rows, cols);
        for(let i = 0; i < rows; i++){
            for(let j = 0; j < cols; j++){
                const idx = i * cols + j;
                const r1 = this.buffer[i<<1|0];
                const i1 = this.buffer[i<<1|1];
                const r2 = vec.buffer[j<<1|0];
                const i2 = vec.buffer[j<<1|1];
                res.buffer[idx<<1|0] = r1 * r2 - i1 * i2;
                res.buffer[idx<<1|1] = r1 * i2 + i1 * r2;
            }
        }
        return res;
    }
    // still working out the definition of projection in complex vector space
    project(vec){// project this vector to vec
        const top = this.dot(vec);
        const bot = vec.dot(vec);
        return vec.smul(top.div(bot));
        //return vec.smul(C(top.div(bot).magnitude(),0));
    }
    tensor(vec){
        const res = this.constructor.create(this.length * vec.length);
        for(let i = 0; i < this.length; i++){
            for(let j = 0; j < vec.length; j++){
                const idx = i * vec.length + j;
                const r1 = this.buffer[i<<1|0];
                const i1 = this.buffer[i<<1|1];
                const r2 = vec.buffer[j<<1|0];
                const i2 = vec.buffer[j<<1|1];
                res.buffer[idx<<1|0] = r1 * r2 - i1 * i2;
                res.buffer[idx<<1|1] = r1 * i2 + i1 * r2;
            }
        }
        return res;
    }
}

export class ComplexMatrix{
    static BufferType = Float32Array;
    static atol = config.atol_32;
    static rtol = config.rtol_32;
    static create(rows, columns){
        if(!columns)columns = rows;
        const matrix = new this();
        matrix.rows = rows;
        matrix.columns = columns;
        matrix.buffer = new this.BufferType(rows * columns * 2);
        return matrix;
    }
    static identity(size){
        const matrix = this.create(size);
        for(let i = 0; i < size; i++){
            matrix.buffer[(i*size + i)<<1] = 1;
        }
        return matrix;
    }
    static fromArrays(arrays){
        const matrix = new this();
        matrix.rows = arrays.length;
        matrix.columns = arrays[0].length;
        matrix.buffer = ComplexVector.fromValues(arrays.flat()).buffer;
        return matrix;
    }
    toString(precision){
        const colMax = (new Array(this.columns)).fill(0);
        const rows = [];
        for(let i = 0; i < this.rows; i++){
            const row = [];
            for(let j = 0; j < this.columns; j++){
                const idx = i * this.columns + j;
                const c = new Complex();
                c.r = this.buffer[idx<<1|0];
                c.i = this.buffer[idx<<1|1];
                const str = row[j] = c.toString(precision);
                if(colMax[j] < str.length)colMax[j] = str.length;
            }
            rows.push(row);
        }
        return rows.map(row=>row.map((str, j)=>str.padStart(colMax[j], " ")).join(" ")).map(row=>`|${row}|`).join("\n");
    }
    equal(matrix, atol=this.constructor.atol, rtol=this.constructor.rtol){
        if(this.rows !== matrix.rows)return false;
        if(this.columns !== matrix.columns)return false;
        for(let i = 0; i < this.rows * this.columns * 2; i++){
            const a = this.buffer[i];
            const b = matrix.buffer[i];
            if(!equalWithTolerance(a, b, atol, rtol)){
                return false;
            }
        }
        return true;
    }
    clone(){
        return this.constructor.create(this.rows, this.columns).copy(this);
    }
    set(row, col, r, i){
        if(typeof i === "undefined"){
            i = r.i;
            r = r.r;
        }
        const index = row * this.columns + col;
        this.buffer[index<<1|0] = r;
        this.buffer[index<<1|1] = i;
        return this;
    }
    get(row, col){
        const index = row * this.columns + col;
        return C(
            this.buffer[index<<1|0],
            this.buffer[index<<1|1],
        );
    }
    getRowReference(i){
        // return vector class
        const vector = new this.constructor.VectorClass();
        vector.length = this.columns;
        vector.buffer = this.buffer.subarray(i * 2 * this.columns, (i+1) * 2 * this.columns);
        return vector;
    }
    copy(source, offset=0){
        this.buffer.set(source.buffer, offset << 1);
        return this;
    }
    add(mat){
        const res = this.constructor.create(this.rows, this.columns);
        for(let i = 0; i < this.buffer.length; i++){
            res.buffer[i] = this.buffer[i] + mat.buffer[i];
        }
        return res;
    }
    addi(mat){
        for(let i = 0; i < this.buffer.length; i++){
            this.buffer[i] += mat.buffer[i];
        }
        return this;
    }
    sub(mat){
        const res = this.constructor.create(this.rows, this.columns);
        for(let i = 0; i < this.buffer.length; i++){
            res.buffer[i] = this.buffer[i] - mat.buffer[i];
        }
        return res;
    }
    subi(mat){
        for(let i = 0; i < this.buffer.length; i++){
            this.buffer[i] -= mat.buffer[i];
        }
        return this;
    }
    transpose(){
        const res = this.constructor.create(this.columns, this.rows);
        for(let i = 0; i < this.columns; i++){
            for(let j = 0; j < this.rows; j++){
                const idx1 = j*this.columns + i;
                const idx2 = i*this.rows + j;
                res.buffer[idx2<<1|0] = this.buffer[idx1<<1|0];
                res.buffer[idx2<<1|1] = this.buffer[idx1<<1|1];
            }
        }
        return res;
    }
    adjoint(){// conjugate transpose
        const res = this.constructor.create(this.columns, this.rows);
        for(let i = 0; i < this.columns; i++){
            for(let j = 0; j < this.rows; j++){
                const idx1 = j*this.columns + i;
                const idx2 = i*this.rows + j;
                res.buffer[idx2<<1|0] = this.buffer[idx1<<1|0];
                res.buffer[idx2<<1|1] = -this.buffer[idx1<<1|1];
            }
        }
        return res;
    }
    mul(mat){
        const res = this.constructor.create(this.rows, mat.columns);
        for(let i = 0; i < this.rows; i++){
            for(let j = 0; j < mat.columns; j++){
                let r_sum = 0;
                let i_sum = 0;
                for(let k = 0; k < this.columns; k++){
                    const idx1 = i * this.columns + k;
                    const idx2 = k * mat.columns + j;
                    const r1 = this.buffer[idx1<<1|0];
                    const i1 = this.buffer[idx1<<1|1];
                    const r2 = mat.buffer[idx2<<1|0];
                    const i2 = mat.buffer[idx2<<1|1];
                    r_sum += r1 * r2 - i1 * i2;
                    i_sum += r1 * i2 + i1 * r2;
                }
                const idx = i * mat.columns + j;
                res.buffer[idx<<1|0] = r_sum;
                res.buffer[idx<<1|1] = i_sum;
            }
        }
        return res;
    }
    muli(mat){
        for(let i = 0; i < this.rows; i++){
            const row_temp = this.constructor.VectorClass.create(this.rows);
            for(let j = 0; j < mat.columns; j++){
                let r_sum = 0;
                let i_sum = 0;
                for(let k = 0; k < this.columns; k++){
                    const idx1 = i * this.columns + k;
                    const idx2 = k * mat.columns + j;
                    const r1 = this.buffer[idx1<<1|0];
                    const i1 = this.buffer[idx1<<1|1];
                    const r2 = mat.buffer[idx2<<1|0];
                    const i2 = mat.buffer[idx2<<1|1];
                    r_sum += r1 * r2 - i1 * i2;
                    i_sum += r1 * i2 + i1 * r2;
                }
                row_temp.buffer[j<<1|0] = r_sum;
                row_temp.buffer[j<<1|1] = i_sum;
            }
            this.copy(row_temp, i * mat.columns);
        }
        return this;
    }
    mulVec(vec){
        const res = this.constructor.VectorClass.create(this.columns);
        for(let i = 0; i < this.rows; i++){
            let real = 0;
            let imag = 0;
            for(let j = 0; j < this.columns; j++){
                const matIdx = i*this.columns + j;
                const matR = this.buffer[matIdx<<1|0];
                const matI = this.buffer[matIdx<<1|1];
                const vecR = vec.buffer[j<<1|0];
                const vecI = vec.buffer[j<<1|1];
                real += matR * vecR - matI * vecI;
                imag += matR * vecI + matI * vecR;
            }
            res.buffer[i<<1|0] = real;
            res.buffer[i<<1|1] = imag;
        }
        return res;
    }
    LUDecompose(){
        // reference implementation:
        // https://en.wikipedia.org/wiki/LU_decomposition#Doolittle_algorithm
        // from C example LUPDecompose()
        if(this.columns !== this.rows)throw new Error("Cannot decompose non-square matrix");
        const size = this.rows;
        const permutation = new Uint32Array(size);
        for(let i = 0; i < size; i++){
            permutation[i] = i;
        }
        for(let i = 0; i < size; i++){
            // find the max
            let max = 0;
            let maxIndex = i;
            for(let j = i; j < size; j++){
                const idx = permutation[j] * size + i;
                const real = this.buffer[idx<<1|0];
                const imag = this.buffer[idx<<1|1];
                const magSquare = real**2 + imag**2;
                if(magSquare > max){
                    max = magSquare;
                    maxIndex = j;
                }
            }
            if(maxIndex !== i){
                // swap the rows and update the permutation vector
                const tmp = permutation[i];
                permutation[i] = permutation[maxIndex];
                permutation[maxIndex] = tmp;
            }
            const permutedI = permutation[i];
            const pivIdx = permutedI * size + i;
            const pivR = this.buffer[pivIdx<<1|0];
            const pivI = this.buffer[pivIdx<<1|1];
            const pivD = pivR*pivR + pivI*pivI;
            for(let j = i+1; j < size; j++){
                const permutedJ = permutation[j];
                const headIdx = permutedJ * size + i;
                const headR = this.buffer[headIdx<<1|0];
                const headI = this.buffer[headIdx<<1|1];
                // divide head by pivot to get the factor
                const factorR = (headR * pivR + headI * pivI)/pivD;
                const factorI = (headI * pivR - headR * pivI)/pivD;
                // store the factor where the value would be 0
                this.buffer[headIdx<<1|0] = factorR;
                this.buffer[headIdx<<1|1] = factorI;
                for(let k = i+1; k < size; k++){
                    const valueIdx = permutedJ * size + k;
                    const refIdx = permutedI * size + k;
                    const refR = this.buffer[refIdx<<1|0];
                    const refI = this.buffer[refIdx<<1|1];
                    this.buffer[valueIdx<<1|0] -= factorR * refR - factorI * refI;
                    this.buffer[valueIdx<<1|1] -= factorR * refI + factorI * refR;
                }
            }
        }
        return permutation;
    }
    invert(){
        return this.clone().inverti();
    }
    inverti(){
        // DasGupta, D. (2013) In-Place Matrix Inversion by Modified Gauss-Jordan Algorithm. Applied Mathematics, 4, 1392-1396. doi: 10.4236/am.2013.410188.
        if(this.columns !== this.rows)throw new Error("Cannot invert non-square matrix");
        const size = this.rows;
        const inverted = new Uint8Array(size);
        for(let _i = 0; _i < size; _i++){
            // find the max
            let max = 0;
            let maxIndex = 0;
            for(let j = 0; j < size; j++){
                if(inverted[j])continue;
                const idx = j * size + j;
                const real = this.buffer[idx<<1|0];
                const imag = this.buffer[idx<<1|1];
                const magSquare = real**2 + imag**2;
                if(magSquare > max){
                    max = magSquare;
                    maxIndex = j;
                }
            }
            // pivot row
            const pivot = maxIndex;
            inverted[pivot] = 1;
            const pivIdx = pivot * size + pivot;
            const pivR = this.buffer[pivIdx<<1|0];
            const pivI = this.buffer[pivIdx<<1|1];
            const pivM2 = pivR**2 + pivI**2;
            const pivinvR = pivR/pivM2;
            const pivinvI = -pivI/pivM2;
            // invert and do other stuff DasGupta1 et al.
            for(let j = 0; j < size; j++){
                const idx = pivot*size + j;
                if(j === pivot){
                    this.buffer[idx<<1|0] = pivinvR;
                    this.buffer[idx<<1|1] = pivinvI;
                }else{
                    const real = this.buffer[idx<<1|0];
                    const imag = this.buffer[idx<<1|1];
                    this.buffer[idx<<1|0] = real * pivinvR - imag * pivinvI;
                    this.buffer[idx<<1|1] = real * pivinvI + imag * pivinvR;
                }
            }

            for(let i = 0; i < size; i++){
                if(i === pivot)continue;
                // non pivotal row
                const rowPivIdx = i * size + pivot;
                const rowPivR = this.buffer[rowPivIdx<<1|0];
                const rowPivI = this.buffer[rowPivIdx<<1|1];
                for(let j = 0; j < size; j++){
                    const idx = i*size + j;
                    if(j === pivot){
                        this.buffer[idx<<1|0] = -(rowPivR * pivinvR - rowPivI * pivinvI);
                        this.buffer[idx<<1|1] = -(rowPivR * pivinvI + rowPivI * pivinvR);
                        continue;
                    }
                    const refIdx = pivot * size + j;
                    const refR = this.buffer[refIdx<<1|0];
                    const refI = this.buffer[refIdx<<1|1];
                    this.buffer[idx<<1|0] -= rowPivR * refR - rowPivI * refI;
                    this.buffer[idx<<1|1] -= rowPivR * refI + rowPivI * refR;
                }
            }
        }
        return this;
    }
    tensor(mat){// tensor product
        const rows = this.rows * mat.rows;
        const columns = this.columns * mat.columns;
        const res = this.constructor.create(rows, columns);
        for(let i1 = 0; i1 < this.rows; i1++){
            for(let i2 = 0; i2 < mat.rows; i2++){
                const i = i1 * mat.rows + i2;
                for(let j1 = 0; j1 < this.columns; j1++){
                    for(let j2 = 0; j2 < mat.columns; j2++){
                        const j = j1 * mat.columns + j2;
                        const idx = i * rows + j;
                        const idx1 = i1 * rows + j1;
                        const idx2 = i2 * rows + j2;
                        const real_1 = this.buffer[idx1<<1|0];
                        const imag_1 = this.buffer[idx1<<1|1];
                        const real_2 = this.buffer[idx2<<1|0];
                        const imag_2 = this.buffer[idx2<<1|1];
                        res.buffer[idx<<1|0] = real_1 * real_2 - imag_1 * imag_2;
                        res.buffer[idx<<1|1] = real_1 * imag_2 + imag_1 * real_2;
                    }
                }
            }
        }
    }
    eigenVector(){
        if(this.columns !== this.rows)throw new Error("Cannot calculate eigenvalue for non-square matrix");
        const size = this.rows;
        const mat = this.clone();
        let vec = this.constructor.VectorClass.create(size);
        for(let i = 0; i < size; i++){
            vec.buffer[i<<1] = 1;
        }
        vec.complexNormalize()
        for(let i = 0; i < 100; i++){
            vec = mat.mulVec(vec).complexNormalize();
            console.log(vec);
        }
    }
}

ComplexVector.MatrixClass = ComplexMatrix;
ComplexMatrix.VectorClass = ComplexVector;
