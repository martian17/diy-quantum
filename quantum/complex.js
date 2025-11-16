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
    negate(){
        const res = this.constructor.create(this.length);
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = -this.buffer[rr];
            res.buffer[ii] = -this.buffer[rr];
        }
        return res;
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
    negatei(){
        for(let i = 0; i < this.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] = -this.buffer[rr];
            this.buffer[ii] = -this.buffer[rr];
        }
        return this;
    }
    conjugatei(){
        for(let i = 0; i < this.length * 2; i += 2){
            this.buffer[i] = -i;
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
    tensor(vec){
        const res = this.constructor.create(this.length * vec.length);
        for(let i = 0; i < this.length; i++){
            for(let j = 0; j < vec.length; j++){
                const idx = i * vec.length + j;
                const r1 = this.buffer[i<<1|0];
                const i1 = this.buffer[i<<1|1];
                const r2 = vec.buffer[i<<1|0];
                const i2 = vec.buffer[i<<1|1];
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
        const matrix = new ComplexMatrix();
        matrix.rows = rows;
        matrix.columns = columns;
        matrix.buffer = new this.BufferType(rows * columns * 2);
        return matrix;
    }
    static fromArrays(arrays){
        const matrix = new ComplexMatrix();
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
            const b = vector.buffer[i];
            if(!equalWithTolerance(a, b, atol, rtol)){
                return false;
            }
        }
        return true;
    }
    clone(){
        ComplexMatrix.create().copy(this);
    }
    set(row, col, r, i){
        if(typeof i === "undefined"){

        }
        const index = row * this.columns + col;
        this.buffer[index<<1|0] = c.r;
        this.buffer[index<<1|1] = c.i;
        return this;
    }
    get(row, col){
        const index = row * this.columns + col;
        return C(
            this.buffer[index<<1|0],
            this.buffer[index<<1|1],
        );
    }
    copy(source, offset=0){
        this.buffer.set(source.buffer, offset << 1);
    }
    add(mat){
        const res = this.constructor.create(this.rows, this.columns);
        for(let i = 0; i < this.buffer.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = this.buffer[rr] + mat.buffer[rr];
            res.buffer[ii] = this.buffer[ii] + mat.buffer[ii];
        }
        return res;
    }
    addi(mat){
        for(let i = 0; i < this.buffer.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] += mat.buffer[rr];
            this.buffer[ii] += mat.buffer[ii];
        }
        return this;
    }
    sub(mat){
        const res = this.constructor.create(this.rows, this.columns);
        for(let i = 0; i < this.buffer.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            res.buffer[rr] = this.buffer[rr] - mat.buffer[rr];
            res.buffer[ii] = this.buffer[ii] - mat.buffer[ii];
        }
        return res;
    }
    subi(mat){
        for(let i = 0; i < this.buffer.length; i++){
            const rr = i<<1|0;
            const ii = i<<1|1;
            this.buffer[rr] -= mat.buffer[rr];
            this.buffer[ii] -= mat.buffer[ii];
        }
        return this;
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
                    const r2 = vec.buffer[idx2<<1|0];
                    const i2 = vec.buffer[idx2<<1|1];
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
            const row_temp = this.constructor.VectorClass.create(this.rows, mat.columns);
            for(let j = 0; j < mat.columns; j++){
                let r_sum = 0;
                let i_sum = 0;
                for(let k = 0; k < this.columns; k++){
                    const idx1 = i * this.columns + k;
                    const idx2 = k * mat.columns + j;
                    const r1 = this.buffer[idx1<<1|0];
                    const i1 = this.buffer[idx1<<1|1];
                    const r2 = vec.buffer[idx2<<1|0];
                    const i2 = vec.buffer[idx2<<1|1];
                    r_sum = r1 * r2 - i1 * i2;
                    i_sum = r1 * i2 + i1 * r2;
                }
                row_temp.buffer[j<<1|0] = r_sum;
                row_temp.buffer[j<<1|1] = i_sum;
            }
            this.copy(row_temp, i * mat.columns);
        }
        return res;
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
    // wip
    // divl(){

    // }
    // divli(){

    // }
    // divr(){

    // }
    // divri(){

    // }
}

ComplexVector.MatrixClass = ComplexMatrix;
ComplexMatrix.VectorClass = ComplexVector;
