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
