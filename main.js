import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {FaceDrawer} from "./gl-pipeline/face.js";

const mixValue = function(v1, v2, r){
    return v1 + (v2 - v1) * r;
}

const toGrayCode = n => n ^ (n >> 1);

const norm = (a,b,c)=>Math.sqrt(a**2 + b**2 + c**2);


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

        this.faceDrawer = new FaceDrawer(this.gl);
        
    }
    setCube(
        verticesRef, colorsRef, facesRef, phase,
        x0, y0, z0, x1, y1, z1,
        c0, c1, c2,
        lineColor, lineWidth, epsilon
    ){
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
                    // mixing colors. a bit verbose but fast and readable
                    colors.push(mixValue(c0[0], mixValue(c1[0], c2[0], phase), y));
                    colors.push(mixValue(c0[1], mixValue(c1[1], c2[1], phase), y));
                    colors.push(mixValue(c0[2], mixValue(c1[2], c2[2], phase), y));
                    colors.push(1);
                }
            }
        }

        const lineIndexOffset = vertices.length / 3;

        let vertNormals = (new Array(8)).fill(0).map(_=>[0,0,0]);
        const faceNormals = squareFaces.map(face =>{
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
            vertices.push(vertices[i*3+0] + vertNormals[i][0]*epsilon);
            vertices.push(vertices[i*3+1] + vertNormals[i][1]*epsilon);
            vertices.push(vertices[i*3+2] + vertNormals[i][2]*epsilon);
            colors.push(lineColor[0]);
            colors.push(lineColor[1]);
            colors.push(lineColor[2]);
            colors.push(1);
        }

        for(let i = 0; i < squareFaces.length; i++){
            const face = squareFaces[i];
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
            xavg = xavg / face.length + faceNormals[i][0]*epsilon;
            yavg = yavg / face.length + faceNormals[i][1]*epsilon;
            zavg = zavg / face.length + faceNormals[i][2]*epsilon;
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
                colors.push(lineColor[0]);
                colors.push(lineColor[1]);
                colors.push(lineColor[2]);
                colors.push(1);
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
        const vertices = [];
        const colors = [];
        const faces = [];

        // use https://ohmycolor.app/color-picker/
        const c0 = [0.890, 0.267, 0.0];
        const c1 = [1.0, 0.933, 0.0];
        const c2 = [0.078, 1.0, 0.784];
        //const lineColor = [0.33,0.33,0.33];
        const lineColor = [0,0,0];
        const lineWidth = 0.001;
        const epsilon = 0.0001;
        for(let i = 0; i < densityMatrix.length; i++){
            const row = densityMatrix[i];
            for(let j = 0; j < row.length; j++){
                //if(i === 0 && j === 0)continue;
                const value = row[j];
                const modulus = Math.sqrt(value.r ** 2 + value.i ** 2);
                //const phase = (Math.atan2(value.i, value.r) + Math.PI*2)%(Math.PI*2);
                const phase = Math.atan2(value.i, value.r);
                const x0 = ((j + 0.1) / row.length-0.5)*2;
                const x1 = ((j + 0.9) / row.length-0.5)*2;
                const z0 = ((i + 0.1) / densityMatrix.length-0.5)*2;
                const z1 = ((i + 0.9) / densityMatrix.length-0.5)*2;
                const y0 = 0;
                const y1 = modulus;
                this.setCube(
                    vertices, colors, faces, phase,
                    x0, y0, z0, x1, y1, z1,
                    c0, c1, c2,
                    lineColor, lineWidth, epsilon
                );
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
