import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {InstancedElementDrawer} from "./gl-pipeline/instanced-cubes.js";
import {generateCube, triangulate} from "./gl-primitives/platonic.js";
import {generateOutline} from "./gl-primitives/polygon-outline.js";

const mixValue = function(v1, v2, r){
    return v1 + (v2 - v1) * r;
}

const mixColors = function(c1, c2, r){
    let res = [];
    for(let i = 0; i < c1.length; i++){
        res.push(mixValue(c1[i], c2[i], r));
    }
    return res;
}

class DensityMatrixGraph {
    constructor(){
        this.canvas = document.createElement("canvas");
        this.canvas.width = 1500;
        this.canvas.height = 1500;
        this.gl = this.canvas.getContext("webgl2", {antialias: true, premultipliedAlpha: true, depth: true});
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.depthFunc(this.gl.LEQUAL);

        this.canvas2d = document.createElement("canvas");
        this.ctx = this.canvas2d.getContext("2d");

        this.instanceDrawer = new InstancedElementDrawer(this.gl);
    }
    setCube(
        verticesRef, colorsRef, facesRef, phase,
        x0, y0, z0, x1, y1, z1,
        c0, c1, c2,
        lineWidth
    ){
        const vertices = [];
        const colors = [];
        const faces = [];


        const offset = verticesRef.length / 3;
        for(let i = 0; i < vertices.length; i++){
            verticesRef.push(vertices[i]);
        }
        for(let i = 0; i < colors.length; i++){
            colorsRef.push(colors[i]);
        }
        for(let i = 0; i < faces.length; i++){
            facesRef.push(faces[i] + offset);
        }
    }
    updateGraph(densityMatrix){
        const lineWidth = 0.001;
        const {vertices, faces} = generateCube();
        const {vertices: outlineVertices, faces: outlineFaces, referenceVertices} = generateOutline({
            vertices,
            faces,
            lineWidth,
            generateReference: true,
        });
        // prepare vertex, referenceVertex, 
        this.instanceDrawer.vertexAttribute.upload(new Float32Array(
            vertices.concat(outlineVertices).flat()
        ));
        this.instanceDrawer.referenceVertexAttribute.upload(new Float32Array(
            vertices.map(v=>[...v,0]).concat(referenceVertices.map(v=>[...v,1])).flat()
        ));
        this.instanceDrawer.uploadFaceBuffer(new Uint16Array(
            // offset the outline face indices
            triangulate(faces.concat(outlineFaces.map(face=>face.map(idx=>idx+vertices.length)))).flat()
        ))

        // now upload instances
        const instanceTransform = [];
        const instanceColorTop = [];
        const instanceColorBottom = [];
        // use https://ohmycolor.app/color-picker/
        const c0 = [0.890, 0.267, 0.0];
        const c1 = [1.0, 0.933, 0.0];
        const c2 = [0.078, 1.0, 0.784];
        const scaleXZ = 2/densityMatrix.length * 0.8;
        outer:
        for(let i = 0; i < densityMatrix.length; i++){
            const row = densityMatrix[i];
            for(let j = 0; j < row.length; j++){
                //if(i === 0 && j === 0)continue;
                const value = row[j];
                const modulus = Math.sqrt(value.r ** 2 + value.i ** 2);
                //const phase = (Math.atan2(value.i, value.r) + Math.PI*2)%(Math.PI*2);
                const phase = Math.atan2(value.i, value.r);

                const scaleY = modulus;
                const translateX = ((j + 0.1)/densityMatrix.length - 0.5) * 2;
                const translateZ = ((i + 0.1)/densityMatrix.length - 0.5) * 2;
                const colorTop = mixColors(c0, mixColors(c1, c2, phase), modulus);
                const colorBottom = mixColors(c0, mixColors(c1, c2, phase), 0);
                instanceTransform.push([scaleXZ, scaleY, translateX, translateZ]);
                instanceColorTop.push(colorTop);
                instanceColorBottom.push(colorBottom);
            }
        }
        this.instanceDrawer.instanceTransformAttribute.upload(new Float32Array(
            instanceTransform.flat()
        ));
        this.instanceDrawer.instanceColorTopAttribute.upload(new Float32Array(
            instanceColorTop.flat()
        ));
        this.instanceDrawer.instanceColorBottomAttribute.upload(new Float32Array(
            instanceColorBottom.flat()
        ));
    }
    setRotation(rotation){
        this.instanceDrawer.setRotation(rotation);
    }
    render(){
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.instanceDrawer.draw();
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
