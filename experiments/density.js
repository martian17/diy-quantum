import {config, outerProduct, outerSquare, embedGate, composeCircuit, gates, printMatrix, printStateVector, nullStateVector, C, mul_matvec, createRandomState, rep} from "../quantum/index.js";
import {ComplexMatrixPlot} from "../webgl/complex-matrix/index.js";
import {FlexLayout, AnsiDisplay, applyStyle} from "../ui-elements/index.js";

export const init = function(parent){
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
    
    parent.appendChild(layout.root.element);
    
    
    const plot1 = new ComplexMatrixPlot();
    const plot2 = new ComplexMatrixPlot();
    // styling
    {
        const {d1, d2} = layout;
        d1.appendChild(plot1.canvas);
        d2.appendChild(plot2.canvas);

        applyStyle(d1, d2, {
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
    
    plot1.updateMatrix(outerSquare(state1));
    plot2.updateMatrix(outerSquare(state2));
    
    
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
        requestAnimationFrame(animate);
    }
    animate(0);
}



