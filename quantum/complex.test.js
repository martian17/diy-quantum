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
    
    test("equal and calone", ()=>{
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
