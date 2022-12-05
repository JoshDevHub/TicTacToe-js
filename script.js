// factory for tic tac toe board
const GameBoard = () => {
  const SIZE = 3;

  const data = Array(SIZE).fill(null).map(() => Array(SIZE).fill(""));

  const getPosition = (position) => {
    const [row, col] = position;
    if (isInvalidPosition(row, col)) return;

    return data[row][col];
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

  return { getPosition, placeSymbol, hasThreeInRow, isFull };
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

  const getCurrentPlayer = () => currentPlayer;

  const changeTurns = () => {
    currentPlayer = currentPlayer === player1 ? player2 : player1;
  }

  const makeMove = (player, position) => {
    board.placeSymbol(player.getSymbol(), position);
  }

  const isWinner = () => {
    return board.hasThreeInRow();
  }

  const isDraw = () => {
    return board.isFull();
  }

  return { getCurrentPlayer, changeTurns, makeMove, isWinner, isDraw };
}
