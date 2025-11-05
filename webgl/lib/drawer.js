export class Drawer{
    constructor(gl){
        this.gl = gl;
    }
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
        // fhmm, 20or faces, not attribute setup is necessary
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
        gl.useProgram(this.program);
        const rotationUniformHandle = gl.getUniformLocation(this.program, "rotation");
        gl.uniform1f(rotationUniformHandle, rotation);
    }
    draw(){
        const {gl} = this;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.faceBufferHandle);
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
            vec3 translate = vec3(instanceTransform[2], -1.0, instanceTransform[3]);
            vec3 scale = vec3(instanceTransform[0], instanceTransform[1] * 2.0, instanceTransform[0]);
            vec3 instancedVertex = (referenceVertex.xyz * scale + translate) + vertexOffset;


            // rotation on the y axis
            // roration -> view angle adjustment
            mat3 R = rotx(0.5) * roty(rotation); 
            vec3 position = R * (instancedVertex);
            gl_Position = vec4(position.x, position.y, position.z / 10.0, 1.6);

            float isEdge = referenceVertex[3];
            color_v = mix(
                mix(instanceColorBottom, instanceColorTop, referenceVertex.y),
                vec3(0.3, 0.3, 0.3),
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

export class IndexedFaceDrawer extends Drawer{
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
