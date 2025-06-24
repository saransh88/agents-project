import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import { z } from "zod";
import { createReadStream } from "fs";
import { spawn } from "child_process";

const createInvoiceTool = tool({
  name: "create_invoice",
  description: "Create an invoice based on voice instructions",
  parameters: z.object({
    customerName: z.string(),
    amount: z.number(),
    dueDate: z.string(),
  }),
  execute: async ({ customerName, amount, dueDate }) => {
    return `Invoice created for ${customerName}, amount: $${amount}, due date: ${dueDate}.`;
  },
});

const voiceAgent = new RealtimeAgent({
  name: "Voice Agent",
  instructions: "You are a voice agent that creates invoices based on voice instructions.",
  tools: [createInvoiceTool],
});

const session = new RealtimeSession(voiceAgent, {
  model: "gpt-4o-realtime-preview-2025-06-03",
  config: {
    inputAudioFormat: "pcm16",
    outputAudioFormat: "pcm16",
    inputAudioTranscription: {
      model: "gpt-4o-mini-transcribe",
    },
  },
});

session.on("audio", (event) => {
  const data = event.data as Buffer | ArrayBuffer;
  if (data instanceof ArrayBuffer) {
    session.sendAudio(data);
    console.log("Audio data sent to session.");
  } else if (Buffer.isBuffer(data)) {
    const arrayBuffer = new Uint8Array(data).buffer;
    session.sendAudio(arrayBuffer);
    console.log("Audio data sent to session.");
  } else {
    console.error("Unexpected audio data format received:", event.data);
  }
});

async function startVoiceAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Please set it in your environment variables.");
  }

  await session.connect({ apiKey });
  console.log("Voice agent is ready to receive instructions.");

  // Debugging log to verify sox command and arguments
  console.log("Spawning sox with command:", "sox", [
    "-d", // Use default audio input device
    "-r", "16000", // Sample rate
    "-c", "1", // Mono channel
    "-b", "16", // Bit depth
    "-t", "raw", // Specify file type explicitly
    "input_audio.pcm" // Output file
  ]);

  // Capture audio input from microphone
  const sox = spawn("sox", [
    "-d", // Use default audio input device
    "-r", "16000", // Sample rate
    "-c", "1", // Mono channel
    "-b", "16", // Bit depth
    "-t", "raw", // Specify file type explicitly
    "input_audio.pcm" // Output file
  ]);

  sox.stdout.on("data", (data) => {
    console.log("Sox stdout:", data.toString());
  });

  sox.stderr.on("data", (data) => {
    console.error("Sox stderr:", data.toString());
  });

  sox.on("error", (err) => {
    console.error("Sox process error:", err);
  });

  sox.on("close", (code) => {
    console.log(`Sox process exited with code ${code}`);
  });

  const inputStream = createReadStream("input_audio.pcm");
  inputStream.on("data", (chunk) => {
    let arrayBuffer: ArrayBuffer | null = null;
    if (Buffer.isBuffer(chunk)) {
      arrayBuffer = new Uint8Array(chunk).buffer;
    } else if (typeof chunk === "string") {
      // Convert string to ArrayBuffer (assuming utf-8 encoding)
      arrayBuffer = new TextEncoder().encode(chunk).buffer as ArrayBuffer;
    }
    if (arrayBuffer) {
      session.sendAudio(arrayBuffer);
    } else {
      console.error("Unexpected chunk type received from inputStream:", typeof chunk);
    }
  });

  inputStream.on("end", () => {
    console.log("Audio input stream ended.");
  });
}

startVoiceAgent().catch((err) => console.error("Error starting voice agent:", err));
