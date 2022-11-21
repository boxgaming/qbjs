Export Render

IncludeJS "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.0.0/caman.full.min.js"

Sub Render(opts)
$If Javascript Then
    Caman("#gx-canvas", function() {
        if (opts.brightness) { this.brightness(opts.brightness); }
        if (opts.contrast) { this.contrast(opts.contrast); }
        if (opts.saturation) { this.saturation(opts.saturation); }
        if (opts.vibrance) { this.vibrance(opts.vibrance); }
        if (opts.exposure) { this.exposure(opts.exposure); }
        if (opts.hue) { this.hue(opts.hue); }
        if (opts.sepia) { this.sepia(opts.sepia); }
        if (opts.gamma) { this.gamma(opts.gamma); }
        if (opts.noise) { this.noise(opts.noise); }
        if (opts.clip) { this.clip(opts.clip); }
        if (opts.sharpen) { this.sharpen(opts.sharpen); }
        if (opts.blur) { this.stackBlur(opts.blur); }
        this.render();
    });
$End If
End Sub