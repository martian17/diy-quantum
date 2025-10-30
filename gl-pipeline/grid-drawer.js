import {Drawer} from "./drawer.js";
import {triangulate} from "../gl-primitives/platonic.js";

class FaceDrawer extends Drawer{
    constructor(gl){
        super(gl);
        this.compileAndLink();

        // set VAO to hang vertices and indices off of
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // prepare buffers
        this.vertexBufferHandle = gl.createBuffer();
        this.colorBufferHandle = gl.createBuffer();
        this.faceBufferHandle = gl.createBuffer();

        // bind vertex buffer to vertex attribute handle
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBufferHandle);
        const vertexAttributeHandle = gl.getAttribLocation(this.program, "vertex");
        gl.enableVertexAttribArray(vertexAttributeHandle);
        gl.vertexAttribPointer(
            vertexAttributeHandle,
            3, // size
            gl.FLOAT, // type
            false, // normalize
            0, // stride
            0 //offset
        );
        // bind color buffer to color attribute handle
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferHandle);
        const colorAttributeHandle = gl.getAttribLocation(this.program, "color");
        gl.enableVertexAttribArray(colorAttributeHandle);
        gl.vertexAttribPointer(
            colorAttributeHandle,
            3, // size
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
    uploadColorBuffer(f32){
        const {gl} = this;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorBufferHandle);
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
        gl.useProgram(this.program);
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

        in vec3 vertex;
        in vec3 color;
        uniform float rotation;
        out float height;
        out vec3 color_v;
        
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
            vec3 position = R * vertex;
            gl_Position = vec4(position.x, position.y, position.z / 10.0, 1.6);
            color_v = color;
        }
    `.trim();
    fragmentSrc = `
        #version 300 es
        
        precision highp float;
        
        in vec3 color_v;
        out vec4 output_color;
        
        void main(){
            output_color = vec4(1.0,1.0,1.0, 1.0);
        }
    `.trim();
}


export class GridDrawer extends FaceDrawer{
    constructor(gl){
        super(gl);
    }
    lineWidth = 0.005;
    uploadDensityMatrix(densityMatrix){
        const size = densityMatrix.length;
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
