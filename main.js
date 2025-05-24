class Node {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.isWall = false;
    this.weight = 1;
    this.distance = Infinity;
    this.isVisited = false;
    this.previousNode = null;
  }
}

class Grid {
  constructor(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.nodes = [];
    this.startNode = null;
    this.endNode = null;
    this.initializeGrid();
  }

  initializeGrid() {
    const gridContainer = document.getElementById("grid");
    gridContainer.style.gridTemplateColumns = `repeat(${this.cols}, 30px)`;
    gridContainer.innerHTML = "";

    for (let i = 0; i < this.rows; i++) {
      this.nodes[i] = [];
      for (let j = 0; j < this.cols; j++) {
        const node = new Node(i, j);
        this.nodes[i][j] = node;

        const cell = document.createElement("div");
        cell.className = "cell";
        cell.dataset.x = i;
        cell.dataset.y = j;

        cell.addEventListener("click", (e) =>
          this.handleCellClick(node, cell, e)
        );
        cell.addEventListener("contextmenu", (e) => {
          e.preventDefault();
          this.handleCellRightClick(node, cell);
        });

        gridContainer.appendChild(cell);
      }
    }
  }

  resize(newRows, newCols) {
    this.rows = newRows;
    this.cols = newCols;
    this.nodes = [];
    this.startNode = null;
    this.endNode = null;
    this.initializeGrid();
  }

  handleCellClick(node, cell, event) {
    if (event.shiftKey) return;

    if (!this.startNode) {
      this.startNode = node;
      cell.classList.add("start");
    } else if (!this.endNode) {
      this.endNode = node;
      cell.classList.add("end");
    } else {
      node.isWall = !node.isWall;
      cell.classList.toggle("wall");
      cell.textContent = "";
    }
  }

  handleCellRightClick(node, cell) {
    if (node === this.startNode || node === this.endNode) return;
    node.weight = node.weight === 1 ? 5 : 1;
    cell.classList.toggle("weight", node.weight > 1);
    cell.textContent = node.weight > 1 ? node.weight : "";
  }

  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ];

    for (const [dx, dy] of directions) {
      const x = node.x + dx;
      const y = node.y + dy;
      if (x >= 0 && x < this.rows && y >= 0 && y < this.cols) {
        neighbors.push(this.nodes[x][y]);
      }
    }
    return neighbors;
  }
}

class Pathfinder {
  constructor(grid) {
    this.grid = grid;
    this.unvisitedNodes = [];
  }

  async dijkstra() {
    const speed = document.getElementById("speed").value;
    this.grid.startNode.distance = 0;
    this.unvisitedNodes = [this.grid.startNode];

    while (this.unvisitedNodes.length > 0) {
      this.unvisitedNodes.sort((a, b) => a.distance - b.distance);
      const currentNode = this.unvisitedNodes.shift();

      if (currentNode === this.grid.endNode) break;
      if (currentNode.isVisited) continue;

      currentNode.isVisited = true;
      this.updateCell(currentNode, "visited");

      await new Promise((resolve) => setTimeout(resolve, speed));

      const neighbors = this.grid.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        if (neighbor.isWall || neighbor.isVisited) continue;

        const newDistance = currentNode.distance + neighbor.weight;
        if (newDistance < neighbor.distance) {
          neighbor.distance = newDistance;
          neighbor.previousNode = currentNode;
          this.unvisitedNodes.push(neighbor);
        }
      }
    }

    if (this.grid.endNode.previousNode) {
      await this.showPath();
    }
  }

  async showPath() {
    const speed = document.getElementById("speed").value;
    let currentNode = this.grid.endNode;
    while (currentNode !== this.grid.startNode) {
      this.updateCell(currentNode, "path");
      currentNode = currentNode.previousNode;
      await new Promise((resolve) => setTimeout(resolve, speed));
    }
  }

  updateCell(node, className) {
    const cell = document.querySelector(
      `[data-x="${node.x}"][data-y="${node.y}"]`
    );
    cell.classList.add(className);
  }
}

const grid = new Grid(10, 10);

function startPathfinding() {
  if (!grid.startNode || !grid.endNode)
    return alert("Set start and end points!");
  grid.nodes.flat().forEach((node) => {
    node.distance = Infinity;
    node.isVisited = false;
    node.previousNode = null;
  });
  document.querySelectorAll(".cell").forEach((cell) => {
    cell.className = "cell";
    if (cell.classList.contains("start")) cell.classList.add("start");
    if (cell.classList.contains("end")) cell.classList.add("end");
    if (cell.classList.contains("wall")) cell.classList.add("wall");
    if (cell.classList.contains("weight")) cell.classList.add("weight");
  });
  new Pathfinder(grid).dijkstra();
}

function clearGrid() {
  grid.startNode = null;
  grid.endNode = null;
  grid.resize(grid.size);
}

function resizeGrid() {
  const newRows = parseInt(document.getElementById("rowsInput").value);
  const newCols = parseInt(document.getElementById("colsInput").value);

  if (
    isNaN(newRows) ||
    isNaN(newCols) ||
    newRows < 2 ||
    newCols < 2 ||
    newRows > 100 ||
    newCols > 100
  ) {
    alert("Please enter valid sizes between 2 and 100.");
    return;
  }

  grid.resize(newRows, newCols);
}

function saveGrid() {
  const gridData = {
    size: grid.size,
    start: grid.startNode ? { x: grid.startNode.x, y: grid.startNode.y } : null,
    end: grid.endNode ? { x: grid.endNode.x, y: grid.endNode.y } : null,
    nodes: grid.nodes.map((row) =>
      row.map((node) => ({
        isWall: node.isWall,
        weight: node.weight,
      }))
    ),
  };
  localStorage.setItem("savedGrid", JSON.stringify(gridData));
}

function loadGrid() {
  const savedData = localStorage.getItem("savedGrid");
  if (!savedData) return;

  const gridData = JSON.parse(savedData);
  grid.resize(gridData.size);

  gridData.nodes.forEach((row, i) =>
    row.forEach((nodeData, j) => {
      const node = grid.nodes[i][j];
      node.isWall = nodeData.isWall;
      node.weight = nodeData.weight;
      const cell = document.querySelector(`[data-x="${i}"][data-y="${j}"]`);
      cell.classList.toggle("wall", node.isWall);
      cell.classList.toggle("weight", node.weight > 1);
      cell.textContent = node.weight > 1 ? node.weight : "";
    })
  );

  if (gridData.start) {
    grid.startNode = grid.nodes[gridData.start.x][gridData.start.y];
    document
      .querySelector(
        `[data-x="${gridData.start.x}"][data-y="${gridData.start.y}"]`
      )
      .classList.add("start");
  }
  if (gridData.end) {
    grid.endNode = grid.nodes[gridData.end.x][gridData.end.y];
    document
      .querySelector(`[data-x="${gridData.end.x}"][data-y="${gridData.end.y}"]`)
      .classList.add("end");
  }
}
