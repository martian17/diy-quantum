import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {FaceDrawer} from "./gl-pipeline/face.js";

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
        const faces = [];
        for(let i = 0; i < densityMatrix.length; i++){
            const row = densityMatrix[i];
            for(let j = 0; j < row.length; j++){
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
                            vertices.push(phase);
                        }
                    }
                }
                // find some way to do it mathematically
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
                vertexOffset += 8;
            }
        }
        this.faceDrawer.uploadVertexBuffer(new Float32Array(vertices));
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
