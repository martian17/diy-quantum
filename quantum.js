const options = {
    stdout: (()=>{
        if(typeof process !== "undefined")return process.stdout;
        return {
            write: function(content){
                if(content.at(-1) === "\n")content = content.slice(0,-1);
                console.log(content);
            }
        }
    })()
}

export const config = {
    options,
    stdout: options.stdout,
};

const transpose = function(matrix){
    const result = [];
    for(let i = 0; i < matrix[0].length; i++){
        const row = [];
        result.push(row);
        for(let j = 0; j < matrix.length; j++){
            row.push(matrix[j][i]);
        }
    }
    return result;
};

const roundFloatWithSign = function(val, precision = 4){
    const base = 10**precision;
    const rounded = Math.round(val * base)/base;
    let sign = "+";
    if(val < 0){
        sign = "-";
    }
    return sign + Math.abs(rounded).toString().slice(0,precision);// max precision letters plus sign
}

const roundFloat = function(val, precision = 4){
    const str = roundFloatWithSign(val, precision);
    if(str[0] === "+")return str.slice(1);
    return str;
}

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
    static epsilon = 1e-12;
    equal(c){
        return Math.abs(c.r - this.r) < this.constructor.epsilon &&
            Math.abs(c.i - this.i) < this.constructor.epsilon;
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
    // should be overloeded to Complex[] but it's javascript so I'll just put it to Complex
    static vector(...values){
        return values.map(value=>{
            if(typeof value === "number"){
                return new Complex(value, 0);
            }else if(value instanceof Array){
                return new Complex(value[0], value[1]);
            }else{
                throw new Error("Unknown");
            }
        });
    }
    static vectorEqual(v1, v2){
        if(v1.length !== v2.length)return false;
        for(let i = 0; i < v1.length; i++){
            if(!v1[i].equal(v2[i]))return false;
        }
        return true;
    }
    static vectorToFloat64Array(vector, targetBuffer){
        if(!targetBuffer){
            targetBuffer = new Float64Array(vector.length*2);
        }
        for(let i = 0; i < vector.length; i++){
            targetBuffer[i<<1|0] = vector[i].r;
            targetBuffer[i<<1|1] = vector[i].i;
        }
        return targetBuffer;
    }
    static matrix(...rows){
        return rows.map(row=>this.vector(...row));
    }
}

export const C = function(r,i){
    return new Complex(r,i);
};



export const printMatrix = function(matrix){
    const sizemap = transpose(matrix).map(col=>col.map(v=>v.toString().length).reduce((a,b)=>a>b?a:b));
    let res = "";
    for(let i = 0; i < matrix.length; i++){
        const row = matrix[i];
        res += "|";
        for(let j = 0; j < row.length; j++){
            res += row[j].toString().padStart(sizemap[j]+1);
        }
        res += " |\n";
    }
    config.stdout.write(res + "\n");
};

const columnsToString = function(...args){
    args = args.map(arg=>{
        if(arg instanceof Array){
            return {
                items: arg,
            }
        }
        return arg;
    });
    const sizes = args.map(v=>{
        if(typeof v === "string"){
            return v.length;
        }
        if(!(v.items instanceof Array))throw new Error("Unknown type in printColumns, column.items not found");
        return v.items.map(t=>t.length).reduce((a,b)=>a>b?a:b);
    });
    const height = args.map(v=>{
        if(typeof v === "string")return 1;
        return v.items.length;
    }).reduce((a,b)=>a>b?a:b);
    let rows = [];
    for(let i = 0; i < height; i++){
        let row = "";
        for(let j = 0; j < args.length; j++){
            const column = args[j];
            if(typeof column === "string"){
                row += column;
                continue;
            }
            const item = column.items[i] || "";
            if(column.padEnd){
                row += item.padEnd(sizes[j], column.pad || " ");
            }else{
                row += item.padStart(sizes[j], column.pad || " ");
            }
        }
        rows.push(row);
    }
    return rows.join("\n");
}

