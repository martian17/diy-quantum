import {config, outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState} from "./quantum.js";
import {DensityMatrixGraph} from "./density-matrix-graph.js";
import {FlexLayout, AnsiDisplay} from "./ui-elements.js";


const layout = new FlexLayout(`
+-----------------------------+
|d1            |d2            |
|              |              |
|              |              |
|-----------------------------|
|code                         |
|                             |
|                             |
+-----------------------------+
`);

document.body.appendChild(layout.root.element);

// |-----------------------------|
// |d1     |      |d2            |
// |--------------|--------------|
// |              |              |
// |-----------------------------|
// |code                         |
// |                             |
// |                             |
// |-----------------------------|



const graph1 = new DensityMatrixGraph();
layout.d1.appendChild(graph1.canvas);

const graph2 = new DensityMatrixGraph();
layout.d2.appendChild(graph2.canvas);

const ansi = new AnsiDisplay({
    height: "300px",
    overflowY: "scroll",
    overflowX: "hidden",
    scrollbarColor: "#ffffff #00000000",
    scrollbarWidth: "thin",
});
layout.code.appendChild(ansi.element)
config.stdout = ansi;


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
ansi.log("state1:");
printStateVector(state1);
ansi.log("density matrix 1:");
printMatrix(outerSquare(state1));
const state2 = createRandomState(2);
ansi.log("\n\nstate2:");
printStateVector(state2);
ansi.log("density matrix 2:");
printMatrix(outerSquare(state2));

graph1.updateGraph(outerSquare(state1));
graph2.updateGraph(outerSquare(state2));

//for(let i = 0; i < 1234; i++){
//    ansi.write(`Hello world ${i}\n`);
//}

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
