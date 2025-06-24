# Agents Project

## Description
This project demonstrates the use of OpenAI Agents SDK to create an interactive agents including voice and text
## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```bash
   cd agents-project
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set your OpenAI API key in your `~/.zshrc` file:
   ```bash
   export OPENAI_API_KEY=your-api-key-here
   ```
   After adding the line, reload your shell configuration:
   ```bash
   source ~/.zshrc
   ```

## Usage

1. Compile the TypeScript file:
   ```bash
   tsc
   ```

2. Run the compiled JavaScript file:
   ```bash
   node dist/agents/testing-agent.js
   ```

3. Interact with the agent by typing questions in the terminal.

## Notes
- Ensure you have Node.js installed.
- Replace `your-api-key-here` in your `~/.zshrc` file with your actual OpenAI API key.

## License
This project is licensed under the ISC License.
