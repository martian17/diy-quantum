export const generateCube = function(){
    const vertices = [];
    for(let i = 0; i < 8; i++){
        vertices.push([
            i>>>2&1,// x
            i>>>1&1,// y
            i>>>0&1,// z
        ]);
    }
    const faces = [
        [0,1,5,4],
        [4,5,7,6],
        [6,7,3,2],
        [2,3,1,0],
        [1,3,7,5],
        [0,4,6,2],
    ];
    return {vertices, faces};
};

export const triangulate = function(faces){
    const triangles = [];
    for(let face of faces){
        for(let i = 1; i < face.length - 1; i++){
            triangles.push(face[0],face[i],face[i+1]);
        }
    }
    return triangles;
};
