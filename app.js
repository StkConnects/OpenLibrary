const powerButton = document.querySelector("#power-button");
const powerLabel = document.querySelector("#power-label");
const previewButton = document.querySelector("#preview-button");

const mainInterface = document.querySelector("#main-interface");
const secondaryInterface = document.querySelector("#secondary-interface");
const interfaceHeading = document.querySelector("#interface-heading");

const throttle = document.querySelector("#throttle");
const steering = document.querySelector("#steering");
const throttleValue = document.querySelector("#throttle-value");
const steeringValue = document.querySelector("#steering-value");

const liftButton = document.querySelector("#lift-button");
const liftLabel = document.querySelector("#lift-label");
const liftSlider = document.querySelector("#lift-slider");
const liftValue = document.querySelector("#lift-value");

const joystick = document.querySelector("#joystick");
const joystickKnob = document.querySelector("#joystick-knob");
const joystickValue = document.querySelector("#joystick-value");

const stopButton = document.querySelector("#stop-button");
const notice = document.querySelector("#control-notice");

let isPowered = false;
let isLiftOn = false;
let isSecondary = false;
let isDragging = false;
let activePointerId = null;

function updateMovementValues() {
    throttleValue.textContent = `${throttle.value}%`;
    steeringValue.textContent = `${steering.value}°`;
}

function updateNotice() {
    if (!isPowered) {
        notice.textContent = "Preview off — no device connected.";
        return;
    }

    const lift = isSecondary
        ? `${liftSlider.value}%`
        : (isLiftOn ? "100%" : "OFF");

    notice.textContent =
        `Preview only — Thrust ${throttle.value}%, ` +
        `Direction ${steering.value}°, Lift ${lift}. No device connected.`;
}

function resetJoystickPosition() {
    joystickKnob.style.left = "50%";
    joystickKnob.style.top = "50%";
    joystickValue.textContent = "0%, 0°";
}

function resetMovement() {
    isDragging = false;
    activePointerId = null;

    throttle.value = 0;
    steering.value = 0;

    resetJoystickPosition();
    updateMovementValues();
}

function setLiftButton(enabled) {
    isLiftOn = enabled;
    liftButton.setAttribute("aria-pressed", String(enabled));
    liftLabel.textContent = enabled ? "Lift 100%" : "Lift OFF";
}

function setPower(enabled) {
    isPowered = enabled;

    powerButton.setAttribute("aria-pressed", String(enabled));
    powerLabel.textContent = enabled ? "Shutdown" : "Start";

    throttle.disabled = !enabled;
    steering.disabled = !enabled;
    liftButton.disabled = !enabled;
    liftSlider.disabled = !enabled;

    if (!enabled) {
        resetMovement();
        setLiftButton(false);
        liftSlider.value = 0;
    }

    updateNotice();
}

powerButton.addEventListener("click", () => {
    setPower(!isPowered);
});

previewButton.addEventListener("click", () => {
    isSecondary = !isSecondary;

    mainInterface.hidden = isSecondary;
    secondaryInterface.hidden = !isSecondary;

    interfaceHeading.textContent = isSecondary
        ? "CONTROLLER INTERFACE / SECONDARY"
        : "CONTROLLER INTERFACE / MAIN";

    resetMovement();
    updateNotice();
});

throttle.addEventListener("input", () => {
    updateMovementValues();
    updateNotice();
});

steering.addEventListener("input", () => {
    updateMovementValues();
    updateNotice();
});

liftButton.addEventListener("click", () => {
    if (!isPowered) return;

    setLiftButton(!isLiftOn);
    updateNotice();
});

liftSlider.addEventListener("input", () => {
    liftValue.textContent = `${liftSlider.value}%`;
    updateNotice();
});

function moveJoystick(event) {
    if (
        !isDragging ||
        !isPowered ||
        !isSecondary ||
        event.pointerId !== activePointerId
    ) {
        return;
    }

    const bounds = joystick.getBoundingClientRect();
    const knobRadius = joystickKnob.offsetWidth / 2;

    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;

    const maxX = Math.max(1, bounds.width / 2 - knobRadius);
    const maxY = Math.max(1, bounds.height / 2 - knobRadius);

    let x = event.clientX - centerX;
    let y = event.clientY - centerY;

    const normalizedDistance = Math.hypot(x / maxX, y / maxY);

    if (normalizedDistance > 1) {
        x /= normalizedDistance;
        y /= normalizedDistance;
    }

    const boundedX = Math.max(-maxX, Math.min(maxX, x));
    const boundedY = Math.max(-maxY, Math.min(maxY, y));

    joystickKnob.style.left =
        `${50 + (boundedX / bounds.width) * 100}%`;

    joystickKnob.style.top =
        `${50 + (boundedY / bounds.height) * 100}%`;

    const direction = Math.round((boundedX / maxX) * 45);
    const speed = Math.round(
        Math.min(1, Math.hypot(boundedX / maxX, boundedY / maxY)) * 100
    );

    throttle.value = speed;
    steering.value = direction;

    updateMovementValues();
    joystickValue.textContent = `${speed}%, ${direction}°`;
    updateNotice();
}

joystick.addEventListener("pointerdown", (event) => {
    if (!isPowered || !isSecondary || isDragging) return;

    isDragging = true;
    activePointerId = event.pointerId;

    joystick.setPointerCapture(event.pointerId);
    moveJoystick(event);
});

joystick.addEventListener("pointermove", moveJoystick);

function releaseJoystick(event) {
    if (!isDragging) return;

    if (
        event &&
        activePointerId !== null &&
        event.pointerId !== activePointerId
    ) {
        return;
    }

    isDragging = false;
    activePointerId = null;

    throttle.value = 0;
    steering.value = 0;

    resetJoystickPosition();
    updateMovementValues();
    updateNotice();
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
joystick.addEventListener("lostpointercapture", releaseJoystick);

stopButton.addEventListener("click", () => {
    resetMovement();
    setLiftButton(false);
    liftSlider.value = 0;
    liftValue.textContent = "0%";

    notice.textContent =
        "Preview controls reset — no device commands were sent.";
});

liftValue.textContent = `${liftSlider.value}%`;
updateMovementValues();
setPower(false);
