import {Drawer} from "./drawer.js";

export class FaceDrawer extends Drawer{
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
            gl_Position = vec4(position.x, position.y, position.z / 10.0, 1.0);
            color_v = color;
        }
    `.trim();
    fragmentSrc = `
        #version 300 es
        
        precision highp float;
        
        in vec3 color_v;
        out vec4 output_color;
        
        void main(){
            output_color = vec4(color_v, 1.0);
        }
    `.trim();
}
