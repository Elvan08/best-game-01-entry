// Mouse + keyboard state, in canvas coordinates. The game polls this each
// frame instead of juggling event handlers through the update code.

export function createInput(canvas) {
  const input = {
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false, // true for one frame after a press
    keys: new Set(),
    pressed: new Set(), // keys that went down this frame
  };

  function toCanvas(evt) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((evt.clientX - rect.left) / rect.width) * canvas.width,
      y: ((evt.clientY - rect.top) / rect.height) * canvas.height,
    };
  }

  canvas.addEventListener('mousemove', (evt) => {
    const p = toCanvas(evt);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (evt) => {
    const p = toCanvas(evt);
    input.mouseX = p.x;
    input.mouseY = p.y;
    if (!input.mouseDown) input.clicked = true;
    input.mouseDown = true;
  });
  window.addEventListener('mouseup', () => {
    input.mouseDown = false;
  });
  window.addEventListener('keydown', (evt) => {
    if (!input.keys.has(evt.code)) input.pressed.add(evt.code);
    input.keys.add(evt.code);
    if (evt.code === 'Space') evt.preventDefault();
  });
  window.addEventListener('keyup', (evt) => {
    input.keys.delete(evt.code);
  });

  // Call at the end of each frame so one-frame signals reset.
  input.endFrame = () => {
    input.clicked = false;
    input.pressed.clear();
  };
  return input;
}
