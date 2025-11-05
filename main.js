import {FlexLayout, applyStyle} from "./ui-elements/index.js";

const origin = window.location.origin;
const experiment = (new URL(window.location.href)).searchParams.get("experiment");

if(!experiment){
    // load the top page
    const rootLayout = new FlexLayout(`
    +----------------------+
    |welcome               |
    |----------------------|
    |experimentList        |
    |----------------------|
    |docs                  |
    |                      |
    |                      |
    +----------------------+
    `);
    document.body.appendChild(rootLayout.root.element);
    
    
    // Origin section
    (async ()=>{
        const {welcome} = rootLayout;
        const packageJson = await fetch(`${origin}/package.json`, { cache: "no-cache" }).then(v=>v.json());
        welcome.innerHTML = `
        <H1>Welcome to ${packageJson.name} v${packageJson.version}</H1>
        <span>
            Supported servers: http-server, github pages
        </span>
        `;
        applyStyle(welcome, {
            paddingBottom: "2em"
        });
    })();
    
    // Experiment list section
    const getExperimentFiles = async function(){
        if(origin.match("localhost")){
            const index = await fetch("http://localhost:8080/experiments/", { cache: "no-cache" }).then(v=>v.text());
            return index.match(/<a href=".*"/g).slice(1,-1).map(v=>v.match(/".*"/)[0].slice(3,-1));
        }else if(origin.match(".github.io")){
            const username = window.location.host.split(".")[0];
            const reponame = window.location.pathname.split("/").filter(v=>v!=="")[0];
            return await fetch(`https://api.github.com/repos/${username}/${reponame}/contents/experiments/`, { cache: "no-cache" }).then(v=>v.json()).then(l=>l.map(v=>v.name));
        }else{
            const errorMsg = `Unsupported origin ${origin}, please use http-server with localhost if running locally, and github pages if under deployment`;
            alert(errorMsg);
            throw new Error(errorMsg);
        }
    }
    
    const experimentListRoot = new FlexLayout(rootLayout.experimentList, `
    +--------------------------------+
    |title       | reload | collapse |
    |--------------------------------|
    |list                            |
    +--------------------------------+
    `);
    applyStyle(rootLayout.experimentList, {
        padding: "1em",
        backgroundColor: "#444",
        borderRadius: "0.5em",
    });
    (async ()=>{
        const {title, reload, collapse, list} = experimentListRoot;
        applyStyle(title, reload, collapse, {
            fontSize: "1.5em",
            flex: "1",
            fontWeight: "900",
        });
        applyStyle(reload, collapse, {
            flex: "0",
        });
        applyStyle(list, {
            overflow: "hidden",
        });
        title.innerHTML = "Experiments";
        reload.innerHTML = "🔄";
        collapse.innerHTML = "V"
        const reloadFunc = async function(){
            const files = await getExperimentFiles();
            list.innerHTML = "";
            const baseUrl = window.location.origin + window.location.pathname;
            for(let file of files){
                const a = document.createElement("a");
                a.innerHTML = file;
                a.href = `${baseUrl}?experiment=${file}`;
                list.appendChild(a);
                applyStyle(a, {
                    color: "#fff",
                    display: "block",
                });
            }
        }
        reloadFunc();
        reload.addEventListener("click", reloadFunc);
        let collapsed = false;
        collapse.addEventListener("click", ()=>{
            collapsed = !collapsed;
            if(collapsed){
                collapse.innerHTML = ">";
                list.style.height = "0px";
            }else{
                collapse.innerHTML = "V";
                list.style.height = "";
            }
        });
    })();
}else{
    // load the experiment
    const module = await import(`./experiments/${experiment}?t=${Date.now()}`);
    module.init(document.body);
}

