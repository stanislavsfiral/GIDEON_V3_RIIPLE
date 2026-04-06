// Логика перекачки пикселей в воксели
function applyFrameToGideon(videoElement, geometry, pointCount) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 1024; // Разрешение для выборки
    canvas.height = 1024;

    ctx.drawImage(videoElement, 0, 0, 1024, 1024);
    const pixels = ctx.getImageData(0, 0, 1024, 1024).data;
    const colors = geometry.attributes.color.array;

    for (let i = 0; i < pointCount; i++) {
        // Упрощенная адресация: индекс вокселя i связан с пикселем
        let pIdx = (i % (1024 * 1024)) * 4;
        colors[i * 3]     = pixels[pIdx] / 255;     // R
        colors[i * 3 + 1] = pixels[pIdx + 1] / 255; // G
        colors[i * 3 + 2] = pixels[pIdx + 2] / 255; // B
    }
    geometry.attributes.color.needsUpdate = true;
}
