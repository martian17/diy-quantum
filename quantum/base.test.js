const riffle = function(a,b,cb){
    const res = [];
    for(let i = 0; i < Math.max(a.length, b.length); i++){
        if(!cb){
            res.push([a[i],b[i]]);
        }else{
            res.push(cb(a[i],b[i]));
        }
    }
    return res;
};

const objectEqual = function(o1, o2){
    if(typeof o1 !== typeof o2)return false;
    if(o1.isNaN && o2.isNaN)return true;
    if(typeof o1 !== "object"){
        return o1 === o2;
    }
    if(o1 === o2)return true;
    if(!(o2 instanceof o1.constructor))return false;
    if(typeof o1[Symbol.iterator] === 'function'){
        const o1Values = [...o1];
        const o2Values = [...o2];
        if(o1Values.length !== o2Values.length){
            return false;
        }
        for(const [a,b] of riffle([...o1], [...o2])){
            if(!objectEqual(a,b))return false;
        }
    }
    for(let key in o1){
        if(!(key in o2))return false;
    }
    for(let key in o2){
        if(!(key in o1))return false;
        if(!objectEqual(o1[key], o2[key]))return false;
    }
};

const stableToString = function(value){
    if(typeof value === "string")return "'" + value + "'";
    if(typeof value === "bigint")return `${value}n`;
    if(
        typeof value === "number" ||
        typeof value === "boolean" ||
        typeof value === "undefined" ||
        value === null
    )return `${value}`;
    if(typeof value === "symbol")return value.toString();
    if("toString" in value 
        && value.toString !== Object.prototype.toString
        && value.toString !== Array.prototype.toString
    ){
        return value.toString();
    }
    const constructorName = value.constructor.name;
    const props = [];
    if(value instanceof ArrayBuffer){
        const u8 = new Uint8Array(value);
        let arr = [];
        for(let i = 0; i < u8.length; i++){
            arr.push(u8[i].toString(16).padStart(2,"0"));
        }
        props.push(`<${arr.join(" ")}>`);
    }
    if(value instanceof Map){
        for(let [key, val] of value){
            props.push(stableToString(key) + " => " + stableToString(val));
        }
    }else if(typeof value[Symbol.iterator] === 'function'){
        for(let val of value){
            props.push(stableToString(val));
        }
    }
    for(let key in value){
        if(String(+key) === key && +key < value.length)continue;
        props.push(`${key}: ${stableToString(value[key])}`);
    }
    if(value.constructor === Array){
        return `[ ${props.join(", ")} ]`;
    }else if(value.constructor === Object){
        return `{ ${props.join(", ")} }`;
    }else if(value instanceof Array || ArrayBuffer.isView(value)){
        return `${constructorName}(${value.length}) [ ${props.join(", ")} ]`;
    }else{
        let size = null;
        if("byteLength" in value && typeof value.byteLength === "number")size = value.byteLength;
        if("length" in value && typeof value.length === "number")size = value.length;
        if("size" in value && typeof value.size === "number")size = value.size;

        return `${constructorName}${size !== null ? `(${size})`:""} { ${props.join(", ")} }`;
    }
}

const stableShortString = function(value, max=100){
    let str = stableToString(value);
    if(str.length >= max){
        str = str.slice(0,max) + "...";
    }
    if(str.match("\n")){
        if(str[0] !== "\n"){
            str = "\n" + str;
        }
        if(str.at(-1) !== "\n"){
            str += "\n"
        }
    }
    return str;
}

const toOrdinal = function(n){
    const val = `${n}`;
    if(val.at(-1) === "1"){
        return `${val}st`;
    }else if(val.at(-1) === "2"){
        return `${val}nd`;
    }else if(val.at(-1) === "3"){
        return `${val}rd`;
    }else{
        return `${val}th`;
    }

}

/********************Start lib body************************/

class Scope{
    constructor({parent} = {}){
        if(parent){
            this.parent = parent;
        }
    }
    map = new Map;
    get(key){
        if(this.map.has(key)){
            return this.map.get(key);
        }
        if(!this.parent){
            throw new Error(`${key} undefined`);
        }else{
            return this.parent.get(key);
        }
    }
    set(key, value){
        this.map.set(key, value);
    }
}


class Describe{
    constructor(name, cb, globalScope){
        this.name = name;
        this.cb = cb;
        this.scope = new Scope({
            parent: globalScope
        });
    }
    tests = [];
    successCnt = 0;
    success = true;
    beforeEach = ()=>{};
    async execute(){
        context.describe = this;
        context.scope = this.scope;
        await this.cb();
        for(let test of this.tests){
            this.beforeEach();
            await test.execute();
            if(test.success){
                this.successCnt++;
            }else{
                this.success = false;
            }
        }
        if(this.success){
            console.log(`\u001b[32;1m\u001b[7m PASS \u001b[0m \u001b[1m${this.name}\u001b[0m`);
        }else{
            console.log(`\u001b[31;1m\u001b[7m FAIL \u001b[0m \u001b[1m${this.name}\u001b[0m`);
        }
        console.log(`Tests: \u001b[32;1m${this.successCnt} passed\u001b[0m, ${this.tests.length} total`);
        for(let test of this.tests){
            if(test.success){
                console.log(`\u001b[32;1m✓\u001b[0m ${test.name}`); 
            }else{
                console.log(`\u001b[31;1m☓\u001b[0m ${test.name}`); 
                test.printError();
            }
        }
    }
}

