import { isTouchSupported, MultiTouchListener, KeyboardHandler } from './io.js';
import { getHeight, getWidth, GuiLabel, RollingVerticalLayout } from './gui.js';
import { clamp, FixedSizeQueue } from './utils.js';
import { menu_font_size } from './game_utils.js';
const keyboardHandler = new KeyboardHandler();
async function main() {
    const canvas = document.getElementById("screen");
    const multi_touch_listener = new MultiTouchListener(canvas, true, true, false);
    const gui = new RollingVerticalLayout([getWidth(), getHeight()], Math.floor(getHeight() / new GuiLabel(``, 100, 24).height()));
    const pinch = new RollingVerticalLayout([getWidth(), getHeight()], gui.stack.data.length, 0, getHeight());
    multi_touch_listener.registerCallBack("tap", (e) => {
        const text = `tap time:${Date.now() - e.startTouchTime}`;
        gui.addElement(new GuiLabel(text, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("touchmove", (e) => {
        const text = `move: dx:${e.deltaX}, dy: ${e.deltaY}`;
        pinch.addElement(new GuiLabel(text, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("doubletap", e => {
        gui.addElement(new GuiLabel(`double tap time:${Date.now() - e.startTouchTime}, time between:${e.timeSinceLastTouch}`, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("longpress", e => {
        gui.addElement(new GuiLabel(`long press time:${Date.now() - e.startTouchTime}`, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("swipe", e => {
        gui.addElement(new GuiLabel(`swipe direction:${e.swipe_direction}`, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("rotate", e => {
        gui.addElement(new GuiLabel(`rotation theta:${e.rotation_theta}, delta:${e.rotation_delta}`, gui.height(), 24));
    });
    multi_touch_listener.registerCallBack("pinch", (event) => {
        pinch.addElement(new GuiLabel(`pinch delta:${event.delta}`, gui.height(), 24));
    });
    canvas.onmousemove = (event) => {
    };
    canvas.addEventListener("wheel", (e) => {
        if (e.deltaY > 10000)
            return;
        const normalized_delta = (clamp(e.deltaY + 1, -getHeight(), getHeight())) / getHeight();
        //e.preventDefault();
    }, { passive: true });
    if (!('TouchEvent' in window))
        console.log("touch events not supported");
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
    }, { passive: false });
    canvas.width = getWidth();
    canvas.height = getHeight();
    canvas.style.cursor = "pointer";
    let counter = 0;
    const touchScreen = isTouchSupported();
    multi_touch_listener.registerCallBackPredicate("pinch", () => true, (event) => {
        const normalized_delta = event.delta / Math.max(getHeight(), getWidth()) * 2;
        event.preventDefault();
    });
    let height = getHeight();
    let width = getWidth();
    let fps_text_width = 0;
    let render_fps = false;
    let low_fps = true;
    let draw = false;
    keyboardHandler.registerCallBack("keydown", () => true, (event) => {
        if (!keyboardHandler.keysHeld["MetaLeft"] && !keyboardHandler.keysHeld["ControlLeft"] &&
            !keyboardHandler.keysHeld["MetaRight"] && !keyboardHandler.keysHeld["ControlRight"])
            event.preventDefault();
        switch (event.code) {
            case ("ArrowUp"):
                break;
            case ("ArrowDown"):
                break;
            case ("ArrowLeft"):
                break;
            case ("ArrowRight"):
                break;
            case ("KeyF"):
                render_fps = !render_fps;
                break;
        }
    });
    let maybectx = canvas.getContext("2d");
    if (!maybectx)
        return;
    const ctx = maybectx;
    let start = Date.now();
    let dt = 1;
    let frame_count = 0;
    let instantaneous_fps = 0;
    const time_queue = new FixedSizeQueue(60 * 2);
    const drawLoop = () => {
        frame_count++;
        //do stuff and render here
        if (getWidth() !== width || getHeight() !== height) {
            width = getWidth();
            height = getHeight();
            canvas.width = width;
            canvas.height = height;
        }
        dt = Date.now() - start;
        time_queue.push(dt);
        start = Date.now();
        let sum = 0;
        let highest = 0;
        for (let i = 0; i < time_queue.length; i++) {
            const value = time_queue.get(i);
            sum += value;
            if (highest < value) {
                highest = value;
            }
        }
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        gui.draw(ctx);
        pinch.draw(ctx);
        if (frame_count % 10 === 0)
            instantaneous_fps = Math.floor(1000 / (low_fps ? highest : dt));
        let text = "";
        ctx.fillStyle = "#FFFFFF";
        text = `avg fps: ${Math.floor(1000 * time_queue.length / sum)}, ${low_fps ? "low" : "ins"} fps: ${instantaneous_fps}`;
        fps_text_width = ctx.measureText(text).width;
        //if(render_fps)
        {
            ctx.strokeText(text, width - fps_text_width - 10, menu_font_size());
            ctx.fillText(text, width - fps_text_width - 10, menu_font_size());
        }
        const touches = multi_touch_listener.previous_touches;
        if (touches.length > 1) {
            const sx = (touches[0].clientX); // + touches[1].clientX) / 2;
            const sy = (touches[0].clientY); // + touches[1].clientY) / 2;
            const ex = sx + Math.cos(multi_touch_listener.rotation_theta) * 900;
            const ey = sy + Math.sin(multi_touch_listener.rotation_theta) * 900;
            ctx.lineWidth = 30;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(ex, ey);
            ctx.stroke();
            ctx.lineWidth = 2;
        }
        requestAnimationFrame(drawLoop);
    };
    drawLoop();
}
main();
