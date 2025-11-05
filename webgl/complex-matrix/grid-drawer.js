import {IndexedFaceDrawer} from "../lib/drawer.js";
import {triangulate} from "../lib/util.js";


export class GridDrawer extends IndexedFaceDrawer{
    constructor(gl){
        super(gl);
    }
    lineWidth = 0.005;
    uploadMatrix(matrix){
        const size = matrix.length;
        const vertices = [];
        const faces = [];
        for(let i = 0; i < size + 1; i++){
            const x = (i/size-0.5)*2;
            const x0 = x - this.lineWidth/2;
            const x1 = x + this.lineWidth/2;
            const z0 = -1;
            const z1 = 1;
            let vertOffset;
            vertOffset = vertices.length;
            const permutations = [
                [0,1,2, 1],
                [0,2,1, -1],
                [1,0,2, -1],
                [1,2,0, 1],
                [2,0,1, 1],
                [2,1,0, -1]
            ];
            const permutate = function(arr,perm){
                return perm.map(i=>arr[i]);
            }
            for(let p of permutations){
                const chirality = p.pop();
                for(let side of [-1,1]){
                    vertOffset = vertices.length;
                    vertices.push(permutate([x0,z0,side],p));
                    vertices.push(permutate([x0,z1,side],p));
                    vertices.push(permutate([x1,z1,side],p));
                    vertices.push(permutate([x1,z0,side],p));
                    const face = [
                        vertOffset + 0,
                        vertOffset + 1,
                        vertOffset + 2,
                        vertOffset + 3,
                    ];
                    if(chirality * side === 1)face.reverse();
                    faces.push(face);
                }

            }
            // vertices.push([x0,-1,z0]);
            // vertices.push([x0,-1,z1]);
            // vertices.push([x1,-1,z1]);
            // vertices.push([x1,-1,z0]);
            // faces.push([
            //     vertOffset + 0,
            //     vertOffset + 1,
            //     vertOffset + 2,
            //     vertOffset + 3,
            // ]);
            // vertOffset = vertices.length;
            // vertices.push([z0,-1,x0]);
            // vertices.push([z0,-1,x1]);
            // vertices.push([z1,-1,x1]);
            // vertices.push([z1,-1,x0]);
            // faces.push([
            //     vertOffset + 0,
            //     vertOffset + 1,
            //     vertOffset + 2,
            //     vertOffset + 3,
            // ]);
        }
        const colors = vertices.map(v=>[0,0,0]);
        this.uploadVertexBuffer(new Float32Array(
            vertices.flat()
        ));
        this.uploadColorBuffer(new Float32Array(
            colors.flat()
        ));
        //console.log(triangulate(faces).flat());
        this.uploadFaceBuffer(new Uint16Array(
            triangulate(faces).flat()
        ));

        // console.log(new Float32Array(
        //     vertices.flat()
        // ));
        // console.log(new Float32Array(
        //     colors.flat()
        // ));
        // //console.log(triangulate(faces).flat());
        // console.log(new Float32Array(
        //     triangulate(faces).flat()
        // ));
    }
}
