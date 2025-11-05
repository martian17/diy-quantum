import {config, outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState, rep} from "../quantum/index.js";
import {ComplexMatrixPlot} from "../webgl/complex-matrix/index.js";
import {FlexLayout, AnsiDisplay, applyStyle} from "../ui-elements/index.js";

export const init = function(parent){
    const layout = new FlexLayout(`
    +-----------------------------+
    |d1       |d2       |d3       |
    |         |         |         |
    |         |         |         |
    |-----------------------------|
    |code                         |
    |                             |
    |                             |
    +-----------------------------+
    `);
    
    parent.appendChild(layout.root.element);


    const plot1 = new ComplexMatrixPlot({grid: false});
    const plot2 = new ComplexMatrixPlot();
    const plot3 = new ComplexMatrixPlot({grid: false});
    // styling
    {
        const {d1, d2, d3} = layout;
        d1.appendChild(plot1.canvas);
        d2.appendChild(plot2.canvas);
        d3.appendChild(plot3.canvas);

        applyStyle(d1, d2, d3, {
            flex: "1",
            aspectRatio: "1 / 1",
            maxWidth:"50vh",
        });
    }
    
    
    const ansi = new AnsiDisplay({
        height: "300px",
    });
    layout.code.appendChild(ansi.element)
    config.stdout = ansi;
    
    
    const QFT_N = function(n){
        const baseMap = rep(n,-1);
        const circuit = [];
        for(let i = 0; i < n; i++){
            circuit.push(embedGate(
                gates.H,
                baseMap.with(i,0),
            ));
            for(let j = 1; j < (n-i); j++){
                circuit.push(embedGate(
                    gates.R1(1/(2**j)),
                    baseMap.with(i,0).with(i+j,-2),
                ));
            }
        }
        for(let i = 0; i < Math.floor(n/2); i++){
            circuit.push(embedGate(
                gates.SWAP,
                baseMap.with(i,0).with(n-i-1,1),
            ));
        }
        return composeCircuit(...circuit);
    };
    
    const isq2 = 1/Math.sqrt(2);
    const qft3 = QFT_N(3);
    const vec0 = nullStateVector(3).with(0,C(isq2,0)).with(7,C(0,isq2));
    const vec1 = mul_matvec(qft3, vec0);
    
    plot1.updateMatrix([vec0]);
    ansi.log("State Before");
    printStateVector(vec0);
    plot2.updateMatrix(qft3);
    ansi.log("\n3 qubits QFT");
    printMatrix(qft3);
    plot3.updateMatrix([vec1]);
    ansi.log("State After");
    printStateVector(vec1);


    let animateStart = 0;
    let rotation = 0.5;
    const animate = function(t){
        if(animateStart === 0)
            animateStart = t;
        const dt = t - animateStart;
        animateStart = t;
        rotation += dt/10000;
        plot2.setRotation(rotation);
        plot2.render();
        requestAnimationFrame(animate);
    }
    plot1.render();
    plot2.render();
    plot3.render();
    animate(0);
}

