/**
 * VIA protocol over WebHID.
 *
 * VIA-compatible boards expose a raw HID interface on usage page 0xFF60,
 * usage 0x61. Commands are 32-byte reports: first byte is the command id, the
 * rest are arguments. The board replies on the same interface, echoing the
 * command id back in byte 0.
 *
 * Browser support: WebHID is Chromium-only (Chrome, Edge, Opera, Arc). Not
 * Firefox, not Safari. The UI checks `isSupported` and explains rather than
 * failing silently.
 *
 * UNVERIFIED AGAINST HARDWARE. Written from the VIA protocol spec; nobody has
 * run it against a real board yet. See docs/CONFIGURATOR.md.
 */

const USAGE_PAGE = 0xff60;
const USAGE = 0x61;
const REPORT_LENGTH = 32;
/** Boards can be slow to answer; longer than this and something is wrong. */
const TIMEOUT_MS = 1500;

export const VIA_COMMAND = {
  getProtocolVersion: 0x01,
  getKeyboardValue: 0x02,
  setKeyboardValue: 0x03,
  dynamicKeymapGetKeycode: 0x04,
  dynamicKeymapSetKeycode: 0x05,
  dynamicKeymapReset: 0x06,
  eepromReset: 0x0a,
  dynamicKeymapGetLayerCount: 0x11,
  dynamicKeymapGetBuffer: 0x12,
  dynamicKeymapSetBuffer: 0x13,
} as const;

export interface ConnectedBoard {
  device: HIDDevice;
  productName: string;
  vendorId: number;
  productId: number;
  protocolVersion: number;
  layerCount: number;
}

export class ViaError extends Error {}

/** WebHID exists and we are on a secure origin. */
export function isSupported(): boolean {
  return typeof navigator !== 'undefined' && 'hid' in navigator;
}

/**
 * Prompt the user to pick their keyboard.
 * Must be called from a user gesture — browsers refuse otherwise.
 */
export async function requestBoard(): Promise<HIDDevice | null> {
  if (!isSupported()) throw new ViaError('This browser does not support WebHID.');

  const devices = await navigator.hid.requestDevice({
    filters: [{ usagePage: USAGE_PAGE, usage: USAGE }],
  });
  return devices[0] ?? null;
}

/** Boards the user has already granted access to, so we can reconnect silently. */
export async function previouslyAllowedBoards(): Promise<HIDDevice[]> {
  if (!isSupported()) return [];
  const devices = await navigator.hid.getDevices();
  return devices.filter((device) =>
    device.collections.some(
      (collection) => collection.usagePage === USAGE_PAGE && collection.usage === USAGE,
    ),
  );
}

/** Send one command and wait for the board's reply. */
async function transceive(device: HIDDevice, payload: number[]): Promise<Uint8Array> {
  if (!device.opened) await device.open();

  const request = new Uint8Array(REPORT_LENGTH);
  request.set(payload.slice(0, REPORT_LENGTH));

  return new Promise<Uint8Array>((resolve, reject) => {
    const timer = setTimeout(() => {
      device.removeEventListener('inputreport', onReport);
      reject(new ViaError('The keyboard did not respond. Unplug it and try again.'));
    }, TIMEOUT_MS);

    function onReport(event: HIDInputReportEvent) {
      const data = new Uint8Array(event.data.buffer);
      // Ignore anything that is not the reply to what we just asked.
      if (data[0] !== payload[0]) return;
      clearTimeout(timer);
      device.removeEventListener('inputreport', onReport);
      resolve(data);
    }

    device.addEventListener('inputreport', onReport);
    device.sendReport(0, request).catch((error: unknown) => {
      clearTimeout(timer);
      device.removeEventListener('inputreport', onReport);
      reject(error instanceof Error ? error : new ViaError(String(error)));
    });
  });
}

export async function open(device: HIDDevice): Promise<ConnectedBoard> {
  if (!device.opened) await device.open();

  const versionReply = await transceive(device, [VIA_COMMAND.getProtocolVersion]);
  const protocolVersion = ((versionReply[1] ?? 0) << 8) | (versionReply[2] ?? 0);

  if (protocolVersion === 0) {
    throw new ViaError(
      'That device answered, but not with a VIA protocol version. It is probably not VIA-compatible.',
    );
  }

  const layerReply = await transceive(device, [VIA_COMMAND.dynamicKeymapGetLayerCount]);
  const layerCount = layerReply[1] ?? 1;

  return {
    device,
    productName: device.productName || 'Unnamed keyboard',
    vendorId: device.vendorId,
    productId: device.productId,
    protocolVersion,
    layerCount: Math.max(1, layerCount),
  };
}

export async function close(board: ConnectedBoard): Promise<void> {
  if (board.device.opened) await board.device.close();
}

export async function readKeycode(
  board: ConnectedBoard,
  layer: number,
  row: number,
  col: number,
): Promise<number> {
  const reply = await transceive(board.device, [
    VIA_COMMAND.dynamicKeymapGetKeycode,
    layer,
    row,
    col,
  ]);
  return ((reply[4] ?? 0) << 8) | (reply[5] ?? 0);
}

export async function writeKeycode(
  board: ConnectedBoard,
  layer: number,
  row: number,
  col: number,
  keycode: number,
): Promise<void> {
  await transceive(board.device, [
    VIA_COMMAND.dynamicKeymapSetKeycode,
    layer,
    row,
    col,
    (keycode >> 8) & 0xff,
    keycode & 0xff,
  ]);
}

/**
 * Read a whole layer at once.
 *
 * Done key by key rather than with the bulk buffer command, because the buffer
 * layout depends on the board's matrix size, which we do not know without a
 * VIA definition file. Slower, but correct on any board.
 */
export async function readLayer(
  board: ConnectedBoard,
  layer: number,
  rows: number,
  cols: number,
): Promise<number[][]> {
  const grid: number[][] = [];
  for (let row = 0; row < rows; row += 1) {
    const line: number[] = [];
    for (let col = 0; col < cols; col += 1) {
      line.push(await readKeycode(board, layer, row, col));
    }
    grid.push(line);
  }
  return grid;
}

/** Wipe all remapping and return the board to its factory keymap. */
export async function resetKeymap(board: ConnectedBoard): Promise<void> {
  await transceive(board.device, [VIA_COMMAND.dynamicKeymapReset]);
}
