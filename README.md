# Cinematic Road Trip Mapper

## Overview

The Cinematic Road Trip Mapper is a web-based toolchain that compiles raw geographic milestones into a high-fidelity, animated driving itinerary video. By running a headless browser automation pipeline, it tracks a vehicle's motion across a customized map canvas, mounts dynamic photo gallery interfaces during key route intervals, and renders the entire output into a compressed video package.

## Features

* **Automation Video Compilation:** Automatically generates a high-quality `.mp4` video capturing the complete map tour.
* **Open-Source Map Canvas:** Uses Leaflet.js to map paths and calculate real-time vehicle orientation angles entirely credential-free.
* **Asynchronous Timeline Layering:** Drives asset generation at precise route midpoint intervals via a dual-layered coordinate tracking loop.
* **Headless Capture Pipeline:** Utilizes Puppeteer to execute frame-by-frame canvas capture synchronized with an asset deployment timeline.

## Requirements

### System Core Tools
* **Node.js** (v18.0.0 or higher recommended)
* **Python 3.x** (Required for timeline pre-processing)
* **FFmpeg** (Must be accessible via your system's global environment PATH)

### FFmpeg Quick Setup
* **macOS:** `brew install ffmpeg`
* **Linux:** `sudo apt install ffmpeg`
* **Windows:** `winget install Gyan.FFmpeg`

## Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/SumitVijay/RoadTripMapperJS.git](https://github.com/SumitVijay/RoadTripMapperJS.git)
   cd RoadTripMapperJS