// src/backend/app.js
import express from 'express';
import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';
import { VideoWriter } from './video_writer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.on('finish', () => {
        if (res.statusCode === 404) {
            console.log(`\x1b[31m❌ [404 NOT FOUND] Browser failed to load: ${req.url}\x1b[0m`);
        }
    });
    next();
});

app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/static', express.static(path.join(__dirname, '../../static')));
app.use('/data', express.static(path.join(__dirname, '../../data')));

const server = app.listen(PORT, async () => {
    console.log(`📡 Local Asset Webserver mounted successfully at http://localhost:${PORT}`);
    
    try {
        console.log('🚀 Ignition: Launching Headless Chromium Animation Engine...');
        const browser = await puppeteer.launch({
            headless: true,
            args: [
                '--hide-scrollbars', '--mute-audio', '--disable-web-security',
                '--use-gl=desktop', '--enable-webgl', '--enable-accelerated-2d-canvas'
            ]
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 1 });

        // Initialize our video writer utility class pointing to the output path
        const outputVideoPath = path.join(__dirname, '../../output_journey.mp4');
        const writer = new VideoWriter(outputVideoPath, 24);
        writer.start();

        // 🧠 THE BRIDGE: Expose a function to the browser window to capture frames on command
        await page.exposeFunction('captureFrameSignal', async (status) => {
            if (status === 'RECORD_TICK') {
                // Take a high-speed raw screenshot buffer of the webpage canvas area
                const screenshotBuffer = await page.screenshot({ type: 'png', omitBackground: true });
                await writer.writeFrame(screenshotBuffer);
            } else if (status === 'COMPLETE') {
                await writer.stop();
                await browser.close();
                server.close();
                console.log("\n🎬 Rendering session closed safely. Enjoy your masterpiece!");
                process.exit(0);
            }
        });

        page.on('console', msg => console.log(`[BROWSER CONSOLE] ${msg.text()}`));

        // --- Add this into src/backend/app.js right next to your other page.on listeners ---
        page.on('request', request => {
            if (request.resourceType() === 'stylesheet') {
                console.log(`🎨 [BROWSER NET] Loading CSS Asset: ${request.url()}`);
            }
        });

        page.on('requestfailed', request => {
            console.log(`❌ [BROWSER NET FAILED] ${request.url()} | Error: ${request.failure().errorText}`);
        });

      // --- Inside src/backend/app.js ---
    console.log('🌍 Loading Map Engine Frontend Canvas Workspace...');
    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });

    // 🛠️ ADD THIS BLOCK IMMEDIATELY BELOW THE GOTO LINE:
    console.log('⏳ Holding engine for 3 seconds to let map tile textures stabilize fully...');
    await new Promise(resolve => setTimeout(resolve, 3000));

// This forces Puppeteer to sleep until Leaflet finishes pulling down map sectors, 
// completely eliminating the empty/partial gray frames at the start of your mp4 file.
        
    } catch (error) {
        console.error('💥 Critical Engine Startup Failure:', error);
        server.close();
    }
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ [PORT ERROR] Port ${PORT} is currently busy!`);
    }
    process.exit(1);
});