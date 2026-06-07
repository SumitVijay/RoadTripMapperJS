/**
 * Cinematic Road Trip Mapper - UI Asset Subsystem
 * File: src/frontend/ui_manager.js
 */

/**
 * Instantiates a fresh editorial photo card asset into the DOM tree
 * and configures its frame-based lifecycle markers.
 * * @param {HTMLElement} containerElement - The DOM container (#ui-layer) where the card mounts.
 * @param {Array} photoGroup - Array of image objects containing filepaths and metadata.
 * @param {number} layoutStyleIdx - Index used to alternate CSS placement classes.
 * @param {number} currentTick - The current master frame count from index.html.
 */
export function displayPhotoCard(containerElement, photoGroup, layoutStyleIdx, currentTick = 0, framesLeft) {
    // 1. Create base container card element
    const card = document.createElement('div');
    card.className = 'photo-card';

    // 2. 🔄 UPDATED POSITIONAL MARKERS: Alternating layouts across the 3 remaining corners
    // Slot 0 (Leg 1) -> Top-Right
    // Slot 1 (Leg 2) -> Bottom-Left  
    // Slot 2 (Leg 3) -> Top-Left
    // Slot 3 (Leg 4) -> Bottom-Right     
    const positionClasses = ['pos-top-right', 'pos-bottom-left', 'pos-top-left', 'pos-bottom-right'];
    card.classList.add(positionClasses[layoutStyleIdx] || 'pos-top-right');


    // 3. Frame photo grid layouts safely based on total available images
    const photoCount = Math.min(photoGroup.length, 3);
    const grid = document.createElement('div');
    grid.className = `gallery-grid grid-${photoCount}`;

    if (photoCount === 1) {
        grid.innerHTML = `<img src="/${photoGroup[0].filepath}" class="gallery-img" />`;
    } else if (photoCount === 2) {
        grid.innerHTML = `
            <img src="/${photoGroup[0].filepath}" class="gallery-img" />
            <img src="/${photoGroup[1].filepath}" class="gallery-img" />
        `;
    } else if (photoCount >= 3) {
        grid.innerHTML = `
            <img src="/${photoGroup[0].filepath}" class="gallery-img main-photo" />
            <img src="/${photoGroup[1].filepath}" class="gallery-img sub-photo" />
            <img src="/${photoGroup[2].filepath}" class="gallery-img sub-photo" />
        `;
    }

    // 4. Append structural title editorial components
    const meta = document.createElement('div');
    meta.className = 'metadata-panel';
    meta.innerHTML = `
        <h2 class="town-title">${photoGroup[0].location_name}</h2>
        <div class="date-label">${photoGroup[0].timestamp.split(' ')[0]}</div>
    `;

    card.appendChild(grid);
    card.appendChild(meta);
    
    containerElement.appendChild(card);

    // 5. Force immediate hardware reflow so browser registers opacity: 0 state before transition
    void card.offsetHeight; 
    card.classList.add('active');

    // 🔑 6. THE DETERMINISTIC FIXED OVERLAP POINTERS
    // We use the custom calculated framesLeft instead of a hardcoded 75 frames!
    const FADE_OUT_DURATION = 12; // 12 frames to execute CSS opacity fade (~500ms)

    // Fallback protection: ensure the card lives for at least 80 ticks on tiny segments
    const dynamicLifespan = Math.max(80, framesLeft); 

    // The card stays fully active for the leg, then fades out right as the car finishes the leg
    card.dataset.fadeFrame = currentTick + (dynamicLifespan - FADE_OUT_DURATION);
    card.dataset.removeFrame = currentTick + dynamicLifespan;

    console.log(`[UI MASTER] 🎫 Card stamped. Spawn: ${currentTick} | Fade Target: ${card.dataset.fadeFrame} | Die Target: ${card.dataset.removeFrame}`);

    return card;
    return card; 
}

/**
 * Legacy cleanup fallback. 
 * (Maintained for backwards compatibility; loops natively handle garbage collection via dataset targets)
 */
export function clearPhotoCard(containerElement) {
    const activeCards = containerElement.querySelectorAll('.photo-card:not(.fading-out)');
    activeCards.forEach(card => {
        card.classList.add('fading-out');
        card.remove();
    });
}