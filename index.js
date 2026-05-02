
import { useRef, useState } from "react";
import io from "socket.io-client";

const socket = io("http://localhost:3001");

export default function Home() {
  const [started, setStarted] = useState(false);
  const localRef = useRef();
  const remoteRef = useRef();
  const pc = useRef();
  let partner = null;

  const start = async () => {
    setStarted(true);

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localRef.current.srcObject = stream;

    pc.current = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    stream.getTracks().forEach(track =>
      pc.current.addTrack(track, stream)
    );

    pc.current.ontrack = e => {
      remoteRef.current.srcObject = e.streams[0];
    };

    pc.current.onicecandidate = e => {
      if (e.candidate && partner) {
        socket.emit("ice", { to: partner, candidate: e.candidate });
      }
    };

    socket.emit("join");
  };

  socket.on("matched", async (id) => {
    partner = id;

    const offer = await pc.current.createOffer();
    await pc.current.setLocalDescription(offer);

    socket.emit("offer", { to: id, offer });
  });

  socket.on("offer", async ({ from, offer }) => {
    partner = from;

    await pc.current.setRemoteDescription(offer);
    const answer = await pc.current.createAnswer();
    await pc.current.setLocalDescription(answer);

    socket.emit("answer", { to: from, answer });
  });

  socket.on("answer", async ({ answer }) => {
    await pc.current.setRemoteDescription(answer);
  });

  socket.on("ice", async ({ candidate }) => {
    await pc.current.addIceCandidate(candidate);
  });

  return (
    <div style={{ textAlign: "center" }}>
      <h1>Stranger Video Chat</h1>
      {!started && <button onClick={start}>Start</button>}
      <div>
        <video ref={localRef} autoPlay muted width="300" />
        <video ref={remoteRef} autoPlay width="300" />
      </div>
    </div>
  );
}
