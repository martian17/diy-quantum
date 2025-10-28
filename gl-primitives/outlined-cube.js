import { addPolygonOutline } from "./polygon-outline.js";

export const outlinedCube = function(x0,y0,z0,x1,y1,z1,colorBottom, colorTop, lineWidth){
    const vertices = [];
    const colors = [];
    const faces = [];

    const squareFaces = [
        [0,4,5,1],
        [4,6,7,5],
        [6,2,3,7],
        [2,0,1,3],
        [1,5,7,3],
        [0,2,6,4],
    ];
    for(let [v1,v2,v3,v4] of squareFaces){
        for(let vert of [v1,v2,v3, v3,v4,v1]){
            faces.push(vert);
        }
    }
    
    for(let x of [x0,x1]){
        for(let y of [y0,y1]){
            for(let z of [z0,z1]){
                vertices.push(x * 0.7);
                vertices.push(y * 0.7);
                vertices.push(z * 0.7);
                if(y === y0){
                    colors.push(colorBottom[0]);
                    colors.push(colorBottom[1]);
                    colors.push(colorBottom[2]);
                }else{
                    colors.push(colorTop[0]);
                    colors.push(colorTop[1]);
                    colors.push(colorTop[2]);
                }
                colors.push();
                // mixing colors. a bit verbose but fast and readable
                // colors.push(mixValue(c0[0], mixValue(c1[0], c2[0], phase), y));
                // colors.push(mixValue(c0[1], mixValue(c1[1], c2[1], phase), y));
                // colors.push(mixValue(c0[2], mixValue(c1[2], c2[2], phase), y));
            }
        }
    }
    addPolygonOutline(vertices, faces, colors, squareFaces, lineWidth);
    return {vertices, faces, colors};
}