export const printStateVector = function(vector){
    const state = vector;
    const probability = vector.map(v=>v.modulusSquare());
    
    const state_texts = state.map(v=>v.toString());
    const probability_texts = probability.map(v=>roundFloat(v));
    const dim = Math.round(Math.log(vector.length)/Math.log(2))
    const tag_texts = state.map((_,i)=>`|${i.toString(2).padStart(dim,"0")}>`)

    config.stdout.write(columnsToString(
        ["", ...tag_texts, "sum"],
        " | ",
        ["states", ...state_texts, state.reduce((a,b)=>a.add(b)).toString()],
        " | ",
        ["probability", ...probability_texts, roundFloat(probability.reduce((a,b)=>a+b))],
        " |",
    ) + "\n");
}

export const mul_matvec = function(mat, vec){
    const res = [];
    for(let i = 0; i < mat.length; i++){
        let v = C(0,0);
        for(let j = 0; j < mat[i].length; j++){
            v = v.add(mat[i][j].mul(vec[j]));
        }
        res.push(v);
    }
    return res;
}

const mul_matmat = function(mat1, mat2){
    const res = [];
    for(let i = 0; i < mat1.length; i++){
        let row = [];
        for(let j = 0; j < mat1.length; j++){
            let value = new Complex(0,0);
            for(let k = 0; k < mat2.length; k++){
                value = value.add(mat1[i][k].mul(mat2[k][j]));
            }
            row.push(value);
        }
        res.push(row);
    }
    return res;
}

const mul_mats = function(...mats){
    let acc = mats[0];
    for(let i = 1; i < mats.length; i++){
        acc = mul_matmat(acc, mats[i]);
    }
    return acc;
}

const sub_vecs = function(vec1, vec2){
    const result = [];
    for(let i = 0; i < vec1.length; i++){
        result.push(vec1[i].sub(vec2[i]));
    }
    return result;
}

export const outerProduct = function(vec1, vec2){
    const result = [];
    for(let i = 0; i < vec1.length; i++){
        const row = [];
        result.push(row);
        for(let j = 0; j < vec2.length; j++){
            // complex multiplication commutes, so the order is irrelevant here
            row.push(vec1[i].mul(vec2[j].conjugate()));
        }
    }
    return result;
}

export const outerSquare = function(vec){
    return outerProduct(vec,vec);
}

export const normalizeStateVector = function(vec){
    const probability = vec.map(v=>v.modulusSquare()).reduce((a,b)=>a+b);
    const normalizationBase = 1/Math.sqrt(probability);
    return vec.map(v=>v.scale(normalizationBase))
}

const normalizeStateVectorAndExtractFactor = function(vec){
    let globalPhase;
    for(let i = 0; i < vec.length; i++){
        if(!vec[i].equal(C(0,0))){// this could have been cached, but we're writing javascript here, so performance doesn't matter
            const m2 = vec[i].modulusSquare();
            globalPhase = vec[i].scale(1/Math.sqrt(m2));
            break;
        }
    }
    if(!globalPhase){
        // state is zero, in this case, return |ψ>=|000....00> and λ=C(0,0)
        return {
            state: vec.map(_=>C(0,0)).with(0,C(1,0)),
            factor: C(0,0)
        };
    }
    const probability = vec.map(v=>v.modulusSquare()).reduce((a,b)=>a+b);
    const globalMagnitude = Math.sqrt(probability);
    const compensationCoefficient = globalPhase.scale(1/globalMagnitude).conjugate();
    return {
        state: vec.map(v=>v.mul(compensationCoefficient)),
        factor: globalPhase.scale(globalMagnitude)
    };
};

const round = function(num,order){
    const base = 10**order;
    return Math.round(num * base)/base;
}

export const createRandomState = function(n){
    // n qubits
    let state = [];
    for(let i = 0; i < 2**n; i++){
        state.push(C(Math.random()-0.5, Math.random()-0.5));
    }
    return normalizeStateVector(state);
};

const loopBitShiftLeft = function(n, i){
    i &= 31;
    return n << (i) | n >>> (32 - i);
};

