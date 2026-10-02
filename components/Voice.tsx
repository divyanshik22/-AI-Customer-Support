"use client";
import { useEffect, useRef, useState } from "react";
export default function Voice({
  enabled,
  onTranscript,
}: {
  enabled: boolean;
  onTranscript: (role: string, text: string) => void;
}) {
  const [status, setStatus] = useState("Ready"),
    [live, setLive] = useState(false),
    [connecting, setConnecting] = useState(false);
  const peer = useRef<RTCPeerConnection | null>(null),
    stream = useRef<MediaStream | null>(null),
    channel = useRef<RTCDataChannel | null>(null),
    audio = useRef<HTMLAudioElement | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callback = useRef(onTranscript);
  callback.current = onTranscript;
  function stop() {
    if (timer.current) clearTimeout(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    channel.current?.close();
    peer.current?.close();
    peer.current = null;
    if (audio.current) audio.current.srcObject = null;
    setLive(false);
    setConnecting(false);
  }
  useEffect(() => () => stop(), []);
  async function start() {
    setConnecting(true);
    setStatus("Connecting…");
    try {
      const pc = new RTCPeerConnection();
      peer.current = pc;
      const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = ms;
      ms.getTracks().forEach((t) => pc.addTrack(t, ms));
      pc.ontrack = (e) => {
        if (audio.current) {
          audio.current.srcObject = e.streams[0];
          audio.current
            .play()
            .catch(() => setStatus("Press play below to hear the agent."));
        }
      };
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onopen = () => {
        setLive(true);
        setConnecting(false);
        setStatus("Listening • Speak naturally");
        dc.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "Briefly greet the customer as an AI voice assistant and ask how you can help.",
            },
          }),
        );
        timer.current = setTimeout(() => {
          stop();
          setStatus("Call ended — five-minute limit.");
        }, 300000);
      };
      dc.onmessage = async (e) => {
        try {
          const event = JSON.parse(e.data);
          if (
            event.type ===
            "conversation.item.input_audio_transcription.completed"
          )
            callback.current("user", event.transcript);
          if (event.type === "response.output_audio_transcript.done")
            callback.current("assistant", event.transcript);
          if (event.type === "error")
            setStatus(event.error?.message || "Voice error");
          if (event.type === "response.function_call_arguments.done") {
            setStatus("Checking policy…");
            let result;
            try {
              const r = await fetch("/api/voice/tool", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: event.name,
                  args: JSON.parse(event.arguments),
                }),
              });
              result = await r.json();
            } catch {
              result = {
                error: "Tool request failed. Ask the customer to try again.",
              };
            }
            if (dc.readyState === "open") {
              dc.send(
                JSON.stringify({
                  type: "conversation.item.create",
                  item: {
                    type: "function_call_output",
                    call_id: event.call_id,
                    output: JSON.stringify(result),
                  },
                }),
              );
              dc.send(JSON.stringify({ type: "response.create" }));
              setStatus("Listening • Speak naturally");
            }
          }
        } catch {
          setStatus("Could not read a voice event.");
        }
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "disconnected"].includes(pc.connectionState)) {
          stop();
          setStatus("Disconnected. Try again.");
        }
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const r = await fetch("/api/voice/session", {
        method: "POST",
        headers: { "Content-Type": "application/sdp" },
        body: offer.sdp,
      });
      if (!r.ok) {
        const b = await r.json();
        throw new Error(b.error);
      }
      await pc.setRemoteDescription({ type: "answer", sdp: await r.text() });
    } catch (e) {
      stop();
      setStatus((e as Error).message);
    }
  }
  return (
    <div className="voice">
      <div>
        <b>◎ Voice assistant</b>
        <small>{status}</small>
      </div>
      <button
        disabled={!enabled || connecting}
        onClick={() => (live ? (stop(), setStatus("Call ended")) : start())}
      >
        {live ? "End call" : "Start voice"}
      </button>
      <audio ref={audio} autoPlay controls />
    </div>
  );
}
