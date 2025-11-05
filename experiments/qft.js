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


    const plot1 = new ComplexMatrixPlot();
    const plot2 = new ComplexMatrixPlot();
    const plot3 = new ComplexMatrixPlot();
    // styling
    {
        const {d1, d2, d3} = layout;
        d1.appendChild(plot1.canvas);
        d2.appendChild(plot2.canvas);
        d3.appendChild(plot3.canvas);

        applyStyle(d1, d2, d3, {
            flex: "1",
            aspectRatio: "1 / 1",
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
    
    
    plot1.updateMatrix(QFT_N(2));
    ansi.log("2 qubits");
    printMatrix(QFT_N(2));
    plot2.updateMatrix(QFT_N(3));
    ansi.log("3 qubits");
    printMatrix(QFT_N(3));
    plot3.updateMatrix(QFT_N(4));
    ansi.log("4 qubits");
    printMatrix(QFT_N(4));


    let animateStart = 0;
    let rotation = 0.5;
    const animate = function(t){
        if(animateStart === 0)
            animateStart = t;
        const dt = t - animateStart;
        animateStart = t;
        rotation += dt/10000;
        plot1.setRotation(rotation);
        plot1.render();
        plot2.setRotation(rotation);
        plot2.render();
        plot3.setRotation(rotation);
        plot3.render();
        requestAnimationFrame(animate);
    }
    animate(0);
}

