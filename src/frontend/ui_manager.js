/**
 * UI Manager Subsystem - Handles clean HTML node creation for the photo timeline deck
 * All visual attributes are strictly controlled via src/frontend/styles.css
 */

/**
 * Dynamically mounts and transitions a group of photos onto the map viewport layout canvas
 * @param {HTMLElement} containerElement - The canvas UI element wrapper holding layout overlays
 * @param {Array} photoGroup - Array of photo objects belonging to the current stop cluster leg
 * @param {Number} layoutStyleIdx - Index defining spatial corner anchor assignments (0, 1, or 2)
 * @returns {HTMLElement} The mounted card element reference for state retention tracking
 */
export function displayPhotoCard(containerElement, photoGroup, layoutStyleIdx) {
    // 1. Create base container card element
    const card = document.createElement('div');
    card.className = 'photo-card';

    // 2. Map positional markers using the alternating classes defined in styles.css
    const positionClasses = ['pos-top-right', 'pos-top-left', 'pos-bottom-right'];
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
    //

    // 5. ⏳ A synchronous micro-delay to separate mounting from layout calculations.
    // This allows the browser to capture opacity: 0 first, then trigger the smooth 900ms transition up to 1.
    setTimeout(() => {
         card.classList.add('active');
     }, 50);

    return card; 
}

/**
 * Triggers an immediate slide transition fade fallback when old assets step down
 */
export function clearPhotoCard(containerElement) {
    const activeCards = containerElement.querySelectorAll('.photo-card:not(.fading-out)');
    activeCards.forEach(card => {
        card.classList.add('fading-out');
        setTimeout(() => card.remove(), 900);
    });
}