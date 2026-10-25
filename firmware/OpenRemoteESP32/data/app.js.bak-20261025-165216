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

const connectionStatus = document.querySelector("#connection-status");
const stopButton = document.querySelector("#stop-button");
const notice = document.querySelector("#control-notice");

let isPowered = false;
let isConnected = false;
let isConnecting = false;

function handleConnectionStatus(status) {
    connectionStatus.textContent = status;
    isConnected = status.startsWith("Connected");
    isConnecting = status === "Connecting";

    if (isConnected) {
        setPower(true);
    } else if (!isConnecting && isPowered) {
        setPower(false);
    }
}

function handleConnectionMessage(message) {
    if (message.type === "status" && message.connected) {
        connectionStatus.textContent =
            message.simulated ? "Connected (Simulator)" : "Connected";
    }
}
let isLiftOn = false;
let isSecondary = false;
let isDragging = false;
let activePointerId = null;

function sendCurrentControls() {
    if (!isConnected || !isPowered) return;

    sendDeviceCommand({
        type: "control",
        thrust: Number(throttle.value),
        lift: isSecondary
            ? Number(liftSlider.value)
            : (isLiftOn ? 100 : 0),
        steering: Number(steering.value)
    });
}

function updateMovementValues() {
    throttleValue.textContent = `${throttle.value}%`;
    steeringValue.textContent = `${steering.value}°`;
}

function updateNotice() {
    notice.textContent = "";
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
    if (isPowered) {
        sendDeviceCommand({ type: "stop" });
        disconnectDevice();
        isConnected = false;
        isConnecting = false;
        connectionStatus.textContent = "Disconnected";
        setPower(false);
        return;
    }

    if (isConnected || isConnecting) return;
    connectDevice(handleConnectionStatus, handleConnectionMessage);
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
    sendCurrentControls();
});

steering.addEventListener("input", () => {
    updateMovementValues();
    updateNotice();
    sendCurrentControls();
});

liftButton.addEventListener("click", () => {
    if (!isPowered) return;

    setLiftButton(!isLiftOn);
    updateNotice();
    sendCurrentControls();
});

liftSlider.addEventListener("input", () => {
    liftValue.textContent = `${liftSlider.value}%`;
    updateNotice();
    sendCurrentControls();
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
    const radialDistance = Math.min(
        1,
        Math.hypot(boundedX / maxX, boundedY / maxY)
    );

    const speed = boundedY < 0
        ? Math.round(radialDistance * 100)
        : 0;

    throttle.value = speed;
    steering.value = direction;

    updateMovementValues();
    joystickValue.textContent = `${speed}%, ${direction}°`;
    updateNotice();
    sendCurrentControls();
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
    sendCurrentControls();
}

joystick.addEventListener("pointerup", releaseJoystick);
joystick.addEventListener("pointercancel", releaseJoystick);
joystick.addEventListener("lostpointercapture", releaseJoystick);

stopButton.addEventListener("click", () => {
    if (isConnected) {
        sendDeviceCommand({ type: "stop" });
    }

    resetMovement();
    setLiftButton(false);
    liftSlider.value = 0;
    liftValue.textContent = "0%";

    notice.textContent = isConnected
        ? "Emergency stop sent to simulator."
        : "Controls reset — simulator is disconnected.";
});

liftValue.textContent = `${liftSlider.value}%`;
updateMovementValues();
setPower(false);
