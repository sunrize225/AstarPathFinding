class Node 
{
    constructor(value, parent) 
    {
        this.value = value;
        this.parent= parent;    
    }
}
class Path 
{
    constructor()
    {
        this.tree = [];
    }

    // finds index of node by value
    find(node)
    {
        for(let x in this.tree)
        {
            if(this.tree[x].value == node)
            {
                return x;
            }
        }
        console.error("No match found in Path.find()");
        return undefined;
    }

    addNode(value, parent)
    {
        let j = new Node(value, parent);
        this.tree.push(j);
    }

    // creates pathway, in reverse order.
    link(node, path)
    {
        path.push(node.value);
        let index = this.find(node.parent); // finds index of parent node in tree
        if(index == 0) // if index == 0 then it is the root, exit recursion
        {
            path.push(this.tree[index].value);
        }
        else {
            this.link(this.tree[index], path);
        }
    }

    findPath(endNode)
    {
        let pathway = [];
        this.link(endNode, pathway);
        return pathway.reverse();
    }
}
class Queue 
{
    constructor()
    {
        this.priorityQ = [];
        this.minIndex = 0;
    }

    // returns index of minimum value from priority queue
    min()
    {
        let minPriority = this.priorityQ[0][0];
        let minimum = this.priorityQ[0];
        this.minIndex = 0;
        for (let x in this.priorityQ)
        {
            if(this.priorityQ[x][0] < minPriority)
            {
                minimum = this.priorityQ[x];
                this.minIndex = x;
            }
        }
        return minimum;
    }

    push(nodeArray)
    {
        this.priorityQ.push(...nodeArray);
    }

    pop()
    {
        this.priorityQ.splice(this.minIndex, 1);
    }

}
class Astar 
{
    constructor(startButton, currentBoard)
    {
        this.currentBoard = currentBoard;
        startButton.addEventListener("click", ()=>{this.start()});
    }
    start()
    {
        // make sure there is a start and end
        if(document.querySelector(".start") == null || document.querySelector('.end') == null)
        {
            window.alert("Please add a start and end block first");
            return -1;
        }
        // declare path and queue and add start cell to both
        let startCell = parseInt(document.querySelector(".start").id);
        let endCell = parseInt(document.querySelector('.end').id);
        let path = new Path();
        let queue = new Queue();
        let distanceOfStart = this.currentBoard.distanceFromCell(startCell, endCell);
        queue.push([[distanceOfStart,startCell]]);
        // find shortest path
        while(queue.min()[1] != endCell)
        {
            let q = queue.min();
            path.addNode(q[1], q[2]);
            this.currentBoard.visit(q[1]);
            let neighbors = this.currentBoard.neighborCells(q[1]);
            // the step distance is not directly kept tracked of,
            // Instead the distance of the parent cell to the end cell
            // is subtracted from its priority to find the parent's step distance 
            let distanceOfParent = this.currentBoard.distanceFromCell(q[1], endCell);
            let stepDistance = q[0] - distanceOfParent + 1;
            let neighborNodes = neighbors.map(cell => {
                let priority = stepDistance + this.currentBoard.distanceFromCell(cell, endCell);
                return [priority, cell, q[1]];
            });
            queue.push(neighborNodes);
            queue.pop();
            if(queue.priorityQ.length == 0) 
            {
                window.alert("No path possible");
            }
        }
        // show shortest path
        path.addNode(endCell, queue.min()[2]);
        let shortestPath = path.findPath(path.tree[path.tree.length - 1]);
        this.currentBoard.highlight(shortestPath);
        this.currentBoard.add("replay", document.getElementById("replay"), [path, shortestPath]);
    }
}
class Board
{
    constructor(board, rowWidth = 20, numRows = 10) 
    {
        this.board = board;
        this.rowWidth = rowWidth;
        this.numRows = numRows;
        this.numCells = rowWidth * numRows;
        this.leftMouseDown = false;
        this.cells = [];
        this.mode = "wall";
    }

