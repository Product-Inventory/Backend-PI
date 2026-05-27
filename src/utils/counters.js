import { db } from '../config/firebase.js'

const COUNTERS_COLLECTION = 'counters'

/**
 * Obtiene el siguiente folio/SKU disponible de forma atómica usando una
 * transacción de Firestore. Si varios usuarios crean registros al mismo tiempo,
 * Firestore reintenta la transacción automáticamente para evitar duplicados.
 *
 * @param {string} counterName  - Nombre del contador en Firestore (ej: 'orders', 'recepciones', 'products')
 * @param {string} prefix       - Prefijo del folio (ej: 'ORD', 'REC', 'PRD')
 * @param {number} [digits=4]   - Dígitos del número (default 4 → 0001)
 * @returns {Promise<string>}   - Siguiente folio formateado (ej: 'ORD-0001')
 */
export async function getNextFolio(counterName, prefix, digits = 4) {
  const counterRef = db.collection(COUNTERS_COLLECTION).doc(counterName)

  const nextNumber = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef)
    const current = counterDoc.exists ? (counterDoc.data().lastFolio || 0) : 0
    const next = current + 1

    transaction.set(
      counterRef,
      {
        lastFolio: next,
        prefix,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    )

    return next
  })

  return `${prefix}-${String(nextNumber).padStart(digits, '0')}`
}
