// src/backend/video_writer.js
import { spawn } from 'child_process';
import path from 'path';

export class VideoWriter {
    constructor(outputPath, fps = 24) {
        this.outputPath = outputPath;
        this.fps = fps;
        this.ffmpegProcess = null;
    }

    /**
     * Spawns a native background FFMPEG encoding pipeline instance
     */
    start() {
        console.log(`🎬 Initializing FFMPEG encoder targeting output: ${this.outputPath}`);

        // Direct command line encoding arguments for high-quality portrait mp4 compilation
        const args = [
            '-y',                          // Overwrite existing file without asking
            '-f', 'image2pipe',            // Read input from a standard RAM pipe stream
            '-vcodec', 'png',              // Input format from Puppeteer screenshots
            '-r', `${this.fps}`,           // Input target framework frame-rate
            '-i', '-',                     // Read input directly from stdin (standard input pipe)
            '-vcodec', 'libx264',          // Encode output utilizing H.264 video standard
            '-pix_fmt', 'yuv420p',         // Set color space profiles matching mobile compatibility
            '-preset', 'ultrafast',        // Ultra fast frame assembly algorithm tuning profile
            '-b:v', '4000k',               // Target visual clarity bitrate profile
            this.outputPath
        ];

        this.ffmpegProcess = spawn('ffmpeg', args);

        // Bind error catching listeners to prevent silent recording failures
        this.ffmpegProcess.stderr.on('data', (data) => {
            // Uncomment this line if you need to debug raw FFMPEG processing outputs
            // console.log(`[FFMPEG DEBUG] ${data.toString()}`);
        });

        this.ffmpegProcess.on('close', (code) => {
            console.log(`🏁 FFMPEG rendering pipe closed cleanly with status code: ${code}`);
        });
    }

    /**
     * Pushes a raw PNG frame buffer directly into the encoder
     */
    async writeFrame(buffer) {
        if (!this.ffmpegProcess || !this.ffmpegProcess.stdin.writable) {
            throw new Error("❌ Attempted to write frame buffer to an uninitialized or dead FFMPEG stream.");
        }
        return new Promise((resolve) => {
            this.ffmpegProcess.stdin.write(buffer, () => {
                resolve();
            });
        });
    }

    /**
     * Closes the stream and seals the MP4 file safely
     */
    async stop() {
        return new Promise((resolve) => {
            if (this.ffmpegProcess) {
                console.log("💾 Finalizing video container track layouts and writing header sectors...");
                this.ffmpegProcess.stdin.end(); // Closing the pipe tells FFMPEG the video is done
                this.ffmpegProcess.on('exit', () => {
                    console.log("🎉 SUCCESS: Video processing complete!");
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}