// ============================================
// 🖼️ Sprite Cropping Helper Functions
// ============================================

/**
 * Renders an item with proper sprite cropping
 * @param {Object} item - Item object with name, image, sprite properties
 * @param {number} containerSize - Size of the container (default: 96)
 * @returns {string} HTML string for the item
 */
function renderItemWithSprite(item, containerSize = 96) {
    if (!item) return '';
    
    let imgTag = '';
    const imgBoxStyle = `
        width: ${containerSize}px; 
        height: ${containerSize}px; 
        border-radius: 12px; 
        background: var(--bg-tertiary); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        margin: 0 auto 16px auto; 
        box-shadow: 0 2px 12px 0 rgba(0,0,0,0.10); 
        overflow: hidden; 
        position: relative;
    `;
    
    if (item.image) {
        if (item.sprite && item.sprite.x !== undefined && item.sprite.y !== undefined) {
            // ✅ Proper sprite cropping
            const sprite = item.sprite;
            
            // Calculate scale to fit sprite in container
            const scale = Math.min(containerSize / sprite.w, containerSize / sprite.h);
            
            // Calculate the final dimensions
            const finalWidth = sprite.w * scale;
            const finalHeight = sprite.h * scale;
            
            // Center the sprite in the container
            const offsetX = (containerSize - finalWidth) / 2;
            const offsetY = (containerSize - finalHeight) / 2;
            
            imgTag = `
                <div style="${imgBoxStyle}">
                    <div style="
                        position: relative;
                        width: ${containerSize}px;
                        height: ${containerSize}px;
                        overflow: hidden;
                    ">
                        <img 
                            src="${item.image}" 
                            alt="${item.name}"
                            style="
                                position: absolute;
                                left: ${offsetX}px;
                                top: ${offsetY}px;
                                width: ${finalWidth}px;
                                height: ${finalHeight}px;
                                transform: translate(-${sprite.x}px, -${sprite.y}px);
                                transform-origin: top left;
                                object-fit: none;
                                image-rendering: pixelated;
                                border-radius: 0;
                            "
                            onerror="this.style.opacity='0.3'; this.parentElement.parentElement.style.background='var(--bg-tertiary)';"
                        />
                    </div>
                </div>
            `;
        } else {
            // No sprite data - use contain
            imgTag = `
                <div style="${imgBoxStyle}">
                    <img 
                        src="${item.image}" 
                        alt="${item.name}"
                        style="
                            width: 100%;
                            height: 100%;
                            object-fit: contain;
                            padding: 4px;
                        "
                        onerror="this.style.opacity='0.3';"
                    />
                </div>
            `;
        }
    } else {
        // No image - show icon
        imgTag = `
            <div style="${imgBoxStyle}">
                <i data-lucide="package" style="width: 48px; height: 48px; color: var(--text-secondary);"></i>
            </div>
        `;
    }
    
    return imgTag;
}

/**
 * Alternative simpler sprite cropping using CSS background
 * @param {Object} item - Item object
 * @param {number} containerSize - Container size
 * @returns {string} HTML string
 */
function renderItemWithSpriteCSS(item, containerSize = 96) {
    if (!item || !item.image) return '';
    
    if (!item.sprite) {
        // No sprite - regular image
        return `
            <div style="
                width: ${containerSize}px; 
                height: ${containerSize}px; 
                border-radius: 12px; 
                background: var(--bg-tertiary); 
                display: flex; 
                align-items: center; 
                justify-content: center;
            ">
                <img 
                    src="${item.image}" 
                    alt="${item.name}"
                    style="
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        padding: 4px;
                    "
                />
            </div>
        `;
    }
    
    const sprite = item.sprite;
    const scale = Math.min(containerSize / sprite.w, containerSize / sprite.h);
    
    return `
        <div style="
            width: ${containerSize}px; 
            height: ${containerSize}px; 
            border-radius: 12px; 
            background: var(--bg-tertiary); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            overflow: hidden;
            position: relative;
        ">
            <div style="
                width: ${sprite.w * scale}px;
                height: ${sprite.h * scale}px;
                background-image: url('${item.image}');
                background-position: -${sprite.x}px -${sprite.y}px;
                background-size: 1024px 1024px;
                background-repeat: no-repeat;
                image-rendering: pixelated;
                transform: scale(${scale});
                transform-origin: top left;
            "></div>
        </div>
    `;
}