class ComplexArrayMap{//unordered_map<Complex[], any>
    map = new Map();// number => bucket[Complex[] as key, value]
    constructor(){
        this.F64B = new Float64Array(1);
        this.I32B = new Int32Array(this.F64B.buffer);
    }
    hash(vector){
        // Just pulled it out of my ass, but should be good enough as we use buckets
        let hash = 0;
        for(let i = 0; i < vector.length; i++){
            const c = vector[i];
            this.F64B[0] = c.r;
            hash ^= loopBitShiftLeft(this.I32B[0] ^ this.I32B[1], i<<1);
            this.F64B[0] = c.i;
            hash ^= loopBitShiftLeft(this.I32B[0] ^ this.I32B[1], i<<1|1);
        }
        return hash;
    }
    getBucket(hash){
        let bucket = this.map.get(hash);
        if(bucket){
            return bucket;
        }
        bucket = [];
        this.map.set(hash,bucket);
        return bucket;
    }
    set(key, value){// key: Complex[]
        const hash = this.hash(key);
        let bucket = this.getBucket(hash);
        for(const entry of bucket){
            const [key1, _value1] = entry;
            if(Complex.vectorEqual(key,key1)){
                entry[1] = value;
                return;
            }
        }
        bucket.push([key, value]);
    }
    get(key){// key: Complex[]
        const hash = this.hash(key);
        let bucket = this.getBucket(hash);
        for(const entry of bucket){
            const [key1, value1] = entry;
            if(Complex.vectorEqual(key,key1)){
                return value1;
            }
        }
        return undefined;
    }
    getValues(){
        return [...this.map.values()].map(bucket=>bucket.map(([_key, value])=>value)).flat();
    }
}

// Caution: no quantization with ε, so it should be performed before calling this function
const coalessStateVectorTerms = function(coefficients, vectors){
    if(coefficients.length !== vectors.length)throw new Error(`coalessing failed: different vector sizes for coefficients and vectors`);
    const terms = new ComplexArrayMap();// Complex[] => term
    for(let i = 0; i < vectors.length; i++){
        const state2 = vectors[i];
        let term = terms.get(state2);
        if(!term){
            term = {
                state1: coefficients.map(_=>C(0,0)),
                state2: state2,
                coefficient: null,
                coefficientMagnitude: null,
            };
            terms.set(state2, term);
        }
        term.state1[i] = coefficients[i];
    }
    return terms.getValues().map((term)=>{
        const {state, factor} = normalizeStateVectorAndExtractFactor(term.state1);
        term.state1 = state;
        term.coefficient = factor;
        term.coefficientMagnitude = factor.magnitude();
        return term;
    }).sort((a, b)=>{
        return b.coefficientMagnitude - a.coefficientMagnitude;
    }).filter((term)=>{
        return !term.coefficient.equal(C(0,0));
    });
};

export const decomposeState = function(parentSpace, indices1, indices2){
    const d = Math.round(Math.log(parentSpace.length)/Math.log(2));
    let mask1 = 0
    for(let i = 0; i < indices1.length; i++){
        mask1 |= 1 << (d - indices1[i] - 1);
    }
    // if second indices is not specified, take the inverse of indices1 in the ascending bit order
    if(!indices2){
        indices2 = [];
        for(let i = 0; i < d; i++){
            if((mask1>>>(d-i-1)&1) === 0){
                indices2.push(i);
            }
        }
    }
    let mask2 = 0;
    for(let i = 0; i < indices2.length; i++){
        mask2 |= 1 << (d - indices2[i] - 1);
    }

    const d1 = indices1.length;
    const d2 = indices2.length;

    const vec1Terms = [];
    const listOfVec2Terms = [];

    const l1 = 2**d1;
    const l2 = 2**d2;
    for(let i = 0; i < l1; i++){
        const vec2Terms = [];
        let baseIndex = 0;
        for(let j = 0; j < indices1.length; j++){
            baseIndex |= (i>>>(d1-j-1)&1)<<(d-indices1[j]-1);
        }
        for(let j = 0; j < l2; j++){
            let index = baseIndex;
            for(let k = 0; k < indices1.length; k++){
                index |= (j>>>(d2-k-1)&1)<<(d-indices2[k]-1);
            }
            vec2Terms.push(parentSpace[index]);
        }
        const {factor: λi, state: state_2i} = normalizeStateVectorAndExtractFactor(vec2Terms);
        vec1Terms.push(λi);
        listOfVec2Terms.push(state_2i);
    }
    const terms = coalessStateVectorTerms(vec1Terms, listOfVec2Terms);
    // if the two qubit sets are entangled, then the the number of terms will be more than 1.
    return terms;
}

