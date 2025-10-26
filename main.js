import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";

class Drawer{
    compileIndividual(type, source){
        const gl = this.gl;
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          const log = gl.getShaderInfoLog(shader);
          gl.deleteShader(shader);
          throw 'unable to create shader. gl said: ' + log;
        }
        return shader;
    }
    compileAndLink(){
        const gl = this.gl;
        const vertexShader = this.compileIndividual(gl.VERTEX_SHADER, this.vertexSrc);
        const fragmentShader = this.compileIndividual(gl.FRAGMENT_SHADER, this.fragmentSrc);
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            gl.deleteProgram(program);
            throw 'unable to link shader program.';
        }
        this.program = program;
    }
}

class FaceDrawer extends Drawer{
    constructor(gl){
        super();
        this.gl = gl;
        this.compileAndLink();

        // set VAO to hang vertices and indices off of
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // prepare buffers
        this.vertexBufferHandle = gl.createBuffer();
        this.faceBufferHandle = gl.createBuffer();

        // bind vertex buffer to vertex attribute handle
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferHandle);
        const vertexAttributeHandle = gl.getAttribLocation(this.program, "vertex");
        gl.enableVertexAttribArray(vertexAttributeHandle);
        gl.vertexAttribPointer(
            vertexAttributeHandle,
            4, // size
            gl.FLOAT, // type
            false, // normalize
            0, // stride
            0 //offset
        );
        // face (index) buffer needs no setup, as it's not bound to the code itself, and it's implicitly bound to the vertex buffers
    }
    uploadVertexBuffer(f32){
        const {gl} = this;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferHandle);
        gl.bufferData(gl.ARRAY_BUFFER, f32, gl.STATIC_DRAW);
    }
    uploadFaceBuffer(u16){
        const {gl} = this;
        this.faceCount = u16.length;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceBufferHandle);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, u16, gl.STATIC_DRAW);
    }
    setRotation(rotation){
        const {gl} = this;
        const rotationUniformHandle = gl.getUniformLocation(this.program, "rotation");
        gl.uniform1f(rotationUniformHandle, rotation);
    }
    draw(){
        const {gl} = this;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.drawElements(
            gl.TRIANGLES, // primitiveType,
            this.faceCount, // count,
            gl.UNSIGNED_SHORT, //indexType,
            0//offset
        );
    }
    vertexSrc = `
        #version 300 es
        
        precision highp float;

        in vec4 vertex;
        uniform float rotation;
        out float height;
        out float phase;
        
        mat3 roty(float theta){
            return mat3(
                cos(theta), 0, sin(theta),
                0, 1, 0,
                -sin(theta), 0, cos(theta)
            );
        }

        mat3 rotx(float theta){
            return mat3(
                1, 0, 0,
                0, cos(theta), -sin(theta),
                0,sin(theta), cos(theta)
            );
        }

        void main() {
            // rotation on the y axis
            // roration -> view angle adjustment
            mat3 R = rotx(0.5) * roty(rotation); 
            vec3 position = R * vertex.xyz;
            gl_Position = vec4(position.x, position.y, position.z / 10.0, 1.0);
            height = vertex.y;
            phase = vertex[3];
        }
    `.trim();
    fragmentSrc = `
        #version 300 es
        
        precision highp float;
        
        in float height;
        in float phase;
        out vec4 output_color;
        
        void main(){
            // use https://ohmycolor.app/color-picker/
            vec4 color_0 = vec4(0.890, 0.267, 0.0, 1.0);
            vec4 color_1 = vec4(1.0, 0.933, 0.0, 1.0);
            vec4 color_2 = vec4(0.078, 1.0, 0.784, 1.0);
            output_color = mix(color_0, mix(color_1, color_2, phase), height);
        }
    `.trim();
}

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
