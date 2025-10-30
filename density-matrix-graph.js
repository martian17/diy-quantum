import {CubeGridDrawer} from "./gl-pipeline/cube-grid-drawer.js";
import {GridDrawer} from "./gl-pipeline/grid-drawer.js";

export class DensityMatrixGraph {
    constructor(){
        this.canvas = document.createElement("canvas");
        this.canvas.width = 500;
        this.canvas.height = 500;
        const gl = this.gl = this.canvas.getContext("webgl2", {antialias: true, premultipliedAlpha: true, depth: true});
        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);

        gl.frontFace(gl.CCW)
        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        this.canvas2d = document.createElement("canvas");
        this.ctx = this.canvas2d.getContext("2d");

        this.cubeGridDrawer = new CubeGridDrawer(this.gl);
        this.gridDrawer = new GridDrawer(this.gl);
    }
    updateGraph(densityMatrix){
        this.cubeGridDrawer.uploadDensityMatrix(densityMatrix);
        this.gridDrawer.uploadDensityMatrix(densityMatrix);
    }
    setRotation(rotation){
        this.cubeGridDrawer.setRotation(rotation);
        this.gridDrawer.setRotation(rotation);
    }
    render(){
        const gl = this.gl;
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // Clear the canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        this.cubeGridDrawer.draw();
        this.gridDrawer.draw();
    }
}
