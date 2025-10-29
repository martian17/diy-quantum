import {Drawer} from "./drawer.js";

class Attribute{
    constructor(bufferHandle, gl){
        this.bufferHandle = bufferHandle;
        this.gl = gl;
    }
    upload(buffer){
        const {gl} = this;
        this.size = buffer.length;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferHandle);
        gl.bufferData(gl.ARRAY_BUFFER, buffer, gl.STATIC_DRAW);
    }
}

export class InstancedElementDrawer extends Drawer{
    constructor(gl){
        super(gl);
        this.compileAndLink();

        // set VAO to hang vertices and indices off of
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        // prepare buffers
        // [x, y, z]
        this.vertexAttribute = this.setupAttribute("vertex");
        // [referenceX, referenceY, referenceZ, isEdge]
        this.referenceVertexAttribute = this.setupAttribute("referenceVertex", {size: 4});
        // for faces, not attribute setup is necessary
        this.faceBufferHandle = gl.createBuffer(); 

        // instance specific attributes
        // [scaleXY, scaleZ, translateX, translateY]
        this.instanceTransformAttribute = this.setupAttribute("instanceTransform", {instanced: true, size: 4});
        // color[3]
        this.instanceColorTopAttribute = this.setupAttribute("instanceColorTop", {instanced: true});
        // color[3]
        this.instanceColorBottomAttribute = this.setupAttribute("instanceColorBottom", {instanced: true});
    }
    setupAttribute(name, {
        size = 3,
        type,
        normalize = false,
        stride = 0,
        offset = 0,

        instanced = false,
    } = {}){
        const {gl} = this;
        if(!type)type = gl.FLOAT;// cannot access gl inside argument list so define it here
        const bufferHandle = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, bufferHandle);
        const attributeHandle = gl.getAttribLocation(this.program, name);
        gl.enableVertexAttribArray(attributeHandle);
        gl.vertexAttribPointer(attributeHandle, size, type, normalize, stride, offset);
        if(instanced)gl.vertexAttribDivisor(attributeHandle, 1);
        return new Attribute(bufferHandle, gl);
    }
    // all other buffer are uploaded through Attribute objects
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
        gl.drawElementsInstanced(
            gl.TRIANGLES, // primitiveType,
            this.faceCount, // count,
            gl.UNSIGNED_SHORT, //indexType,
            0,//offset
            this.instanceTransformAttribute.size/4,// instance count
        );
    }
    vertexSrc = `
        #version 300 es
        precision highp float;

        // [x, y, z]
        in vec3 vertex;
        // [referenceX, referenceY, referenceZ, isEdge]
        in vec4 referenceVertex;

        // instance specific attributes
        // [scaleXZ, scaleY, translateX, translateZ]
        in vec4 instanceTransform;
        // color[3]
        in vec3 instanceColorTop;
        // color[3]
        in vec3 instanceColorBottom;

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
            // transform the point based on the reference
            vec3 vertexOffset = vertex - referenceVertex.xyz;
            //vec3 translate = vec3(-0.0,0.0,-0.0);
            vec3 translate = vec3(instanceTransform[2], 0.0, instanceTransform[3]);
            vec3 scale = vec3(instanceTransform[0], instanceTransform[1], instanceTransform[0]);
            vec3 instancedVertex = (referenceVertex.xyz * scale + translate) + vertexOffset;


            // rotation on the y axis
            // roration -> view angle adjustment
            mat3 R = rotx(0.5) * roty(rotation); 
            vec3 position = R * (instancedVertex);
            gl_Position = vec4(position.x, position.y, position.z / 10.0, 1.5);

            float isEdge = referenceVertex[3];
            color_v = mix(
                mix(instanceColorBottom, instanceColorTop, referenceVertex.y),
                vec3(0.0, 0.0, 0.0),
                isEdge
            );
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
