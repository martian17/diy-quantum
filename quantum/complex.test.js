import {describe, test, expect, overrideEqual, overrideTolerance, beforeEach} from "./base.test.js";
import {Complex, C, ComplexVector, ComplexMatrix} from "./complex.js";

const V = function(...values){
    return ComplexVector.fromValues(values);
}

const M = function(...arrays){
    return ComplexMatrix.fromArrays(arrays);
}

const randC = function(){
    return C(
        Math.random() * 200 - 100,
        Math.random() * 200 - 100,
    );
};

const randV = function(n){
    const res = ComplexVector.create(n);
    for(let i = 0; i < n; i++){
        res.set(i,randC());
    }
    return res;
}

const randM = function(rows, columns){
    const res = ComplexMatrix.create(rows, columns);
    for(let i = 0; i < rows; i++){
        for(let j = 0; j < columns; j++){
            res.set(
                i,j,
                randC()
            );
        }
    }
    return res;
}

overrideEqual((a, b, defaultEqual, atol, rtol)=>{
    if(
        a instanceof Complex ||
        a instanceof ComplexVector ||
        a instanceof ComplexMatrix
    ){
        return a.equal(b, atol, rtol);
    }else{
        return defaultEqual(a, b)
    }
});

describe("Complex", ()=>{
    let a;
    let b;
    beforeEach(()=>{
        a = randC();
        b = randC();
    });

    test("additive inverse test", ()=>{
        expect(a.add(b)).not.toEqual(a);
        expect(a.add(b).sub(b)).toEqual(a);
    });
    test("multiplicative inverse test", ()=>{
        expect(a.mul(b)).not.toEqual(a);
        expect(a.mul(b).div(b)).toEqual(a);
    });
    test("invert", ()=>{
        expect(a.invert()).not.toEqual(a);
        expect(a.invert().invert()).toEqual(a);
        expect(a.mul(b).mul(b.invert())).toEqual(a);
    });
    test("conjugate", ()=>{
        expect(a.conjugate().mul(a).i).toBeCloseTo(0);
    });
    test("magnitude and scale", ()=>{
        expect(a.scale(1/a.magnitude()).magnitude()).toBeCloseTo(1);
        expect(a.magnitude() ** 2).toBeCloseTo(a.modulusSquare());
    });
    test("equal and clone", ()=>{
        expect(a.equal(b)).toBe(false);
        expect(a.equal(a)).toBe(true);
        expect(a.clone()).not.toBe(a);
        expect(a.clone()).toEqual(a);
        expect(a.equal(a.clone())).toBe(true);
    });
    test("toString", ()=>{
        expect(C(
            0,1
        ).toString()).toBe("i");
        expect(C(
            0,-1
        ).toString()).toBe("-i");
        expect(C(
            0,0
        ).toString()).toBe("0");
        expect(C(
            -3.142, 2.718
        ).toString(10)).toBe("-3.142+2.718i");
        expect(C(
            -3.142, 2.718
        ).toString(2)).toBe("-3.14+2.72i");
    });
    test("toString should be unique", ()=>{
        for(let i = 0; i < 100; i++){
            const b = randC();
            expect(b.toString(20)).not.toBe(a.toString(20));
        }
        expect(a.toString(20)).toBe(a.clone().toString(20));
    });
});

describe("ComplexVector", ()=>{
    let a;
    let b;
    let half;
    let c;
    beforeEach(()=>{
        a = randV(20);
        b = randV(20);
        half = randV(10);
        c = randC();
    });

    overrideTolerance({
        atol: 1e-5,
        rtol: 1e-8,
    });
    
    test("equal and clone", ()=>{
        expect(a.equal(b)).toBe(false);
        expect(a.equal(a)).toBe(true);
        expect(a.clone()).not.toBe(a);
        expect(a.clone().equal(a)).toBe(true);
    });
    const testIdentity = function(op1, arg1, op2, arg2, testName){
        test(testName, eval(`()=>{
            expect(a.${op1}(${arg1})).not.toEqual(a);
            expect(a.${op1}(${arg1}).${op2}(${arg2})).toEqual(a);
        }`));
        test(testName + " (immediate)", eval(`()=>{
            expect(a.clone().${op1}i(${arg1})).not.toEqual(a);
            expect(a.clone().${op1}i(${arg1}).${op2}i(${arg2})).toEqual(a);
            expect(a.${op1}i(${arg1})).toBe(a);
        }`));
    }
    // example of an identity test
    // test("additive inverse", ()=>{
    //     expect(a.add(b)).not.toEqual(a);
    //     expect(a.add(b).sub(b)).toEqual(a);
    // });
    // test("immediate: additive inverse test", ()=>{
    //     expect(a.clone().add(b)).not.toEqual(a);
    //     expect(a.clone().add(b).sub(b)).toEqual(a);
    // });
    testIdentity("add", "b", "sub", "b", "additive inverse");
    testIdentity("mul", "b", "div", "b", "multiplicative inverse");
    testIdentity("invert", "", "invert", "", "invert");
    testIdentity("negate", "", "negate", "", "negate");
    testIdentity("conjugate", "", "conjugate", "", "conjugate");
    testIdentity("smul", "c", "smul", "c.invert()", "smul with inverse");

    test("conjugate (component-wise test)", ()=>{
        expect(a.conjugate().mul(a).get(0).i).toBeCloseTo(0);
    });
    test("dot product and norm", ()=>{
        expect(a.dot(a).r).toBeCloseTo(a.norm()**2);
    });
    test("outer", ()=>{
        overrideTolerance({
            atol: 1e-5,
            rtol: 1e-6,
        });
        const outer = a.outer(half);
        expect(outer.rows).toBe(20);
        expect(outer.columns).toBe(10);
        expect(outer.get(0,0)).toEqual(a.get(0).mul(half.get(0)));
        expect(outer.get(19,9)).toEqual(a.get(19).mul(half.get(9)));
    });
    test("project", ()=>{
        overrideTolerance({
            atol: 1e-5,
            rtol: 1e-6,
        });
        expect(a.project(b).dot(b)).toEqual(a.dot(b));
    });
    test("tensor", ()=>{
        overrideTolerance({
            atol: 1e-5,
            rtol: 1e-6,
        });
        const t = a.tensor(half);
        expect(t.length).toBe(200);
        expect(t.get(0)).toEqual(a.get(0).mul(half.get(0)));
        expect(t.get(100)).toEqual(a.get(10).mul(half.get(0)));
    });
});

