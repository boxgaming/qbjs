'use strict';
/**
 * Polyfill of dialog
 * for Firefox
 *
 * author Nemo
 *
 * v1.1
 * Supports:
 * show
 * hide
 * showModal
 * cancel(ESC)
 */
{

const UA = window.navigator.userAgent;
const browser = {
    isFirefox: UA.includes('Firefox'),
};

const dlg = document.createElement('dialog');
let mask = undefined;

const initMask = () => {
    if (mask != undefined)
        return;

    mask = document.createElement('div');
    mask.style.display = 'none';
    mask.style.position = 'absolute';
    mask.style.zIndex = 999998;
    mask.style.top = 0;
    mask.style.left = 0;
    mask.style.right = 0;
    mask.style.bottom = 0;
    mask.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
    document.body.appendChild(mask);
};

// show support
if (!dlg.__proto__.show) {
    dlg.__proto__.open = false;

    dlg.__proto__.show = function() {
        this.open = true;

        this.style.backgroundColor = 'white';
        this.style.position = 'absolute';
        this.style.zIndex = 999999;
        this.style.display = 'table';
        this.style.top = '50%';
        this.style.transform = 'translate(0, -50%)';

        return this;
    };    
}

// showModal support
if (!dlg.__proto__.showModal) {
    initMask();

    dlg.__proto__.showModal = function() {
        mask.style.display = 'block';
        this.show();

        return this;
    };    
}

// hide support
if (!dlg.__proto__.close) {
    initMask();

    dlg.__proto__.close = function() {
        this.open = false;

        mask.style.display = 'none';
        this.style.display = 'none';

        return this;
    }
}

// cancel(ESC) support
if (dlg.oncancel === void 0) {
    const dialogClass = 'dlg-dialog';
    document.addEventListener('keypress', (e) => {
        if (e.code !== 'Escape')
            return;

        let dlgs = document.querySelectorAll(`.${dialogClass}`);
        for (let i = 0; i < dlgs.length; i++) {
            let d = dlgs[i];
            if (d.style.display === 'none')
                continue;

            if (d.wrapper.cancelable) {
                d.close();
            }
        }
    });
}

}
