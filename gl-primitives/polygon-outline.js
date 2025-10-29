const norm = (a,b,c)=>Math.sqrt(a**2 + b**2 + c**2);

export const addPolygonOutline = function(vertices, faces, colors, refFaces, lineWidth, outlineColor = [0,0,0], float = 0.0001){
    const lineIndexOffset = vertices.length / 3;

    let vertNormals = (new Array(8)).fill(0).map(_=>[0,0,0]);
    const faceNormals = refFaces.map(face =>{
        const ax = vertices[face[1]*3+0] - vertices[face[0]*3+0]
        const ay = vertices[face[1]*3+1] - vertices[face[0]*3+1]
        const az = vertices[face[1]*3+2] - vertices[face[0]*3+2]
        const bx = vertices[face[2]*3+0] - vertices[face[0]*3+0]
        const by = vertices[face[2]*3+1] - vertices[face[0]*3+1]
        const bz = vertices[face[2]*3+2] - vertices[face[0]*3+2]
        const nx = ay * bz - az * by;
        const ny = az * bx - ax * bz;
        const nz = ax * by - ay * bx;
        const n = norm(nx,ny,nz);
        for(let i = 0; i < face.length; i++){
            const vidx = face[i];
            vertNormals[vidx][0] += nx/n;
            vertNormals[vidx][1] += ny/n;
            vertNormals[vidx][2] += nz/n;
        }
        // eyeball that the normal is unit
        // console.log(nx/n,ny/n,nz/n);
        return [nx/n,ny/n,nz/n];
    });

    for(let i = 0; i < vertNormals.length; i++){
        vertices.push(vertices[i*3+0] + vertNormals[i][0]*float);
        vertices.push(vertices[i*3+1] + vertNormals[i][1]*float);
        vertices.push(vertices[i*3+2] + vertNormals[i][2]*float);
        colors.push(outlineColor[0]);
        colors.push(outlineColor[1]);
        colors.push(outlineColor[2]);
    }

    for(let i = 0; i < refFaces.length; i++){
        const face = refFaces[i];
        // calculating normal
        let xavg = 0;
        let yavg = 0;
        let zavg = 0;
        for(let j = 0; j < face.length; j++){
            const vidx = face[j];
            xavg += vertices[vidx*3+0];
            yavg += vertices[vidx*3+1];
            zavg += vertices[vidx*3+2];
        }
        xavg = xavg / face.length + faceNormals[i][0]*float;
        yavg = yavg / face.length + faceNormals[i][1]*float;
        zavg = zavg / face.length + faceNormals[i][2]*float;
        const faceIndexOffset = vertices.length / 3;
        for(let j = 0; j < face.length; j++){
            const left   = (lineIndexOffset + face[(j-1+face.length)%face.length])*3;
            const center = (lineIndexOffset + face[j])*3;
            const right  = (lineIndexOffset + face[(j+1)%face.length])*3;

            // fast vector operation in javascript is painful
            let dx1 = vertices[left+0] - vertices[center+0];
            let dy1 = vertices[left+1] - vertices[center+1];
            let dz1 = vertices[left+2] - vertices[center+2];
            let dx2 = vertices[right+0] - vertices[center+0];
            let dy2 = vertices[right+1] - vertices[center+1];
            let dz2 = vertices[right+2] - vertices[center+2];
            const n1 = norm(dx1,dy1,dz1);
            const n2 = norm(dx2,dy2,dz2);
            dx1 /= n1;
            dy1 /= n1;
            dz1 /= n1;
            dx2 /= n2;
            dy2 /= n2;
            dz2 /= n2;

            const x = vertices[center+0];
            const y = vertices[center+1];
            const z = vertices[center+2];
            const dx = dx1+dx2;
            const dy = dy1+dy2;
            const dz = dz1+dz2;
            vertices.push(x + dx*lineWidth);
            vertices.push(y + dy*lineWidth);
            vertices.push(z + dz*lineWidth);
            colors.push(outlineColor[0]);
            colors.push(outlineColor[1]);
            colors.push(outlineColor[2]);
            const vidx1 = lineIndexOffset + face[j];
            const vidx2 = lineIndexOffset + face[(j+1)%face.length];
            const vidx3 = faceIndexOffset + (j+1)%face.length;
            const vidx4 = faceIndexOffset + j;
            faces.push(vidx1);
            faces.push(vidx2);
            faces.push(vidx3);
            faces.push(vidx3);
            faces.push(vidx4);
            faces.push(vidx1);
        }
    }
}

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
    return [nx/n, ny/n, nz/n];
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
                vertexIndexOffset + j
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
