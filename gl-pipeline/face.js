import {Drawer} from "./drawer.js";

export class FaceDrawer extends Drawer{
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
