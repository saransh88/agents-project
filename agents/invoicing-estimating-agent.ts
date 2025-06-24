import { RealtimeAgent, RealtimeSession, tool } from "@openai/agents/realtime";
import { z } from "zod";
import { spawn, exec } from "child_process";
import { writeFile } from "fs";

// Tool for creating invoices
const createInvoiceTool = tool({
  name: "create_invoice",
  description: "Create an invoice based on the provided details",
  parameters: z.object({
    customerName: z.string(),
    amount: z.number(),
    dueDate: z.string(),
  }),
  execute: async ({ customerName, amount, dueDate }) => {
    return `Invoice created for ${customerName}, amount: $${amount}, due date: ${dueDate}.`;
  },
});

// Tool for providing estimates
const provideEstimateTool = tool({
  name: "provide_estimate",
  description: "Provide an estimate based on the job type and details",
  parameters: z.object({
    jobType: z.string(),
    details: z.string(),
  }),
  execute: async ({ jobType, details }) => {
    return `Estimate for ${jobType}: Based on the details provided (${details}), the estimated cost is $500.`;
  },
});

// Invoicing and Estimating Agent (Realtime)
const invoicingEstimatingAgent = new RealtimeAgent({
  name: "Invoicing and Estimating Agent",
  instructions: "You are an agent that helps with invoicing and estimating tasks. You can adapt to different personas like Electrician, Roofer, etc.",
  tools: [createInvoiceTool, provideEstimateTool],
});

const session = new RealtimeSession(invoicingEstimatingAgent, {
  model: "gpt-4o-realtime-preview-2025-06-03",
  config: {
    inputAudioFormat: "pcm16",
    outputAudioFormat: "pcm16", // revert to pcm16
    inputAudioTranscription: {
      model: "gpt-4o-mini-transcribe",
    },
    voice: "coral", // Use the 'coral' voice for agent responses
  },
});

session.on("error", (event) => {
  console.error("Realtime session error:", event);
});

// @ts-ignore
session.on("transcript", (event: any) => {
  console.log("Transcript:", event.transcript);
});

// @ts-ignore
session.on("text", (event: any) => {
  console.log("Agent text response:", event.text);
});

session.on("audio", (event: any) => {
  // Save the audio buffer to a file and play it
  const audioBuffer = Buffer.from(event.data);
  const filename = "agent_output.pcm";
  // Log the last agent text response before playing audio
  if (event.text) {
    console.log("[Agent will speak]:", event.text);
  } else {
    console.log("[Agent will speak]: (No text transcript available for this audio chunk)");
  }
  writeFile(filename, audioBuffer, (err) => {
    if (err) {
      console.error("Error saving agent audio:", err);
      return;
    }
    // Play the audio using sox (or use 'afplay' on macOS)
    exec(`sox -t raw -r 16000 -c 1 -b 16 -e signed-integer ${filename} -d`, (err) => {
      if (err) {
        console.error("Error playing agent audio:", err);
      }
    });
  });
  console.log("Received audio response from agent.");
});

async function startVoiceAgent() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set. Please set it in your environment variables.");
  }

  await session.connect({ apiKey });
  console.log("Invoicing and Estimating Agent is ready for real-time conversation.");

  // Use sox to capture microphone audio in real time and stream to session
  const sox = spawn("sox", [
    "-d", // Use default audio input device
    "-r", "16000", // Sample rate
    "-c", "1", // Mono channel
    "-b", "16", // Bit depth
    "-t", "raw", // Output raw PCM to stdout
    "-"
  ]);

  sox.stdout.on("data", (chunk) => {
    let arrayBuffer: ArrayBuffer | null = null;
    if (Buffer.isBuffer(chunk)) {
      arrayBuffer = new Uint8Array(chunk).buffer;
    } else if (typeof chunk === "string") {
      arrayBuffer = new TextEncoder().encode(chunk).buffer as ArrayBuffer;
    }
    if (arrayBuffer) {
      session.sendAudio(arrayBuffer);
    } else {
      console.error("Unexpected chunk type received from sox stdout:", typeof chunk);
    }
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
}

startVoiceAgent().catch((err) => console.error("Error starting voice agent:", err));
