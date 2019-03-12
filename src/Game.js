import React, { Component } from 'react'
import './Game.css'

class Cell extends React.Component {
  getDisplayValue () {
    // Returns the value that should appear in the cell
    const { value } = this.props
    
    if (!value.isRevealed) {
      return value.isFlagged ? '🚩' : null
    }

    if (value.hasMine) {
      return '💣'
    }

    if (value.adjacentMines === 0) {
      return null
    }

    return value.adjacentMines
  }

  render () {
    const { value, onClick, onRightClick } = this.props
    let className = 'cell'
    if (value.isRevealed) {
      className += ' cell-revealed' // Used for styling
    }
    return (
      <div onClick={onClick} onContextMenu={onRightClick} className={className}>
        { this.getDisplayValue() }
      </div>
    )
  }
}

class Board extends Component {
  state = {
    boardData: this.initBoardData(this.props.height, this.props.width, this.props.mines)
  }

  initBoardData (height, width, mines) {
    let grid = this.initGrid(height, width) // Initialize some empty cells
    grid = this.initMines(grid, height, width, mines) // Fill randomly with mines
    grid = this.getAdjacentMineCount(grid, height, width) // Fill in mine counts for each cell
    return grid
  }

  initGrid (height, width) {
    let grid = []
    for (let y=0; y<height; y++) {
      grid.push([])
      for (let x=0; x<width; x++) {
        grid[y][x] = {
          x,
          y,
          hasMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        }
      }
    }
    return grid
  }

  initMines (grid, height, width, mines) {
    let x, y, planted = 0
    while (planted < mines) {
      x = Math.floor(Math.random() * width)
      y = Math.floor(Math.random() * height)
      if (!grid[y][x].hasMine) {
        grid[y][x].hasMine = true
        planted++
      }
    }
    return grid
  }

  getAdjacentMineCount (grid, height, width) {
    // Fill in counts of neighboring mines for each cell
    for (let y=0; y<height; y++) {
      for (let x=0; x<width; x++) {
        if (!grid[y][x].hasMine) {
          let adjacentMineCount = 0
          const neighborhood = this.getNeighbors(grid, x, y)
          for (let cell of neighborhood) {
            if (cell.hasMine) {
              adjacentMineCount++
            }
          }
          grid[y][x].adjacentMines = adjacentMineCount
        }
      }
    }
    return grid
  }

  getNeighbors (grid, x, y) {
    // Get grid values for nearest neighbors of cell at position (x, y)
    let neighborhood = []

    if (y > 0) {
      neighborhood.push(grid[y-1][x])
    }
    if (y > 0 && x < this.props.width - 1) {
      neighborhood.push(grid[y-1][x+1])
    }
    if (x < this.props.width - 1) {
      neighborhood.push(grid[y][x+1])
    }
    if (y < this.props.height - 1 && x < this.props.width - 1) {
      neighborhood.push(grid[y+1][x+1])
    }
    if (y < this.props.height - 1) {
      neighborhood.push(grid[y+1][x])
    }
    if (y < this.props.height - 1 && x > 0) {
      neighborhood.push(grid[y+1][x-1])
    }
    if (x > 0) {
      neighborhood.push(grid[y][x-1])
    }
    if (y > 0 && x > 0) {
      neighborhood.push(grid[y-1][x-1])
    }
    return neighborhood
  }

  onCellClick (x, y) {
    const { boardData } = this.state
    let newBoardData = boardData
    if (boardData[y][x].isRevealed || boardData[y][x].isFlagged) {
      return // Do nothing if flagged or revealed
    } else if (boardData[y][x].hasMine) {
      this.revealBoard()
      alert('Game over!') // Ouch!
    } else if (boardData[y][x].adjacentMines === 0) {
      newBoardData = this.revealAdjacent(x, y, newBoardData)
    } else {
      newBoardData[y][x].isRevealed = true
    }

    if (this.getHiddenCount(newBoardData) === this.props.mines) {
      this.revealBoard()
      alert('You win!') // If only mines are left, you win!
    }

    this.setState({
      boardData: newBoardData
    })
  }

  onRightClick (e, x, y) {
    e.preventDefault()
    const { boardData } = this.state
    let newBoardData = boardData
    if (!boardData[y][x].isRevealed) {
      newBoardData[y][x].isFlagged = !newBoardData[y][x].isFlagged // Toggle flag
    }
    this.setState({
      boardData: newBoardData
    })
  }

  revealAdjacent (x, y, grid) {
    // Recursively sweep all adjacent empty cells
    let neighborhood = this.getNeighbors(grid, x, y)
    for (let cell of neighborhood) {
      if (!cell.isFlagged && !cell.isRevealed && (cell.adjacentMines === 0 || !cell.hasMine)) {
        grid[cell.y][cell.x].isRevealed = true
        if (cell.adjacentMines === 0) {
          this.revealAdjacent(cell.x, cell.y, grid)
        }
      }
    }
    return grid
  }

  getHiddenCount (boardData) {
    // Returns count of cells that are still un-swept
    let count = 0
    for (let col of boardData) {
      for (let cell of col) {
        if (!cell.isRevealed) {
          count++
        }
      }
    }
    return count
  }

  revealBoard () {
    // Reveal each cell
    const { boardData } = this.state

    let newBoardData = boardData

    for (let y=0; y<this.props.height; y++) {
      for (let x=0; x<this.props.width; x++) {
        newBoardData[y][x].isRevealed = true
      }
    }

    this.setState({
      boardData: newBoardData
    })
  }

  renderBoard (boardData) {
    return boardData.map((row) => {
      return row.map((cell) => {
        return (
          <div>
            <Cell
              onClick={() => this.onCellClick(cell.x, cell.y)}
              onRightClick={(e) => this.onRightClick(e, cell.x, cell.y)}
              value={cell}
            />
            {
              // If we're at the end of a row, go to the next line
              (row[row.length - 1] === cell) ? <div className='clear'/> : ''
            }
          </div>

        )
      })
    })
  }

  render () {
    const { boardData } = this.state
    return (
      <div className='board'>
      { this.renderBoard(boardData) }
      </div>
    )
  }
}

class Game extends Component {
  state = {
    height: 10,
    width: 10,
    mines: 10
  }

  render() {
    const { height, width, mines } = this.state
    return (
      <div className='game'>
        <Board height={height} width={width} mines={mines} />
      </div>
    )
  }
}

export default Game
