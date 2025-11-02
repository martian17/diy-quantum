export const applyStyle = function(elem, style){
    for(let key in style){
        elem.style[key] = style[key];
    }
    return elem;
}

class AnsiLine{
    color = null;
    background = null;
    bold = null;
    underline = null;
    reversed = null;
    constructor(parent){
        const pre = document.createElement("pre");
        this.pre = pre;
        this.parent = parent;
        parent.appendChild(pre);
    }
    append(str){
        this.pre.innerHTML += str;
    }
    destroy(){
        this.parent.removeChild(this.pre);
    }
}

export class AnsiDisplay{
    // ring buffer
    lineObjects = [];
    maxLines = 200;
    index = 0;
    static colorMap = {
        Black:   "\u0f01b[30m",
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
    constructor(style = {}){
        const wrapper = document.createElement("div");
        for(let key in style){
            wrapper.style[key] = style[key];
        }
        wrapper.classList.add("ansi");
        this.element = wrapper;
        this.lineObjects.push(new AnsiLine(wrapper));
    }
    write(str){
        const lines = str.split("\n");
        this.lineObjects[this.index].append(lines[0]);
        for(let i = 1; i < lines.length; i++){
            this.index = ( this.index + 1 ) % this.maxLines;
            if(this.lineObjects[this.index]){
                this.lineObjects[this.index].destroy();
            }
            this.lineObjects[this.index] = new AnsiLine(this.element);
            this.lineObjects[this.index].append(lines[i]);
        }
        this.element.scrollTop = this.element.scrollHeight;
    }
    log(...inputs){
        for(let input of inputs){
            this.write(input + "\n");
        }
    }
}

class StringMatrix{
    static fromString(str){
        const lines = str.trim().split("\n");
        return this.fromLines(lines);
    }
    static fromLines(lines){
        const matrix = new this();
        matrix.width = Math.max(...lines.map(v=>v.length));
        matrix.height = lines.length;
        matrix.lines = lines;
        return matrix;
    }
    getColumn(n){
        if(n < 0)n = this.width + n;
        let res = "";
        for(let i = 0; i < this.height; i++){
            const line = this.lines[i];
            if(line.length < n){
                res += " ";
            }else{
                res += line[n];
            }
        }
        return res;
    }
    getRow(n){
        if(n < 0)n = this.height + n;
        return this.lines[n];
    }
    get(x,y){
        if(x < 0) x = this.width  + x;
        if(y < 0) y = this.height + y;
        return this.lines[y][x];
    }
    slice(...args){//[x0,y0,x1,y1]
        for(let i = 0; i < args.length; i++){
            if(args[i] < 0){
                if((i&1) === 0){
                    args[i] = this.width + args[i];
                }else{
                    args[i] = this.height + args[i];
                }
            }
        }
        const x0 = args[0] || 0;
        const y0 = args[1] || 0;
        const x1 = args[2] || this.width;
        const y1 = args[3] || this.height;
        let res = [];
        for(let i = y0; i < y1; i++){
            res.push(this.lines[i].slice(x0,x1));
        }
        return this.constructor.fromLines(res);
    }
}

export class StringTable extends StringMatrix{
    getVerticalLineIndices(){
        const indices = [];
        outer:
        for(let x = 0; x < this.width; x++){
            if(this.get(x,0) !== "|")continue;
            for(let y = 1; y < this.height; y++){
                if(this.get(x,y) !== "|")continue outer;
            }
            indices.push(x);
        }
        return indices;
    }
    getHorizontalLineIndices(){
        const indices = [];
        outer:
        for(let y = 0; y < this.height; y++){
            if(this.get(0,y) !== "-")continue;
            for(let x = 1; x < this.width; x++){
                if(this.get(x,y) !== "-")continue outer;
            }
            indices.push(y);
        }
        return indices;
    }
}

export class FlexLayout{
    constructor(layout){
        let matrix = StringTable.fromString(layout);
        if([[0,0],[0,-1],[-1,0],[-1,-1]].map(c=>matrix.get(...c)).join("") !== "++++"){
            throw new Error("Error parsing flex layout: it must be enclosed in 4 x's");
        }
        console.log(matrix);
        matrix = matrix.slice(1,1,-1,-1);
        console.log(matrix);
        let root;
        if(matrix.getHorizontalLineIndices().length > 0){
            root = this.processColumn(matrix);
        }else{
            root = this.processRow(matrix);
        }
        this.root = root;
        this.element = root.element || root;
    }
    containerStyle = {
        display: "flex",
        justifyContent: "space-around",
        flex: "1",
    };
    processLeaf(matrix){
        const name = matrix.lines.map(v=>v.trim()).filter(v=>v!=="")[0] || "";
        const container = document.createElement("div");
        if(name !== ""){
            this[name] = container;
        }
        return container;
    }
    processColumn(matrix){
        const indices = matrix.getHorizontalLineIndices();
        if(indices.length === 0)return this.processLeaf(matrix)
        console.log(matrix);
        indices.push(matrix.height);
        const parent = document.createElement("div");
        applyStyle(parent, { ...this.containerStyle, flexDirection: "column" });
        const children = [];
        let start = 0;
        for(let i = 0; i < indices.length; i++){
            const chunk = matrix.slice(0,start,matrix.width,indices[i]);
            start = indices[i] + 1;
            let child = this.processRow(chunk);
            children.push(child);
            if(child instanceof Node){
                parent.appendChild(child);
            }else{
                parent.appendChild(child.element);
            }
        }
        children.element = parent;
        return children;
    }
    processRow(matrix){
        const indices = matrix.getVerticalLineIndices();
        if(indices.length === 0)return this.processLeaf(matrix)
        console.log(matrix);
        indices.push(matrix.width);
        const parent = document.createElement("div");
        applyStyle(parent, { ...this.containerStyle, flexDirection: "row" });
        if(indices.length === 1){
            const name = matrix.lines.map(v=>v.trim()).filter(v=>v!=="")[0] || "";
            if(name !== ""){
                this[name] = parent;
            }
        }
        const children = [];
        let start = 0;
        for(let i = 0; i < indices.length; i++){
            const chunk = matrix.slice(start,0,indices[i],matrix.height);
            start = indices[i] + 1;
            let child = this.processRow(chunk);
            children.push(child);
            if(child instanceof Node){
                parent.appendChild(child);
            }else{
                parent.appendChild(child.element);
            }
        }
        children.element = parent;
        return children;
    }
}
