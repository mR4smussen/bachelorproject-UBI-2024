
// array of all the canvases. views[i] is the canvas for layer i
let views = []
// array of all the canvases divs. divs[i] is the div of the canvas for layer i
let view_divs = []

// global var, so we only draw the background once if we stack the views
let ICICLE_BACKGROUND_DRAW = true

// flag to draw the layers borders or not
const DRAW_LAYER_BORDERS = false

// flag to either draw the plot top-down or bottom up
const TOP_DOWN = true

// flag to stack the different views on top of each other
const ICICLE_STACK_VIEWS = false
const DRAW_ALL_BACKGROUNDS = false

// flag to fill in nodes or not
const FILL_NODES = true

// Layer of Detail - variable for how many layers do we want to visualize
const LoD = 150

// the size of each view
const ICICLE_CANVAS_SIZE = [2000, 20]

// global flag to indicate when the views are being animated
let ANIMATING = false
const start_view = 1
let listener_added = false

function add_icicle(node, canvas) {
    if (!listener_added) {
        listener_added = true
        document.addEventListener('keydown', (event) => {
            if (event.key === 'a') {
                ANIMATING = !ANIMATING
                const divs = Array.from(document.body.querySelectorAll(".canvas-container"));
                if (ANIMATING)
                    divs.forEach(div => div.style.opacity = "0%");
                    animate(start_view)
            }
        });
    }
    if (node.depth > LoD)
        return 
    canvas = views[node.depth]

    // if the layer of the node doesn't have a canvas yet, we create one.
    if (!canvas) {
        const view_div = document.createElement('div');
        view_div.classList.add('canvas-container');
        view_div.setAttribute("id", node.depth.toString())

        view_div.style.margin = "0px";
        view_div.style.display = "block";

        // Create a canvas element
        canvas = document.createElement('canvas');
        canvas.width = ICICLE_CANVAS_SIZE[0];
        canvas.height = ICICLE_CANVAS_SIZE[1];
        canvas.margin = "0px"

        if (!DRAW_LAYER_BORDERS)
            canvas.style.border = "None"

        // Append the canvas to the div
        view_div.appendChild(canvas);

        if (ICICLE_STACK_VIEWS) {
            view_div.style.position = 'absolute';
            view_div.style.left = 0 + 'px';
            view_div.style.top = 0 + 'px';
        }

        // Append the div to the body of the page
        document.body.appendChild(view_div);

        ctx = canvas.getContext("2d");

        view_width = canvas.width
        view_height = canvas.height

        treemap_x = view_width - canvas.width
        treemap_y = view_height - canvas.height

        if (!ICICLE_BACKGROUND_DRAW) {
            ctx.fillStyle = TREE_COLOR;
            ctx.fillRect(treemap_x, treemap_y, view_width, view_height);
            if (ICICLE_STACK_VIEWS && !DRAW_ALL_BACKGROUNDS)
                ICICLE_BACKGROUND_DRAW = true
        }

        // Get all div elements inside the container
        const divs = Array.from(document.body.querySelectorAll(".canvas-container"));

        // Sort the div elements based on their numerical id attribute
        divs.sort((a, b) => {
            const idA = parseInt(a.getAttribute("id"));
            const idB = parseInt(b.getAttribute("id"));
            if (TOP_DOWN)
                return idA - idB;
            return idB - idA;
        });

        // Append sorted div elements back to the container
        divs.forEach(div => document.body.appendChild(div));

        views[node.depth] = canvas
        view_divs[node.depth] = view_div
    } else {
        ctx = canvas.getContext("2d");

        view_width = canvas.width
        view_height = canvas.height

        treemap_x = view_width - canvas.width
        treemap_y = view_height - canvas.height
    }

    

    node_x = treemap_x + (view_width * node.interval[0])
    node_width = (node.interval[1] - node.interval[0]) * view_width

    if (FILL_NODES) {
        ctx.fillStyle = get_color(node.colorNr, node.depth, true);
        ctx.fillRect(
            node_x,             // x pos
            treemap_y,          // y pos
            node_width,         // width
            view_height);       // height 

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2 * (Math.min(0.2, 10 / node.depth));
        ctx.strokeRect(
            node_x,              // x pos
            treemap_y,           // y pos
            node_width,          // width
            view_height);        // height 
    } else {
        ctx.strokeStyle = get_color(node.colorNr, node.depth, true);
        ctx.lineWidth = 5;
        ctx.strokeRect(
            node_x,              // x pos
            treemap_y,           // y pos
            node_width,          // width
            view_height);        // height 
    }
}

// runs through the views and changes which view is currently being viewd
function animate(shown_view) {
    if (ANIMATING) {
        setTimeout(() => {
            const views = Array.from(document.body.querySelectorAll(".canvas-container"));
            view_divs[shown_view].style.opacity = "100%"
            if (shown_view + 1 <= LoD) 
                animate(shown_view + 1)
            else 
                ANIMATING = false
        }, 50) 
    } else {
        const divs = Array.from(document.body.querySelectorAll(".canvas-container"));
        divs.forEach(div => div.style.opacity = "100%");
    }
}