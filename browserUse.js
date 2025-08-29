import { Agent, run, tool  } from "@openai/agents";
import { aisdk } from "@openai/agents-extensions";
import { google } from "@ai-sdk/google";
import OpenAI from "openai";
import 'dotenv/config';
import { z } from 'zod';
import { chromium } from 'playwright'; 

const model = aisdk(google("gemini-1.5-flash"));

let browser;
let page;

async function initializeBrowser() {
  browser = await chromium.launch({
    headless: false,
    chromiumSandbox: true,
    env: {},
    args: ['--disable-extensions', '--disable-file-system'],
  });

  page = await browser.newPage();
}


const takeScreenShot = tool({
  model,
  name: 'take_screenshot',
  description: 'Take a screenshot of the current page and return the base64 image',
  parameters: z.object({}),
  async execute() {
    const image = await page.screenshot({encoding: 'base64'});
    return image;
  },
  // Return base64 image
});

const openBrowser = tool({
  model,
  name: 'open_browser',
  description: 'Open a new browser ',
  parameters: z.object({}),
  async execute() {
    const newPage = await browser.newPage();
    
    return newPage;

  }
});

const openURL = tool({
  model,
  name: 'open_url',
  description: 'Open a new URL in the current browser window',
  parameters: z.object({
    url: z.string().url().describe('The URL to open'),
  }),
  async execute({url}) {
    try {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.waitForLoadState('domcontentloaded');
      // Add a small delay to ensure page is fully stable
      await page.waitForTimeout(2000);
      return `Opened ${url} in the current browser window`;
    } catch (error) {
      return { error: `Failed to open URL: ${error.message}` };
    }
  },
});

const clickOnScreen = tool({
    model,
    name: "click_screen",
    description: "Clicks on coordinates or a selector",
    parameters: z.object({
      x: z.number().nullable().optional(),
      y: z.number().nullable().optional(),
      selector: z.string().nullable().optional()
    }),
    async execute({ x, y, selector }) {
      try {
        if (selector) {
          await page.waitForSelector(selector, { timeout: 10000 });
          await page.click(selector);
          return { message: `Clicked element ${selector}` };
        } else if (x !== null && y !== null) {
          await page.mouse.click(x, y);
          return { message: `Clicked at (${x}, ${y})` };
        } else {
          return { error: "Either selector or both x and y coordinates must be provided" };
        }
      } catch (error) {
        return { error: `Click failed: ${error.message}` };
      }
    }
  });
  

const sendKeys = tool({
    model,
  name: 'send_keys',
  description: "Types text into an element",
  parameters: z.object({
    selector: z.string().describe('The CSS selector of the element to type into'),
    text: z.string().describe('The text to type'),
  }),
  async execute({ selector, text }) {
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
      await page.fill(selector, text);
      return { message: `Typed "${text}" into ${selector}` };
    } catch (error) {
      return { error: `Failed to type text: ${error.message}` };
    }
  }
});


const scroll = tool({
    model,
    name: "scroll",
    description: "Scrolls the page",
    parameters: z.object({
      direction: z.enum(["up", "down"]),
      amount: z.number()
    }),
    async execute({ direction, amount }) {
      const offset = direction === "down" ? amount : -amount;
      await page.evaluate(y => window.scrollBy(0, y), offset);
      return { message: `Scrolled ${direction} by ${amount}px` };
    }
  });

const doubleClick = tool({
    model,
  name: "double_click",
  description: "Double clicks on an element",
  parameters: z.object({
    selector: z.string().describe('The selector of the element to double click'),
  }),
  async execute({ selector }) {
    await page.click(selector, { clickCount: 2 });
    return { message: `Double clicked on ${selector}` };
  }
});

const findElement = tool({
    model,
    name: "find_element",
    description: "Finds an element and returns its bounding box",
    parameters: z.object({
      selector: z.string().describe("CSS selector of element")
    }),
    async execute({ selector }) {
      const element = await page.$(selector);
      if (!element) return { error: "Element not found" };
      const box = await element.boundingBox();
      return { selector, box };
    }
  });
  
  const websiteAutomationAgent = new Agent({
    model,
    name: 'WebSite Automation Agent',
    instructions: `
    You are a web automation agent that can interact with websites through visual understanding and browser controls.
  
    Capabilities:
    - Take screenshots to see the current page
    - Click on elements using coordinates
    - Type text and send keyboard commands
    - Scroll pages
    - Navigate between pages
    - Extract data from pages
    - Fill out forms
  
    Workflow:
    1. Always start by taking a screenshot
    2. Analyze the screenshot to understand the current state
    3. Plan your next action based on the goal
    4. Execute the action
    5. Take another screenshot to verify the result
    6. Repeat until the task is complete
  
    Rules:
    - Always verify actions with screenshots
    - Wait for page loads after navigation
    - Handle errors gracefully
    - Provide status updates on progress
    - If stuck, try alternative approaches

    TOOLS:
        take_screenshot:Captures the current page as a base64 image.Lets the agent "see" the browser after each step.
        open_browser: Opens a new browser window.Useful if you want to handle multiple tabs or reset state.
        open_url: Opens a new URL in the current browser window.Confirms whether navigation was successful (by returning page title or URL).
        click_screen: Clicks on the screen with specified co-ordinates.Lets the agent interact with buttons, links, or form elements.
        send_keys: Types text into an element.Useful for filling out forms or entering text into search fields.Typically combined with click_screen to first focus an input box.
        scroll: Scrolls the page up or down.Needed for long pages or to reveal hidden elements.
        double_click: Double clicks on an element.Useful for clicking buttons or links that require confirmation.
        find_element: Finds an element and returns its bounding box.Useful for locating specific elements on the page.Useful when you want to click something but don’t know coordinates.
        double_click: Double clicks on an element.Useful for clicking buttons or links that require confirmation.Useful for text selection or triggering special UI actions.

    `,


    tools: [takeScreenShot, openBrowser, openURL, clickOnScreen, sendKeys, scroll, doubleClick, findElement],

  });

  
async function runAgentWithQuery(query = '') {
    try {
      await initializeBrowser();
      const result = await run(
          websiteAutomationAgent,
          query
      );
      console.log(result.finalOutput);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  runAgentWithQuery(`Open browser, go to https://ui.chaicode.com,
find signup button and click it,
take screenshot labeled signup,
then fill the form with:
First Name: Mayuresh,
Last Name: Mhatre,
Email: mayuresh.mhatre@gmail.com,
Password 123456,
Confirm Password 123456,
and click Create Account.`);
  