    // adds board and proper event handling to add walls and start/end blocks
    load()
    {
        // sets event handling to detect when left mouse button is down
        this.board.addEventListener('mousedown', function() 
        {
            this.leftMouseDown = true;
        });
        this.board.addEventListener('mouseup', function()
        {
            this.leftMouseDown = false;
        });
        this.board.addEventListener('mouseleave', function()
        {
            this.leftMouseDown = false;
        });

        // adds each cell to boards
        for (let i = 0; i<this.numCells; i++)
        {
            this.cells[i] = document.createElement('div');
            this.cells[i].setAttribute('class', 'cell');
            this.cells[i].setAttribute('id', i);
            /*
            this.cells[i].addEventListener('mousedown', function(){
                if(this.mode=='wall') { 
                    this.classList.toggle('wall');
                } else if(this.mode=='start'){
                    if(!this.classList.contains('end')) {
                        if(document.querySelector('.start') != null)
                        { document.querySelector('.start').classList.remove('start'); }
                        this.classList.add('start');
                        this.mode = 'end';
                    }
                } else {
                    if(!this.classList.contains('start'))
                    {
                        if(document.querySelector('.end') != null) 
                        { document.querySelector('.end').classList.remove('end');}
                        this.classList.add('end');
                        this.mode = 'start';
                    }
                }
            });
            */
            
            this.board.appendChild(this.cells[i]);

            // adds event handlers to each cell
            this.cells[i].addEventListener("click", ()=> {
                if(this.mode == "wall")
                {
                    this.cells[i].classList.toggle("wall");
                }
                else
                {
                    this.cells[i].classList.remove("wall"); // make sure start/end point is not a wall
                    let s = document.querySelector(".start");
                    let e = document.querySelector(".end")
                    if(s == null)
                    {
                        this.cells[i].classList.add("start");
                    }
                    else if(e == null && !this.cells[i].classList.contains("start"))
                    {
                        this.cells[i].classList.add("end")
                    }
                    else if(s != null && e != null)
                    {
                        s.classList.remove("start");
                        e.classList.remove("end");
                        this.cells[i].classList.add("start");
                    }
                }
            });
            this.cells[i].addEventListener("mouseenter", ()=> {
                console.log(this.mode + " " + this.leftMouseDown);
                if(this.mode == "wall" && this.leftMouseDown)
                {
                    this.cells[i].classList.add("wall");
                }
            });
        }

    }

    // calculates distance from one cell to another cell (exclusive, inclusive)
    distanceFromCell(cell, endCell)
    {
        return (Math.abs((endCell % this.rowWidth) - (cell % this.rowWidth)) 
        + Math.abs(Math.floor(endCell/this.rowWidth) - Math.floor(cell/this.rowWidth)));
    }

    // returns neighboring cells that are not walls, optionally exclude visited cells.
    neighborCells(cell, exlcudeVistied=true)
    {
        let stepValues = [1, -1, this.rowWidth, -1 * this.rowWidth];
        let neighbors = [];
        for (let x in stepValues)
        {
            // skips iteration if 'neighboring cell' is across the board
            if(stepValues[x] == -1 && cell != 0 && cell % 20 == 0)
            {
                continue;
            }
            if(stepValues[x] == 1 && (cell + 1) % 20 == 0)
            {
                continue;
            }
            // if defined i.e. a valid cell id and if the cell is not a wall
            if(typeof this.cells[cell+stepValues[x]] !== "undefined" && !this.cells[cell+stepValues[x]].classList.contains('wall')
            // if excludeVisited is false or cell is not visited
            && !(exlcudeVistied && this.cells[cell+stepValues[x]].classList.contains('visited')))
            {
                neighbors.push(cell+stepValues[x]);
            }
        }
        return neighbors;
    }

    visit(cell)
    {
        document.getElementById(cell.toString()).classList.add("visited");
    }

    highlight(cells)
    {
        if(typeof cells === "number")
        {
            document.getElementById(parseInt(cells)).classList.add("path");
        } else {
            this.cells.forEach((cell)=>{
                cell.classList.remove("path");
            });
            cells.forEach((cell)=>
            {
                document.getElementById(parseInt(cell)).classList.add("path");
            });
        }
    }
    
    *replay(pathObject)
    {
        let path = pathObject.tree;
        this.clear();
        while(path.length != 0) 
        {
            let nextCell = path.shift().value;
            yield document.getElementById(nextCell.toString()).classList.add("visited");
        }
    }

    playback(i) {
        let pathObject = i[0];
        let shortestPath = i[1];
        let replay = this.replay(pathObject);
        let s = setInterval(()=>{
            if(replay.next().done)
            {
                this.highlight(shortestPath);
                window.alert("path finished");
                clearInterval(s);
            }
        }, 100);
    }

    clear(entireBoard = false)
    {
        if(entireBoard) 
        {
            this.cells.forEach((cell)=> {
                cell.classList.remove("visited", "path", "start", "end", "wall");
            });
        }
        else 
        {
            this.cells.forEach((cell)=> {
                cell.classList.remove("visited", "path");
            });
        }
    }

    add(type, element, other=false)
    {
        switch(type)
        {
            case "startEnd":
                element.addEventListener("click", ()=>
                {
                    this.mode = "startEnd";
                });
                break;
            case "wall":
                element.addEventListener("click", ()=>
                {
                    this.mode = "wall";
                });
                break;
            case "clear":
                element.addEventListener("click", ()=>
                {
                    this.clear(true);
                });
                break;
            case "replay":
                element.classList.remove("inactive");
                element.addEventListener("click", ()=>
                {
                    this.playback(other);
                });
                break;
            default:
                console.error("Unknown type '" + type + "' at Board.add()");
        }
    }
}