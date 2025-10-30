import {outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {DensityMatrixGraph} from "./density-matrix-graph.js";


// erst bereitet man Density Matrix vor

const entangler = composeCircuit(
    embedGate(
        gates.H,
        [0,-1]
    ),
    gates.CNOT
);

const state = mul_matvec(
    entangler,
    nullStateVector(2).with(0,C(1,0))
);

const state1 = createRandomState(2);
const state2 = createRandomState(2);

const densityMatrix = outerSquare(state1);
    //outerSquare(state)

class AnsiDisplay{
    // ring buffer
    lines = [];
    maxLines = 200;
    index = 0;
    static colorMap = {
        Black:   "\u001b[30m",
        Red:     "\u001b[31m",
        Green:   "\u001b[32m",
        Yellow:  "\u001b[33m",
        Blue:    "\u001b[34m",
        Magenta: "\u001b[35m",
        Cyan:    "\u001b[36m",
        White:   "\u001b[37m",
        BrightBlack:   "\u001b[30;1m",
        BrightRed:     "\u001b[31;1m",
        BrightGreen:   "\u001b[32;1m",
        BrightYellow:  "\u001b[33;1m",
        BrightBlue:    "\u001b[34;1m",
        BrightMagenta: "\u001b[35;1m",
        BrightCyan:    "\u001b[36;1m",
        BrightWhite:   "\u001b[37;1m",

        BackgroundBlack:         "\u001b[40m",
        BackgroundRed:           "\u001b[41m",
        BackgroundGreen:         "\u001b[42m",
        BackgroundYellow:        "\u001b[43m",
        BackgroundBlue:          "\u001b[44m",
        BackgroundMagenta:       "\u001b[45m",
        BackgroundCyan:          "\u001b[46m",
        BackgroundWhite:         "\u001b[47m",
        BackgroundBrightBlack:   "\u001b[40;1m",
        BackgroundBrightRed:     "\u001b[41;1m",
        BackgroundBrightGreen:   "\u001b[42;1m",
        BackgroundBrightYellow:  "\u001b[43;1m",
        BackgroundBrightBlue:    "\u001b[44;1m",
        BackgroundBrightMagenta: "\u001b[45;1m",
        BackgroundBrightCyan:    "\u001b[46;1m",
        BackgroundBrightWhite:   "\u001b[47;1m",

        Bold:      "\u001b[1m",

        Underline: "\u001b[4m",

        Reversed:  "\u001b[7m",

        Reset:     "\u001b[0m",
    }
    constructor(){
        const pre = document.createElement("pre");
        pre.className.add("ansi");
    }
    write(str){
        const lines = str.split("\n");
        const first = lines.splice(0,1)[0];
    }
    insertNewLine(str){

    }
}

const wrapper = document.createElement("div");
wrapper.classList.add("wrapper");
document.body.appendChild(wrapper);

const graph1 = new DensityMatrixGraph();
wrapper.appendChild(graph1.canvas);

const graph2 = new DensityMatrixGraph();
wrapper.appendChild(graph2.canvas);
graph1.updateGraph(outerSquare(state1));
graph2.updateGraph(outerSquare(state2));
printMatrix(densityMatrix)

let animateStart = 0;
let rotation = 0.5;
const animate = function(t){
    if(animateStart === 0)
        animateStart = t;
    const dt = t - animateStart;
    animateStart = t;
    rotation += dt/10000;
    graph1.setRotation(rotation);
    graph1.render();
    graph2.setRotation(rotation);
    graph2.render();
    requestAnimationFrame(animate);
}
animate(0);
