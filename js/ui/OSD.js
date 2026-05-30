export function showOSD(title, value, icon) {
    let container = document.getElementById('osd-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'osd-container';
        container.className = 'osd-container';
        document.body.appendChild(container);
    }

    const osd = document.createElement('div');
    osd.className = 'osd-toast';
    
    let iconHtml = '';
    if (icon) {
        iconHtml = `<div class="osd-icon">${icon}</div>`;
    }

    osd.innerHTML = `
        ${iconHtml}
        <div class="osd-content">
            <div class="osd-title">${title}</div>
            <div class="osd-value">${value}</div>
        </div>
    `;

    container.appendChild(osd);

    // Trigger animation
    requestAnimationFrame(() => {
        osd.classList.add('show');
    });

    setTimeout(() => {
        osd.classList.remove('show');
        setTimeout(() => {
            if (osd.parentNode === container) {
                container.removeChild(osd);
            }
        }, 300); // Wait for transition
    }, 2000);
}