// ============================================
// 🎯 Usage Examples
// ============================================

/*
// Example 1: Using transform method (recommended)
const itemHTML = renderItemWithSprite({
    name: "Godhuman",
    image: "https://assetdelivery.roblox.com/v1/asset/?id=131065686000839",
    sprite: {
        x: 153,
        y: 1,
        w: 150,
        h: 150
    }
});

// Example 2: Using CSS background method
const itemHTML2 = renderItemWithSpriteCSS({
    name: "Skull Guitar", 
    image: "https://assetdelivery.roblox.com/v1/asset/?id=91906971333513",
    sprite: {
        x: 457,
        y: 609,
        w: 150,
        h: 150
    }
});

// Example 3: Item without sprite
const itemHTML3 = renderItemWithSprite({
    name: "Simple Item",
    image: "https://example.com/image.png"
    // no sprite property
});
*/

// ============================================
// 🔧 Integration Helper
// ============================================

/**
 * Update your existing renderItemMonitor function
 */
function updateRenderItemMonitor() {
    // Replace your existing item rendering logic with:
    
    const allItems = Object.values(itemCounts);
    
    const itemsHTML = allItems.map(item => {
        const itemDiv = renderItemWithSprite(item, 96);
        
        return `
            <div class="item-card"
                 style="position: relative;
                         background: var(--bg-secondary);
                         border-radius: 16px;
                         border: 1.5px solid var(--border-color);
                         padding: 20px 18px 16px 18px;
                         min-width: 160px;
                         max-width: 180px;
                         flex: 1 0 160px;
                         box-shadow: 0 4px 24px 0 rgba(0,0,0,0.08);
                         display: flex;
                         flex-direction: column;
                         align-items: center;
                         transition: box-shadow 0.2s, transform 0.2s;
                         cursor: pointer;"
                 onmouseover="this.style.transform='translateY(-6px) scale(1.03)'; this.style.boxShadow='0 12px 32px 0 rgba(59,130,246,0.10)';"
                 onmouseout="this.style.transform=''; this.style.boxShadow='0 4px 24px 0 rgba(0,0,0,0.08)';"
                 title="${item.owners.join(', ')}">
                
                <!-- Badge -->
                <div style="position: absolute;
                            top: 12px;
                            right: 12px;
                            background: rgba(255, 0, 0, 0.18);
                            color: #ffffffff;
                            padding: 4px 10px;
                            border-radius: 8px;
                            font-size: 12px;
                            font-weight: 700;
                            display: flex;
                            align-items: center;
                            gap: 4px;
                            box-shadow: 0 2px 8px 0 rgba(59,130,246,0.08);">
                    <span style="font-size: 15px;">x</span>
                    <span>${item.count}</span>
                </div>
                
                <!-- Item Image with Sprite Cropping -->
                ${itemDiv}
                
                <!-- Item Info -->
                <div style="font-size: 16px;
                            font-weight: 700;
                            color: var(--text-primary);
                            white-space: nowrap;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            width: 100%;
                            margin-bottom: 6px;
                            text-align: center;"
                     title="${item.name}">
                    ${item.name}
                </div>
                <div style="font-size: 12px;
                            color: var(--text-secondary);
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                            text-align: center;">
                    ${item.category}
                </div>
            </div>
        `;
    }).join('');
    
    // Update your itemList.innerHTML
    const itemList = document.getElementById('itemList');
    if (itemList) {
        itemList.innerHTML = `
            <div style="display: flex; flex-wrap: wrap; gap: 24px; justify-content: flex-start; align-items: stretch;">
                ${itemsHTML}
            </div>
        `;
    }
    
    // Create Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

console.log('🎯 Sprite Cropping Helper Loaded! Use renderItemWithSprite() or renderItemWithSpriteCSS()');
