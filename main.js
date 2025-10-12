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
    toString(precision = 4){
        let r = Math.abs(this.r).toString().slice(0,precision);
        let i = Math.abs(this.i).toString().slice(0,precision)+"i";
        if(i === "1i")i = "i";
        if(r === "0" && i === "0i")return "0";
        if(i === "0i")return `${this.r<0?"-":""}${r}`;
        if(r === "0")return `${this.i<0?"-":""}${i}`;
        return `${this.r<0?"-":""}${r}${this.i<0?"-":"+"}${i}`;
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
        [0,[isq2,-isq2]],
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
}


const embedGate = function(gate, qubitMap){
    const dim = 2**qubitMap.length;
    const reverseMap = [];
    for(let i = 0; i < qubitMap.length; i++){
        if(qubitMap[i] === -1)continue;
        reverseMap[qubitMap[i]] = i;
    }

    // if non critical index is different
    // we simply ignore the value from the matrix
    let nonCriticalMask = 0;
    for(let i = 0; i < qubitMap.length; i++){
        if(qubitMap[i] === -1){
            // reverse bits because big endian, because math
            // |01> means first bit 0, and second bit 1
            nonCriticalMask |= 1 << (qubitMap.length-i-1);
        }
    }
    //console.log(gate);
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
            let rowIndex = 0;
            let colIndex = 0;
            for(let k = 0; k < reverseMap.length; k++){
                rowIndex |= (j>>>(qubitMap.length-reverseMap[k]-1)&1)<<k;
                colIndex |= (i>>>(qubitMap.length-reverseMap[k]-1)&1)<<k;
            }
            row.push(gate[colIndex][rowIndex]);
        }
    }
    //console.log(res);
    return res;
}

// printMatrix(embedGate(
//     gates.X,
//     //[-1,-1,-1,0]
//     [0,-1,-1,-1]
// ));

// printMatrix(embedGate(
//     gates.CNOT,
//     //[-1,-1,-1,0]
//     [1,0,-1]
// ));

printMatrix(mul_mats(
        embedGate(
            gates.CNOT,
            [1,0]
        ),
        embedGate(
            gates.H,
            [0,-1]
        ),
        embedGate(
            gates.X,
            [-1,0]
        ),
// embedGate(
//     gates.CNOT,
//     [1,0]
// ),
// embedGate(
//     gates.H,
//     [0,-1]
// ),
));

printVector(
    mul_matvec(
    mul_mats(
        // embedGate(
        //     gates.X,
        //     [-1,0]
        // ),
        embedGate(
            gates.CNOT,
            [1,0]
        ),
        embedGate(
            gates.H,
            [0,-1]
        ),
        //gates.CNOT,
    ),
    Complex.vector(1,0,0,0),
    )
);
