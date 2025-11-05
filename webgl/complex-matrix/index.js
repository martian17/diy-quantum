import {CubeGridDrawer} from "./cube-grid-drawer.js";
import {GridDrawer} from     "./grid-drawer.js";

export class ComplexMatrixPlot {
    constructor({grid = true} = {}){
        this.displayGrid = grid;
        this.canvas = document.createElement("canvas");
        this.canvas.style.width = "100%";
        this.canvas.style.height = "100%";
        this.canvas.style.display = "block";
        const ro = new ResizeObserver(entries=>{
            const rect = entries[0].contentRect;
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.render();
        });
        ro.observe(this.canvas);

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
    updateMatrix(matrix){
        this.cubeGridDrawer.uploadMatrix(matrix);
        this.gridDrawer.uploadMatrix(matrix);
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
        if(this.displayGrid)this.gridDrawer.draw();
    }
}
