import {Drawer} from "../lib/drawer.js";
import {generateCube} from "../lib/platonic.js";
import {mixColors, triangulate, generateOutline} from "../lib/util.js";

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

class InstancedElementDrawer extends Drawer{
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


export const phaseToColor = function(phase){
    phase = (phase + Math.PI*2)%(Math.PI*2);
    let p = phase/(Math.PI*2);
    const orange = [1.0, 0.5, 0.0];
    const red = [1.0, 0.471, 0.471];
    const blue = [0, 0.78, 1]//[0.078, 1.0, 0.784];
    const cyan = [0.412, 0.761, 0.514];//[0.471, 1.0, 0.824];
    const r = (p*4)%1;
    console.log(p)
    if(p < 0.25){
        return mixColors(orange, red, r);
    }else if(p < 0.5){
        return mixColors(red, blue, r);
    }else if(p < 0.75){
        return mixColors(blue, cyan, r);
    }else{
        return mixColors(cyan, orange, r);
    }
}

export class CubeGridDrawer extends InstancedElementDrawer{
    constructor(gl){
        super(gl);
    }
    _withOutline = true;
    lineWidth = 0.003;
    set withOutline(withOutline){
        this._withOutline = withOutline;
        this.uploadDensityMatrix(this.densityMatrix);
    }
    get withOutline(){
        return this._withOutline;
    }
    uploadDensityMatrix(densityMatrix){
        this.densityMatrix = densityMatrix;
        const {vertices, faces} = generateCube();
        let {vertices: outlineVertices, faces: outlineFaces, referenceVertices} = generateOutline({
            vertices,
            faces,
            lineWidth: this.lineWidth,
            generateReference: true,
        });
        if(!this.withOutline){
            outlineVertices = [];
            outlineFaces = [];
            referenceVertices = [];
        }
        // prepare vertex, referenceVertex, 
        this.vertexAttribute.upload(new Float32Array(
            vertices.concat(outlineVertices).flat()
        ));
        this.referenceVertexAttribute.upload(new Float32Array(
            vertices.map(v=>[...v,0]).concat(referenceVertices.map(v=>[...v,1])).flat()
        ));
        this.uploadFaceBuffer(new Uint16Array(
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
        for(let i = 0; i < densityMatrix.length; i++){
            const row = densityMatrix[i];
            for(let j = 0; j < row.length; j++){
                const value = row[j];
                const modulus = Math.sqrt(value.r ** 2 + value.i ** 2);
                //const phase = (Math.atan2(value.i, value.r) + Math.PI*2)%(Math.PI*2);
                const phase = Math.atan2(value.i, value.r);

                const scaleY = modulus;
                const translateX = ((j + 0.1)/densityMatrix.length - 0.5) * 2;
                const translateZ = ((i + 0.1)/densityMatrix.length - 0.5) * 2;
                // const colorBottom = mixColors(c0, c1, modulus);
                // const colorTop = phaseToColor(phase)//mixColors(c0, mixColors(c1, c2, phase), modulus);
                const colorTop = mixColors(c0, mixColors(c1, c2, phase), modulus);
                const colorBottom = mixColors(c0, mixColors(c1, c2, phase), 0);
                instanceTransform.push([scaleXZ, scaleY, translateX, translateZ]);
                instanceColorTop.push(colorTop);
                instanceColorBottom.push(colorBottom);
            }
        }
        this.instanceTransformAttribute.upload(new Float32Array(
            instanceTransform.flat()
        ));
        this.instanceColorTopAttribute.upload(new Float32Array(
            instanceColorTop.flat()
        ));
        this.instanceColorBottomAttribute.upload(new Float32Array(
            instanceColorBottom.flat()
        ));
    }
}
