# Taptile Mini
#
# VIA_ENABLE is the line that matters. It turns on RAW_ENABLE *and* the VIA
# command set — dynamic_keymap_get_keycode, set_keycode, get_layer_count and
# the rest. Those are exactly the commands src/lib/via/protocol.ts sends.
#
# RAW_ENABLE on its own opens the HID pipe with nothing listening on it: the
# configurator would connect and get silence back. Do not "simplify" this.
VIA_ENABLE = yes

# Four layers of remappable keys, stored on the board itself so a layout
# survives being unplugged and moved to another computer.
DYNAMIC_KEYMAP_ENABLE = yes

ENCODER_ENABLE = yes
ENCODER_MAP_ENABLE = yes
