Export Render

IncludeJS "https://cdnjs.cloudflare.com/ajax/libs/camanjs/4.0.0/caman.full.min.js"

Dim lastOpts As Object

Sub Render(opts, imageId)
$If Javascript Then
    var complete = false;
    if (imageId == undefined) { imageId = 0; }
    Caman(QB.getImage(imageId), function() {
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
        lastOpts = opts;
        complete = true;
    });
    while (!complete) { await GX.sleep(10); }
$End If
End Sub