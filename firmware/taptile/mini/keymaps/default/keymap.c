#include QMK_KEYBOARD_H

/* Default layout, shipped on the board.
 *
 * Chosen for video editors because that is who the site talks to. Every one of
 * these is remappable in the configurator — this is just what arrives working
 * out of the box, so the thing is useful before anyone opens the software.
 *
 *   K1  Cut        K2  Ripple del   K3  Undo
 *   K4  Mark in    K5  Mark out     K6  Redo
 *   K7  Save       K8  Zoom in      K9  Play/pause
 *
 *   D1  Scrub (encoder)   D2  Volume (encoder)
 */

enum layers { _BASE, _FN, _L2, _L3 };

const uint16_t PROGMEM keymaps[][MATRIX_ROWS][MATRIX_COLS] = {
    [_BASE] = LAYOUT(
        LCTL(KC_X),     LSFT(KC_DEL),   LCTL(KC_Z),
        KC_I,           KC_O,           LCTL(KC_Y),
        LCTL(KC_S),     LCTL(KC_EQL),   KC_SPC,
                    MO(_FN),        KC_MUTE
    ),

    /* Hold the left encoder button for a second layer. */
    [_FN] = LAYOUT(
        LCTL(KC_C),     LCTL(KC_V),     LCTL(KC_A),
        KC_MPRV,        KC_MNXT,        LCTL(KC_F),
        LCTL(LSFT(KC_S)), LCTL(KC_MINS), KC_MPLY,
                    _______,        KC_MSTP
    ),

    [_L2] = LAYOUT(
        KC_TRNS, KC_TRNS, KC_TRNS,
        KC_TRNS, KC_TRNS, KC_TRNS,
        KC_TRNS, KC_TRNS, KC_TRNS,
             KC_TRNS, KC_TRNS
    ),

    [_L3] = LAYOUT(
        KC_TRNS, KC_TRNS, KC_TRNS,
        KC_TRNS, KC_TRNS, KC_TRNS,
        KC_TRNS, KC_TRNS, KC_TRNS,
             KC_TRNS, KC_TRNS
    ),
};

#if defined(ENCODER_MAP_ENABLE)
/* Left knob scrubs the timeline, right knob is volume.
 * Both are remappable from the configurator like everything else. */
const uint16_t PROGMEM encoder_map[][NUM_ENCODERS][NUM_DIRECTIONS] = {
    [_BASE] = { ENCODER_CCW_CW(KC_LEFT, KC_RGHT), ENCODER_CCW_CW(KC_VOLD, KC_VOLU) },
    [_FN]   = { ENCODER_CCW_CW(LCTL(KC_LEFT), LCTL(KC_RGHT)), ENCODER_CCW_CW(KC_MPRV, KC_MNXT) },
    [_L2]   = { ENCODER_CCW_CW(KC_TRNS, KC_TRNS), ENCODER_CCW_CW(KC_TRNS, KC_TRNS) },
    [_L3]   = { ENCODER_CCW_CW(KC_TRNS, KC_TRNS), ENCODER_CCW_CW(KC_TRNS, KC_TRNS) },
};
#endif
