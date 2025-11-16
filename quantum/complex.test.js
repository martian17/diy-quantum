import {describe, test, expect, overrideEqual, beforeEach} from "./base.test.js";
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

overrideEqual((a, b, defaultEqual)=>{
    if(
        a instanceof Complex ||
        a instanceof ComplexVector ||
        a instanceof ComplexMatrix
    ){
        return a.equal(b);
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
    beforeEach(()=>{
        a = randV(20);
        b = randV(20);
    });
    
    test("equal and clone", ()=>{
        expect(a.equal(b)).toBe(false);
        expect(a.equal(a)).toBe(true);
        expect(a.clone()).not.toBe(a);
        expect(a.clone().equal(a)).toBe(true);
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
    test("conjugate (component wise test)", ()=>{
        expect(a.conjugate().mul(a).get(0).i).toBeCloseTo(0);
    });
});
// 
// describe("Complex Vector", (expect)=>{
//     const a = V(C(1,2), C(3,4));
//     const b = V(C(5,6), C(7,8));
//     test(".equal",()=>{
//         expect(a.equal(b)).toBe(false);
//         expect(a.equal(a)).toBe(true);
//         expect(a.equal(V(C(1,2), C(3,4)))).toBe(true);
//         expect(a.equal(V(C(1,2)))).toBe(false);
//     });
//     test(".add, .sub, .mul, .divi", ()=>{
//         expect(a.add(b)).toEqual(V(C(6,8), C(10, 12)));
//         expect(a.sub(b)).toEqual(V(C(-4,-4), C(-4, -4)));
//         expect(a.mul(b)).toEqual(V(C(-7,16), C(-11, 52)));
//         expect(a.mul(b).div(b)).toEqual(a);
//     });
//     test(".clone", ()=>{
//         expect(a.clone()).toEqual(a);
//         expect(a.clone()).not.toBe(a);
//     });
//     test(".set", ()=>{
//         const cc = a.clone();
//         expect(cc.set(0,C(-1,-2))).toEqual(V(C(-1,-2), C(3,4)));
//     });
//     test(".get", ()=>{
//         expect(cc.get(1)).toEqual(C(3,4));
//     });
//     test(".copy", ()=>{
//         cc.copy(a, 0)
//         expect(cc).toEqual(a);
//         expect(cc).not.toBe(a);
//     });
//     test(".addi, subi, .muli", ()=>{
//         expect(a.clone().addi(b)).toEqual(V(C(6,8), C(10, 12)));
//         expect(a.clone().subi(b)).toEqual(V(C(-4,-4), C(-4, -4)));
//         expect(a.clone().muli(b)).toEqual(V(C(-7,16), C(-11, 52)));
//         expect(a.clone().muli(b).divi(b)).toEqual(a);
//     });
//     test("Testing memory locality for immidiate operations", ()=>{
//         expect(cc.addi(b)).toBe(cc);
//         expect(cc.subi(b)).toBe(cc);
//         expect(cc.muli(b)).toBe(cc);
//         expect(cc.divi(b)).toBe(cc);
//     });
//     test(".dot", ()=>{
//         const _d = b.conjugate();
//         expect(a.dot(b)).toEqual(a.get(0).mul(_d.get(0)).add(a.get(1).mul(_d.get(1))));
//         expect(a.dot(b)).toEqual(b.dot(a).conjugate());
//     });
//     test(".outer", ()=>{
//         expect(a.outer(b)).toEqual(M(
//             [a.get(0).mul(b.get(0)), a.get(0).mul(b.get(1))],
//             [a.get(1).mul(b.get(0)), a.get(1).mul(b.get(1))],
//         ));
//         expect(randV(3).outer(randV(5))).toHaveProperties({
//             rows: 3,
//             columns: 5
//         });
//     });
//     console.log(".project");
//     // const isq2 = 1/Math.sqrt(2);
//     // expect(a.project(V(C(1,0),C(0,0)))).toEqual(V(C(1,2),C(0,0)));
//     // expect(a.project(V(C(0,0),C(-isq2,-isq2)))).toEqual(V(C(0,0),C(3,4)));
//     // expect(V(C(1,0),C(1,0)).project(V(C(0,1),C(0,0)))).toEqual("");
//     console.log(".smul");
//     console.log(".smuli");
//     console.log(".tensor");
// });
// 
// describe("Complex random vectors", (expect)=>{
//     const a = randV(20);
//     const b = randV(20);
//     console.log(".equal");
//     expect(a.equal(b)).toBe(false);
//     expect(a.equal(a)).toBe(true);
//     expect(a.equal(a.clone())).toBe(true);
//     console.log(".add, .sub, .mul, .divi")
//     expect(a.add(b).sub(b)).toEqual(a);
//     expect(a.mul(b).div(b)).toEqual(a);
//     expect(a.mul(b)).notToEqual(a);
//     console.log(".clone");
//     expect(a.clone()).toEqual(a);
//     expect(a.clone()).not.toBe(a);
//     console.log(".set .get");
//     const a1 = a.clone();
//     const v1 = a1.get(1);
//     a1.set(1,C(0,0));
//     expect(a1).notToEqual(a);
//     a1.set(1,v1);
//     expect(a1).toEqual(a);
//     console.log(".copy");
//     const a2 = a.clone();
//     a2.copy(b);
//     expect(a2).toEqual(b);
//     expect(a2).not.toBe(b);
//     console.log(".addi, .subi, .muli");
//     expect(a.clone().addi(b).subi(b)).toEqual(a);
//     expect(a.clone().muli(b).divi(b)).toEqual(a);
//     console.log("Testing memory locality for immidiate operations");
//     const a3 = a.clone();
//     expect(a3.addi(b)).toBe(a3);
//     expect(a3.subi(b)).toBe(a3);
//     expect(a3.muli(b)).toBe(a3);
//     expect(a3.divi(b)).toBe(a3);
//     console.log(".dot");
//     expect(a.dot(a).i).toBe(0);
//     expect(a.dot(b)).toEqual(b.dot(a).conjugate());
//     console.log(".project, .smul");
//     const proj = a.project(b);
//     const scalar = proj.get(0).div(b.get(0));
//     expect(proj).toEqual(b.smul(scalar));
//     console.log("smul");
//     
//     
// });
// 
// 
// // 
// // 