const addParenthesisIfNeeded = function(expression){
    if(expression.slice(1).match(/[+-]/)){
        // vstr contains multiple term
        expression = `(${expression})`;
    }
    return expression;
}

const stateVectorToString = function(state){
    const dim = Math.round(Math.log(state.length)/Math.log(2))
    let result = "";
    for(let i = 0; i < state.length; i++){
        const value = state[i];
        if(value.equal(C(0,0)))continue;
        let vstr = addParenthesisIfNeeded(value.toString());
        const tagText = `|${i.toString(2).padStart(dim,"0")}>`;
        let term = vstr + tagText;
        if(i !== 0 && term[0] !== "-"){
            term = "+"+term;
        }
        result += term;
    }
    return result;
}

// this takes terms[] type defined in the above function and prints it
// I should really consider using typescript, or at this point just C++ or rust
export const decomposedStateTermsToString = function(terms){
    let res = "";
    for(let i = 0; i < terms.length; i++){
        let term = terms[i];
        let coef = addParenthesisIfNeeded(term.coefficient.toString());
        let state1Terms = addParenthesisIfNeeded(stateVectorToString(term.state1));
        let state2Terms = addParenthesisIfNeeded(stateVectorToString(term.state2));
        if(res === ""){
            res += coef + "(" + state1Terms + "⊗ " + state2Terms + ")";
        }else{
            if(coef[0] === "-"){
                res += " - " + coef.slice(1) + "(" + state1Terms + "⊗ " + state2Terms + ")";
            }else{
                res += " + " + coef + "(" + state1Terms + "⊗ " + state2Terms + ")";
            }
        }
    }
    return res;
}

const colors = {
    orange: (str) => {
        return `\u001b[33m${str}\u001b[0m`;
    },
    reversed: (str) => {
        return `\u001b[7m${str}\u001b[0m`;
    }
}


const isq2 = 1/Math.sqrt(2);
export const gates = {
    // Hadamard gate
    H: Complex.matrix(
        [isq2,isq2],
        [isq2,-isq2]
    ),
    // T gate
    T: Complex.matrix(
        [1,0],
        [0,[isq2,isq2]],
    ),
    // S gate
    S: Complex.matrix(
        [1,0],
        [0,[0,1]],
    ),
    // HSHSHS gate
    HSHSHS: Complex.matrix(
        [[isq2,isq2],0],
        [0,[isq2,isq2]],
    ),
    // Pauli X
    X: Complex.matrix(
        [0,1],
        [1,0]
    ),
    // Pauli Y
    Y: Complex.matrix(
        [0,[0,-1]],
        [[0,1],0]
    ),
    // Pauli Z
    Z: Complex.matrix(
        [1,0],
        [0,-1]
    ),
    // Einheitsmatrix
    I: Complex.matrix(
        [1,0],
        [0,1]
    ),
    // qubit 0 is control, qubit 1 is target
    CNOT: Complex.matrix(
        [1,0,0,0],
        [0,1,0,0],
        [0,0,0,1],
        [0,0,1,0],
    ),
    CT: Complex.matrix(
        [1,0,0,0],
        [0,1,0,0],
        [0,0,1,0],
        [0,0,0,[isq2,isq2]],
    ),
    SWAP: Complex.matrix(
        [1,0,0,0],
        [0,0,1,0],
        [0,1,0,0],
        [0,0,0,1],
    ),
    RX: function(radian_pi){
        const theta = radian_pi * Math.PI;
        return Complex.matrix(
            [Math.cos(theta/2),[0,-Math.sin(theta/2)]],
            [[0,-Math.sin(theta/2)],Math.cos(theta/2)]
        );
    },
    RY: function(radian_pi){
        const theta = radian_pi * Math.PI;
        return Complex.matrix(
            [Math.cos(theta/2),-Math.sin(theta/2)],
            [Math.sin(theta/2),Math.cos(theta/2)]
        );
    },
    RZ: function(radian_pi){
        const theta = radian_pi * Math.PI;
        return Complex.matrix(
            [[Math.cos(theta/2),-Math.sin(theta/2)],0],
            [0,[Math.cos(theta/2),Math.sin(theta/2)]]
        );
    },
    R1: function(radian_pi){//radian over pi. Half rotation will be 1
        const theta = radian_pi * Math.PI;
        return Complex.matrix(
            [1,0],
            [0,[Math.cos(theta), Math.sin(theta)]]
        );
    },

    MES_Z_PLUS: outerSquare(
        Complex.vector(1,0)
    ),
}

