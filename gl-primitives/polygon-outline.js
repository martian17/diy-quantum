const norm = (a,b,c)=>Math.sqrt(a**2 + b**2 + c**2);

const getNormal = function(v0,v1,v2){
    const ax = v1[0] - v0[0];
    const ay = v1[1] - v0[1];
    const az = v1[2] - v0[2];
    const bx = v2[0] - v0[0];
    const by = v2[1] - v0[1];
    const bz = v2[2] - v0[2];
    const nx = ay * bz - az * by;
    const ny = az * bx - ax * bz;
    const nz = ax * by - ay * bx;
    const n = norm(nx,ny,nz);
    // negative because counterclockwise
    return [-nx/n, -ny/n, -nz/n];
}

const unitDiff = function(v0,v1){
    const dx = v0[0] - v1[0];
    const dy = v0[1] - v1[1];
    const dz = v0[2] - v1[2];
    const n = norm(dx,dy,dz);
    return [dx/n,dy/n,dz/n];
}

const unitSum = function(vectors){
    let sum = [0,0,0];
    for(let i = 0; i < vectors.length; i++){
        sum[0] += vectors[i][0];
        sum[1] += vectors[i][1];
        sum[2] += vectors[i][2];
    }
    const n = norm(...sum);
    sum[0] /= n;
    sum[1] /= n;
    sum[2] /= n;
    return sum;
}

const vec3add = function(v0, v1){
    return [
        v0[0] + v1[0],
        v0[1] + v1[1],
        v0[2] + v1[2],
    ];
}

const vec3scale = function(v0, scale){
    return [
        v0[0] * scale,
        v0[1] * scale,
        v0[2] * scale,
    ];
}

const dot3 = function(v0,v1){
    return v0[0] * v1[0] + v0[1] * v1[1] + v0[2] * v1[2];
}

const dist3 = function(v0, v1){
    const dx = v0[0] - v1[0];
    const dy = v0[1] - v1[1];
    const dz = v0[2] - v1[2];
    return Math.sqrt(dx**2 + dy**2 + dz**2);
}



export const generateOutline = function({
    vertices,
    faces,
    lineWidth,
    float = 0.0001,
    generateReference = false,
}){
    const faceNormals = faces.map(face => getNormal(...face.slice(0,3).map(idx => vertices[idx])));
    const vertFaces = new Array(vertices.length).fill(0).map(_=>[]);
    for(let i = 0; i < faces.length; i++){
        const face = faces[i];
        for(let idx of face){
            vertFaces[idx].push(i);
        }
    }
    const vertNormals = vertFaces.map(faces=>unitSum(faces.map(idx=>faceNormals[idx])))

    const resultVertices = [];
    const resultFaces = [];
    const referenceVertices = [];
    // pushing the shifted up points
    for(let i = 0; i < vertNormals.length; i++){
        resultVertices.push(vec3add(vertices[i],vec3scale(vertNormals[i], float)));
        if(generateReference)referenceVertices.push(vertices[i]);
    }
    // jetzt kommen die Punkte dazwischen
    for(let i = 0; i < faces.length; i++){
        const face = faces[i];
        const vertexIndexOffset = resultVertices.length;
        for(let j = 0; j < face.length; j++){
            const leftVertex = vertices[face[(j-1 + face.length)%face.length]];
            const centerVertex = vertices[face[j]];
            const rightVertex = vertices[face[(j+1)%face.length]];
            const a = unitDiff(leftVertex, centerVertex);
            const b = unitDiff(rightVertex, centerVertex);
            const angle = Math.acos(dot3(a,b));
            let innerSpan = 1/Math.sin(angle/2) * lineWidth;
            const maxSpan = Math.min(dist3(centerVertex, leftVertex), dist3(centerVertex, rightVertex));
            if(!(innerSpan < maxSpan)){// innerSpan could be NaN
                innerSpan = maxSpan;
            }
            resultVertices.push(vec3add(centerVertex, vec3scale(unitSum([a,b]), innerSpan)));
            if(generateReference)referenceVertices.push(centerVertex);
            resultFaces.push([
                face[j],
                face[(j+1)%face.length],
                vertexIndexOffset + (j+1)%face.length,
                vertexIndexOffset + j,
            ]);
        }
    }
    const res = {
        vertices: resultVertices,
        faces: resultFaces
    };
    if(generateReference)res.referenceVertices = referenceVertices;
    return res;
};
