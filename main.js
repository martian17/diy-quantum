import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {FaceDrawer} from "./gl-pipeline/face.js";

const mixValue = function(v1, v2, r){
    return v1 + (v2 - v1) * r;
}

const toGrayCode = n => n ^ (n >> 1);


class DensityMatrixGraph {
    constructor(){
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        this.gl = this.canvas.getContext("webgl2", {antialias: true, premultipliedAlpha: true, depth: true});
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.canvas2d = document.createElement("canvas");
        this.ctx = this.canvas2d.getContext("2d");

        this.faceDrawer = new FaceDrawer(this.gl);
        
    }
    updateGraph(densityMatrix){
        let vertexOffset = 0;
        const vertices = [];
        const colors = [];
        const faces = [];

        // use https://ohmycolor.app/color-picker/
        const c0 = [0.890, 0.267, 0.0];
        const c1 = [1.0, 0.933, 0.0];
        const c2 = [0.078, 1.0, 0.784];
        for(let i = 0; i < densityMatrix.length; i++){
            const row = densityMatrix[i];
            for(let j = 0; j < row.length; j++){
                // // find some way to do it mathematically
                // // looping through faces
                // let dimap = 0;
                // for(let dim1 = 0; dim1 < 3; dim1++){
                //     for(let depth = 0; depth < 2; depth++){
                //         for(let _pidx = 0; _pidx < 4; _pidx++){
                //             let pidx = toGrayCode(pidx);
                //             let index = 0;
                //             let pbit = 0;
                //             for(let dim = 0; dim < 3; dim++){
                //                 if(dim1 === dim){
                //                     index |= depth << (2-depth);
                //                 }else{
                //                     index |= ((pidx >>> pbit)&1) << (2-pidx);
                //                     pbit++;
                //                 }
                //             }
                //             // at this point, index[0:3] forms a face
                //             
                //         }

                //     }
                // }
                // for(let dim1 = 0; dim1 < 3; dim1++){
                //     for(let pos = 0; pos < 2; pos++){
                //         const [dim2, dim3] = [0,1,2].splice(dim1);
                //         const v1 = [0,0,0].with(dim1,pos).with(dim2,0).with(dim3,0);
                //         const v2 = [0,0,0].with(dim1,pos).with(dim2,0).with(dim3,1);
                //         const v3 = [0,0,0].with(dim1,pos).with(dim2,1).with(dim3,1);
                //         const v4 = [0,0,0].with(dim1,pos).with(dim2,1).with(dim3,0);
                //     }

                // }
                const facesTemplate = [
                    0,1,2,
                    2,1,3,
                    2,3,6,
                    6,3,7,
                    6,7,4,
                    4,7,5,
                    4,5,0,
                    0,5,1,
                    0,2,6,
                    0,6,4,
                    1,7,3,
                    1,5,7,
                ];
                for(let value of facesTemplate){
                    faces.push(value + vertexOffset);
                }

                // const edgesTemplate = [
                //     [0,1],
                //     [2,3],
                //     [6,7],
                //     [4,5],
                //     [0,2],
                //     [4,6],
                //     [5,7],
                //     [1,3],
                //     [0,4],
                //     [1,5],
                //     [3,7],
                //     [2,6],
                // ];
                // for(let value of edgesTemplate){
                //     
                //     faces.push(value + vertexOffset);
                // }

                const value = row[j];
                const modulus = Math.sqrt(value.r ** 2 + value.i ** 2);
                const phase = Math.atan2(value.i, value.r);
                const x0 = ((j + 0.1) / row.length-0.5)*2;
                const x1 = ((j + 0.9) / row.length-0.5)*2;
                const z0 = ((i + 0.1) / densityMatrix.length-0.5)*2;
                const z1 = ((i + 0.9) / densityMatrix.length-0.5)*2;
                const y0 = 0;
                const y1 = modulus;
                
                for(let x of [x0,x1]){
                    for(let y of [y0,y1]){
                        for(let z of [z0,z1]){
                            vertices.push(x * 0.7);
                            vertices.push(y * 0.7);
                            vertices.push(z * 0.7);
                            // mixing colors. a bit verbose but fast and readable
                            colors.push(mixValue(c0[0], mixValue(c1[0], c2[0], phase), y));
                            colors.push(mixValue(c0[1], mixValue(c1[1], c2[1], phase), y));
                            colors.push(mixValue(c0[2], mixValue(c1[2], c2[2], phase), y));
                            colors.push(1);

                            vertexOffset++;
                        }
                    }
                }
            }
        }
        this.faceDrawer.uploadVertexBuffer(new Float32Array(vertices));
        this.faceDrawer.uploadColorBuffer(new Float32Array(colors));
        this.faceDrawer.uploadFaceBuffer(new Uint16Array(faces));
    }
    setRotation(rotation){
        this.faceDrawer.setRotation(rotation);
    }
    render(){
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.faceDrawer.draw();

    }
}

// erst bereitet man Density Matrix vor

const entangler = composeCircuit(
    embedGate(
        gates.H,
        [0,-1]
    ),
    gates.CNOT
);

const state = mul_matvec(
    entangler,
    nullStateVector(2).with(0,C(1,0))
);

const state1 = createRandomState(2);
const state2 = createRandomState(2);

const densityMatrix = outerSquare(state1);
    //outerSquare(state)

const graph = new DensityMatrixGraph();
document.body.appendChild(graph.canvas);
graph.updateGraph(densityMatrix);
printMatrix(densityMatrix)

let animateStart = 0;
let rotation = 0;
const animate = function(t){
    if(animateStart === 0)
        animateStart = t;
    const dt = t - animateStart;
    animateStart = t;
    rotation += dt/3000;
    graph.setRotation(rotation);
    graph.render();
    requestAnimationFrame(animate);
}
animate(0);
