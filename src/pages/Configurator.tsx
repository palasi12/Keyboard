import { useCallback, useEffect, useMemo, useState } from 'react';
import Seo from '../components/Seo';
import {
  KEYCODE_GROUPS,
  KC_NO,
  describeKeycode,
  type KeycodeOption,
} from '../lib/via/keycodes';
import {
  ViaError,
  close as closeBoard,
  isSupported,
  open as openBoard,
  previouslyAllowedBoards,
  readLayer,
  requestBoard,
  resetKeymap,
  writeKeycode,
  type ConnectedBoard,
} from '../lib/via/protocol';

/**
 * The keyboard configurator.
 *
 * Two modes:
 *  - connected: talks to a real VIA board over WebHID, writes land on the
 *    device immediately and survive unplugging
 *  - demo: no hardware, so the grid is local only. Lets people try the
 *    interface before they buy, and lets us develop without a board on the desk
 */

/** Matrix size to assume before we know better. */
const DEFAULT_ROWS = 3;
const DEFAULT_COLS = 3;

type Mode = 'idle' | 'connecting' | 'connected' | 'demo';

export default function Configurator() {
  const [mode, setMode] = useState<Mode>('idle');
  const [board, setBoard] = useState<ConnectedBoard | null>(null);
  const [rows, setRows] = useState(DEFAULT_ROWS);
  const [cols, setCols] = useState(DEFAULT_COLS);
  const [layer, setLayer] = useState(0);
  const [grid, setGrid] = useState<number[][]>(() => blankGrid(DEFAULT_ROWS, DEFAULT_COLS));
  const [selected, setSelected] = useState<{ row: number; col: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rawHex, setRawHex] = useState('');

  const supported = isSupported();

  // Reconnect silently if the user already granted this board before.
  useEffect(() => {
    if (!supported) return;
    void previouslyAllowedBoards().then((devices) => {
      if (devices.length > 0) setStatus('A keyboard you have used before is plugged in.');
    });
  }, [supported]);

  const loadGrid = useCallback(
    async (target: ConnectedBoard, layerIndex: number, r: number, c: number) => {
      try {
        const next = await readLayer(target, layerIndex, r, c);
        setGrid(next);
      } catch (err) {
        setError(
          err instanceof ViaError
            ? err.message
            : 'Could not read the current layout from the keyboard.',
        );
      }
    },
    [],
  );

  async function handleConnect() {
    setError(null);
    setStatus(null);
    setMode('connecting');

    try {
      const device = await requestBoard();
      if (!device) {
        setMode('idle');
        return;
      }

      const connected = await openBoard(device);
      setBoard(connected);
      setMode('connected');
      setStatus(
        `Connected to ${connected.productName} · VIA protocol ${connected.protocolVersion} · ${connected.layerCount} layer${connected.layerCount === 1 ? '' : 's'}`,
      );
      await loadGrid(connected, 0, rows, cols);
    } catch (err) {
      setMode('idle');
      setError(
        err instanceof ViaError
          ? err.message
          : 'Could not connect. Make sure the keyboard is plugged in directly, not through a hub.',
      );
    }
  }

  async function handleDisconnect() {
    if (board) await closeBoard(board).catch(() => undefined);
    setBoard(null);
    setMode('idle');
    setSelected(null);
    setStatus(null);
  }

  function startDemo() {
    setMode('demo');
    setBoard(null);
    setGrid(blankGrid(rows, cols));
    setStatus('Demo mode — nothing is written to hardware.');
    setError(null);
  }

  const assign = useCallback(
    async (keycode: number) => {
      if (!selected) return;
      const { row, col } = selected;

      // Update the UI first so it feels instant, then persist.
      setGrid((current) =>
        current.map((line, r) =>
          r !== row ? line : line.map((value, c) => (c === col ? keycode : value)),
        ),
      );

      if (mode !== 'connected' || !board) return;

      setBusy(true);
      try {
        await writeKeycode(board, layer, row, col, keycode);
        setStatus('Saved to the keyboard.');
        setError(null);
      } catch (err) {
        setError(
          err instanceof ViaError ? err.message : 'Could not write that key to the keyboard.',
        );
        // Put the old value back — the board did not accept it.
        await loadGrid(board, layer, rows, cols);
      } finally {
        setBusy(false);
      }
    },
    [selected, mode, board, layer, rows, cols, loadGrid],
  );

  async function changeLayer(next: number) {
    setLayer(next);
    setSelected(null);
    if (mode === 'connected' && board) await loadGrid(board, next, rows, cols);
    else setGrid(blankGrid(rows, cols));
  }

  async function changeMatrix(nextRows: number, nextCols: number) {
    setRows(nextRows);
    setCols(nextCols);
    setSelected(null);
    if (mode === 'connected' && board) await loadGrid(board, layer, nextRows, nextCols);
    else setGrid(blankGrid(nextRows, nextCols));
  }

  async function handleReset() {
    if (!board) return;
    if (!window.confirm('Reset every key on this keyboard to its factory setting?')) return;
    setBusy(true);
    try {
      await resetKeymap(board);
      await loadGrid(board, layer, rows, cols);
      setStatus('Keyboard reset to factory defaults.');
    } catch {
      setError('Could not reset the keyboard.');
    } finally {
      setBusy(false);
    }
  }

  const selectedCode = useMemo(() => {
    if (!selected) return null;
    return grid[selected.row]?.[selected.col] ?? KC_NO;
  }, [grid, selected]);

  return (
    <section className="mx-auto max-w-shell px-5 py-14">
      <Seo
        title="Configurator — program your keyboard"
        description="Plug in your Taptile keyboard and remap every key from your browser. No download."
        path="/configurator"
      />

      <p className="kicker-accent">Configurator</p>
      <h1 className="mt-3 text-3xl font-heading tracking-heading text-neutral-100 sm:text-4xl">
        Program your keyboard
      </h1>
      <p className="mt-3 max-w-xl text-neutral-400">
        Plug it in, connect, then click a key and choose what it should do. Changes save
        onto the keyboard itself — it keeps them on any computer.
      </p>

      {!supported && (
        <div className="mt-8 rounded-xl border border-hairline bg-surface px-5 py-4">
          <p className="font-semibold text-neutral-100">This browser can&apos;t talk to USB devices</p>
          <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
            The configurator needs WebHID, which only Chrome, Edge, Opera and Arc support.
            Firefox and Safari don&apos;t have it. Open this page in one of those, or try
            the demo below.
          </p>
        </div>
      )}

      {/* ------------------------------- toolbar ------------------------------- */}
      <div className="mt-8 flex flex-wrap items-center gap-2.5">
        {mode === 'connected' ? (
          <>
            <button type="button" onClick={handleDisconnect} className="btn-secondary py-2">
              Disconnect
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary py-2"
              disabled={busy}
            >
              Reset to factory
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleConnect}
              className="btn-primary py-2"
              disabled={!supported || mode === 'connecting'}
            >
              {mode === 'connecting' ? 'Connecting…' : 'Connect keyboard'}
            </button>
            <button type="button" onClick={startDemo} className="btn-secondary py-2">
              Try the demo
            </button>
          </>
        )}

        {board && board.layerCount > 1 && (
          <div className="flex items-center gap-1 rounded-full border border-hairline p-1">
            {Array.from({ length: board.layerCount }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => void changeLayer(index)}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  layer === index
                    ? 'bg-neutral-100 text-keycap'
                    : 'text-neutral-400 hover:text-neutral-100'
                }`}
              >
                Layer {index}
              </button>
            ))}
          </div>
        )}

        <label className="ml-auto flex items-center gap-2 text-xs text-neutral-500">
          Layout
          <select
            value={`${rows}x${cols}`}
            onChange={(event) => {
              const [r, c] = event.target.value.split('x').map(Number);
              void changeMatrix(r ?? DEFAULT_ROWS, c ?? DEFAULT_COLS);
            }}
            className="field w-auto py-1.5 text-xs"
          >
            <option value="1x3">3 keys (1 × 3)</option>
            <option value="2x3">6 keys (2 × 3)</option>
            <option value="3x3">9 keys (3 × 3)</option>
            <option value="3x4">12 keys (3 × 4)</option>
            <option value="4x4">16 keys (4 × 4)</option>
          </select>
        </label>
      </div>

      {status && (
        <p className="mt-4 text-sm text-neutral-400" role="status" aria-live="polite">
          {status}
        </p>
      )}
      {error && (
        <p className="mt-4 text-sm text-accent-400" role="alert">
          {error}
        </p>
      )}

      {/* --------------------------- grid + inspector --------------------------- */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div className="stage-soft rounded-xl border border-hairline p-6">
          <div
            className="mx-auto grid max-w-md gap-3"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {grid.map((line, row) =>
              line.map((code, col) => {
                const isSelected = selected?.row === row && selected?.col === col;
                return (
                  <button
                    key={`${row}-${col}`}
                    type="button"
                    onClick={() => setSelected({ row, col })}
                    className={`cap aspect-square ${isSelected ? 'cap-selected' : ''}`}
                    aria-pressed={isSelected}
                    aria-label={`Row ${row + 1}, column ${col + 1}: ${describeKeycode(code)}`}
                  >
                    <span
                      className={`cap-face px-1 text-center text-[11px] font-semibold leading-tight ${
                        isSelected ? 'text-keycap' : 'text-neutral-300'
                      }`}
                    >
                      {code === KC_NO ? (
                        <span className="opacity-30">empty</span>
                      ) : (
                        describeKeycode(code)
                      )}
                    </span>
                  </button>
                );
              }),
            )}
          </div>

          {mode === 'idle' && (
            <p className="mt-6 text-center text-sm text-neutral-600">
              Connect a keyboard to load its real layout.
            </p>
          )}
        </div>

        {/* -------------------------------- picker -------------------------------- */}
        <aside>
          {selected ? (
            <div className="card p-6">
              <p className="kicker">
                Row {selected.row + 1} · Column {selected.col + 1}
              </p>
              <h2 className="mt-2 text-lg font-heading text-neutral-100">
                {selectedCode === null ? '—' : describeKeycode(selectedCode)}
              </h2>

              <div className="mt-6 max-h-[420px] space-y-5 overflow-y-auto pr-1">
                {KEYCODE_GROUPS.map((group) => (
                  <div key={group.name}>
                    <p className="label">{group.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.options.map((option: KeycodeOption) => (
                        <button
                          key={`${group.name}-${option.code}`}
                          type="button"
                          onClick={() => void assign(option.code)}
                          disabled={busy}
                          title={option.hint}
                          className={`rounded-full border px-2.5 py-1 text-xs transition ${
                            selectedCode === option.code
                              ? 'border-transparent bg-neutral-100 text-keycap'
                              : 'border-hairline text-neutral-300 hover:bg-white/[0.06]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div>
                  <label htmlFor="raw-hex" className="label">
                    Raw keycode
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="raw-hex"
                      value={rawHex}
                      onChange={(event) => setRawHex(event.target.value)}
                      placeholder="0x0106"
                      className="field flex-1 font-mono text-xs"
                    />
                    <button
                      type="button"
                      className="btn-secondary px-3 py-2 text-xs"
                      disabled={busy}
                      onClick={() => {
                        const parsed = Number.parseInt(rawHex.replace(/^0x/i, ''), 16);
                        if (Number.isNaN(parsed) || parsed < 0 || parsed > 0xffff) {
                          setError('Enter a hex value between 0x0000 and 0xFFFF.');
                          return;
                        }
                        void assign(parsed);
                      }}
                    >
                      Set
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-neutral-600">
                    Escape hatch for anything not in the lists above.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center">
              <p className="text-sm text-neutral-500">
                Select a key on the left to choose what it does.
              </p>
            </div>
          )}
        </aside>
      </div>

      <p className="mt-10 max-w-2xl text-xs leading-relaxed text-neutral-600">
        Works with VIA-compatible keyboards. Everything happens between your browser and the
        keyboard on your desk — no layouts are uploaded to us, and nothing is stored on our
        servers.
      </p>
    </section>
  );
}

function blankGrid(rows: number, cols: number): number[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => KC_NO));
}