export const embedGate = function(gate, qubitMap){
    const dim = 2**qubitMap.length;
    const reverseMap = [];
    let controlMask = 0;
    let controlSignMask = 0;
    for(let i = 0; i < qubitMap.length; i++){
        if(qubitMap[i] >= 0){
            reverseMap[qubitMap[i]] = i;
        }else if(qubitMap[i] === -2){
            controlMask |= 1 << (qubitMap.length - i - 1);
            controlSignMask |= 1 << (qubitMap.length - i - 1);
        }else if(qubitMap[i] === -3){
            controlMask |= 1 << (qubitMap.length - i - 1);
        }
    }
    //-2 => control
    //-3 => negative controlx

    // if non critical index is different
    // we simply ignore the value from the matrix
    let nonCriticalMask = 0;
    for(let i = 0; i < qubitMap.length; i++){
        if(qubitMap[i] === -1){// empty
            // reverse bits because big endian, because math
            // |01> means first bit 0, and second bit 1
            nonCriticalMask |= 1 << (qubitMap.length-i-1);
        }
    }

    const res = [];
    for(let i = 0; i < dim; i++){
        const row = [];
        res.push(row);
        for(let j = 0; j < dim; j++){
            // check if non-critical index is the same
            // ansonstens, it should be 0
            if((nonCriticalMask&i) !== (nonCriticalMask&j)){
                row.push(C(0,0));
                continue;
            }
            // if the control bits don't match, then it should be also 0
            if((i&controlMask) !== (j&controlMask)){
                row.push(C(0,0));
                continue;
            }
            if((i&controlMask) !== controlSignMask){
                if(i === j){
                    row.push(C(1,0));
                }else{
                    row.push(C(0,0));
                }
                continue;
            }
            let rowIndex = 0;
            let colIndex = 0;
            for(let k = 0; k < reverseMap.length; k++){
                rowIndex |= (j>>>(qubitMap.length-reverseMap[k]-1)&1)<<(reverseMap.length-k-1);
                colIndex |= (i>>>(qubitMap.length-reverseMap[k]-1)&1)<<(reverseMap.length-k-1);
            }
            row.push(gate[colIndex][rowIndex]);
        }
    }
    return res;
}


export const composeCircuit = function(...args){
    // Because gates are performed like this
    // GATE|Ψ>
    // serially applied gates will be in the following form
    // (GATE_N ... (GATE_2(GATE_1|Ψ>))...)
    // Therefore, the gate vectors need to be multiplied backwards
    return mul_mats(...args.reverse());
}

const rep = function(n,v=0){
    const arr = [];
    for(let i = 0; i < n; i++){
        arr.push(v);
    }
    return arr;
}

export const nullStateVector = function(n){
    const N = 2**n;
    const res = [];
    for(let i = 0; i < N; i++){
        res.push(C(0,0));
    }
    return res;
}

export const performMeasurement = function(state, measurementMatrix){
    const projection = mul_matvec(measurementMatrix, state);
    const probability = projection.map(v=>v.modulusSquare()).reduce((a,b)=>a+b);
    if(Math.random() < probability){
        return [normalizeStateVector(projection),1];
    }else{
        // I don't know if subtracting the projection from the state would give the state vector in case
        // the measurement results in -1 state. Ask Michel about this
        return [normalizeStateVector(sub_vecs(state, projection)),-1];
    }
}
