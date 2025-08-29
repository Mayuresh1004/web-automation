# Web Automation Agent

A web automation tool built with OpenAI Agents and Playwright that can interact with websites through visual understanding and browser controls.

## Features

- **Browser Automation**: Control browser actions like clicking, typing, scrolling
- **Screenshot Capture**: Take screenshots to understand page state
- **Element Interaction**: Click on elements by selector or coordinates
- **Form Filling**: Automatically fill out web forms
- **Navigation**: Navigate between pages and wait for elements
- **Text Extraction**: Extract visible text from web pages

## Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```
   GOOGLE_API_KEY=your_google_api_key_here
   ```
   
   Get your Google API key from: https://makersuite.google.com/app/apikey

3. **Install Playwright Browsers**:
   ```bash
   npx playwright install chromium
   ```

## Usage

Run the automation:
```bash
node browserUse.js
```

## Current Task

The agent is configured to:
1. Navigate to ui.chaicode.com
2. Find and click the "Sign Up" button in the authentication dropdown
3. Fill out the sign-up form with test data
4. Submit the form

## Code Structure

- **Tools**: Individual browser automation functions (click, type, screenshot, etc.)
- **Agent**: AI agent that orchestrates the automation using the tools
- **Browser Management**: Proper initialization and cleanup of browser resources

## Dependencies

- `@openai/agents`: Core agent framework
- `@openai/agents-extensions`: AI SDK integration
- `@ai-sdk/google`: Google AI model integration
- `playwright`: Browser automation
- `zod`: Schema validation
- `dotenv`: Environment variable management

## Notes

- The browser runs in non-headless mode for visibility
- Screenshots are taken after major actions to verify progress
- Proper error handling and resource cleanup is implemented
- All tools check if the browser is initialized before executing
