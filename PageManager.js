class PageManager {
    constructor(canvasId, inputId, activeRegionColor, inactiveRegionColor) {
        this._canvas = document.getElementById(canvasId);
        this._canvas.onmousemove = this.onCanvasHover;
        this._canvas.onmouseleave = this.uncolorActiveRegion;
        this._context = this._canvas.getContext('2d');
        this._fileInput = document.getElementById(inputId);
        this._fileInput.onchange = this.onUpload;
        this._transparency = 0;
        this._pixelMatrix = new PixelMatrix(this._transparency, 1);
        this._activeRegionColor = this._hexToRgb(activeRegionColor);
        this._inactiveRegionColor = this._hexToRgb(inactiveRegionColor);
        this._imageData = null;
        this._lastColoredRegion = [];
    }

    onUpload = (inputEvent) => {
        const file = inputEvent.target.files[0];
        const reader = new FileReader();
        const img = new Image();
	        
        reader.readAsDataURL(file);
        reader.onload = (readerEvent) => {
            if (readerEvent.target.readyState == FileReader.DONE) {
                img.src = readerEvent.target.result;
            }
        };
        img.onload = () => {
            this._context.drawImage(img, 0, 0);

            this._imageData = this._context.getImageData(0, 0, this._canvas.width, this._canvas.height);

            this._pixelMatrix.restoreRegions(this._imageData);
        };
    };

    onCanvasHover = (event) => {
        if (!this._activeRegionColor || !this._imageData) {
            return;
        }

        const coords = this._getCanvasCoords(event);
        const color = this._pixelMatrix.findColorAt(coords.x, coords.y);

        if (color === this._transparency) {
            return;
        }

        this.uncolorActiveRegion();

        const regionToColor = this._pixelMatrix.findRegionWithColor(color);

        for (let regionCoords of regionToColor) {
            const index = this._pixelIndex(regionCoords);

            this._imageData.data[index] = this._activeRegionColor.r;
            this._imageData.data[index + 1] = this._activeRegionColor.g;
            this._imageData.data[index + 2] = this._activeRegionColor.b;
            this._imageData.data[index + 3] = 255;
        }

        this._context.putImageData(this._imageData, 0, 0);

        this._lastColoredRegion = regionToColor;
    };

    uncolorActiveRegion = () => {
        for (let regionCoords of this._lastColoredRegion) {
            const index = this._pixelIndex(regionCoords);

            this._imageData.data[index] = this._inactiveRegionColor.r;
            this._imageData.data[index + 1] = this._inactiveRegionColor.g;
            this._imageData.data[index + 2] = this._inactiveRegionColor.b;
            this._imageData.data[index + 3] = 255;
        }

        this._context.putImageData(this._imageData, 0, 0);
    };

    _getCanvasCoords(event) {
        const rect = this._canvas.getBoundingClientRect();

        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    _pixelIndex(coords) {
        return 4 * (coords.x + coords.y * this._canvas.width);
    }

    // https://stackoverflow.com/a/5624139/2385132
    _hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        
        hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
}
