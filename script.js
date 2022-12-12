"use strict";

const pubSub = (() => {
  const events = {};

  const subscribe = (eventName, ...actions) => {
    events[eventName] = events[eventName] || [];
    actions.forEach((action) => events[eventName].push(action));
  }

  const publish = (eventName, data) => {
    events[eventName]?.forEach((fn) => fn(data));
  }

  return { subscribe, publish };
})();

// factory for tic tac toe board
const GameBoard = (cellData) => {
  const SIZE = 3;

  const data = cellData ?? Array(SIZE).fill(null).map(() => Array(SIZE).fill(""));

  const getData = () => [...data.map((row) => [...row])];

  const copyBoard = () => GameBoard(getData());

  const getEmptyPositions = () => {
    return data.reduce((positionsList, row, rowIdx) => {
      row.forEach((position, colIdx) => {
        if (position === "") positionsList.push([rowIdx, colIdx])
      })
      return positionsList;
    }, [])
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

  const hasThreeInRow = (symbol = null) => {
    if (!symbol) {
      return hasThreeInRow("X") || hasThreeInRow("O");
    }

    const combinations = data.concat(columns(), diagonals());
    return combinations.some((combo) => combo.every((square) => square === symbol));
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

  return {
    getData, getEmptyPositions, placeSymbol, hasThreeInRow,
    isFull, isPositionAvailable, copyBoard
  };
};

// Player Factory
const HumanPlayer = (symbol) => {
  const playerSymbol = symbol;
  let name;

  const getSymbol = () => playerSymbol;
  const getName = () => name;
  const setName = (newName) => name = newName;
  const getAutomatedMove = () => [-1, -1];

  return { getSymbol, getName, setName, getAutomatedMove };
}

const ComputerPlayer = (symbol) => {
  const playerSymbol = symbol;
  const name = "BeepBoop";

  const getSymbol = () => playerSymbol;
  const getName = () => name;
  const setName = () => {};

  const getAutomatedMove = (boardData) => {
    const possibilities = [];
    boardData.forEach((row, rowIdx) => {
      row.forEach((col, colIdx) => {
        if (col === "") possibilities.push([rowIdx, colIdx]);
      })
    })
    const randomIdx = Math.floor(Math.random() * possibilities.length);
    return possibilities[randomIdx];
  }

  return { getSymbol, getName, setName, getAutomatedMove };
}

const TicTacToe = () => {
  let board = GameBoard();
  const player1 = HumanPlayer("X");
  const player2 = ComputerPlayer("O");
  let currentPlayer = player1;

  const getCurrentSymbol = () => currentPlayer.getSymbol();

  const getBoardData = () => board.getData();

  const changeTurns = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  }

  const makeMove = (position) => {
    if (board.isPositionAvailable(position)) {
      board.placeSymbol(getCurrentSymbol(), position);
      pubSub.publish("gameUpdated", board.getData());
      if (isGameOver()) return;

      changeTurns();
      makeMove(currentPlayer.getAutomatedMove(board));
    }
  }

  const isWinner = () => board.hasThreeInRow();
  const isDraw = () => board.isFull();
  const isGameOver = () => isWinner() || isDraw();

  const broadcastGameOver = () => {
    if (!isGameOver()) return;

    const winner = isWinner() ? currentPlayer.getName() : null;
    pubSub.publish("gameOver", winner);
  }

  const resetGame = () => {
    board = GameBoard();
    currentPlayer = player1;
    pubSub.publish("gameUpdated", board.getData());
  }

  const setupGame = (playerNames) => {
    player1.setName(playerNames.player1);
    player2.setName(playerNames.player2);
    pubSub.publish("gameUpdated", board.getData());
  }

  return { getBoardData, broadcastGameOver, resetGame, setupGame, makeMove };
}

const Display = () => {
  const grid = document.getElementById("grid");
  const resultsContainer = document.getElementById("results");
  const rowTemplate = document.getElementById("row-template");
  const symbolClassMap = new Map([["X", "x-symbol"], ["O", "o-symbol"]]);

  const replayButton = document.querySelector("button");
  replayButton.addEventListener("click", () => {
    pubSub.publish("newGame");
    toggleModal();
  })

  const squareClickHandler = (event) => {
    const row = event.target.parentNode.getAttribute("data-row")
    const col = event.target.getAttribute("data-col");
    if (!row || !col) return;

    pubSub.publish("makeMove", [row, col]);
  }

  grid.addEventListener("click", squareClickHandler);

  const renderGameOver = (winningPlayer) => {
    let resultText;
    if (winningPlayer) {
      resultText = `${winningPlayer} has won the game!`;
    } else {
      resultText = "Tie game!";
    }

    resultsContainer.textContent = resultText;
    toggleModal();
  };

  const renderGrid = (modelData) => {
    grid.replaceChildren();

    modelData.forEach(createRow);
  }

  const createRow = (rowData, rowNum) => {
    const clone = rowTemplate.content.cloneNode(true);
    const row = clone.querySelector("div");

    rowData.forEach((position, index) => {
      const square = row.querySelector(`[data-col='${index}']`);
      square.classList.add(symbolClassMap.get(position));
    });
    row.setAttribute("data-row", rowNum);
    grid.appendChild(clone);
  }

  const toggleModal = () => {
    document
      .querySelectorAll("[data-toggle='closed']")
      .forEach((node) => node.classList.toggle("closed"));
  }

  const renderPlayerSelect = () => {
    const template = document.getElementById("name-form");
    const clone = template.content.cloneNode(true);

    const button = clone.querySelector("button");
    button.addEventListener("click", () => {
      const form = document.body.querySelector("form");
      const player1 = document.getElementById("player1").value;
      const player2 = document.getElementById("player2").value;
      document.body.removeChild(form);
      pubSub.publish("setupGame", { player1, player2 });
    })
    document.body.appendChild(clone);
  }

  return { renderPlayerSelect, renderGrid, renderGameOver }
}

const controller = (() => {
  const init = () => {
    const model = TicTacToe();
    const view = Display();

    pubSub.subscribe("setupGame", model.setupGame);
    pubSub.subscribe("makeMove", model.makeMove, model.broadcastGameOver)
    pubSub.subscribe("newGame", model.resetGame);

    pubSub.subscribe("gameUpdated", view.renderGrid);
    pubSub.subscribe("gameOver", view.renderGameOver);

    view.renderPlayerSelect();
  }

  return { init };
})();

controller.init();
