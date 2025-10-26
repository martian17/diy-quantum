export class Drawer{
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
