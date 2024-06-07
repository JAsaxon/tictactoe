import { useState, useEffect } from "react";
import "./App.scss";
import { io } from "socket.io-client";

const socket = io("http://localhost:3000");

function App() {
  const [count, setCount] = useState(0);
  const [roomId, setRoomId] = useState("");
  //* {board: number[][], currentTurn: number, playerCount: number, players{string: number}}
  const [room, setRoom] = useState({});
  const [winner, setWinner] = useState(undefined);
  useEffect(() => {
    setRoom({});
    setWinner(undefined);
    socket.on("receive-count", (c) => {
      setCount(c);
    });
    socket.on("get-room", (serverSideRoom) => {
      setRoom(serverSideRoom);
      console.log(serverSideRoom, socket.id);
    });
    socket.on("win", (serverWinner) => {
      setWinner(serverWinner);
    });
    // Clean up the effect
    return () => {
      socket.off("receive-count");
      socket.emit("leave");
    };
  }, []);

  function handleClick() {
    socket.emit("count", count + 1);
  }
  function getYourIndex() {
    return room.players[socket.id];
  }
  function handleSubmit(e) {
    e.preventDefault();
    socket.emit("leave", roomId);
    socket.emit("join-room", roomId);
  }
  function isYourTurn() {
    if (room.board === undefined) {
      return false;
    }
    const yourTurnIndex = room.players[socket.id];
    return yourTurnIndex === room.currentTurn;
  }
  function handleTurn(i, j) {
    const flatIndex = i * 3 + j;
    socket.emit("make-turn", {
      flatIndex: flatIndex,
      roomId: roomId,
    });
  }
  function getPiece(n) {
    if (n === 0) {
      return "";
    }
    if (n === 1) {
      return "x";
    }
    if (n === 2) {
      return "o";
    }
  }
  return (
    <>
      {winner && winner === getYourIndex() && <h1>You win!</h1>}
      {winner && winner !== getYourIndex() && <h1>You lose! :(</h1>}

      {!winner && isYourTurn() && <h3>Your Turn</h3>}
      {!winner && room.board !== undefined && !isYourTurn() && (
        <h3>Waiting for the other player to make a move...</h3>
      )}

      <div className="board">
        {room?.board?.map((row, i) => {
          return row.map((el, j) => {
            return (
              <div key={i} onClick={() => handleTurn(i, j)}>
                {getPiece(el)}
              </div>
            );
          });
        })}
      </div>
      {room?.playerCount}
      <div className="card">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            onChange={(e) => setRoomId(e.currentTarget.value)}
            value={roomId}
          />
          <button type="submit">Join Room</button>
        </form>
        <button onClick={handleClick}>Count is {count}</button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </>
  );
}

export default App;
