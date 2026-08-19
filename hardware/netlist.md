# Taptile RP2040 — netlist

Generated from `Taptile_RP2040.kicad_pcb`. 38 nets, 165 connected pads.

Every pad below carries a `(net N "NAME")` entry in the board file — the same
thing KiCad's Update-PCB-from-Schematic writes, and what the ratsnest, DRC and
Gerber netlist all read.

| Net | Pads | Connections |
|---|---|---|
| `GND` | 47 | C1.2, C10.2, C11.2, C12.2, C13.2, C14.2, C15.2, C16.2, C17.2, C18.2, C2.2, C3.2, C4.2, C5.2, C6.2, C7.2, C8.2, C9.2, ENC1.C, ENC1.S2, ENC2.C, ENC2.S2, J1.A1, J1.A12, J1.B1, J1.B12, J1.S1, J2.3, R3.2, R4.2, SW1.2, SW10.2, SW11.2, SW2.2, SW3.2, SW4.2, SW5.2, SW6.2, SW7.2, SW8.2, SW9.2, U1.19, U1.57, U2.4, U3.2, Y1.2, Y1.4 |
| `+3V3` | 23 | C1.1, C10.1, C12.1, C14.1, C15.1, C2.1, C3.1, C4.1, C5.1, C6.1, C9.1, R7.1, U1.1, U1.10, U1.22, U1.33, U1.42, U1.43, U1.44, U1.48, U1.49, U2.8, U3.5 |
| `+1V1` | 6 | C11.1, C7.1, C8.1, U1.23, U1.45, U1.50 |
| `+5V` | 7 | C13.1, J1.A4, J1.A9, J1.B4, J1.B9, U3.1, U3.3 |
| `BOOT_BTN` | 2 | R6.2, SW10.1 |
| `CC1` | 2 | J1.A5, R3.1 |
| `CC2` | 2 | J1.B5, R4.1 |
| `GPIO0` | 2 | SW1.1, U1.2 |
| `GPIO1` | 2 | SW2.1, U1.3 |
| `GPIO10` | 2 | ENC1.B, U1.13 |
| `GPIO11` | 2 | ENC1.S1, U1.14 |
| `GPIO12` | 2 | ENC2.A, U1.15 |
| `GPIO13` | 2 | ENC2.B, U1.16 |
| `GPIO14` | 2 | ENC2.S1, U1.17 |
| `GPIO2` | 2 | SW3.1, U1.4 |
| `GPIO3` | 2 | SW4.1, U1.5 |
| `GPIO4` | 2 | SW5.1, U1.6 |
| `GPIO5` | 2 | SW6.1, U1.7 |
| `GPIO6` | 2 | SW7.1, U1.8 |
| `GPIO7` | 2 | SW8.1, U1.9 |
| `GPIO8` | 2 | SW9.1, U1.11 |
| `GPIO9` | 2 | ENC1.A, U1.12 |
| `QSPI_SCLK` | 2 | U1.52, U2.6 |
| `QSPI_SD0` | 2 | U1.53, U2.5 |
| `QSPI_SD1` | 2 | U1.55, U2.2 |
| `QSPI_SD2` | 2 | U1.54, U2.3 |
| `QSPI_SD3` | 2 | U1.51, U2.7 |
| `QSPI_SS_N` | 3 | R6.1, U1.56, U2.1 |
| `RUN` | 4 | C18.1, R7.2, SW11.1, U1.26 |
| `SWCLK` | 2 | J2.1, U1.25 |
| `SWDIO` | 2 | J2.2, U1.24 |
| `USB_DM` | 2 | R2.1, U1.46 |
| `USB_DM_C` | 3 | J1.A7, J1.B7, R2.2 |
| `USB_DP` | 2 | R1.1, U1.47 |
| `USB_DP_C` | 3 | J1.A6, J1.B6, R1.2 |
| `XIN` | 3 | C16.1, U1.20, Y1.1 |
| `XOUT` | 2 | R5.1, U1.21 |
| `XOUT_R` | 3 | C17.1, R5.2, Y1.3 |

## Single-pad nets

A net with one pad on it goes nowhere. This list must stay empty.

None — every net has at least two pads.