describe("ComplexMatrix", ()=>{
    const size1 = 20;
    const size2 = 15;
    let a;
    let b;
    let c;
    let d;
    let I;
    beforeEach(()=>{
        a = randM(size1,size2);
        b = randM(size1,size2);
        c = randM(size1,size1);
        d = randM(size1,size1);
        I = ComplexMatrix.identity(size1);
    });

    overrideTolerance({
        atol: 1e-5,
        rtol: 1e-8,
    });

    test("create and toString", ()=>{
        const m = ComplexMatrix.create(3,2);
        expect(m.toString()).toBe(
            "|0 0|\n"+
            "|0 0|\n"+
            "|0 0|"
        );
    });
    test("fromArrays and toString", ()=>{
        const m = ComplexMatrix.fromArrays([
            [1,2,3],
            [4,[0,-5],[6,7]]
        ]);
        expect(m.toString()).toBe(
            "|1   2    3|\n"+
            "|4 -5i 6+7i|"
        );
    });
    test("equal and clone", ()=>{
        expect(a.clone()).not.toBe(a);
        expect(a.clone()).toEqual(a);
        expect(a.clone()).not.toEqual(b);
    })
    test("set and get", ()=>{
        a.set(0,0,C(4,2));
        expect(a.get(0,0)).toEqual(C(4,2));
        expect(a.get(3,7)).not.toEqual(b.get(5,6));
        a.set(3,7,b.get(5,6));
        expect(a.get(3,7)).toEqual(b.get(5,6));
    });
    test("copy", ()=>{
        expect(a).not.toEqual(b);
        a.copy(b);
        expect(a).toEqual(b);
        expect(a).not.toBe(b);
    });
    const testIdentity = function(target, op1, arg1, op2, arg2, testName){
        test(testName, eval(`()=>{
            expect(${target}.${op1}(${arg1})).not.toEqual(${target});
            expect(${target}.${op1}(${arg1}).${op2}(${arg2})).toEqual(${target});
        }`));
    };
    // example of an identity test
    testIdentity("a", "add", "b", "sub", "b", "additive inverse");
    test("additive inverse (immediate)", ()=>{
        expect(a.clone().addi(b)).not.toEqual(a);
        expect(a.clone().addi(b).subi(b)).toEqual(a);
        expect(a.addi(b)).toBe(a);
    });
    test("identity matrix mul and muli", ()=>{
        expect(c.mul(I)).toEqual(c);
        expect(c.clone().muli(I)).toEqual(c);
        expect(c.mul(I)).not.toBe(c);
    });
    test("transpose", ()=>{
        expect(a.transpose()).not.toEqual(a);
        expect(a.transpose().rows).toEqual(a.columns);
        expect(a.transpose().transpose()).toEqual(a);
    });
    test("adjoint (conjugate transpose)", ()=>{
        expect(a.adjoint()).not.toEqual(a);
        expect(a.adjoint()).not.toEqual(a.transpose());
        expect(a.adjoint().rows).toEqual(a.columns);
        expect(a.adjoint().adjoint()).toEqual(a);
    });
    test("LU decomposition", ()=>{
        const m = ComplexMatrix.fromArrays([
            [-2, 2, -1],
            [6, -6, 7],
            [3, -8, 4]
        ]);
        const p = m.LUDecompose();
        expect(m).toEqual(ComplexMatrix.fromArrays([
            [ -1/3,  0, 4/3],
            [    6, -6,   7],
            [  0.5, -5, 0.5],
        ]));
        expect(p).toEqual(new Uint32Array([ 1, 2, 0 ]));
    });
    test("invert", ()=>{
        overrideTolerance({
            atol: 1e-4,
            rtol: 1e-4,
        });
        expect(c.invert()).not.toEqual(c);
        expect(c.invert().invert()).toEqual(c);
        expect(c.mul(c.invert())).toEqual(ComplexMatrix.identity(c.rows))
    });
    test("in-place invert", ()=>{
        overrideTolerance({
            atol: 1e-4,
            rtol: 1e-4,
        });
        const m = ComplexMatrix.fromArrays([
            [-1, -1,  3],
            [ 2,  1,  2],
            [-2, -2,  1],
        ]);
        expect(m.inverti()).toEqual(
            ComplexMatrix.fromArrays([
            [ -1,  1,    1],
            [1.2, -1, -1.6],
            [0.4,  0, -0.2],
        ]));
        expect(c.clone().inverti()).not.toEqual(c);
        expect(c.clone().inverti().inverti()).toEqual(c);
        expect(c.mul(c.clone().invert())).toEqual(ComplexMatrix.identity(c.rows))
    });
});
