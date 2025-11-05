import {InstancedElementDrawer} from "../lib/drawer.js";
import {generateCube} from "../lib/platonic.js";
import {mixColors, triangulate, generateOutline} from "../lib/util.js";

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
        this.uploadMatrix(this.matrix);
    }
    get withOutline(){
        return this._withOutline;
    }
    uploadMatrix(matrix){
        this.matrix = matrix;
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
        const scaleXZ = 2/matrix.length * 0.8;
        for(let i = 0; i < matrix.length; i++){
            const row = matrix[i];
            for(let j = 0; j < row.length; j++){
                const value = row[j];
                const modulus = Math.sqrt(value.r ** 2 + value.i ** 2);
                //const phase = (Math.atan2(value.i, value.r) + Math.PI*2)%(Math.PI*2);
                const phase = Math.atan2(value.i, value.r);

                const scaleY = modulus;
                const translateX = ((j + 0.1)/matrix.length - 0.5) * 2;
                const translateZ = ((i + 0.1)/matrix.length - 0.5) * 2;
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