class ExpectError{
    constructor(...lines){
        this.message = lines.join("\n");
    }
    print(){
        console.log(this.message);
    }
}


class Test{
    constructor(name, cb, describe){
        this.name = name;
        this.cb = cb;
        this.describe = describe;
        this.scope = new Scope({
            parent: describe.scope
        });
    }
    success = true;
    expects = [];
    equal = objectEqual;
    async execute(){
        try{
            context.test = this;
            context.scope = this.scope;
            await this.cb();
        }catch(err){
            this.success = false;
            this.error = err;
        }
    }
    printError(){
        console.log(`On ${toOrdinal(this.expects.length)} expect()`);
        if(!this.error){
            const msg = "Trying to print nonexistent error";
            console.log(msg);
            throw new Error(msg);
        }else if(this.error instanceof ExpectError){
            this.error.print();
        }else{
            console.log("Unexpected error encountered while executing the test");
            console.log(this.error);
        }
    }
}

const equalWithTolerance = function(a, b, atol, rtol){
    return Math.abs(a - b) < atol + rtol * Math.max(Math.abs(a), Math.abs(b));
};

class Expect{
    constructor(value, test){
        this.val1 = value;
        this.test = test;
        this.scope = new Scope({
            parent: test.scope
        });
        context.expect = this;
    }
    _not = false;
    success = false;
    get not(){
        this._not = true;
        return this;
    }
    toBe(value){
        this.val2 = value;
        const not = this._not;
        if(not && (this.val1 === this.val2)){
            const s1 = stableShortString(this.val1);
            throw new ExpectError(
                `not.toBe: Expected different values or references`,
                `but got ${s1} in both cases`
            )
        }else if(!not && (this.val1 !== this.val2)){
            const s1 = stableShortString(this.val1);
            const s2 = stableShortString(this.val2);
            throw new ExpectError(
                `toBe: Expected ${s1} to be ${s2}`
            );
        }else{
            this.success = true;
        }
    }
    toEqual(value){
        this.val2 = value;
        const not = this._not;
        const equal = this.scope.get("equal");
        if(not && equal(this.val1, this.val2)){
            const s1 = stableShortString(this.val1);
            throw new ExpectError(
                `not.toEqual: Expected different values`,
                `but got ${s1} in both cases`
            )
        }else if(!not && !equal(this.val1,this.val2)){
            const s1 = stableShortString(this.val1);
            const s2 = stableShortString(this.val2);
            throw new ExpectError(
                `toEqual: Expected ${s1} to equal ${s2}`
            );
        }else{
            this.success = true;
        }
    }
    toBeCloseTo(value, atol = this.scope.get("atol"), rtol = this.scope.get("rtol")){
        this.val2 = value;
        const not = this._not;
        const s1 = stableShortString(this.val1);
        const s2 = stableShortString(this.val2);
        if(not && equalWithTolerance(this.val1, this.val2, atol, rtol)){
            const s1 = stableShortString(this.val1);
            throw new ExpectError(
                `not.toBeCloseTo: Expected ${s1} to be far from ${s2}`,
                `atol: ${atol}`,
                `rtol: ${rtol}`,
            )
        }else if(!not && !equalWithTolerance(this.val1,this.val2, atol, rtol)){
            throw new ExpectError(
                `toEqual: Expected ${s1} to be close to ${s2}`,
                `atol: ${atol}`,
                `rtol: ${rtol}`,
            );
        }else{
            this.success = true;
        }
    }
}

// Export and scope initialization
const globalScope = new Scope();
globalScope.set("equal", objectEqual);
// tolerance are for float 64
globalScope.set("atol", 1e-8);
globalScope.set("rtol", 1e-12);

// context object for the immediate functions
const context = {
    describe: null,
    test: null,
    expect: null,
    scope: globalScope,
};

export const overrideEqual = function(comp){
    context.scope.set("equal", (a, b)=>{
        return comp(a, b, objectEqual, context.scope.get("atol"), context.scope.get("rtol"));
    });
};

export const overrideTolerance = function({atol, rtol} = {}){
    if(typeof atol === "number")context.scope.set("atol", atol);
    if(typeof rtol === "number")context.scope.set("rtol", rtol);
}

export const expect = function(value){
    const expect = new Expect(value, context.test);
    context.test.expects.push(expect);
    return expect;
};

export const test = function(name, cb){
    const test = new Test(name, cb, context.describe);
    context.describe.tests.push(test);
};


class Fifo{
    queue = [];
    push(val){
        this.size++;
        this.queue.push(val);
    }
    pop(){
        if(this.queue.length === 0)return null;
        this.size--;
        const val = this.queue.shift();
        return val;
    }
    size = 0;
}

let taskQueue = new Fifo();
let runningTask = null;
const serialSchedule = async function(cb){
    taskQueue.push(cb);
    if(runningTask === null){
        while(taskQueue.size !== 0){
            runningTask = taskQueue.pop()();
            await runningTask;
        }
    }
}

export const describe = function(name, cb){
    const describe = new Describe(name, cb, globalScope);
    context.describe = describe;
    // in order to ensure the execution order
    serialSchedule(()=>{
        return describe.execute();
    });
};

export const beforeEach = function(cb){
    if(!context.describe){
        throw new Error("Describe undefined");
    }
    context.describe.beforeEach = cb;
};

