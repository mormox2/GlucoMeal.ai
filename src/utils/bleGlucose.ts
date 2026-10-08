/**
 * Lecture d'une mesure de glycémie selon le profil Bluetooth standard « Glucose Profile » (GLP, service 0x1808).
 *
 * La caractéristique Glucose Measurement (0x2A18) n'est pas lisible directement : elle est envoyée par
 * notification en réponse à une commande écrite sur le Record Access Control Point (RACP, 0x2A52).
 */

export interface GlucoseMeasurement {
  mgdl: number;
  /** Heure de la mesure selon l'horloge du lecteur (décalage horaire inclus), absente si invalide */
  time?: Date;
  sequenceNumber: number;
}

const FLAG_TIME_OFFSET = 0x01;
const FLAG_CONCENTRATION = 0x02;
const FLAG_UNIT_MOL_PER_L = 0x04;

const MMOL_TO_MGDL = 18.016;

/**
 * Décode un nombre SFLOAT IEEE-11073 (16 bits : exposant signé sur 4 bits, mantisse signée sur 12 bits).
 * Renvoie null pour les valeurs spéciales (NaN, NRes, ±infini).
 */
export function decodeSfloat(raw: number): number | null {
  const mantissaRaw = raw & 0x0fff;
  if ([0x07ff, 0x0800, 0x07fe, 0x0802, 0x0801].includes(mantissaRaw)) return null;
  const mantissa = mantissaRaw >= 0x0800 ? mantissaRaw - 0x1000 : mantissaRaw;
  const exponentRaw = (raw >> 12) & 0x0f;
  const exponent = exponentRaw >= 0x08 ? exponentRaw - 0x10 : exponentRaw;
  return mantissa * Math.pow(10, exponent);
}

/**
 * Décode une trame Glucose Measurement (0x2A18) en lisant les drapeaux : présence du décalage horaire,
 * présence de la concentration et unité (kg/L ou mol/L). Renvoie null si la trame ne contient pas de
 * concentration exploitable.
 */
export function parseGlucoseMeasurement(view: DataView): GlucoseMeasurement | null {
  if (view.byteLength < 10) return null;
  const flags = view.getUint8(0);
  const sequenceNumber = view.getUint16(1, true);

  const year = view.getUint16(3, true);
  const month = view.getUint8(5);
  const day = view.getUint8(6);
  const hours = view.getUint8(7);
  const minutes = view.getUint8(8);
  const seconds = view.getUint8(9);

  let offset = 10;
  let timeOffsetMinutes = 0;
  if (flags & FLAG_TIME_OFFSET) {
    if (view.byteLength < offset + 2) return null;
    timeOffsetMinutes = view.getInt16(offset, true);
    offset += 2;
  }

  if (!(flags & FLAG_CONCENTRATION) || view.byteLength < offset + 2) return null;
  const concentration = decodeSfloat(view.getUint16(offset, true));
  if (concentration === null || concentration <= 0) return null;

  const mgdl =
    flags & FLAG_UNIT_MOL_PER_L
      ? concentration * 1000 * MMOL_TO_MGDL // mol/L → mmol/L → mg/dL
      : concentration * 100000; // kg/L → mg/dL

  const validDate = year >= 2000 && month >= 1 && month <= 12 && day >= 1 && day <= 31;
  const time = validDate
    ? new Date(year, month - 1, day, hours, minutes + timeOffsetMinutes, seconds)
    : undefined;

  return { mgdl: Math.round(mgdl), time, sequenceNumber };
}

const RACP_REPORT_STORED_RECORDS = 0x01;
const RACP_OPERATOR_LAST_RECORD = 0x06;

/**
 * Demande au lecteur sa dernière mesure enregistrée via le RACP et attend la notification correspondante.
 */
export async function readLatestGlucoseRecord(server: any, timeoutMs = 10000): Promise<GlucoseMeasurement> {
  const service = await server.getPrimaryService('glucose');
  const measurementChar = await service.getCharacteristic(0x2a18);
  const racpChar = await service.getCharacteristic(0x2a52);

  return new Promise<GlucoseMeasurement>(async (resolve, reject) => {
    let latest: GlucoseMeasurement | null = null;
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Aucune mesure reçue du lecteur (délai dépassé).'));
    }, timeoutMs);

    const onMeasurement = (event: any) => {
      const parsed = parseGlucoseMeasurement(event.target.value as DataView);
      if (parsed && (!latest || parsed.sequenceNumber >= latest.sequenceNumber)) latest = parsed;
    };
    // Réponse du RACP (opcode 0x06) : fin du transfert des enregistrements
    const onRacp = (event: any) => {
      const value = event.target.value as DataView;
      if (value.getUint8(0) !== 0x06) return;
      cleanup();
      if (latest) resolve(latest);
      else reject(new Error('Le lecteur ne contient aucune mesure exploitable.'));
    };
    const cleanup = () => {
      clearTimeout(timer);
      measurementChar.removeEventListener('characteristicvaluechanged', onMeasurement);
      racpChar.removeEventListener('characteristicvaluechanged', onRacp);
    };

    try {
      measurementChar.addEventListener('characteristicvaluechanged', onMeasurement);
      racpChar.addEventListener('characteristicvaluechanged', onRacp);
      await measurementChar.startNotifications();
      await racpChar.startNotifications();
      await racpChar.writeValue(new Uint8Array([RACP_REPORT_STORED_RECORDS, RACP_OPERATOR_LAST_RECORD]));
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
}
