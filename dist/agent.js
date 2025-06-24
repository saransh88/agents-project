import { Agent, run, tool } from "@openai/agents";
import { z } from "zod";
import readline from "readline";
const testCaseTool = tool({
    name: "test_case_tool",
    description: "Provide information about test cases based on ISTQB standards",
    execute: async () => {
        return "A test case is a set of conditions or variables under which a tester will determine whether a system under test satisfies requirements or works correctly.";
    },
    parameters: z.object({ exampleParam: z.string().nullable() }), // Ensure fields are nullable or required
    strict: true,
});
const testingAgent = new Agent({
    name: "Testing Agent",
    instructions: "You are a testing agent that helps with testing. You will follow ISTQB standards.",
    tools: [testCaseTool],
});
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
async function chatWithAgent() {
    rl.question("Ask a question: ", async (question) => {
        const result = await run(testingAgent, question);
        console.log("Agent's response:", result.finalOutput);
        chatWithAgent(); // Prompt for the next question
    });
}
chatWithAgent();
