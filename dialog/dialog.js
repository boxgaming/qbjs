/**
 * class Dialog {
 * 
 * author: nemo
 *   date: 2017-06-20
 *      v: 1.1
 * }
 */
{
'use strict';

class Dialog {

    constructor(opt) {
        Object.assign(this.option = {
            caption: '',
            message: '',
            content: undefined,
            buttons: Dialog.buttons.NONE,

            resize: 'none',

            cancelable: true,

            showHeader: true,
            showClose: true,
            showFooter: false,

            // handler
            abortHandler: undefined,
            cancelHandler: () => { this.close(); },
            ignoreHandler: undefined,
            noHandler: undefined,
            okHandler: () => { this.close(); },
            retryHandler: undefined,
            yesHandler: undefined,

            // events
            beforeClosing: () => { return true; }, // set to false to prevent close
            closed: undefined,
        }, opt);
        this.init();
    }

    /**
     * START init
     */
    init() {
        return this
            .initLayout()
            .initAttributes()
            .initContent()
            .initEvents();
    }

    initLayout() {
        this.dialog = create('dialog', 'dialog');
        this.dialog.style.resize = this.option.resize,
        appendTo(this.dialog, document.body);
        this.show();

        this.container = this.dialog;
        
        this.header = create('header', 'header');
        this.caption = create('h3', 'caption');
        this.closeButton = create('em', 'close-button');

        this.body = create('div', 'body');
        this.content = create('section', 'content');
        this.buttonArea = create('div', 'button-area');

        this.footer = create('footer', 'footer');

        // assembly dom
        this.header.appendChild(this.caption);
        if (this.option.showClose)
            this.header.appendChild(this.closeButton);
        if (this.option.showHeader)
            this.dialog.appendChild(this.header);

        this.body.appendChild(this.content);
        this.body.appendChild(this.buttonArea);
        this.assemblyButtons();
        this.dialog.appendChild(this.body);

        if (this.option.showFooter)
            this.dialog.appendChild(this.footer);

        return this;
    }

    initAttributes() {
        this.dialog.wrapper = this;

        this.cancelable = this.option.cancelable;

        return this;
    }

    assemblyButtons() {
        switch (this.option.buttons) {
            case Dialog.buttons.ABORT_RETRY_IGNORE:
                new DialogButton(this, Dialog.button.ABORT).assembly();
                new DialogButton(this, Dialog.button.RETRY).assembly().focus();
                new DialogButton(this, Dialog.button.IGNORE).assembly();
                break;
            case Dialog.buttons.OK:
                new DialogButton(this, Dialog.button.OK).assembly().focus();
                break;
            case Dialog.buttons.OK_CANCEL:
                new DialogButton(this, Dialog.button.OK).assembly();
                new DialogButton(this, Dialog.button.CANCEL).assembly().focus();
                break;
            case Dialog.buttons.RETRY_CANCEL:
                new DialogButton(this, Dialog.button.RETRY).assembly().focus();
                new DialogButton(this, Dialog.button.CANCEL).assembly();
                break;
            case Dialog.buttons.YES_NO:
                new DialogButton(this, Dialog.button.YES).assembly();
                new DialogButton(this, Dialog.button.NO).assembly().focus();
                break;
            case Dialog.buttons.YES_NO_CANCEL:
                new DialogButton(this, Dialog.button.YES).assembly();
                new DialogButton(this, Dialog.button.NO).assembly();
                new DialogButton(this, Dialog.button.CANCEL).assembly().focus();
                break;
            default:
                // no button
                break;
        }

        return this;
    }

    appendButton(btn) {
        this.buttonArea.appendChild(btn.button);
        return this;
    }

    removeButton(btn) {
        this.buttonArea.removeChild(btn.button);
        return this;
    }

    initContent() {
        this.caption.innerText = this.option.caption;
        if (this.option.content == undefined) {
            this.content.innerText = this.option.message;
        } else {
            this.content.innerHTML = this.option.content;
        }

        return this;
    }

    initEvents() {
        this.closeButton.addEventListener('click', () => {
            this.close();
        });

        // prevent esc
        this.dialog.addEventListener('cancel', (e) => { 
            !this.cancelable && e.preventDefault();
        });

        return this;
    }
    /**
     * END init
     */

    //:~

    trigger(type) {
        switch (type) {
            case Dialog.button.ABORT:
                callHandler(this.option.abortHandler, this);
                break;
            case Dialog.button.CANCEL:
                callHandler(this.option.cancelHandler, this);
                break;
            case Dialog.button.IGNORE:
                callHandler(this.option.ignoreHandler, this);
                break;
            case Dialog.button.NO:
                callHandler(this.option.noHandler, this);
                break;
            case Dialog.button.OK:
                callHandler(this.option.okHandler, this);
                break;
            case Dialog.button.RETRY:
                callHandler(this.option.retryHandler, this);
                break;
            case Dialog.button.YES:
                callHandler(this.option.yesHandler, this);
                break;
            default:
                console.log(`Unknown type:${type}`);
                break;
        }

        return this;
    }

    beforeClosing(func) {
        this.option.beforeClosing = func;

        return this;
    }

    closed(func) {
        this.dialog.addEventListener('close', func);

        return this;
    }

    get cancelable() {
        return this.option.cancelable;
    }

    set cancelable(value) {
        this.option.cancelable = !!value;
    }

    show() {
        if (this.dialog.open)
            return this;

        try {
            this.dialog.showModal();
        } catch (e) {
            appendTo(this.dialog, document.body);
            this.dialog.showModal();
        }

        return this;
    }

    hide(dispose = true) {
        if (!this.dialog.open)
            return this;

        if (typeof this.option.beforeClosing != 'function' ||
            !!this.option.beforeClosing()) {
            this.dialog.close();

            try {
                dispose && document.body.removeChild(this.dialog);
            } finally { }
        } 

        return this;
    }

    close(dispose = true) {
        return this.hide(dispose);
    }

    addClass(className) {
        addClass(this.dialog, className);
    }

    //:~
    
    /**
     * START static helper
     */
    static alert(message, caption = '') {
        return new Dialog({
            caption: `${caption}`,
            message: `${message}`,
            buttons: Dialog.buttons.OK,
        });
    }

    static confirm(message, caption = '', ok, cancel) {
        return new Dialog({
            caption: `${caption}`,
            message: `${message}`,
            buttons: Dialog.buttons.OK_CANCEL,
            okHandler: ok,
            cancelHandler: cancel,
        });
    }

    static template(dom, caption = '') {
        return new Dialog({
            caption: `${caption}`,
            content: dom.innerHTML,
        });
    }

    static templet(dom, caption) {
        return template(dom, caption);
    }

    static iframe(src, caption = '', width = 'auto', height = 'auto') {
        let dlg = new Dialog({
            caption: `${caption}`,
            content: `<iframe style="border: none;" src="${src}"></iframe>`,
        });
        let iframe = dlg.content.childNodes[0];
        iframe.style.width = width;
        iframe.style.height = height;
    }
    /**
     * END static helper
     */
}

class DialogButton {
    constructor(dialog, type) {
        this.dialog = dialog;
        this.type = type;

        this.button = create('button', `btn-${type}`);
        this.button.type = 'button';
        this.button.innerText = Dialog.buttonText[type];

        this.click(() => {
            this.dialog.trigger(this.type);
        });
    }

    assembly() {
        this.dialog.appendButton(this);

        return this;
    }

    click(func) {
        this.button.addEventListener('click', func);

        return this;
    }

    focus() {
        window.setTimeout(() => {
            this.button.focus();
        }, 1);

        return this;
    }
}

Object.assign(Dialog, {

    buttons: {
        ABORT_RETRY_IGNORE: 1,
        OK: 2,
        OK_CANCEL: 3,
        RETRY_CANCEL: 4,
        YES_NO: 5,
        YES_NO_CANCEL: 6,
    },

    button: {
        NONE: 0,
        ABORT: 1,
        CANCEL: 2,
        IGNORE: 3,
        NO: 4,
        OK: 5,
        RETRY: 6,
        YES: 7,
    },

    buttonText: [
        undefined,
        'Abort',
        'Cancel',
        'Ignore',
        'NO',
        'OK',
        'Retry',
        'Yes',
    ],
});

let callHandler = (func, dlg) => {
    return typeof func == 'function' ?
        func(dlg) : undefined;
}

let cls = (cls) => {
    return `dlg-${cls}`;
}

let addClass = (dom, className) => {
    let c = dom.className;
    let add = cls(className);
    if (c == '') {
        return add;
    } else {
        return c + ' ' + add;
    }
}

let prependTo = (sub, base) => {
    if (base.hasChildNodes()) {
        base.insertBefore(sub, base.firstChild);
    } else {
        base.appendChild(sub);
    }
}

let appendTo = (sub, base) => {
    base.appendChild(sub);
}

let show = (dom, display = 'block') => {
    visible(dom, true, display);
}

let hide = (dom) => {
    visible(dom, true);
}

let visible = (dom, v, display) => {
    if (dom == undefined || dom.style == undefined)
        return;
    else
        dom.style.display = v ? display : 'none';
}

let create = (name, className) => {
    let e = document.createElement(name);
    if (typeof className == 'string')
        e.className = cls(className);
    return e;
}

// export { Dialog } // ES6
window['Dialog'] = Dialog;
}
