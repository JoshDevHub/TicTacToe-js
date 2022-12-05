"use strict";

// factory for tic tac toe board
const GameBoard = () => {
  const SIZE = 3;

  const data = Array(SIZE).fill(null).map(() => Array(SIZE).fill(""));

  const getData = () => [...data];

  const getPosition = (position) => {
    const [row, col] = position;
    if (isInvalidPosition(row, col)) return;

    return data[row][col];
  }

  const isPositionAvailable = (position) => {
    const [row, col] = position;
    if (isInvalidPosition(row, col)) return false;

    return data[row][col] === "";
  }

  const placeSymbol = (symbol, position) => {
    const [row, col] = position;
    if (isInvalidPosition(row, col)) return;

    if (data[row][col] === "") {
      data[row][col] = symbol;
    }
  }

  const hasThreeInRow = () => {
    const combinations = data.concat(columns(), diagonals());
    return combinations.some((combo) => {
      const [first, second, third] = combo;
      return first && first === second && first === third;
    })
  }

  const isFull = () => {
    return data.every((row) => row.every((position) => position !== ""));
  }

  // private helpers
  const isInvalidPosition = (row, col) => {
    return row < 0 && SIZE >= row && col < 0 && SIZE >= col
  }

  const columns = () => {
    return data[0].map((_, i) => data.map((row) => row[i]));
  }

  const diagonals = () => {
    const main = [data[2][0], data[1][1], data[0][2]];
    const anti = [data[0][0], data[1][1], data[2][2]];
    return [main, anti];
  }

  return { getData, getPosition, placeSymbol, hasThreeInRow, isFull, isPositionAvailable };
};

// Player Factory
const Player = (symbol) => {
  const playerSymbol = symbol;

  const getSymbol = () => playerSymbol;

  return { getSymbol };
}

const TicTacToe = () => {
  const board = GameBoard();
  const player1 = Player("X");
  const player2 = Player("O");
  let currentPlayer = player1;

  const getCurrentPlayer = () => currentPlayer.getSymbol();

  const getBoardData = () => board.getData();

  const changeTurns = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  }

  const makeMove = (position) => {
    if (board.isPositionAvailable(position)) {
      const currentSymbol = currentPlayer.getSymbol();
      board.placeSymbol(currentSymbol, position);
      if (isGameOver()) return;

      changeTurns();
    }
  }

  const isWinner = () => board.hasThreeInRow();
  const isDraw = () => board.isFull();
  const isGameOver = () => isWinner() || isDraw();

  return { getCurrentPlayer, getBoardData, changeTurns, makeMove, isWinner, isDraw };
}

const Display = (actions) => {
  const grid = document.getElementById("grid");
  const resultsContainer = document.getElementById("results")
  const { move, getData, isWinner, getCurrentPlayer } = actions;

  const squareClickHandler = (event) => {
    const row = event.target.parentNode.getAttribute("data-row")
    const col = event.target.getAttribute("data-col");
    if (!row || !col) return;

    move([row, col]);
    renderGrid(getData());
    if (isWinner()) {
      renderGameOver();
    }
  }

  grid.addEventListener("click", squareClickHandler);

  const renderGameOver = () => {
    grid.removeEventListener("click", squareClickHandler);
    resultsContainer.textContent = `${getCurrentPlayer()} has won the game!`;
  };

  const renderGrid = (modelData) => {
    grid.replaceChildren();

    modelData.forEach(createRow);
  }

  const createRow = (rowData, rowNum) => {
    const template = document.getElementById("row-template")
    const clone = template.content.cloneNode(true);

    const row = clone.querySelector('div');

    rowData.forEach((position, index) => {
      const square = row.querySelector(`[data-col='${index}']`);
      console.log(square === "X");
      square.textContent = position;
    });
    row.setAttribute("data-row", rowNum);
    grid.appendChild(clone);
  }

  return { renderGrid }
}

const controller = (() => {
  const model = TicTacToe();
  const actions = {
    move: model.makeMove,
    getData: model.getBoardData,
    isWinner: model.isWinner,
    getCurrentPlayer: model.getCurrentPlayer
  }
  const view = Display(actions);

  view.renderGrid(model.getBoardData());
})();
