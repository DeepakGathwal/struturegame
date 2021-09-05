
 life = {
    //user overloadable events
    events: {
        onStateChange: function (coords) {},
        onReset: function (coords) {}
    },

    //user overwriteable parameters
    params: {
        size: [100, 100],
        delay: 100
    },

    //utility
    util: {
        grid: [],
        stack: [],
        step: 0,
        paused: true
    },

    init: function (params, events) {
        this.params = params;
        this.events = events;
    },

    doStep: function () {
        stack = [];
        var n, c;

        //loop through alive cells
        for (var k in this.util.grid) {
            for (var j in this.util.grid[k]) {
                if (typeof this.util.grid[k][j] != "number") continue;

                //find neighbors
                n = this.getNeighbors([k, j]);
                for (var i in n) {

                    //initialize column
                    if (stack[n[i][0]] === undefined) {
                        stack[n[i][0]] = [];
                    }

                    //increment cell
                    if (stack[n[i][0]][n[i][1]] === undefined) {
                        stack[n[i][0]][n[i][1]] = 1;
                    } else stack[n[i][0]][n[i][1]]++;

                }

                //check self
                stack[k] = stack[k] === undefined ? [] : stack[k];
                if (stack[k][j] === undefined) {
                    stack[k][j] = 0;
                }
            }
        }

        this.applyRules(stack);
        this.util.step++;

    },

    setState: function (coords, alive, value) {
        //make sure cell has been initialized
        this.util.grid[coords[0]] = this.util.grid[coords[0]] !== undefined ? this.util.grid[coords[0]] : [];

        //apply
        if (alive) this.util.grid[coords[0]][coords[1]] = 1;
        else delete this.util.grid[coords[0]][coords[1]];

        //trigger event
        this.events.onStateChange(coords, alive, value);


    },

    putGrid: function (grid) {
        for (var x in grid) {
            for (var y in grid[x]) {
                this.setState([grid[x][y], x], true);
            }
        }
    },

    start: function () {
        //skip interval for zero delay
        if (!this.util.paused && this.params.delay === 0) {
            this.doStep();
            return start();
        }

        //else start interval
        this.util.interval = setInterval(

        function () {
            life.doStep();
        }, this.params.delay);
        this.util.paused = false;
    },

    pause: function () {
        clearInterval(this.util.interval);
        this.util.paused = true;
    },

    reset: function () {
        for (var x in this.util.grid) {
            for (var y in this.util.grid[x]) {
                this.setState([x, y], false);
            }
        }
    },

    isAlive: function (coords) {
        return this.util.grid[coords[0]] === undefined ? false : this.util.grid[coords[0]][coords[1]] == 1;
    },

    applyRules: function (stack) {
        for (var x in stack) {
            for (var y in stack[x]) {
                //apply the rules
                if (stack[x][y] < 2 || stack[x][y] > 3) {
                    this.setState([x, y], false, stack[x][y]);
                } else if (stack[x][y] == 3) {
                    this.setState([x, y], true);
                }
            }
        }
    },

    getNeighbors: function (coords) {
        var ret = [],
            sub = [],
            same = true,
            i, j, c, b;

        var dim = coords.length;
        var n = Math.pow(3, dim);

        //there are 3^ndim neighbors
        for (i = 0; i < n; i++) {

            //figure out each value (x,y,z,...)
            for (j = dim - 1; j >= 0; j--) {
                c = parseInt(coords[j]);
                sub.splice(0, 0, c + Math.floor(i / Math.pow(3, j)) % 3 - 1);

                //mind boundaries
                b = this.params.size[Math.floor(dim - j) - 1];
                sub[0] = sub[0] < 0 ? sub[0] + b : sub[0];
                sub[0] = sub[0] >= b ? sub[0] - b : sub[0];

                same = same && sub[0] == c;
            }

            //don't add original point, reset
            if (!same) ret.push(sub);
            same = true;
            sub = [];
        }
        return ret;
    }
};

//canvas interface for game of life
canvasView = {
    canvas: document.getElementById("grid"),
    context: {},
    cellSize: 2,
    cellBorder: 1,
    cellDead: "#fff",
    cellAlive: "#000",
    cellTrail: "#000",
    borderColor: "#fff",
    zlevel: 1,
    size: [],

    init: function () {
        //set up canvas
        this.context = this.canvas.getContext('2d');

        //set listeners
        this.canvas.addEventListener('click', this.onClick, false);
        window.onresize = this.onResize;
        this.onResize();

        //initialize game of life
        life.init({
            size: canvasView.size,
            delay: 0
        }, {
            onStateChange: canvasView.onStateChange
        });
    },

    drawBase: function () {
        var i, j;
        for (i = 0; i < this.size[1]; i++) {
            for (j = 0; j < this.size[0]; j++) {
                this.drawCell([i, j], life.isAlive([i, j]));
            }
        }
    },

    drawCell: function (coords, state, value) {
        var y = parseInt(coords[0]),
            x = parseInt(coords[1]);

        //config style
        this.context.fillStyle = state ? this.cellAlive : this.cellDead;
        this.context.strokeStyle = this.borderColor;
        this.context.lineWidth = this.cellBorder;
        this.context.globalAlpha = 1;

        //config size
        x += (x * this.cellBorder * this.cellSize) * this.zlevel;
        y += (y * this.cellBorder * this.cellSize) * this.zlevel;
        var wh = (this.cellSize + this.cellBorder) * this.zlevel;

        //draw
        this.context.fillRect(x, y, wh, wh);
        this.context.strokeRect(x, y, wh, wh);

        //draw tail
        if (value > 0) {
            this.context.fillStyle = this.cellTrail;
            this.context.globalAlpha = value / 8;
            this.context.fillRect(x, y, wh, wh);
        }


    },

    onResize: function () {
        canvasView.canvas.width = canvasView.canvas.parentNode.offsetWidth;
        canvasView.canvas.height = canvasView.canvas.parentNode.offsetHeight;

        canvasView.size[0] = Math.floor(canvasView.canvas.width / (canvasView.cellSize + canvasView.cellBorder));
        canvasView.size[1] = Math.floor(canvasView.canvas.height / (canvasView.cellSize + canvasView.cellBorder));
        canvasView.drawBase();
    },

    zoomIn: function () {
        this.zlevel += this.zlevel < 1 ? 0.01 : 0.1;
        this.drawBase();
    },

    zoomOut: function () {
        this.zlevel -= this.zlevel <= 1 ? 0.01 : 0.1;
        this.drawBase();
    },

    onStateChange: function (coords, state, value) {
        canvasView.drawCell(coords, state, value);
    },

    onClick: function (e) {
        var x = e.pageX - canvasView.canvas.offsetLeft;
        var y = e.pageY - canvasView.canvas.offsetTop;
        x = Math.floor(x / ((canvasView.cellSize + canvasView.cellBorder) * canvasView.zlevel));
        y = Math.floor(y / ((canvasView.cellSize + canvasView.cellBorder) * canvasView.zlevel));

        life.setState([y, x], !life.isAlive([y, x]));
    }
};

//start
canvasView.init();
life.putGrid({
    19: [21],
    20: [20, 21, 22],
    21: [20]
});

