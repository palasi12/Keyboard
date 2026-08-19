#pragma once

/* Four layers is what the configurator's layer switcher expects. Raising this
 * costs EEPROM; the RP2040 emulates EEPROM in flash, so it is not free. */
#define DYNAMIC_KEYMAP_LAYER_COUNT 4

/* Cheap switches bounce. 5ms is the usual starting point; raise it if a key
 * ever registers twice from one press. */
#define DEBOUNCE 5

/* EC11 encoders are 4 pulses per detent. Without this, one click of the knob
 * fires four times. */
#define ENCODER_RESOLUTION 4

/* Direct-pin wiring: every switch has its own GPIO, so there is no matrix and
 * therefore no ghosting. This is why the board has no diodes. */
#define MATRIX_HAS_GHOST_disabled
