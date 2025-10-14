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

class Complex{
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
    scale(k){
        return new Complex(
            this.r * k,
            this.i * k,
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
    static matrix(...rows){
        return rows.map(row=>this.vector(...row));
    }
}

const C = function(r,i){
    return new Complex(r,i);
};



const printMatrix = function(matrix){
    const sizemap = transpose(matrix).map(col=>col.map(v=>v.toString().length).reduce((a,b)=>a>b?a:b));
    for(let i = 0; i < matrix.length; i++){
        const row = matrix[i];
        process.stdout.write("|");
        for(let j = 0; j < row.length; j++){
            process.stdout.write(row[j].toString().padStart(sizemap[j]+1));
        }
        process.stdout.write(" |\n");
    }
}

const printVector = function(vector){
    const textSize = vector.map(v=>v.toString().length).reduce((a,b)=>a>b?a:b);
    for(let i = 0; i < vector.length; i++){
        process.stdout.write("|");
        process.stdout.write(vector[i].toString().padStart(textSize+1));
        process.stdout.write(" |\n");
    }
}

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

const printStateVector = function(vector){
    const state = vector;
    const probability = vector.map(v=>v.modulusSquare());
    
    const state_texts = state.map(v=>v.toString());
    const probability_texts = probability.map(v=>roundFloat(v));
    const dim = Math.round(Math.log(vector.length)/Math.log(2))
    const tag_texts = state.map((_,i)=>`|${i.toString(2).padStart(dim,"0")}>`)

    console.log(columnsToString(
        ["", ...tag_texts, "sum"],
        " | ",
        ["states", ...state_texts, state.reduce((a,b)=>a.add(b)).toString()],
        " | ",
        ["probability", ...probability_texts, roundFloat(probability.reduce((a,b)=>a+b))],
        " |",
    ));
}

const mul_vecmat = function(vec, mat){
    const res = [];
    for(let i = 0; i < mat[0].length; i++){
        let v = C(0,0);
        for(let j = 0; j < mat.length; j++){
            v = v.add(vec[i].mul(mat[j][i]));
        }
        res.push(v);
    }
    return res;
}

const mul_matvec = function(mat, vec){
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

const outerProduct = function(vec1, vec2){
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

const outerSquare = function(vec){
    return outerProduct(vec,vec);
}

const normalizeStateVector = function(vec){
    const probability = vec.map(v=>v.modulusSquare()).reduce((a,b)=>a+b);
    const normalizationBase = 1/Math.sqrt(probability);
    return vec.map(v=>v.scale(normalizationBase))
}

const round = function(num,order){
    const base = 10**order;
    return Math.round(num * base)/base;
}

const matStringify = function(mat){
    return JSON.stringify(mat.map(r=>r.map(c=>[round(c.r,5),round(c.i,5)])));
}

const getPauliGroup = function(){
    const isq2 = 1/Math.sqrt(2);
    const group = new Map([
        Complex.matrix(
            [isq2,isq2],
            [isq2,-isq2]
        ),
        Complex.matrix(
            [0,1],
            [1,0]
        ),
        Complex.matrix(
            [0,[0,-1]],
            [[0,1],0]
        ),
        Complex.matrix(
            [1,0],
            [0,-1]
        ),
    ].map(mat=>[matStringify(mat),mat]));
    for(let matrix of group.values()){
        printMatrix(matrix)
        console.log("");
    }
    console.log("-----------------------");
    while(true){
        const values = [...group.values()];
        let dn = 0;
        for(let mat1 of values){
            for(let mat2 of values){
                const mat3 = mul_matmat(mat1, mat2);
                const index = matStringify(mat3);
                if(group.has(index))continue;
                group.set(index, mat3);
                dn++;
            }
        }
        if(dn === 0)break;
    }
    const result = [...group.values()];
    for(let matrix of result){
        printMatrix(matrix)
        console.log("");
    }
    console.log(result.length);
    return result;
}


//getPauliGroup();



const isq2 = 1/Math.sqrt(2);
const gates = {
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

const embedGate = function(gate, qubitMap){
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


const compose_circuit = function(...args){
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

const circuits = {
    entanglement_00_11: compose_circuit(
        embedGate(
            gates.H,
            [0,-1]
        ),
        gates.CNOT,
        // adding the following entangles |01> and |10>
        // embedGate(
        //     gates.X,
        //     [-1,0]
        // ),
    ),
    reverse_cnot: compose_circuit(
        embedGate(
            gates.CNOT,
            [1,0]
        ),
    ),
    QFT_4: compose_circuit(
        embedGate(
            gates.H,
            [0,-1],
        ),
        // embedGate(
        //     gates.CT,
        //     [0,1],
        // ),
        embedGate(
            gates.R1(1/4),
            [-2,0],
        ),
        embedGate(
            gates.H,
            [-1,0],
        ),
    ),
    QFT_8: compose_circuit(
        embedGate(
            gates.H,
            [0,-1,-1],
        ),
        embedGate(
            gates.S,
            [0,-2,-1],
        ),
        embedGate(
            gates.T,
            [0,-1,-2],
        ),
        embedGate(
            gates.H,
            [-1,0,-1],
        ),
        embedGate(
            gates.S,
            [-1,0,-2],
        ),
        embedGate(
            gates.H,
            [-1,-1,0],
        ),
        embedGate(
            gates.SWAP,
            [0,-1,1],
        ),
    ),
    QFT_N: function(n){
        const baseMap = rep(n,-1);
        const circuit = [];
        for(let i = 0; i < n; i++){
            circuit.push(embedGate(
                gates.H,
                baseMap.with(i,0),
            ));
            for(let j = 1; j < (n-i); j++){
                circuit.push(embedGate(
                    gates.R1(1/(2**j)),
                    baseMap.with(i,0).with(i+j,-2),
                ));
            }
        }
        for(let i = 0; i < Math.floor(n/2); i++){
            circuit.push(embedGate(
                gates.SWAP,
                baseMap.with(i,0).with(n-i-1,1),
            ));
        }
        return compose_circuit(...circuit);
    },
}

const performMeasurment = function(state, measurmentMatrix){
    const projection = mul_matvec(measurmentMatrix, state);
    const probability = projection.map(v=>v.modulusSquare()).reduce((a,b)=>a+b);
    if(Math.random() < probability){
        return [normalizeStateVector(projection),1];
    }else{
        // I don't know if subtracting the projection from the state would give the state vector in case
        // the measurment results in -1 state. Ask Michel about this
        return [normalizeStateVector(sub_vecs(state, projection)),-1];
    }
}

console.log("[QFT 8x8]");{
    printMatrix(circuits.QFT_N(3));
}


console.log("\n[Entanglement between |00> and |11>]");{
    printMatrix(circuits.entanglement_00_11);
    printStateVector(
        mul_matvec(
            circuits.entanglement_00_11,
            Complex.vector(1,0,0,0),
        )
    );
}
