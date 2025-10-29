export const appendVFC = function(vfc1, vfc2){
    const faceOffset = vfc1.vertices.length / 3;
    // vertices
    for(let i = 0; i < vfc2.vertices.length; i++){
        vfc1.vertices.push(vfc2.vertices[i]);
    }
    // faces
    for(let i = 0; i < vfc2.faces.length; i++){
        vfc1.faces.push(faceOffset + vfc2.faces[i]);
    }
    // colors
    for(let i = 0; i < vfc2.colors.length; i++){
        vfc1.colors.push(vfc2.colors[i]);
    }
}

const mixValue = function(v1, v2, r){
    return v1 + (v2 - v1) * r;
}

export const mixColors = function(c1, c2, r){
    let res = [];
    for(let i = 0; i < c1.length; i++){
        res.push(mixValue(c1[i], c2[i], r));
    }
    return res;
}
