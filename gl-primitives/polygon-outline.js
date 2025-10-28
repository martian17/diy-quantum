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
