import { describe, it, expect } from 'vitest';
import { decodeSfloat, parseGlucoseMeasurement } from '../bleGlucose';

// Trame Glucose Measurement (0x2A18) : drapeaux, séquence, date de base, [décalage], concentration SFLOAT
function frame(flags: number, sfloat: number, withOffsetMinutes?: number): DataView {
  const bytes: number[] = [flags, 0x05, 0x00, 0xea, 0x07, 10, 8, 11, 45, 30]; // 8 oct. 2026 11:45:30
  if (withOffsetMinutes !== undefined) {
    bytes.push(withOffsetMinutes & 0xff, (withOffsetMinutes >> 8) & 0xff);
  }
  bytes.push(sfloat & 0xff, (sfloat >> 8) & 0xff, 0x11);
  return new DataView(new Uint8Array(bytes).buffer);
}

describe('Décodage Bluetooth Glucose Profile', () => {
  it('décode les SFLOAT et rejette les valeurs spéciales', () => {
    expect(decodeSfloat(0xb06e)).toBeCloseTo(110e-5); // mantisse 110, exposant -5
    expect(decodeSfloat(0x07ff)).toBeNull(); // NaN
  });

  it('lit une concentration en kg/L sans décalage horaire (offset 10)', () => {
    const m = parseGlucoseMeasurement(frame(0x02, 0xb06e));
    expect(m?.mgdl).toBe(110);
    expect(m?.sequenceNumber).toBe(5);
    expect(m?.time).toEqual(new Date(2026, 9, 8, 11, 45, 30));
  });

  it('applique le décalage horaire et décale la lecture de la concentration (offset 12)', () => {
    const m = parseGlucoseMeasurement(frame(0x03, 0xb06e, -30));
    expect(m?.mgdl).toBe(110);
    expect(m?.time).toEqual(new Date(2026, 9, 8, 11, 15, 30));
  });

  it('convertit une concentration en mol/L', () => {
    // 6.1 mmol/L = 0.0061 mol/L → mantisse 61, exposant -4
    const m = parseGlucoseMeasurement(frame(0x06, 0xc03d));
    expect(m?.mgdl).toBe(110);
  });

  it('ignore une trame sans concentration', () => {
    expect(parseGlucoseMeasurement(frame(0x00, 0xb06e))).toBeNull();
  });
});
